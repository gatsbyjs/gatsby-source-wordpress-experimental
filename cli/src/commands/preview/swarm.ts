import { GluegunCommand, GluegunToolbox } from "gluegun"
import * as draftLog from "draftlog"
draftLog(console)

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

    const maxPreviewsEach = 10
    const total = users.length * maxPreviewsEach

    let successes = 0
    let failures = 0

    const successTimes = [0]
    const failureTimes = [0]

    function getAverageFromListOfTimes(times: number[]): number {
      const sum = times.reduce((a, b) => a + b, 0)
      const average = sum / times.length || 0

      return Math.ceil(average) / 1000
    }

    // Input progess goes from 0 to 100
    function progressBar(progress: number): string {
      // Make it 50 characters length
      let units = Math.round(progress / 2)

      if (units > 50) {
        units = 50
      }

      return (
        `[` +
        `=`.repeat(units) +
        ` `.repeat(50 - units) +
        `] ` +
        Math.ceil(progress) +
        `%`
      )
    }

    const getDraft = (): string =>
      `
    Preview Swarming ${wpUrl}
    with ${users.length} users making ${maxPreviewsEach} previews each
    ---
    %SUCCESS_NUMBER% Successes (${getAverageFromListOfTimes(
      successTimes
    )}s average duration)
    %FAILURE_NUMBER% Failures (${getAverageFromListOfTimes(
      failureTimes
    )}s average duration)
    %PROGRESS% of %TOTAL% Total
    ${progressBar(((failures + successes) / total) * 100)}
    `
        .replace(/%SUCCESS_NUMBER%/gm, String(successes))
        .replace(/%FAILURE_NUMBER%/gm, String(failures))
        .replace(/%PROGRESS%/gm, String(failures + successes))
        .replace(/%TOTAL%/gm, String(total))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const consoleAny: any = console
    const draft = consoleAny.draft(getDraft())

    const updateDraft = (): void => draft(getDraft())

    await Promise.all(
      users.map(async ({ username, password }, index) => {
        const position = {
          x: [0, 1].includes(index) ? 0 : 600,
          y: [0, 2].includes(index) ? 0 : 600,
        }

        const browser = await puppeteer.launch({
          headless: false,
          // slowMo: 10,
          defaultViewport: null,
          args: [
            `--window-size=500,500`,
            `--window-position=${position.x},${position.y}`,
            `--disable-features=site-per-process`,
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

        while (counter < maxPreviewsEach) {
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

          const previewStart = Date.now()

          let failed = false

          try {
            const { success } = await previewCurrentPost({
              title: `swarm user ${username} post updated at ${Date.now()}`,
              page,
              browser,
            })

            if (success) {
              successes++
            } else {
              failures++
              failed = true
            }

            // print.info(success)
          } catch (e) {
            failed = true
            failures++
            // print.error(e.message)
          } finally {
            const previewEnd = Date.now()
            const previewSeconds = previewEnd - previewStart

            if (failed) {
              failureTimes.push(previewSeconds)
            } else {
              successTimes.push(previewSeconds)
            }

            updateDraft()
          }
        }
        await browser.close()
      })
    )

    updateDraft()
  },
}

module.exports = command
