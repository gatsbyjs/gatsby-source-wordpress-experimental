import { Page } from "puppeteer"
/**
 * External dependencies
 */
import { capitalize } from "lodash"

/**
 * WordPress dependencies
 */
import { modifiers, SHIFT, ALT, CTRL } from "@wordpress/keycodes"

/**
 * Emulates a Ctrl+A SelectAll key combination by dispatching custom keyboard
 * events and using the results of those events to determine whether to call
 * `document.execCommand( 'selectall' );`. This is necessary because Puppeteer
 * does not emulate Ctrl+A SelectAll in macOS. Events are dispatched to ensure
 * that any `Event#preventDefault` which would have normally occurred in the
 * application as a result of Ctrl+A is respected.
 *
 * @see https://github.com/GoogleChrome/puppeteer/issues/1313
 * @see https://w3c.github.io/uievents/tools/key-event-viewer.html
 *
 * @return {Promise} Promise resolving once the SelectAll emulation completes.
 */
async function emulateSelectAll({ page }): Promise<void> {
  await page.evaluate(() => {
    const isMac = /Mac|iPod|iPhone|iPad/.test(window.navigator.platform)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const KeyboardEventAny = KeyboardEvent as any

    document.activeElement.dispatchEvent(
      new KeyboardEventAny(`keydown`, {
        bubbles: true,
        cancelable: true,
        key: isMac ? `Meta` : `Control`,
        code: isMac ? `MetaLeft` : `ControlLeft`,
        location: window.KeyboardEvent.DOM_KEY_LOCATION_LEFT,
        getModifierState: (keyArg): boolean =>
          keyArg === (isMac ? `Meta` : `Control`),
        ctrlKey: !isMac,
        metaKey: isMac,
        charCode: 0,
        keyCode: isMac ? 93 : 17,
        which: isMac ? 93 : 17,
      })
    )

    const preventableEvent = new KeyboardEventAny(`keydown`, {
      bubbles: true,
      cancelable: true,
      key: `a`,
      code: `KeyA`,
      location: window.KeyboardEvent.DOM_KEY_LOCATION_STANDARD,
      getModifierState: (keyArg): boolean =>
        keyArg === (isMac ? `Meta` : `Control`),
      ctrlKey: !isMac,
      metaKey: isMac,
      charCode: 0,
      keyCode: 65,
      which: 65,
    })

    const wasPrevented =
      !document.activeElement.dispatchEvent(preventableEvent) ||
      preventableEvent.defaultPrevented

    if (!wasPrevented) {
      document.execCommand(`selectall`, false, null)
    }

    document.activeElement.dispatchEvent(
      new KeyboardEventAny(`keyup`, {
        bubbles: true,
        cancelable: true,
        key: isMac ? `Meta` : `Control`,
        code: isMac ? `MetaLeft` : `ControlLeft`,
        location: window.KeyboardEvent.DOM_KEY_LOCATION_LEFT,
        getModifierState: (): false => false,
        charCode: 0,
        keyCode: isMac ? 93 : 17,
        which: isMac ? 93 : 17,
      })
    )
  })
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _clipboardData: any
  }
}

/**
 * Sets the clipboard data that can be pasted with
 * `pressKeyWithModifier( 'primary', 'v' )`.
 *
 * @param {Object} $1           Options.
 * @param {string} $1.plainText Plain text to set.
 * @param {string} $1.html      HTML to set.
 */
export async function setClipboardData(input: {
  plainText: string
  html: string
  page: Page
}): Promise<void> {
  const { plainText = ``, html = ``, page } = input

  await page.evaluate(
    (_plainText, _html) => {
      window._clipboardData = new DataTransfer()
      window._clipboardData.setData(`text/plain`, _plainText)
      window._clipboardData.setData(`text/html`, _html)
    },
    plainText,
    html
  )
}

async function emulateClipboard(input: {
  type: string
  page: Page
}): Promise<void> {
  const { type, page } = input

  await page.evaluate((_type): void => {
    if (_type !== `paste`) {
      window._clipboardData = new DataTransfer()

      const selection = window.getSelection()
      const plainText = selection.toString()
      let html = plainText

      if (selection.rangeCount) {
        const range = selection.getRangeAt(0)
        const fragment = range.cloneContents()

        html = Array.from(fragment.childNodes)
          .map((node: HTMLElement): string => node.outerHTML || node.nodeValue)
          .join(``)
      }

      window._clipboardData.setData(`text/plain`, plainText)
      window._clipboardData.setData(`text/html`, html)
    }

    document.activeElement.dispatchEvent(
      new ClipboardEvent(_type, {
        bubbles: true,
        clipboardData: window._clipboardData,
      })
    )
  }, type)
}

/**
 * Performs a key press with modifier (Shift, Control, Meta, Alt), where each modifier
 * is normalized to platform-specific modifier.
 *
 * @param {string} modifier Modifier key.
 * @param {string} key Key to press while modifier held.
 */
export async function pressKeyWithModifier(input: {
  modifier: string
  key: string
  page: Page
}): Promise<void> {
  const { modifier, key, page } = input

  if (modifier.toLowerCase() === `primary` && key.toLowerCase() === `a`) {
    return await emulateSelectAll({ page })
  }

  if (modifier.toLowerCase() === `primary` && key.toLowerCase() === `c`) {
    return await emulateClipboard({ type: `copy`, page })
  }

  if (modifier.toLowerCase() === `primary` && key.toLowerCase() === `x`) {
    return await emulateClipboard({ type: `cut`, page })
  }

  if (modifier.toLowerCase() === `primary` && key.toLowerCase() === `v`) {
    return await emulateClipboard({ type: `paste`, page })
  }

  const isAppleOS = (): boolean => process.platform === `darwin`

  const overWrittenModifiers = {
    ...modifiers,
    shiftAlt: (_isApple): string[] =>
      _isApple() ? [SHIFT, ALT] : [SHIFT, CTRL],
  }
  const mappedModifiers = overWrittenModifiers[modifier](isAppleOS)
  const ctrlSwap = (mod): string => (mod === CTRL ? `control` : mod)

  await Promise.all(
    mappedModifiers.map(
      async (mod): Promise<void> => {
        const capitalizedMod = capitalize(ctrlSwap(mod))
        return page.keyboard.down(capitalizedMod)
      }
    )
  )

  await page.keyboard.press(key)

  await Promise.all(
    mappedModifiers.map(
      async (mod): Promise<void> => {
        const capitalizedMod = capitalize(ctrlSwap(mod))
        return page.keyboard.up(capitalizedMod)
      }
    )
  )
}
