import express from "express"
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

  const nodeThatCreatedThisPage = getNode(nodeIdThatCreatedThisPage)

  const nodePageCreatedCallback =
    nodeThatCreatedThisPage &&
    nodePageCreatedCallbacks[nodeThatCreatedThisPage.id]

  if (
    nodeThatCreatedThisPage &&
    typeof nodePageCreatedCallback === `function`
  ) {
    nodePageCreatedCallback({
      passedNode: nodeThatCreatedThisPage,
      pageNode: page,
      context: `onCreatePage`,
    })
  }
}

function wasNodeUpdated({
  node: possiblyUpdatedNode,
  modifiedDate,
  context,
  helpers,
}): boolean {
  const nodeWasUpdated = !!(
    possiblyUpdatedNode &&
    // if the modifiedDate is equal to the modified date of the node
    // then the node was updated already
    new Date(possiblyUpdatedNode.modified).getTime() ===
      new Date(modifiedDate).getTime()
  )

  helpers.reporter.log(
    formatLogMessage(
      `Check if node was updated:\n\n${JSON.stringify(
        {
          foundNodeModifiedTime: possiblyUpdatedNode.modified,
          recievedModifiedTime: modifiedDate,
          nodeWasUpdated,
          context,
        },
        null,
        2
      )}\n`
    )
  )

  return nodeWasUpdated
}

export const addPreviewStatusResolver = (helpers: GatsbyHelpers): void => {
  return

  const { createResolvers, getNode } = helpers

  createResolvers({
    Query: {
      wpPreviewStatus: {
        type: `WpPreviewStatus`,
        args: {
          nodeId: `String!`,
          modified: `String!`,
        },
        resolve(source, args, context, info) {
          let previewStatusResolve

          const previewStatusPromise = new Promise((resolve) => {
            previewStatusResolve = resolve
          })

          const {
            nodeId,
            modified,
            // ignoreNoIndicationOfSourcing
          } = args

          helpers.reporter.log(
            formatLogMessage(`asking for the preview status of Node ${nodeId}`)
          )

          if (!inPreviewMode()) {
            helpers.reporter.log(
              formatLogMessage(
                `Not in preview mode but wpPreviewStatus was queried.`
              )
            )

            // preview mode is enabled via the ENABLE_GATSBY_REFRESH_ENDPOINT env var
            // If it's not enabled, we let WP know so it can display an error message
            previewStatusResolve({ statusType: `NOT_IN_PREVIEW_MODE` })

            return previewStatusPromise
          }

          const existingNode = getNode(nodeId)

          /**
           * This callback is invoked to respond to the WP preview client
           * and report back on the status of the page being previewed
           */
          function onPageCreatedCallback({
            passedNode,
            pageNode,
            context,
          }): boolean {
            if (
              !wasNodeUpdated({
                node: passedNode,
                modifiedDate: modified,
                context,
                helpers,
              })
            ) {
              return false
            }

            // if a page node exists and was updated now or before now
            // then we should respond
            if (pageNode && pageNode.updatedAt <= Date.now()) {
              helpers.reporter.log(
                formatLogMessage(
                  `Sending response to Preview status query for Node ${passedNode.id} from ${context}`
                )
              )

              previewStatusResolve({
                statusType: `PREVIEW_READY`,
                pageNode,
              })

              // we can remove our subscriber when we emit previewReady because
              // WP only allows 1 user to edit/preview any post or page at a time
              store.dispatch.previewStore.unSubscribeToPagesCreatedFromNodeById(
                {
                  nodeId: passedNode.id,
                }
              )
              return true
            }

            return false
          }

          const nodePagesCreatedByNodeIds = store.getState().previewStore
            .nodeIdsToCreatedPages

          const thisNodePage = nodePagesCreatedByNodeIds?.[nodeId]

          const { page } = thisNodePage ?? {}

          if (existingNode && page) {
            // call the callback immediately. It's internal checks will determine wether it's the right time or not.
            const wasPreviewLoaded = onPageCreatedCallback({
              passedNode: existingNode,
              pageNode: page,
              context: `existing node callback`,
            })

            if (wasPreviewLoaded) {
              return previewStatusPromise
            }
          }

          // if this node & page haven't been updated yet, set up a subscriber callback
          store.dispatch.previewStore.subscribeToPagesCreatedFromNodeById({
            nodeId,
            onPageCreatedCallback,
            modified,
          })

          // if (!ignoreNoIndicationOfSourcing) {
          //   const { lastAction } = helpers.store.getState()

          //   if (lastAction.type === `CLEAR_PENDING_PAGE_DATA_WRITES`) {
          //     helpers.reporter.log(
          //       formatLogMessage(`returning no indication of sourcing`)
          //     )
          //     return res.json({ statusType: `NO_INDICATION_OF_SOURCING` })
          //   }
          // } else {
          //   helpers.reporter.log(formatLogMessage(`ignore no indication of sourcing`))
          // }

          return previewStatusPromise
        },
      },
    },
  })
}

export const addPreviewStatusField = (helpers: GatsbyHelpers): void => {
  const { actions } = helpers

  actions.createTypes([
    /* GraphQL */ `
      enum WpPreviewStatusTypeEnum {
        PREVIEW_READY
        NOT_IN_PREVIEW_MODE
        NO_INDICATION_OF_SOURCING
      }

      type WpPreviewStatusPageNode {
        path: String
      }

      type WpPreviewStatus {
        statusType: WpPreviewStatusTypeEnum
        pageNode: WpPreviewStatusPageNode
      }
    `,
  ])
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

  store.dispatch.previewStore.subscribeToPagesCreatedFromNodeById({
    nodeId: webhookBody.id,
    modified: webhookBody.modified,
    onPageCreatedCallback: async ({ passedNode, pageNode, context }) => {
      // mutate WP post to add Gatsby page path

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

      dump(passedNode.databaseId)

      if (data.wpGatsbyRevisionStatus.success) {
        reporter.log(
          formatLogMessage(
            `Successfully mutated WordPress post during preview onCreatePage`
          )
        )
      } else {
        reporter.log(
          formatLogMessage(
            `failed to mutate WordPress post during preview onCreatePage.\nCheck your WP server logs for more information.`
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
