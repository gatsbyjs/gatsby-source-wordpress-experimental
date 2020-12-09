import { Browser, Page } from "puppeteer"

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    wp: any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onCustomEvent: any
  }
}

/**
 * Creates new post.
 *
 * @param {Object}  object                    Object to create new post, along with tips enabling option.
 * @param {string}  [object.title]            Title of the new post.
 * @param {string}  [object.content]          Content of the new post.
 */
export async function previewCurrentPost(input: {
  title: string
  content?: string
  page: Page
  browser: Browser
  previewTimeout: number
  debugMode: boolean
}): Promise<{ success: boolean }> {
  const { page, title, browser, debugMode, previewTimeout = 10000 } = input

  const debugLog = (message: string): void =>
    debugMode ? console.log(message) : null

  await page.waitForSelector(`.edit-post-layout`)

  const previewPagePromise: Promise<Page> = new Promise((resolve) =>
    browser.once(`targetcreated`, (target) => resolve(target.page()))
  )

  // press "preview"
  await page.evaluate(
    ({ title }) => {
      window.wp.data.dispatch(`core/editor`).editPost({ title })

      setTimeout(() => {
        // eslint-disable-next-line @typescript-eslint/no-extra-semi
        ;(document.querySelector(
          `.block-editor-post-preview__button-toggle`
        ) as HTMLElement).click()
        // eslint-disable-next-line @typescript-eslint/no-extra-semi
        ;(document.querySelector(
          `.edit-post-header-preview__button-external`
        ) as HTMLElement).click()
      }, 100)
    },
    { title }
  )

  const previewPage = await previewPagePromise

  await previewPage.setDefaultNavigationTimeout(0)

  let rejected = false

  const tooLongTimeout = setTimeout(async () => {
    rejected = true

    if (previewPage) {
      await previewPage.close()
    }
  }, previewTimeout)

  try {
    debugLog(`waiting for wp gatsby preview ready`)
    await previewPage.waitForFunction(
      () =>
        new Promise((resolve) => {
          document.addEventListener(`wp-gatsby-preview-ready`, () => {
            const loader: HTMLElement = document.getElementById(`loader`)

            loader.classList.add(`loaded`)
            loader.style.display = `none`

            return resolve(true)
          })
        }),
      {
        timeout: 300000,
      }
    )
    debugLog(`finished waiting for wp gatsby preview ready`)
  } catch (e) {
    console.log(e.message)
    rejected = true
  }

  if (!rejected) {
    const checkIframeHasSrcFn = `document.getElementById("preview").src !== ""`
    debugLog(`waiting for ${checkIframeHasSrcFn}`)
    await previewPage.waitForFunction(checkIframeHasSrcFn, {
      timeout: 300000,
    })
    debugLog(`end waiting for ${checkIframeHasSrcFn}`)

    const checkIframeInteractiveFn = `["complete", "interactive"].includes(document.getElementById("preview").contentWindow.document.readyState)`

    debugLog(`waiting for ${checkIframeInteractiveFn}`)
    await previewPage.waitForFunction(checkIframeInteractiveFn, {
      timeout: 300000,
    })
    debugLog(`end waiting for ${checkIframeInteractiveFn}`)

    const frameHandle = await previewPage.$(`iframe[id='preview']`)
    const frame = await frameHandle.contentFrame()

    const checkTitleFn = `document.querySelector("h1") && document.querySelector("h1").innerText.includes("${title}")`

    debugLog(`waiting for ${checkTitleFn}`)
    await frame.waitForFunction(checkTitleFn, {
      timeout: 300000,
    })
    debugLog(`end waiting for ${checkTitleFn}`)

    clearTimeout(tooLongTimeout)

    debugLog(`waiting for previewPage.close()`)
    await previewPage.close()
    debugLog(`finished waiting for previewPage.close()`)
    return { success: true }
  } else {
    return { success: false }
  }
}
