// const filteredData = applyNodeFilter({
//     name: `wp-template-directories`,
//     context: {
//         sourcePluginId: pluginOptions.id,
//         nodeId: `jfdklsjfks8`
//     },
//     data: {},
// })

// exports.onPreInit = ({ pluginOptions }) => {
//     addNodeFilter({
//         name: `wp-template-directories`,
//         filter: async ({ context, data, name, helpers, actions }) => {
//             if (context.sourcePluginId === pluginOptions.id) {
//                 const node = await helpers.getNode(context.nodeId)
//             }
//         },
//     })
// }

// exports.createNodes = () => {
//     const node = fetchNode()

//     const filteredNode = applyFilter({
//         data: {
//             node
//         },
//     })

//     createNode(filteredNode)
// }

import store from "~/store"

export const applyNodeFilter = async ({ name, context, data }) => {
  if (!name) {
    return data
  }

  const nodeFilters = store.getState().wpHooks.nodeFilters?.[name]

  if (!nodeFilters || !nodeFilters.length) {
    return data
  }

  const sortedNodeFilters = nodeFilters.sort((a, b) => a.priority - b.priority)

  for (const { filter } of sortedNodeFilters) {
    data = filter({ data, context, name })
  }

  return data
}

// { name, filter, data, context }
export const addNodeFilter = (filter) => {
  store.dispatch.wpHooks.addNodeFilter(filter)
}
