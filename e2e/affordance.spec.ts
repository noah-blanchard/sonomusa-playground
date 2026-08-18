import { expect, test } from '@playwright/test'
import { allRoutes } from './routes'

/**
 * Everything clickable looks clickable.
 *
 * The UA stylesheet gives `<a href>` a pointer and `<button>` an arrow, and
 * nothing in the shell corrected it — so the carousel arrows, the position
 * dots, the INFO trigger and the dialog close all read as inert on hover. It
 * is the kind of bug that no unit test can see, that a screenshot cannot show
 * because a screenshot has no cursor, and that everyone notices immediately.
 *
 * `globals.css` fixes it in one rule. This is what keeps it fixed, including
 * for controls that do not exist yet.
 */
test('every clickable element has a pointer cursor', async ({ page }) => {
  for (const route of [...(await allRoutes(page)), '/this-route-does-not-exist']) {
    await page.goto(route)
    await page.evaluate(() => document.fonts.ready)

    const offenders = await page.evaluate(() => {
      const clickable = document.querySelectorAll<HTMLElement>(
        'a[href], button, [role="button"], summary',
      )

      return Array.from(clickable)
        // `inert` frames in the gallery are deliberately unreachable, and a
        // hidden control has no hover state to get wrong.
        .filter((node) => node.offsetParent !== null && !node.closest('[inert]'))
        .filter((node) => getComputedStyle(node).cursor !== 'pointer')
        .map(
          (node) =>
            `<${node.tagName.toLowerCase()}> "${(node.getAttribute('aria-label') ?? node.textContent ?? '')
              .replace(/\s+/g, ' ')
              .trim()
              .slice(0, 40)}" has cursor:${getComputedStyle(node).cursor}`,
        )
    })

    expect(offenders, `${route} — ${offenders.length} control(s) do not look clickable`).toEqual([])
  }
})

/**
 * The dialog's controls are inside a `<dialog>` that is closed at load, so the
 * sweep above never reaches them. They are also the two that were most wrong.
 */
test('the info dialog controls have a pointer cursor', async ({ page }) => {
  await page.goto('/')

  const trigger = page.getByRole('button', { name: 'Info' })
  await expect(trigger).toHaveCSS('cursor', 'pointer')

  await trigger.click()
  await expect(page.getByRole('button', { name: 'Close' })).toHaveCSS('cursor', 'pointer')
})
