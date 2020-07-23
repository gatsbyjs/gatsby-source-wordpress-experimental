import { createGatsbyNodesFromWPGQLContentNodes } from "../create-nodes/create-nodes"
import { paginatedWpNodeFetch } from "./fetch-nodes-paginated"
import { formatLogMessage } from "~/utils/format-log-message"
import { CREATED_NODE_IDS } from "~/constants"
import store from "~/store"
import { getGatsbyApi } from "~/utils/get-gatsby-api"
import chunk from "lodash/chunk"
import uniq from "lodash/uniq"
import fetchGraphql from "../../../utils/fetch-graphql"
import compress from "graphql-query-compress"
import {
  pushPromiseOntoRetryQueue,
  mediaNodeFetchQueue,
} from "./fetch-referenced-media-items"

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

export const getGatsbyNodeTypeNames = () =>
  getContentTypeQueryInfos().map((query) => query.typeInfo.nodesTypeName)

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

const fetchByIdsInQueue = async () => {
  const allIdsWithTypes = await fetchGraphql({
    query: /* GraphQL */ `
      {
        wpGatsby {
          allIDs {
            id
            type
          }
        }
      }
    `,
  })

  const nodes = await fetchNodesByIdsAndType(
    allIdsWithTypes.data.wpGatsby.allIDs
  )

  dd(nodes.length)
}

const fetchNodesByIdsAndType = async (typedIds) => {
  const typeNameToQueryInfo = getContentTypeQueryInfos().reduce(
    (accumulator, current) => {
      accumulator[current.typeInfo.nodesTypeName] = current

      return accumulator
    },
    {}
  )

  const state = store.getState()
  const { helpers, pluginOptions } = state.gatsbyApi
  const { createContentDigest, actions, reporter } = helpers

  let nodes = []

  const chunkedTypedIds = chunk(typedIds, 100)

  store.dispatch.logger.createActivityTimer({
    typeName: `All Nodes`,
    pluginOptions,
    reporter,
  })

  for (const [index, ids] of chunkedTypedIds.entries()) {
    pushPromiseOntoRetryQueue({
      helpers,
      createContentDigest,
      actions,
      queue: mediaNodeFetchQueue,
      retryKey: `Nodes by IDs query #${index}`,
      retryPromise: async () => {
        let neededFragmentsByType = {}

        const timerMessage = `starting #${index}. types: ${uniq(
          ids.map(({ type }) => type)
        ).join(`, `)}`

        console.time(timerMessage)

        const query = /* GraphQL */ `
          query AssortedNodesByIds {
            ${ids
              .map(({ id, type }, index) => {
                try {
                  const {
                    selectionSet,
                    builtFragments,
                    typeInfo: { singularName },
                  } = typeNameToQueryInfo[type]

                  neededFragmentsByType[type] = {
                    selectionSet,
                    builtFragments,
                  }

                  return /* GraphQL */ `
                  node__index_${index}: ${singularName}(id: "${id}") {
                    ...${type}
                  }
                `
                } catch (e) {
                  dump(`no query info for ${type}`)
                }
              })
              .join(` `)}
          }
          
          ${Object.entries(neededFragmentsByType)
            .map(
              ([
                type,
                { selectionSet, builtFragments },
              ]) => `fragment ${type} on ${type} {
            ${selectionSet}
          }

          ${builtFragments || ``}`
            )
            .join(` `)}
        `

        const { data } = await fetchGraphql({
          query: compress(query),
          errorContext: `Error occured while fast-fetching assorted nodes by ids.`,
        })

        // since we're getting each media item on it's single node root field
        // we just needs the values of each property in the response
        // anything that returns null is because we tried to get the source url
        // plus the source url minus resize patterns. So there will be nulls
        // since only the full source url will return data
        const fetchedNodes = Object.values(data).filter((node) => {
          if (!node) {
            return false
          }

          nodes.push(node)
          return true
        })

        console.timeEnd(timerMessage)

        store.dispatch.logger.incrementActivityTimer({
          typeName: `All Nodes`,
          by: fetchedNodes.length,
        })
      },
    })
  }

  store.dispatch.logger.stopActivityTimer({ typeName: `All Nodes` })

  await mediaNodeFetchQueue.onIdle()

  return nodes
}

/**
 * fetchAndCreateAllNodes
 *
 * uses query info (generated from introspection in onPreBootstrap) to
 * fetch and create Gatsby nodes from any lists of nodes in the remote schema
 */
export const fetchAndCreateAllNodes = async () => {
  const { helpers } = getGatsbyApi()
  const { reporter, cache } = helpers

  //
  // fetch nodes from WPGQL
  const activity = reporter.activityTimer(formatLogMessage(`fetching nodes`))
  activity.start()

  store.subscribe(() => {
    activity.setStatus(`${store.getState().logger.entityCount} total`)
  })

  await fetchByIdsInQueue()

  const wpgqlNodesByContentType = await fetchWPGQLContentNodesByContentType()

  const createNodesActivity = reporter.activityTimer(
    formatLogMessage(`creating nodes`)
  )
  createNodesActivity.start()

  //
  // Create Gatsby nodes from WPGQL response
  const createdNodeIds = await createGatsbyNodesFromWPGQLContentNodes({
    wpgqlNodesByContentType,
    createNodesActivity,
  })

  createNodesActivity.end()
  activity.end()

  // save the node id's so we can touch them on the next build
  // so that we don't have to refetch all nodes
  await cache.set(CREATED_NODE_IDS, createdNodeIds)
}
