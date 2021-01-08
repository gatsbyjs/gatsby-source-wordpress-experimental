import PQueue from "p-queue"
import { processNode } from "~/steps/source-nodes/create-nodes/process-node"
import { getGatsbyApi } from "~/utils/get-gatsby-api"

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
    errorContext: `Error occurred while recursively fetching "MenuItem" nodes in Menu beforeChangeNode API.`,
  })

  const remoteChildMenuItemNodes = Object.values(data)

  await Promise.all(
    remoteChildMenuItemNodes.map(async (remoteMenuItemNode) => {
      if (remoteMenuItemNode.id) {
        additionalNodeIds.push(remoteMenuItemNode.id)
      }

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

const deleteMenuNodeChildMenuItems = (node) => {
  const {
    pluginOptions,
    helpers: { getNodesByType, actions },
  } = getGatsbyApi()

  const allMenuItems = getNodesByType(
    `${pluginOptions.schema.typePrefix}MenuItem`
  )

  const allMenuItemsNodesWithThisMenuIdAsAParent = allMenuItems.filter(
    (menuItemNode) => menuItemNode.menu.node.id === node.id
  )

  allMenuItemsNodesWithThisMenuIdAsAParent?.forEach((menuItemNode) => {
    actions.touchNode({ nodeId: menuItemNode.id })
    actions.deleteNode({
      node: menuItemNode,
    })
  })
}

export const menuBeforeChangeNode = async (api) => {
  if (!api.remoteNode) {
    return null
  }

  if (api.actionType === `DELETE`) {
    // delete child menu items
    return deleteMenuNodeChildMenuItems(api.remoteNode)
  }

  if (api.actionType !== `UPDATE` && api.actionType !== `CREATE`) {
    // no need to update child MenuItems if we're not updating an existing menu
    // if we're creating a new menu it will be empty initially.
    return null
  }

  const additionalNodeIds = []

  // we delete all child menu items first to take care of a WPGQL bug
  // where there are invalid menu items that are not properly attached to our menu
  // because their ID's are incorrect.\
  // @todo remove this once this is fixed in WPGQL
  deleteMenuNodeChildMenuItems(api.remoteNode)
  menuItemFetchQueue.add(fetchChildMenuItems({ ...api, additionalNodeIds }))

  await menuItemFetchQueue.onIdle()
  await menuItemFetchQueue.onEmpty()

  return { additionalNodeIds }
}
