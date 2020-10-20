import express from "express"
import { websocketManager } from "gatsby/dist/utils/websocket-manager"
import { sourcePreviews } from "~/steps/source-nodes/update-nodes/source-previews"
import store from "~/store"

// import { emitter } from "gatsby/dist/redux"
// import { Server as WebSocketServer } from "ws"
// import moment from "moment"

const listenToWebsocket = ({ app, getNodesByType, getNode }): void => {
  const webSocket = websocketManager.getSocket()

  webSocket.on(`connection`, (socket) => {
    function onPageCreatedCallback({ node, pageNode }) {
      console.log(`sending back to ${node.id}`)
      socket.emit(`wpPreviewReady`, { payload: { node, pageNode } })
    }

    socket.on(
      `subscribeToNodePages`,
      ({ nodeId, modified }: { nodeId: string; modified: string }) => {
        console.log(`subscribing to ${nodeId}`)
        const existingNode = getNode(nodeId)

        if (existingNode && existingNode.modified === modified) {
          // if this node was already updated, we need to check the last time it had a page created for it. If that time was before now, send back early, otherwise we need to subscribe to updates on that page.

          const { page } =
            store.getState().previewStore.nodePageCreatedStateByNodeId[
              nodeId
            ] ?? {}

          if (page && page.updatedAt < Date.now()) {
            // this node was already updated, no need to subcribe
            // just send the node back
            console.log(`sending back early`)
            onPageCreatedCallback({ node: existingNode, pageNode: page })

            return
          }
        }

        console.log(`setting up subscriber`)
        // if this node & page haven't been updated yet, set up a subscriber callback
        store.dispatch.previewStore.subscribeToPagesCreatedFromNodeById({
          nodeId,
          onPageCreatedCallback,
        })
      }
    )
  })
}

// onCreatePage we want to figure out which node the page is dependant on
// and then store that page in state
export const savePreviewNodeIdToPageDependency = (helpers) => {
  // if we're not in preview mode we don't want to track this
  if (!process.env.ENABLE_GATSBY_REFRESH_ENDPOINT) {
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
    nodeThatCreatedThisPage = getNode(nodeId)
  }

  if (nodeThatCreatedThisPage) {
    store.dispatch.previewStore.saveNodePageState({
      nodeId: nodeThatCreatedThisPage.id,
      page,
    })
  }
}

export const onCreatePageRespondToPreviewWebsocket = (
  helpers,
  pluginOptions
) => {
  const {
    nodePageCreatedCallbacks,
    pageIdToNodeDependencyId,
  } = store.getState().previewStore
  const { page, getNode } = helpers

  if (!nodePageCreatedCallbacks) {
    return
  }

  const nodeIdThatCreatedThisPage = pageIdToNodeDependencyId[page.id]

  if (!nodeIdThatCreatedThisPage) {
    console.log(`no node id that created this page`)
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
    nodePageCreatedCallback({ node: nodeThatCreatedThisPage, pageNode: page })
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
    sourcePreviews({ ...helpers, webhookBody: req.body }, pluginOptions)

    res.end()
  })

  //   const wss = new WebSocketServer({ port: 8988, path: `/__wpgatsby` })
  //
  //   wss.on("connection", function (connection) {
  //     console.log("connection")
  //     connection.on("message", function message(message) {
  //       message = JSON.parse(message)
  //       console.log("id : " + message.nodeId)
  //       console.log("modified : " + message.modifiedGmt)

  //       const pageNodes = getNodesByType(`SitePage`)
  //       const pageNodeForDesiredNode = pageNodes.find((pageNode) => {
  //         // if there's a page with a matching node id in it's context
  //         if (pageNode.context && pageNode.context.id === message.nodeId) {
  //           // get that node
  //           const node = getNode(message.nodeId)

  //           const nodeModifiedTime = moment.utc(node.modifiedGmt).unix()
  //           const receivedTime = moment.utc(message.modifiedGmt).unix()

  //           // check if it's been updated since the preview was sent
  //           // if it has we want to send that back right away to remove the loader
  //           const nodeIsStale =
  //             // if the modified date of the node we have
  //             nodeModifiedTime <
  //             // is earlier than the modified date sent
  //             receivedTime

  //           dump({
  //             nodeModifiedTime,
  //             receivedTime,
  //           })

  //           if (node && !nodeIsStale) {
  //             console.log(`found unstale node`)
  //             console.log(`unstale node modified = ${node.modifiedGmt}`)
  //           } else if (node && nodeIsStale) {
  //             console.log(`found stale node`)
  //             console.log(`stale node modified = ${node.modifiedGmt}`)
  //           }

  //           return !nodeIsStale
  //         }

  //         return false
  //       })

  //       if (pageNodeForDesiredNode) {
  //         console.log(`sending existing node to connection`)
  //         // console.log(pageNodeForDesiredNode)
  //         connection.send(JSON.stringify(pageNodeForDesiredNode))
  //       } else {
  //         console.log(`setting up createnode on ${message.nodeId}`)
  //         listeningToNodes[message.nodeId] = (pageNode) => {
  //           if (pageNode.internal.type !== `SitePage`) {
  //             const pageNodes = getNodesByType(`SitePage`)

  //             pageNode = pageNodes.find(
  //               (pageNode) =>
  //                 pageNode.context && pageNode.context.id === message.nodeId
  //             )
  //           }
  //           console.log(`sending created pageNode to connection`)
  //           connection.send(JSON.stringify(pageNode))
  //         }
  //       }
  //     })
  //   })
}
