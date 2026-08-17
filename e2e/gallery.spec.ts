import { expect, test, type Page } from '@playwright/test'

/**
 * The behaviour the unit tests cannot reach.
 *
 * `galleryReducer` is tested exhaustively in isolation, and that is the right
 * place for it. What is untested there is whether the reducer is actually wired
 * to a key press, whether a neighbour frame is really inert, and whether the
 * platform dialog behaves the way the component assumes it does. Those only
 * exist in a browser.
 */

/** The gallery announces its own state; reading it beats inspecting the DOM. */
function announcement(page: Page) {
  return page.locator('[aria-roledescription="carousel"] [aria-live="polite"]')
}

test.describe('gallery navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('the next and previous buttons move through the collection', async ({ page }) => {
    await expect(announcement(page)).toContainText('project 1 of')

    await page.getByRole('button', { name: 'Next project' }).click()
    await expect(announcement(page)).toContainText('project 2 of')

    await page.getByRole('button', { name: 'Previous project' }).click()
    await expect(announcement(page)).toContainText('project 1 of')
  })

  test('it loops backwards from the first project to the last', async ({ page }) => {
    const total = await page.getByRole('button', { name: /project \d+ of \d+$/ }).count()

    await page.getByRole('button', { name: 'Previous project' }).click()
    await expect(announcement(page)).toContainText(`project ${total} of ${total}`)
  })

  test('arrow keys move the gallery when focus is inside it', async ({ page }) => {
    // Arrow handling lives on the section and relies on the event bubbling from
    // whatever inside it holds focus — so focusing a control is the real path.
    await page.getByRole('button', { name: 'Next project' }).focus()

    await page.keyboard.press('ArrowRight')
    await expect(announcement(page)).toContainText('project 2 of')

    await page.keyboard.press('ArrowLeft')
    await expect(announcement(page)).toContainText('project 1 of')

    await page.keyboard.press('End')
    await expect(announcement(page)).toContainText(/project (\d+) of \1/)

    await page.keyboard.press('Home')
    await expect(announcement(page)).toContainText('project 1 of')
  })

  test('only the active frame can be reached by keyboard', async ({ page }) => {
    // A partly visible neighbour holding tabbable links is a trap: focus lands
    // on something the user cannot see. `inert` is what prevents it, and inert
    // is precisely the kind of thing that works until a React version changes.
    const links = page.locator('.gallery-frame a[href]')
    await expect(links).not.toHaveCount(0)

    const reachable = await links.evaluateAll(
      (nodes) => nodes.filter((node) => !node.closest('[inert]')).length,
    )

    expect(reachable, 'exactly one frame should expose its link').toBe(1)
  })
})

test.describe('info overlay', () => {
  test('opens, contains focus, and returns focus to its trigger on Escape', async ({ page }) => {
    await page.goto('/')

    const trigger = page.getByRole('button', { name: 'Info' })
    await trigger.click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // The native <dialog> is what provides containment; this asserts it is
    // genuinely modal rather than merely painted on top.
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    const focusInside = await page.evaluate(() =>
      Boolean(document.activeElement?.closest('dialog')),
    )
    expect(focusInside, 'focus should not escape the dialog').toBe(true)

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()

    // Returning focus is the one part <dialog> does not do for us, so it is the
    // part that can regress.
    await expect(trigger).toBeFocused()
  })

  test('closes on the close button', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('button', { name: 'Info' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()

    await page.getByRole('button', { name: 'Close' }).click()
    await expect(page.getByRole('dialog')).toBeHidden()
  })
})

test.describe('reduced motion', () => {
  test('remains fully navigable with motion disabled', async ({ page }) => {
    // Reduced motion is a supported mode, not a degraded one
    // (docs/rules/05-experience.md): the composition collapses, navigation
    // does not.
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')

    await page.getByRole('button', { name: 'Next project' }).click()
    await expect(announcement(page)).toContainText('project 2 of')

    await expect(page.locator('.gallery-frame').first()).toBeVisible()
  })
})
