import chalk from "chalk"
import urlUtil from "url"
import fetchGraphql from "~/utils/fetch-graphql"

import store from "~/store"

import { fetchAndCreateSingleNode } from "~/steps/source-nodes/update-nodes/wp-actions/update"
import { formatLogMessage } from "~/utils/format-log-message"
import { touchValidNodes } from "./source-nodes/update-nodes/fetch-node-updates"

import type { GatsbyHelpers } from "~/utils/gatsby-types"
import { IPluginOptions } from "~/models/gatsby-api"
import { OnPageCreatedCallback } from "../models/preview"

export const inPreviewMode = (): boolean =>
  !!process.env.ENABLE_GATSBY_REFRESH_ENDPOINT

/**
 * during onCreatePage we want to figure out which node the page is dependant on
and then store that page in state so we can return info about the page to WordPress
when the page is updated during Previews.
We do that by finding the node id on pageContext.id
Ideally we could detect this without the need for pageContext.id.
There was an attempt to use store.componentDataDependencies but my implementation 
was buggy and unreliable. @todo it's worth trying to remove the need for 
pageContext.id again in the future.
 */
export const savePreviewNodeIdToPageDependency = (
  helpers: GatsbyHelpers
): void => {
  // if we're not in preview mode we don't want to track this
  if (!inPreviewMode()) {
    return
  }

  const { page, getNode } = helpers

  const nodeThatCreatedThisPage =
    page.context && page.context.id && getNode(page.context.id)

  if (nodeThatCreatedThisPage) {
    store.dispatch.previewStore.saveNodePageState({
      nodeId: nodeThatCreatedThisPage.id,
      page: {
        path: page.path,
        updatedAt: page.updatedAt,
      },
    })
  }
}

/**
 * during onCreatePage we check if the node this page was created from
 * has been updated and if it has a callback waiting for it
 * if both of those things are true we invoke the callback to
 * respond to the WP instance preview client
 */
