import { runApisInSteps } from "~/utils/run-steps"
import { emitter } from "gatsby/dist/redux"
import express from "express"
import * as steps from "~/steps/index"
import { Server as WebSocketServer } from "ws"

const listeningToNodes = {}

module.exports = runApisInSteps({
  createSchemaCustomization: [
    steps.setGatsbyApiToState,
    steps.ensurePluginRequirementsAreMet,
    steps.ingestRemoteSchema,
    steps.createSchemaCustomization,
  ],

  sourceNodes: [
    steps.setGatsbyApiToState,
    steps.persistPreviouslyCachedImages,
    steps.sourcePreviews,
    steps.sourceNodes,
    steps.setImageNodeIdCache,
  ],

  onPostBuild: [steps.setImageNodeIdCache],

  onCreateNode: [
    ({ node }) => {
      console.log(`createnode ${node?.context?.id}`)
      if (
        node.internal.type === `SitePage` &&
        listeningToNodes[node?.context?.id]
      ) {
        listeningToNodes[node.context.id]?.(node)
      } else {
        listeningToNodes[node.id]?.(node)
      }
    },
  ],

  onCreateDevServer: [
    ({ app, getNodesByType, getNode }) => {
      const refresh = async (req) => {
        emitter.emit(`WEBHOOK_RECEIVED`, {
          webhookBody: req.body,
        })
      }

      const REFRESH_ENDPOINT = `/__wpgatsby-refresh`

      app.use(REFRESH_ENDPOINT, express.json())
      app.post(REFRESH_ENDPOINT, (req, res) => {
        refresh(req)
        res.end()
      })

      const wss = new WebSocketServer({ port: `8988`, path: `/__wpgatsby` })

      wss.on("connection", function (connection) {
        console.log("connection")
        connection.on("message", function message(message) {
          message = JSON.parse(message)
          console.log("id : " + message.nodeId)
          console.log("modified : " + message.modifiedGmt)

          const pageNodes = getNodesByType(`SitePage`)
          const pageNodeForDesiredNode = pageNodes.find((pageNode) => {
            // if there's a page with a matching node id in it's context
            if (pageNode?.context?.id === message.nodeId) {
              // get that node
              const node = getNode(message.nodeId)

              // check if it's been updated since the preview was sent
              return node.modifiedGmt == message.modifiedGmt
            }

            return false
          })

          if (pageNodeForDesiredNode) {
            // console.log(`sending existing node to connection`)
            connection.send(JSON.stringify(pageNodeForDesiredNode))
          } else {
            // console.log(`setting up createnode on ${message.nodeId}`)
            listeningToNodes[message.nodeId] = (pageNode) => {
              if (pageNode.internal.type !== `SitePage`) {
                const pageNodes = getNodesByType(`SitePage`)

                pageNode = pageNodes.find(
                  (pageNode) => pageNode?.context?.id === message.nodeId
                )
              }
              // console.log(`sending created pageNode to connection`)
              connection.send(JSON.stringify(pageNode))
            }
          }
        })
      })
    },
    steps.setImageNodeIdCache,
    steps.startPollingForContentUpdates,
  ],
})
