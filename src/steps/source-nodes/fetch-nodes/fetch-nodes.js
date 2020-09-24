import { createGatsbyNodesFromWPGQLContentNodes } from "../create-nodes/create-nodes"
import { paginatedWpNodeFetch } from "./fetch-nodes-paginated"
import { formatLogMessage } from "~/utils/format-log-message"
import { CREATED_NODE_IDS } from "~/constants"
import store from "~/store"
import { getGatsbyApi } from "~/utils/get-gatsby-api"
import chunk from "lodash/chunk"
import { getCache } from "~/utils/cache"

/**
 * fetchWPGQLContentNodes
 *
 * fetches and paginates remote nodes by post type while reporting progress
 */
export const fetchWPGQLContentNodes = async ({ queryInfo }) => {
  const { pluginOptions, helpers } = store.getState().gatsbyApi
  const { reporter } = helpers
  const {
    url,
    verbose,
    schema: { perPage },
  } = pluginOptions

  const { nodeListQueries, typeInfo, settings } = queryInfo

  const typeName = typeInfo.nodesTypeName

  store.dispatch.logger.createActivityTimer({
    typeName,
    pluginOptions,
    reporter,
  })

  let allNodesOfContentType = []

  // there's normally just one query here, but more can be added using the settings.nodeListQueries api
  for (const nodeListQuery of nodeListQueries) {
    let contentNodes = await paginatedWpNodeFetch({
      first: perPage,
      after: null,
      contentTypePlural: typeInfo.pluralName,
      nodeTypeName: typeInfo.nodesTypeName,
      query: nodeListQuery,
      url,
      settings,
      helpers,
    })

    allNodesOfContentType = [...allNodesOfContentType, ...contentNodes]
  }

  store.dispatch.logger.stopActivityTimer({ typeName })

  if (allNodesOfContentType && allNodesOfContentType.length) {
    return {
      singular: queryInfo.typeInfo.singularName,
      plural: queryInfo.typeInfo.pluralName,
      allNodesOfContentType,
    }
  }

  return false
}

/**
 * getContentTypeQueryInfos
 *
 * returns query infos (Type info & GQL query strings) filtered to
 * remove types that are excluded in the plugin options
 *
 * @returns {Array} Type info & GQL query strings
 */
export const getContentTypeQueryInfos = () => {
  const { nodeQueries } = store.getState().remoteSchema
  const queryInfos = Object.values(nodeQueries).filter(
    ({ settings }) => !settings.exclude
  )
  return queryInfos
}

export const getGatsbyNodeTypeNames = () => {
  const { typeMap } = store.getState().remoteSchema

  const queryableTypenames = getContentTypeQueryInfos().map(
    (query) => query.typeInfo.nodesTypeName
  )

  const implementingNodeTypes = queryableTypenames.reduce(
    (accumulator, typename) => {
      const type = typeMap.get(typename)

      if (type.possibleTypes?.length) {
        accumulator = [
          ...accumulator,
          ...type.possibleTypes.map(({ name }) => name),
        ]
      }

      return accumulator
    },
    []
  )

  return [...new Set([...queryableTypenames, ...implementingNodeTypes])]
}

/**
 * fetchWPGQLContentNodesByContentType
 *
 * fetches nodes from the remote WPGQL server and groups them by post type
 *
 * @returns {Array}
 */
export const fetchWPGQLContentNodesByContentType = async () => {
  const contentNodeGroups = []

  const nodeQueries = getContentTypeQueryInfos()

  const chunkSize = process.env.GATSBY_CONCURRENT_DOWNLOAD || 50
  const chunkedQueries = chunk(nodeQueries, chunkSize)

  for (const queries of chunkedQueries) {
    await Promise.all(
      queries.map(async (queryInfo) => {
        if (
          // if the type settings call for lazyNodes, don't fetch them upfront here
          queryInfo.settings.lazyNodes ||
          // if this is a media item and the nodes aren't lazy, we only want to fetch referenced nodes, so we don't fetch all of them here.
          (!queryInfo.settings.lazyNodes &&
            queryInfo.typeInfo.nodesTypeName === `MediaItem`)
        ) {
          return
        }

        const contentNodeGroup = await fetchWPGQLContentNodes({ queryInfo })

        if (contentNodeGroup) {
          contentNodeGroups.push(contentNodeGroup)
        }
      })
    )
  }

  return contentNodeGroups
}

