import { Page } from "puppeteer"
/**
 * WordPress dependencies
 */
import { addQueryArgs } from "@wordpress/url"

/**
 * Internal dependencies
 */
import { visitAdminPage } from "./visit-admin-page"

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    wp: any
  }
}

/**
 * Creates new post.
 *
 * @param {Object}  object                    Object to create new post, along with tips enabling option.
 * @param {string}  [object.postType]         Post type of the new post.
 * @param {string}  [object.title]            Title of the new post.
 * @param {string}  [object.content]          Content of the new post.
 * @param {string}  [object.excerpt]          Excerpt of the new post.
 * @param {boolean} [object.showWelcomeGuide] Whether to show the welcome guide.
 */
export async function createNewPost(input: {
  postType: string
  title: string
  content: string
  excerpt: string
  showWelcomeGuide: boolean
  page: Page
  baseUrl: string
}): Promise<void> {
  const {
    page,
    postType,
    title,
    content,
    excerpt,
    showWelcomeGuide = false,
    baseUrl,
  } = input

  const query = addQueryArgs(``, {
    post_type: postType,
    post_title: title,
    content,
    excerpt,
  }).slice(1)

  await visitAdminPage({ adminPath: `post-new.php`, query, page, baseUrl })

  await page.waitForSelector(`.edit-post-layout`)

  const isWelcomeGuideActive = await page.evaluate(() =>
    window.wp.data.select(`core/edit-post`).isFeatureActive(`welcomeGuide`)
  )
  const isFullscreenMode = await page.evaluate(() =>
    window.wp.data.select(`core/edit-post`).isFeatureActive(`fullscreenMode`)
  )

  if (showWelcomeGuide !== isWelcomeGuideActive) {
    await page.evaluate(() =>
      window.wp.data.dispatch(`core/edit-post`).toggleFeature(`welcomeGuide`)
    )

    // await page.reload()
    await page.waitForSelector(`.edit-post-layout`)
  }

  if (isFullscreenMode) {
    await page.evaluate(() =>
      window.wp.data.dispatch(`core/edit-post`).toggleFeature(`fullscreenMode`)
    )

    await page.waitForSelector(`body:not(.is-fullscreen-mode)`)
  }
}
