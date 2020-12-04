import path from "path"
import fs from "fs-extra"
import chalk from "chalk"
import urlUtil from "url"
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

/**
 * This is called when the /__refresh endpoint is posted to from WP previews.
 * It should only ever run in Preview mode, which is process.env.ENABLE_GATSBY_REFRESH_ENDPOINT = true
 */
export const sourcePreviews = async (
  {
    webhookBody,
    reporter,
  }: {
    webhookBody: IWebhookBody
    // this comes from Gatsby
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    reporter: any
  },
  { url }: IPluginOptions
): Promise<void> => {
  const requiredProperties = [
    `preview`,
    `previewId`,
    `id`,
    `token`,
    `remoteUrl`,
    `parentId`,
    `modified`,
  ]

  const missingProperties = requiredProperties.filter(
    (property) => !(property in webhookBody)
  )

  if (!webhookBody || missingProperties.length) {
    reporter.warn(
      formatLogMessage(
        `sourcePreviews was called but the required webhookBody properties weren't provided.`
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

  const sendPreviewStatus = async ({
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
        mutation MUTATE_PREVIEW_NODE(
          $input: WpGatsbyRemotePreviewStatusInput!
        ) {
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
