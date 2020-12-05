import { Page } from "puppeteer"
import { createURL } from "./create-url"
import { isCurrentURL } from "./is-current-url"
import { pressKeyWithModifier } from "./press-key-with-modifier"

/**
 * Performs log in with specified username and password.
 *
 * @param {?string} username String to be used as user credential.
 * @param {?string} password String to be used as user credential.
 */
export async function loginUser(input: {
  username: string
  password: string
  page: Page
  baseUrl: string
}): Promise<void> {
  const { username, password, page, baseUrl } = input

  if (!isCurrentURL({ path: `wp-login.php`, page, baseUrl })) {
    await page.goto(createURL({ path: `wp-login.php`, baseUrl }))
  }

  await new Promise(resolve => setTimeout(resolve, 100))

  await page.focus(`#user_login`)
  await new Promise(resolve => setTimeout(resolve, 1))
  await pressKeyWithModifier({ modifier: `primary`, key: `a`, page })
  await page.type(`#user_login`, username)
  await new Promise(resolve => setTimeout(resolve, 100))
  await page.focus(`#user_pass`)
  await new Promise(resolve => setTimeout(resolve, 1))
  await pressKeyWithModifier({ modifier: `primary`, key: `a`, page })
  await new Promise(resolve => setTimeout(resolve, 100))
  await page.type(`#user_pass`, password)

  await new Promise(resolve => setTimeout(resolve, 1000))
  await Promise.all([page.waitForNavigation(), page.click(`#wp-submit`)])
}
