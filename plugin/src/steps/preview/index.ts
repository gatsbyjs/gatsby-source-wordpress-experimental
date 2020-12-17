import { GatsbyHelpers } from "~/utils/gatsby-types"
import path from "path"
import fs from "fs-extra"
import chalk from "chalk"
import urlUtil from "url"
import PQueue from "p-queue"

import { paginatedWpNodeFetch } from "~/steps/source-nodes/fetch-nodes/fetch-nodes-paginated"
import fetchGraphql from "~/utils/fetch-graphql"

import store from "~/store"

import { fetchAndCreateSingleNode } from "~/steps/source-nodes/update-nodes/wp-actions/update"
import { formatLogMessage } from "~/utils/format-log-message"
import { touchValidNodes } from "../source-nodes/update-nodes/fetch-node-updates"

import { IPluginOptions } from "~/models/gatsby-api"

export const inPreviewMode = (): boolean =>
  !!process.env.ENABLE_GATSBY_REFRESH_ENDPOINT &&
  !!store.getState().previewStore.inPreviewMode

type PreviewStatusUnion =
  | `PREVIEW_SUCCESS`
  | `NO_PAGE_CREATED_FOR_PREVIEWED_NODE`
  | `GATSBY_PREVIEW_PROCESS_ERROR`
  | `RECEIVED_PREVIEW_DATA_FROM_WRONG_URL`

interface IWebhookBody {
  preview: boolean
  previewId: number
  author: {
    node: {
      databaseId: number
    }
  }
  token: string
  remoteUrl: string
  modified: string
  parentId: number
  id: string
  isDraft: boolean
  isNewPostDraft: boolean
  singleName: string
  isRevision: boolean
  revisionsAreDisabled: boolean
}

interface IPageNode {
  path: string
}

let previewQueue: PQueue

const getPreviewQueue = (): PQueue => {
  if (!previewQueue) {
    const {
      previewRequestConcurrency,
    } = store.getState().gatsbyApi.pluginOptions.schema

    previewQueue = new PQueue({
      concurrency: previewRequestConcurrency,
      carryoverConcurrencyCount: true,
    })
  }

  return previewQueue
}

/**
 * This is called when the /__refresh endpoint is posted to from WP previews.
 * It should only ever run in Preview mode, which is process.env.ENABLE_GATSBY_REFRESH_ENDPOINT = true
 */
export const sourcePreviews = async (
  { webhookBody, reporter }: GatsbyHelpers,
  pluginOptions: IPluginOptions
): Promise<void> => {
  if (previewForIdIsAlreadyBeingProcessed(webhookBody?.id)) {
    return
  }

  const previewActions = await paginatedWpNodeFetch({
    contentTypePlural: `actionMonitorActions`,
    nodeTypeName: `ActionMonitor`,
    headers: {
      WPGatsbyPreview: webhookBody.token,
      WPGatsbyPreviewUser: webhookBody.userId,
    },
    query: /* GraphQL */ `
      query PREVIEW_ACTIONS {
        actionMonitorActions(
          where: { status: PRIVATE, orderby: { field: MODIFIED, order: DESC } }
          first: 100
        ) {
          nodes {
            previewData {
              id
              isDraft
              isNewPostDraft
              isRevision
              modified
              modifiedGmt
              parentId
              preview
              previewId
              remoteUrl
              revisionsAreDisabled
              singleName
            }
            author {
              node {
                databaseId
              }
            }
            modifiedGmt
            modified
            title
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `,
  })

  if (!previewActions?.length) {
    return
  }

  const queue = getPreviewQueue()

  previewActions?.forEach(({ previewData, author }) => {
    queue.add(() =>
      sourcePreview(
        {
          webhookBody: { ...previewData, author, token: webhookBody.token },
          reporter,
        },
        pluginOptions
      )
    )
  })

  await Promise.all([queue.onEmpty(), queue.onIdle()])
}

