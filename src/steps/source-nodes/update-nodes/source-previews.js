import { fetchAndCreateSingleNode } from "~/steps/source-nodes/update-nodes/wp-actions/update"
import { formatLogMessage } from "~/utils/format-log-message"
import chalk from "chalk"
import urlUtil from "url"
import { touchValidNodes } from "./fetch-node-updates"
import store from "~/store"

export const sourcePreviews = async ({ webhookBody, reporter }, { url }) => {
  if (
    !webhookBody ||
    !webhookBody.preview ||
    !webhookBody.previewId ||
    !webhookBody.token ||
    !webhookBody.remoteUrl
  ) {
    return
  }

  store.dispatch.previewStore.enablePreviewMode()

  await touchValidNodes()

  const { hostname: settingsHostname } = urlUtil.parse(url)
  const { hostname: remoteHostname } = urlUtil.parse(webhookBody.remoteUrl)

  if (settingsHostname !== remoteHostname) {
    reporter.panic(
      formatLogMessage(
        `Received preview data from a different remote URL than the one specified in plugin options. \n\n ${chalk.bold(
          `Remote URL:`
        )} ${webhookBody.remoteUrl}\n ${chalk.bold(
          `Plugin options URL:`
        )} ${url}`
      )
    )
  }

  await new Promise((resolve) => setTimeout(resolve, 5000))
  await fetchAndCreateSingleNode({
    actionType: `PREVIEW`,
    ...webhookBody,
  })
}
