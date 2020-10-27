import express from "express"
import store from "~/store"

export const inPreviewMode = (): boolean =>
  !!process.env.ENABLE_GATSBY_REFRESH_ENDPOINT

// onCreatePage we want to figure out which node the page is dependant on
// and then store that page in state
export const savePreviewNodeIdToPageDependency = (helpers) => {
  // if we're not in preview mode we don't want to track this
  if (!inPreviewMode()) {
    return
  }

  const { page, getNode } = helpers

  const contextNode =
    page.context && page.context.id && getNode(page.context.id)

  let nodeThatCreatedThisPage = contextNode

  if (!contextNode) {
    return
  }

  // // the following code could be used to remove the requirement that
  // // node.id is passed to pageContext when creating pages.
  // // Unfortunately it was really buggy in the current implementation
  // // So folks can just add the id to pageContext and it will work
  // // Leaving this in case someone comes here trying to remove the pageContext.id
  // // requirement in the future
  // //
  // // we want to try to get the node by context id
  // // because otherwise we need to look it up expensively in componentDataDependencies
  // // by finding the map key (nodeId) where the map value is an array containing page.path 😱 not good
  // if (!nodeThatCreatedThisPage) {
  //   const state = gatsbyState.getState()

  //   const getMapKeyByValue = (val) => {
  //     /**
  //      * this is expensive because we're looking up a map key (node id) by wether our value exists within it's value which is an array of page paths
  //      */
  //     const returnedEntries = [
  //       ...state.componentDataDependencies.nodes,
  //     ].find(([, value]) => [...value].includes(val))

  //     if (returnedEntries && returnedEntries.length) {
  //       return returnedEntries[0]
  //     }

  //     return null
  //   }

  //   const nodeId = getMapKeyByValue(page.path)

  //   // console.log(`state node id ${nodeId}`)
  //   nodeThatCreatedThisPage = getNode(nodeId)
  // }

  if (nodeThatCreatedThisPage) {
    store.dispatch.previewStore.saveNodePageState({
      nodeId: nodeThatCreatedThisPage.id,
      page,
    })
    // console.log(`node created this page`)
    // console.log(nodeThatCreatedThisPage)
  } else {
    // console.log(`no node that created this page`)
  }
}

export const onCreatePageRespondToPreviewStatusQuery = (helpers) => {
  // if we're not in preview mode we don't want to set this up
  if (!inPreviewMode()) {
    console.log(`not in preview mode`)
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

export const setupPreviewRefresher = (helpers, pluginOptions) => {
  previewRefreshWebhook(helpers, pluginOptions)
}

function wasNodeUpdated({ node: possiblyUpdatedNode, modifiedDate, context }) {
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

const previewRefreshWebhook = (helpers, pluginOptions) => {
  const { app, getNode } = helpers

  const previewStatusEndpoint = `/__wpgatsby-preview-status`

  app.use(previewStatusEndpoint, express.json())
  app.post(previewStatusEndpoint, (req, res) => {
    const { nodeId, modified } = req.body
    console.log(`asking for ${nodeId} preview info`)

    if (!inPreviewMode()) {
      console.log(`not in preview mode`)

      // preview mode is enabled via the refresh webhook.
      // we should wait a bit and then check if it's become enabled.
      // if it's still not enabled we should send an event back to the browser saying to press preview again.
      res.json({ type: `wpNotInPreviewMode` })

      return
    }

    const existingNode = getNode(nodeId)

    function onPageCreatedCallback({ passedNode, pageNode, context }) {
      if (
        !wasNodeUpdated({
          node: passedNode,
          modifiedDate: modified,
          context,
        })
      ) {
        console.log(
          `node was not updated yet but onPageCreatedCallback was called from "${context}"`
        )
        return false
      }

      if (pageNode && pageNode.updatedAt <= Date.now()) {
        // this node was already updated, no need to subcribe
        // just send the node back
        console.log(`sending back to ${passedNode.id} from ${context}`)

        res.json({ type: `wpPreviewReady`, payload: { passedNode, pageNode } })

        // we can remove our subscriber when we emit previewReady because
        // WP only allows 1 user to edit/preview any post or page at a time
        store.dispatch.previewStore.unSubscribeToPagesCreatedFromNodeById({
          nodeId: passedNode.id,
        })
        return true
      } else {
        console.log(`node was updated but no pageNode?`)
        console.log({ pageNode })
        return false
      }
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
        console.log(`existing node preview was loaded`)
        return
      } else {
        console.log(`existing node preview was not loaded`)
        nodePagesCreatedByNodeIds
      }
    }

    if (!page) {
      console.log(`no existing page for ${nodeId}`)
    } else {
      console.log(`node page exists`)
    }
    if (!existingNode) {
      console.log(`no existing node for ${nodeId}`)
    } else {
      console.log(`node exists`)
    }

    console.log(`setting up subscriber`)

    // if this node & page haven't been updated yet, set up a subscriber callback
    store.dispatch.previewStore.subscribeToPagesCreatedFromNodeById({
      nodeId,
      onPageCreatedCallback,
      modified,
    })
  })
}
