import store from "~/store"
import fetchGraphql from "~/utils/fetch-graphql"
import { formatLogMessage } from "~/utils/format-log-message"
import { createNodeWithSideEffects } from "./create-nodes"
import fetchReferencedMediaItemsAndCreateNodes from "../fetch-nodes/fetch-referenced-media-items"
import { CREATED_NODE_IDS } from "~/constants"

const fetchAndCreateNonNodeRootFields = async () => {
  const {
    remoteSchema: { nonNodeQuery, wpUrl },
    gatsbyApi: { helpers, pluginOptions },
  } = store.getState()

  const { actions, createContentDigest, cache, reporter } = helpers

  const activity = reporter.activityTimer(formatLogMessage(`fetch root fields`))

  activity.start()

  const { data } = await fetchGraphql({
    query: nonNodeQuery,
    errorContext: `Error occured while fetching non-Node root fields.`,
  })

  const createdNodeIds = []
  // const totalSideEffectNodes = []
  const referencedMediaItemNodeIds = new Set()

  const type = pluginOptions.schema.typePrefix

  const node = {
    ...data,
    id: `${pluginOptions.url}--rootfields`,
    type,
  }

  const createRootNode = createNodeWithSideEffects({
    node,
    actions,
    createContentDigest,
    pluginOptions,
    referencedMediaItemNodeIds,
    helpers,
    createdNodeIds,
    // totalSideEffectNodes,
    wpUrl,
    type,
  })

  await createRootNode()

  const referencedMediaItemNodeIdsArray = [...referencedMediaItemNodeIds]

  const newMediaItemIds = referencedMediaItemNodeIdsArray.filter(
    (id) => !helpers.getNode(id)
  )

  /**
   * if we're not lazy fetching media items, we need to fetch them
   * upfront here
   */
  if (!pluginOptions.type.MediaItem.lazyNodes && newMediaItemIds.length) {
    store.dispatch.logger.createActivityTimer({
      typeName: `MediaItems`,
      pluginOptions,
      reporter,
    })

    await fetchReferencedMediaItemsAndCreateNodes({
      referencedMediaItemNodeIds: newMediaItemIds,
    })

    const previouslyCachedNodeIds = await cache.get(CREATED_NODE_IDS)

    const createdNodeIds = [
      ...new Set([
        ...previouslyCachedNodeIds,
        ...referencedMediaItemNodeIdsArray,
      ]),
    ]

    // save the node id's so we can touch them on the next build
    // so that we don't have to refetch all nodes
    await cache.set(CREATED_NODE_IDS, createdNodeIds)

    store.dispatch.logger.stopActivityTimer({
      typeName: `MediaItems`,
    })
  }

  activity.end()
}

export default fetchAndCreateNonNodeRootFields
