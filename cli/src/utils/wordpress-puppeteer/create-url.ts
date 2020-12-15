import { join } from "path"

/**
 * Creates new URL by parsing base URL, path and query string.
 *
 * @param {string} path String to be serialized as pathname.
 * @param {?string} query String to be serialized as query portion of URL.
 * @return {string} String which represents full URL.
 */
export function createURL(input: {
  path: string
  query?: string
  baseUrl: string
}): string {
  const { path, query = ``, baseUrl } = input

  const url = new URL(baseUrl)

  url.pathname = join(url.pathname, path)
  url.search = query

  return url.href
}
