import chalk from "chalk"
import urlUtil from "url"
import fetchGraphql from "~/utils/fetch-graphql"

import store from "~/store"

import { fetchAndCreateSingleNode } from "~/steps/source-nodes/update-nodes/wp-actions/update"
import { formatLogMessage } from "~/utils/format-log-message"
import { touchValidNodes } from "./source-nodes/update-nodes/fetch-node-updates"

import type { GatsbyHelpers } from "~/utils/gatsby-types"
import { IPluginOptions } from "~/models/gatsby-api"

export const inPreviewMode = (): boolean =>
  !!process.env.ENABLE_GATSBY_REFRESH_ENDPOINT

/**
 * onCreatePage we want to figure out which node the page is dependant on
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
 *
 * onCreatePage we check if the node this page was created from
 * has been updated and if it has a callback waiting for it
 * if both of those things are true we invoke the callback to
 * respond to the WP instance preview client
 */
export const onCreatePageRespondToPreviewStatusQuery = (
  helpers: GatsbyHelpers
): void => {
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

  nodePageCreatedCallback({
    passedNode: nodeThatCreatedThisPage,
    pageNode: page,
    context: `onCreatePage`,
  })
}

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
  if (
    !webhookBody ||
    !webhookBody.preview ||
    !webhookBody.previewId ||
    !webhookBody.id ||
    !webhookBody.token ||
    !webhookBody.remoteUrl ||
    !webhookBody.parentId ||
    !webhookBody.modified
  ) {
    reporter.warn(
      formatLogMessage(
        `sourcePreviews was called but the required webhookBody properties weren't provided.`
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

  // this will wait until the page is created for this node
  // then it'll send a mutation to WPGraphQL so that WP knows the preview is ready
  store.dispatch.previewStore.subscribeToPagesCreatedFromNodeById({
    nodeId: webhookBody.id,
    modified: webhookBody.modified,
    onPageCreatedCallback: async ({ passedNode, pageNode, context }) => {
      const { data } = await fetchGraphql({
        query: /* GraphQL */ `
          mutation MUTATE_PREVIEW_NODE(
            $modified: String!
            $pagePath: String!
            $parentId: Float!
          ) {
            wpGatsbyRevisionStatus(
              input: {
                clientMutationId: $modified
                modified: $modified
                pagePath: $pagePath
                parentId: $parentId
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
        },
        errorContext: `Error occured while mutating WordPress Preview node meta.`,
      })

      if (data.wpGatsbyRevisionStatus.success) {
        reporter.log(
          formatLogMessage(
            `Successfully mutated WordPress post ${webhookBody.id} during Preview ${context}`
          )
        )
      } else {
        reporter.log(
          formatLogMessage(
            `failed to mutate WordPress post ${webhookBody.id} during Preview ${context}.\nCheck your WP server logs for more information.`
          )
        )
      }
    },
  })

  await fetchAndCreateSingleNode({
    actionType: `PREVIEW`,
    ...webhookBody,
    previewParentId: webhookBody.parentId,
  })
}
