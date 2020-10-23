import fetchAndApplyNodeUpdates from "./fetch-node-updates"
import { formatLogMessage } from "~/utils/format-log-message"
import store from "~/store"
import { getGatsbyApi } from "~/utils/get-gatsby-api"

const refetcher = async (
  msRefetchInterval,
  helpers,
  { reconnectionActivity = null, retryCount = 1 } = {}
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
          `Content updates re-connected after ${retryCount} ${
            retryCount === 1 ? `try` : `tries`
          }`
        )
      )

      reconnectionActivity = null
      retryCount = 1
    }
  } catch (e) {
    const { pluginOptions } = getGatsbyApi()
    if (pluginOptions?.debug?.throwRefetchErrors) {
      throw e
    }

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

    // retry after retry count times 5 seconds
    const retryTime = retryCount * 5000
    // if the retry time is greater than or equal to the max (60 seconds)
    // use the max, otherwise use the retry time
    const maxWait = 60000
    const waitFor = retryTime >= maxWait ? maxWait : retryTime

    await new Promise((resolve) => setTimeout(resolve, waitFor))
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
