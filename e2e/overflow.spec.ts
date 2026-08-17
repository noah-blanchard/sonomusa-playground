import { expect, test } from '@playwright/test'
import { allRoutes, WIDTHS } from './routes'

/**
 * The assertion that would have caught the bug this suite was written for.
 *
 * `scrollWidth === clientWidth` on the document element is the whole test. It
 * is worth more than everything else here combined: the gallery's neighbour
 * frames escaped their container and widened the document by 696px at 1440,
 * 552px at 768 and 344px at 390, which also dragged the mobile layout viewport
 * out to ~734px and made the entire page render as though zoomed out. Every
 * unit test passed throughout.
 *
 * Horizontal page scroll is never intentional here, so this needs no allowance
 * and no threshold. One pixel of it is a bug.
 */
for (const width of WIDTHS) {
  test(`no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })

    for (const route of await allRoutes(page)) {
      await page.goto(route)
      // Fonts change metrics, and the gallery settles into place — measuring
      // before either would test a layout no one ever sees.
      await page.evaluate(() => document.fonts.ready)

      const measured = await page.evaluate(() => {
        const el = document.documentElement

        // Reported alongside the numbers: knowing WHAT is widest is the
        // difference between a five-minute fix and an afternoon of bisecting.
        let widest = ''
        let right = 0
        for (const node of document.querySelectorAll('body *')) {
          const box = node.getBoundingClientRect()
          if (box.right > right) {
            right = box.right
            widest = `${node.tagName.toLowerCase()}.${String(node.className).split(' ')[0]}`
          }
        }

        return { scrollWidth: el.scrollWidth, clientWidth: el.clientWidth, widest }
      })

      expect(
        measured.scrollWidth,
        `${route} at ${width}px overflows by ${measured.scrollWidth - measured.clientWidth}px — widest element is ${measured.widest}`,
      ).toBe(measured.clientWidth)
    }
  })
}

/**
 * A page with no heading is broken in a way that is easy to miss and hard to
 * notice: the route still renders, the screenshot still looks fine, and only a
 * screen reader user finds out.
 */
test('every route has exactly one h1', async ({ page }) => {
  for (const route of await allRoutes(page)) {
    await page.goto(route)

    const headings = page.locator('h1')
    await expect(headings, `${route} should have one h1`).toHaveCount(1)
    await expect(headings.first()).not.toBeEmpty()
  }
})
