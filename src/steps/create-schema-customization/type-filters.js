import { createRemoteMediaItemNode } from "~/steps/source-nodes/create-nodes/create-remote-media-item-node"

// @todo move this to plugin options
export const typeDefinitionFilters = [
  {
    typeName: `__all`,
    typeDef: (typeDef) => {
      if (typeDef?.fields?.date) {
        const dateField = {
          ...typeDef.fields.date,
          type: `Date`,
          extensions: {
            dateformat: {},
          },
        }

        typeDef.fields.date = dateField
      }

      return typeDef
    },
  },
  {
    typeName: `MediaItem`,
    typeDef: (objectType, { pluginOptions }) => {
      // @todo: this field is deprecated as of 0.1.8, remove this when we get to beta
      objectType.fields.remoteFile = {
        type: `File`,
        deprecationReason: `MediaItem.remoteFile was renamed to localFile`,
        resolve: (mediaItemNode, _, context) => {
          if (!mediaItemNode) {
            return null
          }

          const remoteMediaNodeId =
            mediaItemNode.remoteFile && mediaItemNode.remoteFile.id
              ? mediaItemNode.remoteFile.id
              : null

          if (remoteMediaNodeId) {
            const node = context.nodeModel.getNodeById({
              id: mediaItemNode.remoteFile.id,
              type: `File`,
            })

            if (node) {
              return node
            }
          }

          return createRemoteMediaItemNode({
            mediaItemNode,
          })
        },
      }

      objectType.fields.localFile = {
        type: `File`,
        resolve: (mediaItemNode, _, context) => {
          if (!mediaItemNode) {
            return null
          }

          const localMediaNodeId = mediaItemNode?.localFile?.id

          if (localMediaNodeId) {
            const node = context.nodeModel.getNodeById({
              id: mediaItemNode.localFile.id,
              type: `File`,
            })

            if (node) {
              return node
            }
          }

          return createRemoteMediaItemNode({
            mediaItemNode,
          })
        },
      }

      return objectType
    },
  },
]
