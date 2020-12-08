import { GluegunCommand, GluegunToolbox } from "gluegun"

import * as fs from "fs-extra"

import { runPreviewSwarm } from "../../utils/wordpress-puppeteer/run-preview-swarm"

const command: GluegunCommand = {
  name: `swarm`,
  commandPath: [`preview`, `swarm`],
  dashed: true,
  description: `Swarm a Gatsby Preview instance with bot WP users`,
  run: async (toolbox: GluegunToolbox) => {
    const { print, prompt, parameters } = toolbox

    const {
      wpUrl: optionWpUrl,
      users: optionUsersJsonPath,
      previewRefreshUrl,
      previewFrontendUrl,
    } = parameters.options

    print.info(
      `We're going to toast your WP and Gatsby and then smatter them with delicious jam`
    )

    let { wpUrl, wpUsersJsonPath } = await prompt.ask([
      !optionWpUrl && {
        type: `input`,
        name: `wpUrl`,
        message: `What's the full URL for your WordPress instance?`,
      },
      !optionUsersJsonPath && {
        type: `input`,
        name: `wpUsersJsonPath`,
        message: `What's the path to your users.json file?`,
      },
    ])

    if (optionWpUrl) {
      wpUrl = optionWpUrl
    }

    if (optionUsersJsonPath) {
      wpUsersJsonPath = optionUsersJsonPath
    }

    if (!wpUsersJsonPath) {
      print.error(`You must provide a path to your users.json file.`)
    }

    if (!wpUrl) {
      print.error(`You must provide the home url for your WordPress instance.`)
    }

    if (!wpUsersJsonPath || !wpUrl) {
      return
    }

    const users = await fs.readJson(wpUsersJsonPath)

    const swarmStats = await runPreviewSwarm({
      headless: false,
      maxPreviewsEach: 10,
      previewTimeout: 10000,
      users,
      wpUrl,
      gatsbyPreviewFrontendUrl: previewRefreshUrl,
      gatsbyPreviewRefreshEndpoint: previewFrontendUrl,
    })

    return swarmStats
  },
}

module.exports = command
