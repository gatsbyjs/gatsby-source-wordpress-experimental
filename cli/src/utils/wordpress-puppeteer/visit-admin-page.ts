import { Page } from "puppeteer"
/**
 * External dependencies
 */
import { join } from "path"

/**
 * Internal dependencies
 */
import { createURL } from "./create-url"
// import { isCurrentURL } from "./is-current-url"
// import { loginUser } from "./login-user"
import { getPageError } from "./get-page-error"

/**
 * Visits admin page; if user is not logged in then it logging in it first, then visits admin page.
 *
 * @param {string} adminPath String to be serialized as pathname.
 * @param {string} query String to be serialized as query portion of URL.
 */
export async function visitAdminPage(input: {
  adminPath: string
  query?: string
  page: Page
  baseUrl: string
}): Promise<void> {
  const { adminPath, query, page, baseUrl } = input

  await Promise.all([
    page.goto(createURL({ baseUrl, path: join(`wp-admin`, adminPath), query })),
    page.waitForNavigation({ waitUntil: `domcontentloaded` }),
  ])

  const error = await getPageError({ page })
  if (error) {
    throw new Error(`Unexpected error in page content: ` + error)
  }
}
