import { Browser, Page } from "puppeteer"
/**
 * WordPress dependencies
 */
// import { addQueryArgs } from "@wordpress/url"

/**
 * Internal dependencies
 */
// import { visitAdminPage } from "./visit-admin-page"

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
  index: number
}): Promise<{ success: boolean }> {
  return new Promise(async (resolve, reject) => {
    const { page, title, browser, index } = input

    await new Promise((resolve) => setTimeout(resolve, index * 1000))

    await page.waitForSelector(`.edit-post-layout`)

    const previewPagePromise: Promise<Page> = new Promise((resolve) =>
      browser.once(`targetcreated`, (target) => resolve(target.page()))
    )

    await page.evaluate(
      ({ title }) => {
        window.wp.data.dispatch(`core/editor`).editPost({ title })
        console.log(
          document.querySelector(`.block-editor-post-preview__button-toggle`)
        )
        setTimeout(() => {
          ;(document.querySelector(
            `.block-editor-post-preview__button-toggle`
          ) as HTMLElement).click()
          ;(document.querySelector(
            `.edit-post-header-preview__button-external`
          ) as HTMLElement).click()
        }, 1000)
      },
      { title }
    )

    const previewPage = await previewPagePromise

    await previewPage.exposeFunction(`onCustomEvent`, (e) => {
      console.log(`${e.type} fired`, e.detail || ``)
    })

    /**
     * Attach an event listener to page to capture a custom event on page load/navigation.
     * @param {string} type Event name.
     * @returns {!Promise}
     */
    function listenFor(type): Promise<void> {
      return previewPage.evaluateOnNewDocument((type) => {
        document.addEventListener(type, (e) => {
          window.onCustomEvent({ type, detail: e.detail })
        })
      }, type)
    }

    let rejected = false

    const tooLongTimeout = setTimeout(async () => {
      rejected = true
      // console.log(`preview took too long`)
      if (previewPage) {
        await previewPage.close()
      }

      return reject(Error(`preview took too long`))
    }, 5000)

    previewPage.evaluate(() => {
      document.addEventListener(`wp-gatsby-preview-ready`, () => {
        console.log(`wp-gatsby-preview-ready`)

        const loader: HTMLElement = document.getElementById(`loader`)

        loader.classList.add(`loaded`)
        loader.style.display = `none`
      })
    })

    await listenFor(`wp-gatsby-preview-ready`)
    clearTimeout(tooLongTimeout)

    await new Promise((resolve) => setTimeout(resolve, 2500))
    // await new Promise(resolve => setTimeout(resolve, 15000))
    if (!rejected) {
      console.log(`preview ready!!2`)
      await previewPage.close()

      return resolve({ success: true })
    }

    return resolve({ success: false })
  })
}
