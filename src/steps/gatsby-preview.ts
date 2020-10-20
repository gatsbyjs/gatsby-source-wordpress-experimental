import express from "express"
import { websocketManager } from "gatsby/dist/utils/websocket-manager"
import { sourcePreviews } from "~/steps/source-nodes/update-nodes/source-previews"
import store from "~/store"

const listenToWebsocket = ({ getNode }): void => {
  const webSocket = websocketManager.getSocket()

  webSocket.on(`connection`, (socket) => {
    socket.on(
      `subscribeToNodePages`,
      ({ nodeId, modified }: { nodeId: string; modified: string }) => {
        const { inPreviewMode } = store.getState().previewStore

        if (!inPreviewMode) {
          console.log(`not in preview mode`)

          // preview mode is enabled via the refresh webhook.
          // we should wait a bit and then check if it's become enabled.
          // if it's still not enabled we should send an event back to the browser saying to press preview again.
          socket.emit(`wpNotInPreviewMode`)
        }

        console.log(`subscribing to ${nodeId}`)
        const existingNode = getNode(nodeId)

        function wasNodeUpdated({ node: possiblyUpdatedNode, modifiedDate }) {
          console.log({
            possiblyUpdatedModifiedTime: possiblyUpdatedNode.modified,
            websocketSentModifiedTime: modifiedDate,
          })
          return (
            possiblyUpdatedNode &&
            // if the modifiedDate is after or equal to the modified date of the node
            // then the node was updated already
            new Date(possiblyUpdatedNode.modified).getTime() >=
              new Date(modifiedDate).getTime()
          )
        }

        function onPageCreatedCallback({ passedNode, pageNode, context }) {
          if (!wasNodeUpdated({ node: passedNode, modifiedDate: modified })) {
            console.log(
              `node was not updated yet but onPageCreatedCallback was called`
            )
            return
          }

          if (pageNode && pageNode.updatedAt < Date.now()) {
            // this node was already updated, no need to subcribe
            // just send the node back
            console.log(`sending back to ${passedNode.id} from ${context}`)
            socket.emit(`wpPreviewReady`, { payload: { passedNode, pageNode } })
            // we can remove our subscriber when we emit previewReady because
            // WP only allows 1 user to edit/preview any post or page at a time
            store.dispatch.previewStore.unSubscribeToPagesCreatedFromNodeById({
              nodeId: passedNode.id,
            })
            return
          }
        }

        const { page } =
          store.getState().previewStore.nodePageCreatedStateByNodeId[nodeId] ??
          {}

        if (existingNode) {
          // call the callback immediately. It's internal checks will determine wether it's the right time or not.
          onPageCreatedCallback({
            passedNode: existingNode,
            pageNode: page,
            context: `existing node`,
          })
        }

        if (!inPreviewMode) {
          // no need to set up a subscriber since we're not in preview mode yet
          // once the user clicks preview again it will put us in preview mode
          // and then we'll want to subscribe to pages created from this node id
          // we can get into this state if the preview server get's rebooted
          // while someone has a preview tab open.
          // refreshing the page will mean we're asking for wether a node is ready or not
          // but we aren't in preview mode because preview hasn't been clicked
          // since the process started
          console.log(`not in preview mode, not setting up a subscriber`)
          return
        }

        console.log(`setting up subscriber`)
        // if this node & page haven't been updated yet, set up a subscriber callback
        store.dispatch.previewStore.subscribeToPagesCreatedFromNodeById({
          nodeId,
          onPageCreatedCallback,
          modified,
        })
      }
    )
  })
}

const inPreviewMode = () => {
  const { inPreviewMode } = store.getState().previewStore

  return inPreviewMode
}

// onCreatePage we want to figure out which node the page is dependant on
// and then store that page in state
export const savePreviewNodeIdToPageDependency = (helpers) => {
  // if we're not in preview mode we don't want to track this
  // if (!inPreviewMode()) {
  //   return
  // }
  // actually we want to track nodeId -> pageId always in develop
  // the reason is that we want to be able to return info about
  // pages from a clean build before the refresh endpoint puts us into preview mode.
  if (process.env.NODE_ENV !== `development`) {
    return
  }

  const { page, store: gatsbyState, getNode } = helpers

  const contextNode =
    page.context && page.context.id && getNode(page.context.id)

  let nodeThatCreatedThisPage = contextNode

  // we want to try to get the node by context id
  // because otherwise we need to look it up expensively in componentDataDependencies
  // by finding the map key (nodeId) where the map value is an array containing page.path 😱 not good
  if (!nodeThatCreatedThisPage) {
    const state = gatsbyState.getState()

    const getMapKeyByValue = (val) => {
      /**
       * this is expensive because we're looking up a map key (node id) by wether our value exists within it's value which is an array of page paths
       */
      const returnedEntries = [
        ...state.componentDataDependencies.nodes,
      ].find(([, value]) => [...value].includes(val))

      if (returnedEntries && returnedEntries.length) {
        return returnedEntries[0]
      }

      return null
    }

    const nodeId = getMapKeyByValue(page.path)
    // console.log(`state node id ${nodeId}`)
    nodeThatCreatedThisPage = getNode(nodeId)
  }

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

export const onCreatePageRespondToPreviewWebsocket = (helpers) => {
  // if we're not in preview mode we don't want to set this up
  if (!inPreviewMode()) {
    console.log(`not in preview mode`)
    return
  }

  const {
    nodePageCreatedCallbacks,
    pageIdToNodeDependencyId,
  } = store.getState().previewStore

  const { page, getNode } = helpers

  const debugMode = page.path.includes(`generated-preview-path`)

  if (debugMode) {
    console.log(`onCreatePageRespondToPreviewWebsocket`)
  }

  debugMode && console.log(`in preview debug mode`)

  if (
    !nodePageCreatedCallbacks ||
    !Object.keys(nodePageCreatedCallbacks).length
  ) {
    debugMode && console.log(`no nodePageCreatedCallbacks`)
    return
  }

  const nodeIdThatCreatedThisPage =
    pageIdToNodeDependencyId?.[page.path]?.nodeId

  if (!nodeIdThatCreatedThisPage) {
    debugMode && console.log(`no node id that created this page`)
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
  } else {
    debugMode && console.log("no nodeThatCreated this page")
  }
}

export const setupPreviewRefresher = (helpers, pluginOptions) => {
  previewRefreshWebhook(helpers, pluginOptions)
  getWebsocket(helpers)
}

const getWebsocket = (helpers) => {
  // the socket is initialized directly after onCreateDevServer
  // so we need to wait a moment
  // this is hacky. @todo either setup a new websocket server or PR core to pass the socket to onCreateDevServer
  setTimeout(() => listenToWebsocket(helpers), 5000)
}

const previewRefreshWebhook = (helpers, pluginOptions) => {
  const { app } = helpers

  const refreshEndpoint = `/__wpgatsby-refresh`

  app.use(refreshEndpoint, express.json())
  app.post(refreshEndpoint, (req, res) => {
    console.log(`sourcing previews`)
    sourcePreviews({ ...helpers, webhookBody: req.body }, pluginOptions)

    res.end()
  })
}