export const onCreatePageRespondToPreviewStatusQuery = async (
  helpers: GatsbyHelpers
): Promise<void> => {
  // if we're not in preview mode we don't want to set this up
  if (!inPreviewMode()) {
    return
  }

  const {
    nodePageCreatedCallbacks,
    pagePathToNodeDependencyId,
  } = store.getState().previewStore

  const { page, getNode } = helpers

  if (
    !nodePageCreatedCallbacks ||
    !Object.keys(nodePageCreatedCallbacks).length
  ) {
    return
  }

  const nodeIdThatCreatedThisPage =
    pagePathToNodeDependencyId?.[page.path]?.nodeId

  if (!nodeIdThatCreatedThisPage) {
    return
  }

  const nodePageCreatedCallback =
    nodeIdThatCreatedThisPage &&
    nodePageCreatedCallbacks[nodeIdThatCreatedThisPage]

  if (
    !nodeIdThatCreatedThisPage ||
    typeof nodePageCreatedCallback !== `function`
  ) {
    return
  }

  const nodeThatCreatedThisPage = getNode(nodeIdThatCreatedThisPage)

  if (!nodeThatCreatedThisPage) {
    helpers.reporter.warn(
      formatLogMessage(
        `There was an attempt to call a Preview onPageCreated callback for node ${nodeIdThatCreatedThisPage}, but no node was found.`
      )
    )
    return
  }

  await nodePageCreatedCallback({
    passedNode: nodeThatCreatedThisPage,
    pageNode: page,
    context: `onCreatePage Preview callback invocation`,
    status: `PREVIEW_SUCCESS`,
  })

  store.dispatch.previewStore.unSubscribeToPagesCreatedFromNodeById({
    nodeId: nodeIdThatCreatedThisPage,
  })
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
    webhookBody: {
      preview: boolean
      previewId: string
      token: string
      remoteUrl: string
      modified: string
      parentId: string
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

  if (settingsHostname !== remoteHostname) {
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

  const onPageCreatedCallback = async ({
    passedNode,
    pageNode,
    context,
    status,
  }): Promise<void> => {
    const { data } = await fetchGraphql({
      query: /* GraphQL */ `
        mutation MUTATE_PREVIEW_NODE(
          $modified: String!
          $parentId: Float!
          $pagePath: String
          $status: WPGatsbyRemotePreviewStatusEnum!
          $context: String
        ) {
          wpGatsbyRemotePreviewStatus(
            input: {
              clientMutationId: $modified
              modified: $modified
              pagePath: $pagePath
              parentId: $parentId
              status: $status
              statusContext: $context
            }
          ) {
            success
          }
        }
      `,
      variables: {
        modified: passedNode.modified,
        pagePath: pageNode.path,
        parentId: passedNode.databaseId,
        status,
        context,
      },
      errorContext: `Error occured while mutating WordPress Preview node meta.`,
    })

    if (data.wpGatsbyRemotePreviewStatus.success) {
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

  // this callback will be invoked when the page is created/updated for this node
  // then it'll send a mutation to WPGraphQL so that WP knows the preview is ready
  store.dispatch.previewStore.subscribeToPagesCreatedFromNodeById({
    nodeId: webhookBody.id,
    modified: webhookBody.modified,
    onPageCreatedCallback,
  })

  await fetchAndCreateSingleNode({
    actionType: `PREVIEW`,
    ...webhookBody,
    previewParentId: webhookBody.parentId,
    isPreview: true,
  })
}

/**
 * Preview callbacks are usually invoked during onCreatePage in Gatsby Preview
 * so that we can send back the preview status of a created page to WP
 * In the case that no page is created for the node we're previewing, we'll
 * have callbacks hanging around and WP will not know the status of the preview
 * So in onPreExtractQueries (which runs after pages are created), we check which
 * preview callbacks haven't been invoked, and invoke them with a "NO_PAGE_CREATED_FOR_PREVIEWED_NODE" status, which sends that status to WP
 * After invoking all these leftovers, we clear them out from the store so they aren't called again later.
 */
export const onPreExtractQueriesInvokeLeftoverPreviewCallbacks = async (): Promise<
  void
> =>
  // check for any onCreatePageCallbacks that weren't called during createPages
  // we need to tell WP that a page wasn't created for the preview
  invokeAndCleanupLeftoverPreviewCallbacks({
    status: `NO_PAGE_CREATED_FOR_PREVIEWED_NODE`,
    context: `onPreExtractQueries check for previewed nodes without pages`,
  })

export const invokeAndCleanupLeftoverPreviewCallbacks = async ({
  status,
  context,
}: {
  status: string
  context: string
}): Promise<void> => {
  const state = store.getState()

  const { getNode } = state.gatsbyApi.helpers

  const leftoverCallbacks = state.previewStore.nodePageCreatedCallbacks

  const leftoverCallbacksExist = Object.keys(leftoverCallbacks).length

  if (leftoverCallbacksExist) {
    await Promise.all(
      Object.entries(leftoverCallbacks).map(
        invokeLeftoverPreviewCallback({ getNode, status, context })
      )
    )

    // after processing our callbacks, we need to remove them all so they don't get called again in the future
    store.dispatch.previewStore.clearPreviewCallbacks()
  }
}

/**
 * This callback is invoked to send WP the preview status. In this case the status
 * is that we couldn't find a page for the node being previewed
 */
const invokeLeftoverPreviewCallback = ({ getNode, status, context }) => async ([
  nodeId,
  callback,
]: [string, OnPageCreatedCallback]): Promise<void> => {
  const passedNode = getNode(nodeId)

  await callback({
    passedNode,
    // we pass null as the path because no page was created for this node.
    // if it had been, this callback would've been removed earlier in the process
    pageNode: { path: null },
    status,
    context,
  })
}