const getHardCachedNodes = async () => {
  const isDevelop = process.env.NODE_ENV === `development`

  if (isDevelop) {
    const hardCache = getCache(`wordpress-data`)
    const allWpNodes = await hardCache.get(`allWpNodes`)
    // const cachedSchemaMD5 = await hardCache.get(`schemaMD5`)
    // const cachedLastActionId = await hardCache.get(`lastActionId`)

    const shouldUseHardDataCache = allWpNodes?.length
    // &&
    // cachedSchemaMD5 &&
    // cachedLastActionId

    if (shouldUseHardDataCache) {
      return allWpNodes
    }
  }

  return false
}

const setHardCachedNodes = async ({ helpers }) => {
  const isDevelop = process.env.NODE_ENV === `development`

  if (isDevelop) {
    const hardCache = getCache(`wordpress-data`)

    const allNodes = await helpers.getNodes()
    const allWpNodes = allNodes.filter(
      (node) => node.internal.owner === `gatsby-source-wordpress-experimental`
    )

    await hardCache.set(`allWpNodes`, allWpNodes)
  }
}

/**
 * fetchAndCreateAllNodes
 *
 * uses query info (generated from introspection in onPreBootstrap) to
 * fetch and create Gatsby nodes from any lists of nodes in the remote schema
 */
export const fetchAndCreateAllNodes = async () => {
  const { helpers, pluginOptions } = getGatsbyApi()
  const { reporter, cache } = helpers

  //
  // fetch nodes from WPGQL
  const activity = reporter.activityTimer(formatLogMessage(`fetching nodes`))
  activity.start()

  store.subscribe(() => {
    activity.setStatus(`${store.getState().logger.entityCount} total`)
  })

  let createdNodeIds

  const hardCachedNodes = await getHardCachedNodes()

  if (!hardCachedNodes) {
    const wpgqlNodesByContentType = await fetchWPGQLContentNodesByContentType()

    const createNodesActivity = reporter.activityTimer(
      formatLogMessage(`creating nodes`)
    )
    createNodesActivity.start()

    //
    // Create Gatsby nodes from WPGQL response
    createdNodeIds = await createGatsbyNodesFromWPGQLContentNodes({
      wpgqlNodesByContentType,
      createNodesActivity,
    })

    await setHardCachedNodes({ helpers })

    createNodesActivity.end()
    activity.end()
  }

  if (hardCachedNodes) {
    const loggers = {}

    // restore nodes
    await Promise.all(
      hardCachedNodes.map(async (node) => {
        if (!loggers[node.internal.type]) {
          // const {
          //   pluginOptions,
          //   helpers: { reporter },
          // } = getGatsbyApi()

          loggers[node.internal.type] = true

          store.dispatch.logger.createActivityTimer({
            typeName: node.internal.type,
            pluginOptions,
            reporter,
          })

          // allWpNodes.forEach((group) => {
          //   const chunkedNodes = chunk(group.allNodesOfContentType, 100)

          //   chunkedNodes.forEach((chunk) => {
          //     store.dispatch.logger.incrementActivityTimer({
          //       typeName: `Cached nodes`,
          //       by: chunk.length,
          //       action: `restored`,
          //     })
          //   })
          // })

          // store.dispatch.logger.stopActivityTimer({
          //   typeName: `Cached nodes`,
          //   action: `restored`,
          // })
        } else {
          store.dispatch.logger.incrementActivityTimer({
            typeName: node.internal.type,
            by: 1,
            action: `restored`,
          })
        }

        node.internal = {
          contentDigest: node.internal.contentDigest,
          type: node.internal.type,
        }
        await helpers.actions.createNode(node)
      })
    )
    // build createdNodeIds id array
    createdNodeIds = hardCachedNodes.map((node) => node.id)
  }

  // save the node id's so we can touch them on the next build
  // so that we don't have to refetch all nodes
  await cache.set(CREATED_NODE_IDS, createdNodeIds)
}
