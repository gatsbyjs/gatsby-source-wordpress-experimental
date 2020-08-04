import fetchAndApplyNodeUpdates from "./fetch-node-updates"
import { formatLogMessage } from "~/utils/format-log-message"
import store from "~/store"

const refetcher = async (
  msRefetchInterval,
  helpers,
  { reconnectionActivity = null, retryCount = 0 } = {}
) => {
  try {
    await fetchAndApplyNodeUpdates({
      intervalRefetching: true,
      throwFetchErrors: true,
      throwGqlErrors: true,
    })

    if (reconnectionActivity) {
      reconnectionActivity.end()
      helpers.reporter.success(
        formatLogMessage(
          `Content updates re-connected after ${retryCount} tries`
        )
      )

      reconnectionActivity = null
      retryCount = 0
    }
  } catch (e) {
    if (!reconnectionActivity) {
      reconnectionActivity = helpers.reporter.activityTimer(
        formatLogMessage(`Content update error: "${e.message}"`)
      )
      reconnectionActivity.start()
      reconnectionActivity.setStatus(`retrying...`)
    } else {
      retryCount++
      reconnectionActivity.setStatus(`retried ${retryCount} times`)
    }

    await new Promise((resolve) => setTimeout(resolve, 30000))
  }

  setTimeout(
    () =>
      refetcher(msRefetchInterval, helpers, {
        reconnectionActivity,
        retryCount,
      }),
    msRefetchInterval
  )
}

/**
 * Starts constantly refetching the latest WordPress changes
 * so we can update Gatsby nodes when data changes
 */
const startPollingForContentUpdates = (helpers, pluginOptions) => {
  if (process.env.WP_DISABLE_POLLING) {
    return
  }

  const { verbose } = store.getState().gatsbyApi.pluginOptions

  const msRefetchInterval =
    pluginOptions &&
    pluginOptions.develop &&
    pluginOptions.develop.nodeUpdateInterval
      ? pluginOptions.develop.nodeUpdateInterval
      : 300

  if (verbose) {
    helpers.reporter.log(``)
    helpers.reporter.info(formatLogMessage`Watching for WordPress changes`)
  }

  refetcher(msRefetchInterval, helpers)
}

export { startPollingForContentUpdates }