export const sourcePreview = async (
  { webhookBody, reporter }: GatsbyHelpers,
  { url }: IPluginOptions
): Promise<void> => {
  if (previewForIdIsAlreadyBeingProcessed(webhookBody?.id)) {
    return
  }

  const requiredProperties = [
    `preview`,
    `previewId`,
    `id`,
    `token`,
    `remoteUrl`,
    `parentId`,
    `modified`,
    `author`,
  ]

  const missingProperties = requiredProperties.filter(
    (property) => !(property in webhookBody)
  )

  if (!webhookBody || missingProperties.length) {
    reporter.warn(
      formatLogMessage(
        `sourcePreview was called but the required webhookBody properties weren't provided.`
      )
    )
    reporter.info(
      formatLogMessage(
        `Missing properties: \n${JSON.stringify(missingProperties, null, 2)}`
      )
    )
    reporter.log(
      formatLogMessage(
        `Webhook body: \n${JSON.stringify(webhookBody, null, 2)}`
      )
    )
    return
  }

  await touchValidNodes()

  const { hostname: settingsHostname } = urlUtil.parse(url)
  const { hostname: remoteHostname } = urlUtil.parse(webhookBody.remoteUrl)

  const sendPreviewStatus = createPreviewStatusCallback({
    webhookBody,
    reporter,
  })

  if (settingsHostname !== remoteHostname) {
    await sendPreviewStatus({
      status: `RECEIVED_PREVIEW_DATA_FROM_WRONG_URL`,
      context: `check that the preview data came from the right URL.`,
      passedNode: {
        modified: webhookBody.modified,
        databaseId: webhookBody.parentId,
      },
      graphqlEndpoint: webhookBody.remoteUrl,
    })

    reporter.warn(
      formatLogMessage(
        `Received preview data from a different remote URL than the one specified in plugin options. \n\n ${chalk.bold(
          `Remote URL:`
        )} ${webhookBody.remoteUrl}\n ${chalk.bold(
          `Plugin options URL:`
        )} ${url}`
      )
    )

    return
  }

  store.dispatch.previewStore.setInPreviewMode(true)

  // this callback will be invoked when the page is created/updated for this node
  // then it'll send a mutation to WPGraphQL so that WP knows the preview is ready
  store.dispatch.previewStore.subscribeToPagesCreatedFromNodeById({
    nodeId: webhookBody.id,
    modified: webhookBody.modified,
    sendPreviewStatus,
  })

  await fetchAndCreateSingleNode({
    actionType: `PREVIEW`,
    ...webhookBody,
    previewParentId: webhookBody.parentId,
    isPreview: true,
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Reporter = any

interface OnPreviewStatusInput {
  status: PreviewStatusUnion
  context?: string
  nodeId?: string
  passedNode?: {
    modified?: string
    databaseId: number
  }
  pageNode?: IPageNode
  graphqlEndpoint?: string
  error?: Error
}

const createPreviewStatusCallback = ({
  webhookBody,
  reporter,
}: {
  webhookBody: IWebhookBody
  reporter: Reporter
}) => async ({
  passedNode,
  pageNode,
  context,
  status,
  graphqlEndpoint,
  error,
}: OnPreviewStatusInput): Promise<void> => {
  if (status === `PREVIEW_SUCCESS`) {
    // we might need to write a dummy page-data.json so that
    // Gatsby doesn't throw 404 errors when WPGatsby tries to read this file
    // that maybe doesn't exist yet
    await writeDummyPageDataJsonIfNeeded({ webhookBody, pageNode })
  }

  const statusContext = error?.message
    ? `${context}\n\n${error.message}`
    : context

  const { data } = await fetchGraphql({
    url: graphqlEndpoint,
    query: /* GraphQL */ `
      mutation MUTATE_PREVIEW_NODE($input: WpGatsbyRemotePreviewStatusInput!) {
        wpGatsbyRemotePreviewStatus(input: $input) {
          success
        }
      }
    `,
    variables: {
      input: {
        clientMutationId: `sendPreviewStatus`,
        modified: passedNode?.modified,
        pagePath: pageNode?.path,
        parentId: webhookBody.parentId || webhookBody.previewId, // if the parentId is 0 we want to use the previewId
        status,
        statusContext,
      },
    },
    errorContext: `Error occured while mutating WordPress Preview node meta.`,
    forceReportCriticalErrors: true,
    headers: {
      WPGatsbyPreview: webhookBody.token,
      WPGatsbyPreviewUser: webhookBody.author.node.databaseId,
    },
  })

  if (data?.wpGatsbyRemotePreviewStatus?.success) {
    reporter.log(
      formatLogMessage(
        `Successfully sent Preview status back to WordPress post ${webhookBody.id} during ${context}`
      )
    )
  } else {
    reporter.log(
      formatLogMessage(
        `failed to mutate WordPress post ${webhookBody.id} during Preview ${context}.\nCheck your WP server logs for more information.`
      )
    )
  }
}

/**
 * For previews of draft posts, gatsby develop will throw a bunch of 404 errors
 * while WPGatsby is trying to read page-data.json
 * So we can write a dummy page-data.json if one doesn't exist.
 * that way there will be no 404's and Gatsby will overwrite our dummy file when it
 * needs to.
 */
const writeDummyPageDataJsonIfNeeded = async ({
  webhookBody,
  pageNode,
}: {
  webhookBody: IWebhookBody
  pageNode: IPageNode
}): Promise<void> => {
  if (!webhookBody.isDraft) {
    return
  }

  const pageDataDirectory = path.join(
    process.cwd(),
    `public/page-data`,
    pageNode.path
  )

  await fs.ensureDir(pageDataDirectory)

  const pageDataPath = path.join(pageDataDirectory, `page-data.json`)

  const pageDataExists = await fs.exists(pageDataPath)

  if (!pageDataExists) {
    await fs.writeJSON(pageDataPath, {
      isNewPostDraft: webhookBody.isNewPostDraft,
      isDraft: webhookBody.isDraft,
    })
  }
}

const previewForIdIsAlreadyBeingProcessed = (id: string): boolean => {
  if (!id) {
    return false
  }

  const existingCallbacks = store.getState().previewStore
    .nodePageCreatedCallbacks

  const alreadyProcessingThisPreview = !!existingCallbacks?.[id]

  return alreadyProcessingThisPreview
}
