import * as draftLog from "draftlog"
draftLog(console)

import * as puppeteer from "puppeteer"

import { createNewPost } from "./create-new-post"
import { loginUser } from "./login-user"
import { pressKeyWithModifier } from "./press-key-with-modifier"
import { previewCurrentPost } from "./preview-post"
import { visitAdminPage } from "./visit-admin-page"

export interface WpPreviewUser {
  username: string
  password: string
}

interface Headless {
  headless: boolean
}

interface WpUrl {
  wpUrl: string
}

interface SetWPGatsbyPreviewSettingsInput extends Headless, WpUrl {
  gatsbyPreviewFrontendUrl: string
  gatsbyPreviewRefreshEndpoint: string
  users: WpPreviewUser[]
}

export interface PreviewSwarmInput
  extends SetWPGatsbyPreviewSettingsInput,
    Headless,
    WpUrl {
  maxPreviewsEach: number
  previewTimeout: number
  logInputs?: boolean
  cliOutput?: boolean
}

export interface PreviewSwarmStats {
  averageSuccessDurationSeconds: number
  averageFailureDurationSeconds: number
  successes: number
  failures: number
  userCount: number
  previewsEach: number
  totalPreviews: number
  swarmDurationSeconds: number
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

function getAverageSecondsFromListOfMsTimes(times: number[]): number {
  const sum = times.reduce((a, b) => a + b, 0)
  const average = sum / times.length || 0

  return Math.ceil(average) / 1000
}

interface StartBrowserAndLoginUserInput {
  headless: boolean
  index: number
  wpUrl: string
  username: string
  password: string
}

async function startBrowserAndLoginUser({
  headless,
  index,
  wpUrl,
  username,
  password,
}: StartBrowserAndLoginUserInput): Promise<{
  page: puppeteer.Page
  browser: puppeteer.Browser
}> {
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
            `--disable-web-security`,
            `--no-sandbox`,
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

  return { page, browser }
}

async function setWpGatsbyPreviewSettings({
  gatsbyPreviewFrontendUrl,
  gatsbyPreviewRefreshEndpoint,
  users,
  headless,
  wpUrl,
}: SetWPGatsbyPreviewSettingsInput): Promise<void> {
  const { page, browser } = await startBrowserAndLoginUser({
    username: users[0].username,
    password: users[0].password,
    headless,
    index: 0,
    wpUrl,
  })

  await visitAdminPage({
    adminPath: `options-general.php`,
    query: `?page=gatsbyjs`,
    page,
    baseUrl: wpUrl,
  })

  await page.$eval(
    `input[name="wpgatsby_settings\\[enable_gatsby_preview\\]"]`,
    (check: HTMLInputElement) => (check.value = `on`)
  )
  await page.$eval(
    `input#wpuf-wpgatsby_settings\\[enable_gatsby_preview\\]`,
    (check: HTMLInputElement) => (check.checked = true)
  )

  await page.focus(`#wpgatsby_settings\\[preview_instance_url\\]`)
  await pressKeyWithModifier({ modifier: `primary`, key: `a`, page })
  await page.type(
    `#wpgatsby_settings\\[preview_instance_url\\]`,
    gatsbyPreviewFrontendUrl
  )

  await page.focus(`#wpgatsby_settings\\[preview_api_webhook\\]`)
  await pressKeyWithModifier({ modifier: `primary`, key: `a`, page })
  await page.type(
    `#wpgatsby_settings\\[preview_api_webhook\\]`,
    gatsbyPreviewRefreshEndpoint
  )

  await Promise.all([page.waitForNavigation(), page.click(`#submit`)])

  await browser.close()
}

/**
 * It's expected that the first user passed to this function in the users array
 * has the permissions to update WPGatsby settings
 */
export async function runPreviewSwarm({
  users,
  wpUrl,
  maxPreviewsEach = 10,
  previewTimeout = 10000,
  headless = false,
  logInputs = false,
  cliOutput = true,
  gatsbyPreviewFrontendUrl,
  gatsbyPreviewRefreshEndpoint,
}: PreviewSwarmInput): Promise<PreviewSwarmStats> {
  if (logInputs) {
    console.log({
      wpUrl,
      maxPreviewsEach,
      previewTimeout,
      headless,
      gatsbyPreviewFrontendUrl,
      gatsbyPreviewRefreshEndpoint,
    })
  }

  const startTime = Date.now()

  if (gatsbyPreviewFrontendUrl || gatsbyPreviewRefreshEndpoint) {
    await setWpGatsbyPreviewSettings({
      gatsbyPreviewRefreshEndpoint,
      gatsbyPreviewFrontendUrl,
      users,
      headless,
      wpUrl,
    })
  }

  const total = users.length * maxPreviewsEach

  const successTimes = []
  const failureTimes = []
  let updateDraft = (): void => {}

  if (cliOutput) {
    const getDraft = (): string =>
      `
    Preview Swarming ${wpUrl}
    with ${users.length} users making ${maxPreviewsEach} previews each
    ---
    %SUCCESS_NUMBER% Successes (${getAverageSecondsFromListOfMsTimes(
      successTimes
    )}s average duration)
    %FAILURE_NUMBER% Failures (${getAverageSecondsFromListOfMsTimes(
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

    updateDraft = (): void => draft(getDraft())
  }

  const browsers = []

  await Promise.all(
    users.map(async ({ username, password }, index) => {
      const { page, browser } = await startBrowserAndLoginUser({
        headless,
        index,
        wpUrl,
        username,
        password,
      })

      browsers.push(browser)

      try {
        const title = `swarm user ${username} post`

        let counter = 0

        while (counter < maxPreviewsEach) {
          counter++

          // first we want to see if this user has a preview swarm page
          await visitAdminPage({
            adminPath: `edit.php`,
            page,
            baseUrl: wpUrl,
          })

          const adminRowTitleLinks = await page.$$(`a.row-title`)
          const normalizedLinks = await Promise.all(
            adminRowTitleLinks.map(
              async (link): Promise<{ text: string; href: string }> => {
                const linkText = (await (
                  await link.getProperty(`innerText`)
                ).jsonValue()) as string

                const linkHref = (await (
                  await link.getProperty(`href`)
                ).jsonValue()) as string

                return {
                  href: linkHref,
                  text: linkText,
                }
              }
            )
          )
          const existingLinkElement = normalizedLinks.find(({ text }) =>
            text.includes(title)
          )
          const existingPostUrl = existingLinkElement?.href

          // if this user has a page, preview from that
          if (existingPostUrl) {
            await page.goto(existingPostUrl)
          }
          // otherwise create a new one
          else {
            await createNewPost({
              baseUrl: wpUrl,
              content: `post content`,
              excerpt: `excerpt`,
              showWelcomeGuide: false,
              postType: `post`,
              title,
              page,
            })
          }

          const previewStart = Date.now()

          let failed = false

          try {
            const { success } = await previewCurrentPost({
              title: `swarm user ${username} post updated at ${Date.now()}`,
              page,
              browser,
              previewTimeout,
              headless,
            })

            failed = !success
          } catch (e) {
            console.error(e.message)
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
      } catch (e) {
        console.error(e.message)
      } finally {
        await browser.close()
      }
    })
  )

  updateDraft()

  return {
    averageFailureDurationSeconds: getAverageSecondsFromListOfMsTimes(
      failureTimes
    ),
    averageSuccessDurationSeconds: getAverageSecondsFromListOfMsTimes(
      successTimes
    ),
    failures: failureTimes.length,
    successes: successTimes.length,
    totalPreviews: failureTimes.length + successTimes.length,
    previewsEach: maxPreviewsEach,
    swarmDurationSeconds: (Date.now() - startTime) / 1000,
    userCount: users.length,
  }
}
