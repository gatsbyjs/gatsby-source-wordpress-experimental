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
    await Promise.all([
      page.goto(createURL({ path: `wp-login.php`, baseUrl })),
      page.waitForNavigation({ waitUntil: `domcontentloaded` }),
    ])
  }

  await page.focus(`#user_login`)
  await pressKeyWithModifier({ modifier: `primary`, key: `a`, page })
  await page.type(`#user_login`, username)

  await page.focus(`#user_pass`)
  await pressKeyWithModifier({ modifier: `primary`, key: `a`, page })
  await page.type(`#user_pass`, password)

  await Promise.all([page.waitForNavigation(), page.click(`#wp-submit`)])
}
