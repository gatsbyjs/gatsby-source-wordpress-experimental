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

/**
 * This is called when the /__refresh endpoint is posted to from WP previews.
 * It should only ever run in Preview mode, which is process.env.ENABLE_GATSBY_REFRESH_ENDPOINT = true
 */
export const sourcePreviews = async (
  {
    webhookBody,
    reporter,
  }: {
    webhookBody: {
      preview: boolean
      previewId: number
      token: string
      remoteUrl: string
      modified: string
      parentId: number
      id: string
    }
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
    passedNode?: {
      modified?: string
      databaseId: number
    }
    pageNode?: {
      path: string
    }
    graphqlEndpoint?: string
  }

  const sendPreviewStatus = async ({
    passedNode,
    pageNode,
    context,
    status,
    graphqlEndpoint,
  }: OnPreviewStatusInput): Promise<void> => {
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
          parentId: passedNode.databaseId,
          status,
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

    reporter.panic(
      formatLogMessage(
        `Received preview data from a different remote URL than the one specified in plugin options. \n\n ${chalk.bold(
          `Remote URL:`
        )} ${webhookBody.remoteUrl}\n ${chalk.bold(
          `Plugin options URL:`
        )} ${url}`
      )
    )
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
