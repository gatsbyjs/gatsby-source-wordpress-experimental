import { Page } from "puppeteer"
/**
 * Internal dependencies
 */
import { createURL } from "./create-url"

/**
 * Checks if current URL is a WordPress path.
 *
 * @param {string} path String to be serialized as pathname.
 * @param {?string} query String to be serialized as query portion of URL.
 * @return {boolean} Boolean represents whether current URL is or not a WordPress path.
 */
export function isCurrentURL(input: {
  path: string
  query?: string
  page: Page
  baseUrl: string
}): boolean {
  const { path, query = ``, page, baseUrl } = input

  const currentURL = new URL(page.url())

  currentURL.search = query

  return createURL({ path, query, baseUrl }) === currentURL.href
}
