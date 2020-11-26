import fetchAndApplyNodeUpdates from "./update-nodes/fetch-node-updates"

import { fetchAndCreateAllNodes } from "./fetch-nodes/fetch-nodes"

import { LAST_COMPLETED_SOURCE_TIME } from "~/constants"
import store from "~/store"
import fetchAndCreateNonNodeRootFields from "./create-nodes/fetch-and-create-non-node-root-fields"
import { allowFileDownloaderProgressBarToClear } from "./create-nodes/create-remote-file-node/progress-bar-promise"
import { sourcePreviews } from "~/steps/preview"

const sourceNodes = async (helpers, pluginOptions) => {
  const { cache, webhookBody } = helpers

  if (webhookBody.preview) {
    await sourcePreviews(helpers, pluginOptions)

    return
  }

  // fetch non-node root fields such as settings.
  // For now, we're refetching them on every build
  const nonNodeRootFieldsPromise = fetchAndCreateNonNodeRootFields()

  const lastCompletedSourceTime =
    webhookBody.refreshing && webhookBody.since
      ? webhookBody.since
      : await cache.get(LAST_COMPLETED_SOURCE_TIME)

  const {
    schemaWasChanged,
    foundUsableHardCachedData,
  } = store.getState().remoteSchema

  const fetchEverything =
    foundUsableHardCachedData ||
    !lastCompletedSourceTime ||
    // don't refetch everything in development
    ((process.env.NODE_ENV !== `development` ||
      // unless we're in preview mode
      process.env.ENABLE_GATSBY_REFRESH_ENDPOINT) &&
      // and the schema was changed
      schemaWasChanged)

  // If this is an uncached build,
  // or our initial build to fetch and cache everything didn't complete,
  // pull everything from WPGQL
  if (fetchEverything) {
    await fetchAndCreateAllNodes()

    await helpers.cache.set(LAST_COMPLETED_SOURCE_TIME, Date.now())
  }

  // If we've already successfully pulled everything from WPGraphQL
  // just pull the latest changes
  else if (!fetchEverything) {
    await fetchAndApplyNodeUpdates({
      since: lastCompletedSourceTime,
    })
  }

  await nonNodeRootFieldsPromise

  allowFileDownloaderProgressBarToClear()

  const { dispatch } = store
  dispatch.remoteSchema.setSchemaWasChanged(false)
  dispatch.develop.resumeRefreshPolling()
}

export { sourceNodes }
