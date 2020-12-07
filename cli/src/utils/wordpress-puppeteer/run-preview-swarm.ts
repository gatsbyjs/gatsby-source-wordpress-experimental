import * as draftLog from "draftlog"
draftLog(console)

import * as puppeteer from "puppeteer"

import { createNewPost } from "./create-new-post"
import { loginUser } from "./login-user"
import { previewCurrentPost } from "./preview-post"

export interface WpPreviewUser {
  username: string
  password: string
}

export interface PreviewSwarmInput {
  users: WpPreviewUser[]
  wpUrl: string
  maxPreviewsEach: number
  previewTimeout: number
  headless: boolean
}

export interface PreviewSwarmStats {
  averageSuccessDurationSeconds: number
  averageFailureDurationSeconds: number
  successes: number
  failures: number
  userCount: number
  previewsEach: number
  totalPreview: number
  swarmDurationSeconds: number
}

export async function runPreviewSwarm({
  users,
  wpUrl,
  maxPreviewsEach = 10,
  previewTimeout = 10000,
  headless = false,
}: PreviewSwarmInput): Promise<PreviewSwarmStats> {
  const startTime = Date.now()
  const total = users.length * maxPreviewsEach

  const successTimes = []
  const failureTimes = []

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
    ${progressBar(((failureTimes.length + successTimes.length) / total) * 100)}
    `
      .replace(/%SUCCESS_NUMBER%/gm, String(successTimes.length))
      .replace(/%FAILURE_NUMBER%/gm, String(failureTimes.length))
      .replace(
        /%PROGRESS%/gm,
        String(failureTimes.length + successTimes.length)
      )
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

      const puppeteerConfig = {
        headless,
        // non-headless mode is just for debugging with a few users
        // otherwise our positioning ☝️ would be more robust
        ...(!headless
          ? {
              defaultViewport: null,
              args: [
                `--window-size=500,500`,
                `--window-position=${position.x},${position.y}`,
                `--disable-features=site-per-process`,
              ],
            }
          : { args: [`--disable-features=site-per-process`] }),
      }

      const browser = await puppeteer.launch(puppeteerConfig)

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
            previewTimeout,
          })

          failed = !success
        } catch (e) {
          failed = true
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

  return {
    averageFailureDurationSeconds: getAverageFromListOfTimes(failureTimes),
    averageSuccessDurationSeconds: getAverageFromListOfTimes(successTimes),
    failures: failureTimes.length,
    successes: successTimes.length,
    totalPreview: failureTimes.length + successTimes.length,
    previewsEach: maxPreviewsEach,
    swarmDurationSeconds: (Date.now() - startTime) / 1000,
    userCount: users.length,
  }
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

function getAverageFromListOfTimes(times: number[]): number {
  const sum = times.reduce((a, b) => a + b, 0)
  const average = sum / times.length || 0

  return Math.ceil(average) / 1000
}
