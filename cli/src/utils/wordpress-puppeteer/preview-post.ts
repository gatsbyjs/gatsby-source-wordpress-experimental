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
  headless?: boolean
}): Promise<{ success: boolean }> {
  const {
    page,
    title,
    browser,
    previewTimeout = 10000,
    headless = true,
  } = input

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

  if (!headless) {
    try {
      console.log(`waiting for wp-gatsby-preview-ready`)
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
          timeout: 30000,
        }
      )
      console.log(`finished waiting for wp-gatsby-preview-ready`)
    } catch (e) {
      console.log(e.message)

      if (!e.message.includes(`waiting for function failed: timeout`)) {
        rejected = true
      }
    }
  }

  if (!rejected) {
    console.log(`waiting for document.getElementById("preview").src !== ""`)
    await previewPage.waitForFunction(
      `document.getElementById("preview").src !== ""`
    )
    console.log(
      `finished waiting for document.getElementById("preview").src !== ""`
    )

    console.log(
      `waiting for ["complete", "interactive"].includes(document.getElementById("preview").contentWindow.document.readyState)`
    )
    await previewPage.waitForFunction(
      `["complete", "interactive"].includes(document.getElementById("preview").contentWindow.document.readyState)`
    )
    console.log(
      `finished waiting for ["complete", "interactive"].includes(document.getElementById("preview").contentWindow.document.readyState)`
    )

    const frameHandle = await previewPage.$(`iframe[id='preview']`)
    const frame = await frameHandle.contentFrame()

    console.log(
      `waiting for document.querySelector("h1") && document.querySelector("h1").innerText.includes("${title}")`
    )
    await frame.waitForFunction(
      `document.querySelector("h1") && document.querySelector("h1").innerText.includes("${title}")`
    )
    console.log(
      `finished waiting for document.querySelector("h1") && document.querySelector("h1").innerText.includes("${title}")`
    )

    clearTimeout(tooLongTimeout)

    await previewPage.close()
    return { success: true }
  } else {
    return { success: false }
  }
}
