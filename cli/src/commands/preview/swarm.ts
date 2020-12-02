import { GluegunCommand, GluegunToolbox } from "gluegun"

import * as fs from "fs-extra"
import * as puppeteer from "puppeteer"

import { createNewPost } from "../../utils/wordpress-puppeteer/create-new-post"
import { loginUser } from "../../utils/wordpress-puppeteer/login-user"
import { previewCurrentPost } from "../../utils/wordpress-puppeteer/preview-post"

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

    await Promise.all(
      users.map(async ({ username, password }, index) => {
        const position = {
          x: [0, 1].includes(index) ? 0 : 600,
          y: [0, 2].includes(index) ? 0 : 600,
        }
        const browser = await puppeteer.launch({
          headless: false,
          slowMo: 25,
          defaultViewport: null,
          args: [
            `--window-size=500,500`,
            `--window-position=${position.x},${position.y}`,
          ],
        })

        const page = await browser.newPage()
        await page.goto(wpUrl)

        await loginUser({
          username,
          password,
          baseUrl: wpUrl,
          page,
        })

        let counter = 0

        while (counter <= 10) {
          counter++

          await createNewPost({
            baseUrl: wpUrl,
            content: `post content`,
            excerpt: `excerpt`,
            showWelcomeGuide: false,
            postType: `post`,
            title: `new post`,
            page,
          })

          try {
            const { success } = await previewCurrentPost({
              title: `swarm user ${username} post updated at ${Date.now()}`,
              page,
              browser,
              index,
            })

            print.info(success)
          } catch (e) {
            print.error(e.message)
          }
        }
        await browser.close()
      })
    )
  },
}

module.exports = command
