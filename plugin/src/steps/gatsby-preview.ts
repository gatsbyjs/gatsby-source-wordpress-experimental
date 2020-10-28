import express from "express"
import store from "~/store"

import type { GatsbyHelpers } from "~/utils/gatsby-types"

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

  const contextNode =
    page.context && page.context.id && getNode(page.context.id)

  const nodeThatCreatedThisPage = contextNode

  if (!contextNode) {
    return
  }

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
}): boolean {
  const nodeWasUpdated = !!(
    possiblyUpdatedNode &&
    // if the modifiedDate is after or equal to the modified date of the node
    // then the node was updated already
    new Date(possiblyUpdatedNode.modified).getTime() ===
      new Date(modifiedDate).getTime()
  )

  console.log({
    foundNodeModifiedTime: possiblyUpdatedNode.modified,
    recievedModifiedTime: modifiedDate,
    nodeWasUpdated,
    context,
  })

  return nodeWasUpdated
}

export const setupPreviewRefresher = (helpers: GatsbyHelpers): void => {
  const { app, getNode } = helpers

  const previewStatusEndpoint = `/__wpgatsby-preview-status`

  app.use(previewStatusEndpoint, express.json())
  app.post(previewStatusEndpoint, (req, res) => {
    const { nodeId, modified, ignoreNoIndicationOfSourcing } = req.body || {}
    console.log(`asking for the preview status of Node ${nodeId}`)

    if (!inPreviewMode()) {
      console.log(`not in preview mode`)

      // preview mode is enabled via the ENABLE_GATSBY_REFRESH_ENDPOINT env var
      // If it's not enabled, we let WP know so it can display an error message
      res.json({ type: `NOT_IN_PREVIEW_MODE` })

      return
    }

    const existingNode = getNode(nodeId)

    /**
     * This callback is invoked to respond to the WP preview client
     * and report back on the status of the page being previewed
     */
    function onPageCreatedCallback({ passedNode, pageNode, context }): boolean {
      if (
        !wasNodeUpdated({
          node: passedNode,
          modifiedDate: modified,
          context,
        })
      ) {
        return false
      }

      // if a page node exists and was updated now or before now
      // then we should respond
      if (pageNode && pageNode.updatedAt <= Date.now()) {
        console.log(`sending back to ${passedNode.id} from ${context}`)

        res.json({ type: `PREVIEW_READY`, payload: { pageNode } })

        // we can remove our subscriber when we emit previewReady because
        // WP only allows 1 user to edit/preview any post or page at a time
        store.dispatch.previewStore.unSubscribeToPagesCreatedFromNodeById({
          nodeId: passedNode.id,
        })
        return true
      } else {
        console.log(`not sending back to ${passedNode.id} from ${context}`)
        console.log({
          pageNode,
          now: Date.now(),
        })
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
        return
      }
    }

    // if this node & page haven't been updated yet, set up a subscriber callback
    store.dispatch.previewStore.subscribeToPagesCreatedFromNodeById({
      nodeId,
      onPageCreatedCallback,
      modified,
    })

    if (!ignoreNoIndicationOfSourcing) {
      const { lastAction } = helpers.store.getState()

      if (lastAction.type === `CLEAR_PENDING_PAGE_DATA_WRITES`) {
        console.log(`returning no indication of sourcing`)
        return res.json({ type: `NO_INDICATION_OF_SOURCING` })
      }
    } else {
      console.log(`ignore no indication of sourcing`)
    }
  })
}
