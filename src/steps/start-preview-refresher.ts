import express from "express"
import { websocketManager } from "gatsby/dist/utils/websocket-manager"
import { sourcePreviews } from "~/steps/source-nodes/update-nodes/source-previews"

// import { emitter } from "gatsby/dist/redux"
// import { Server as WebSocketServer } from "ws"
// import moment from "moment"

const listenToWebsocket = ({ app, getNodesByType, getNode }): void => {
  const webSocket = websocketManager.getSocket()

  webSocket.on(`connection`, (socket) => {
    socket.on(`subscribeToNodePages`, (nodeId: string) => {
      //   subscribeToPagesCreatedFromNodeById(nodeId, (node) => {
      //       socket.send({ type: `wpPreviewReady`, payload: node })
      //   })
    })
  })
}

export const setupPreviewRefresher = (helpers, pluginOptions) => {
  refreshSourceNodes(helpers, pluginOptions)
  getWebsocket(helpers)
}

const getWebsocket = async (helpers) => {
  // the socket is initialized directly after onCreateDevServer
  // so we need to wait a moment
  setTimeout(() => listenToWebsocket(helpers), 1000)
}

const refreshSourceNodes = (helpers, pluginOptions) => {
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
