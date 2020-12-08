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
}): Promise<{ success: boolean }> {
  const { page, title, browser, previewTimeout = 10000 } = input

  await page.waitForSelector(`.edit-post-layout`)

  const previewPagePromise: Promise<Page> = new Promise(resolve =>
    browser.once(`targetcreated`, target => resolve(target.page()))
  )

  // press "preview"
  await page.evaluate(
    ({ title }) => {
      window.wp.data.dispatch(`core/editor`).editPost({ title })

      setTimeout(() => {
        ;(document.querySelector(
          `.block-editor-post-preview__button-toggle`
        ) as HTMLElement).click()
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
    await previewPage.waitForFunction(
      () =>
        new Promise(resolve => {
          document.addEventListener(`wp-gatsby-preview-ready`, () => {
            const loader: HTMLElement = document.getElementById(`loader`)

            loader.classList.add(`loaded`)
            loader.style.display = `none`

            return resolve(true)
          })
        })
    )
  } catch (e) {
    console.log(e.message)
    rejected = true
  }

  if (!rejected) {
    await previewPage.waitForFunction(
      `document.getElementById("preview").src !== ""`
    )

    await previewPage.waitForFunction(
      `["complete", "interactive"].includes(document.getElementById("preview").contentWindow.document.readyState)`
    )

    const frameHandle = await previewPage.$(`iframe[id='preview']`)
    const frame = await frameHandle.contentFrame()

    await frame.waitForFunction(
      `document.querySelector("h1") && document.querySelector("h1").innerText.includes("${title}")`
    )

    clearTimeout(tooLongTimeout)

    await previewPage.close()
    return { success: true }
  } else {
    return { success: false }
  }
}
