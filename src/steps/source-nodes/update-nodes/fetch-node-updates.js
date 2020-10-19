import { CREATED_NODE_IDS, LAST_COMPLETED_SOURCE_TIME } from "~/constants"
import { fetchAndRunWpActions } from "./wp-actions"
import { formatLogMessage } from "~/utils/format-log-message"
import { getGatsbyApi } from "~/utils/get-gatsby-api"
import { getPersistentCache } from "~/utils/cache"

export const touchValidNodes = async () => {
  const { helpers } = getGatsbyApi()
  const { actions } = helpers

  let validNodeIds = await getPersistentCache({ key: CREATED_NODE_IDS })
  validNodeIds.forEach((nodeId) => actions.touchNode({ nodeId }))
}

/**
 * fetchAndApplyNodeUpdates
 *
 * uses query info (types and gql query strings) fetched/generated in
 * onPreBootstrap to ask WordPress for the latest changes, and then
 * apply creates, updates, and deletes to Gatsby nodes
 */
const fetchAndApplyNodeUpdates = async ({
  since,
  intervalRefetching,
  throwFetchErrors = false,
  throwGqlErrors = false,
}) => {
  const { helpers, pluginOptions } = getGatsbyApi()

  const { cache, reporter } = helpers

  let activity

  if (!intervalRefetching) {
    activity = reporter.activityTimer(
      formatLogMessage(`pull updates since last build`)
    )
    activity.start()
  }

  if (!since) {
    since = await cache.get(LAST_COMPLETED_SOURCE_TIME)
  }

  // Check with WPGQL to create, delete, or update cached WP nodes
  const { wpActions, didUpdate } = await fetchAndRunWpActions({
    since,
    intervalRefetching,
    helpers,
    pluginOptions,
    throwFetchErrors,
    throwGqlErrors,
  })

  if (
    // if we're refetching, we only want to touch all nodes
    // if something changed
    didUpdate ||
    // if this is a regular build, we want to touch all nodes
    // so they don't get garbage collected
    !intervalRefetching
  ) {
    await touchValidNodes()
  }

  if (!intervalRefetching) {
    activity.end()
  }

  return { wpActions, didUpdate }
}

export default fetchAndApplyNodeUpdates
