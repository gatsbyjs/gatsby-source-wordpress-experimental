import PQueue from "p-queue"
import { processNode } from "~/steps/source-nodes/create-nodes/process-node"

const menuItemFetchQueue = new PQueue({
  concurrency: Number(process.env.GATSBY_CONCURRENT_DOWNLOAD ?? 200),
  carryoverConcurrencyCount: true,
})

const fetchChildMenuItems = (api) => async () => {
  const {
    remoteNode,
    wpStore,
    fetchGraphql,
    helpers,
    actions,
    buildTypeName,
    additionalNodeIds,
  } = api

  if (
    !remoteNode?.menuItems?.nodes?.length &&
    !remoteNode?.childItems?.nodes?.length
  ) {
    // if we don't have any child menu items to fetch, skip out
    return
  }

  const state = wpStore.getState()

  const { selectionSet } = state.remoteSchema.nodeQueries.menuItems
  const { wpUrl } = state.remoteSchema
  const { pluginOptions } = state.gatsbyApi

  const query = /* GraphQL */ `
    fragment MENU_ITEM_FIELDS on MenuItem {
      ${selectionSet}
    }

    query {
      ${(remoteNode.menuItems || remoteNode.childItems).nodes
        .map(
          ({ id }, index) =>
            `id__${index}: menuItem(id: "${id}") { ...MENU_ITEM_FIELDS }`
        )
        .join(` `)}
    }`

  const { data } = await fetchGraphql({
    query,
    errorContext: `Error occured while recursively fetching "MenuItem" nodes in Menu beforeChangeNode API.`,
  })

  const remoteChildMenuItemNodes = Object.values(data)

  remoteChildMenuItemNodes.forEach(
    ({ id } = {}) => id && additionalNodeIds.push(id)
  )

  await Promise.all(
    remoteChildMenuItemNodes.map(async (remoteMenuItemNode) => {
      // recursively fetch child menu items
      menuItemFetchQueue.add(
        fetchChildMenuItems({
          ...api,
          remoteNode: remoteMenuItemNode,
        })
      )

      const type = buildTypeName(`MenuItem`)

      const processedNode = await processNode({
        node: remoteMenuItemNode,
        pluginOptions,
        wpUrl,
        helpers,
      })

      await actions.createNode({
        ...processedNode,
        nodeType: `MenuItem`,
        type: `MenuItem`,
        parent: null,
        internal: {
          contentDigest: helpers.createContentDigest(remoteMenuItemNode),
          type,
        },
      })
    })
  )
}

export const menuBeforeChangeNode = async (api) => {
  if (api.actionType !== `UPDATE` && api.actionType !== `CREATE`) {
    // no need to update child MenuItems if we're not updating an existing menu
    // if we're creating a new menu it will be empty initially.
    return null
  }

  const additionalNodeIds = []

  menuItemFetchQueue.add(fetchChildMenuItems({ ...api, additionalNodeIds }))

  await menuItemFetchQueue.onIdle()

  return { additionalNodeIds }
}
