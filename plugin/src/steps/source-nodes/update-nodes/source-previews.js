import { fetchAndCreateSingleNode } from "~/steps/source-nodes/update-nodes/wp-actions/update"
import { formatLogMessage } from "~/utils/format-log-message"
import chalk from "chalk"
import urlUtil from "url"

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

  await fetchAndCreateSingleNode({
    actionType: `PREVIEW`,
    ...webhookBody,
  })
}
