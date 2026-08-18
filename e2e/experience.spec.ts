import { expect, test, type Page } from '@playwright/test'

/**
 * The way into a project, end to end.
 *
 * The animation itself is untestable here — Playwright cannot watch a morph,
 * and a screenshot of one frame proves nothing. What these check is everything
 * around it that CAN be wrong: that both controls exist and are distinguishable,
 * that the primary one performs a real navigation, that a transition is
 * actually started rather than the whole mechanism being inert, that the work
 * paints on arrival, and that none of it depends on a mouse or on motion.
 *
 * Nothing here names a project. Which projects host an experience is read from
 * the running site, so adding or removing one leaves the suite correct.
 */

/**
 * How many projects the gallery holds, read from the pagination dots rather
 * than from a number in this file — the same reason `routes.ts` derives its
 * list instead of listing it.
 */
function countProjects(page: Page): Promise<number> {
  return page.getByRole('button', { name: /project \d+ of \d+$/ }).count()
}

/** Steps the carousel through every project, collecting the stage links. */
async function collectStageLinks(page: Page): Promise<string[]> {
  const active = page.locator('.gallery-frame:not([inert])')
  const next = page.getByRole('button', { name: 'Next project' })
  const total = await countProjects(page)

  const found = new Set<string>()

  for (let step = 0; step < total; step += 1) {
    const link = active.locator('a[href$="/play"]')
    if ((await link.count()) > 0) {
      const href = await link.first().getAttribute('href')
      if (href) found.add(href)
    }

    await next.click()
    // The travel is --duration-slow; let the frame settle before reading it.
    await page.waitForTimeout(820)
  }

  return [...found]
}

/**
 * Brings the first project that offers a stage to the front and leaves it
 * there, returning its href.
 *
 * Only the fronting frame is reachable — the others are `inert`, deliberately,
 * so a half-visible neighbour cannot hold a tabbable link behind the active
 * card. Every test that activates the control has to front it first.
 */
async function frontStageLink(page: Page): Promise<string> {
  const link = page.locator('.gallery-frame:not([inert]) a[href$="/play"]')
  const next = page.getByRole('button', { name: 'Next project' })
  const total = await countProjects(page)

  for (let step = 0; step <= total; step += 1) {
    if ((await link.count()) > 0) {
      const href = await link.first().getAttribute('href')
      if (href) return href
    }

    await next.click()
    await page.waitForTimeout(820)
  }

  throw new Error('No project offers a stage — the suite would silently test nothing.')
}

test('the fronting frame offers a way in and a way to read about it', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)

  const active = page.locator('.gallery-frame:not([inert])')

  // Every project has a page, so the secondary control is unconditional.
  await expect(active.locator('a[href^="/projects/"]:not([href$="/play"])')).toHaveCount(1)

  const next = page.getByRole('button', { name: 'Next project' })
  const total = await countProjects(page)

  for (let step = 0; step < total; step += 1) {
    const primary = active.locator('a[href$="/play"], a[target="_blank"]')
    const secondary = active.locator('a[href^="/projects/"]:not([href$="/play"])')

    // The primary is conditional — most projects have nothing to try yet, and
    // no control at all is the correct answer. The secondary never is.
    await expect(secondary).toHaveCount(1)
    expect(await primary.count()).toBeLessThanOrEqual(1)

    if ((await primary.count()) === 1) {
      // Each link names its own project, so six of them do not all announce
      // "Try it out" (docs/rules/05-experience.md).
      const name = await primary.first().getAttribute('aria-label')
      const label = name ?? (await primary.first().innerText())
      expect(label.length).toBeGreaterThan('Try it out'.length)
    }

    await next.click()
    await page.waitForTimeout(820)
  }
})

test('the stage route exists exactly for the projects that offer it', async ({ page, request }) => {
  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)

  const offered = new Set(await collectStageLinks(page))
  expect(offered.size).toBeGreaterThan(0)

  await page.goto('/projects')
  const projectPaths = await page
    .locator('main a[href^="/projects/"]')
    .evaluateAll((links) => [
      ...new Set(links.map((link) => new URL((link as HTMLAnchorElement).href).pathname)),
    ])

  for (const path of projectPaths) {
    const stage = `${path}/play`
    const response = await request.get(stage)

    // A URL that resolves to an empty stage would be worse than one that does
    // not resolve, so the route must not exist without an experience behind it.
    expect(response.status(), `${stage} should ${offered.has(stage) ? 'exist' : '404'}`).toBe(
      offered.has(stage) ? 200 : 404,
    )
  }
})

test('the way in navigates for real, and starts a transition on the way', async ({ page }) => {
  await page.addInitScript(() => {
    const start = document.startViewTransition?.bind(document)
    Object.defineProperty(window, '__transitions', { value: { count: 0 }, writable: true })

    if (start) {
      document.startViewTransition = ((...args: unknown[]) => {
        ;(window as unknown as { __transitions: { count: number } }).__transitions.count += 1
        return (start as (...a: unknown[]) => unknown)(...args)
      }) as typeof document.startViewTransition
    }
  })

  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)

  const href = await frontStageLink(page)

  const primary = page.locator(`.gallery-frame:not([inert]) a[href="${href}"]`)
  await expect(primary).toHaveCount(1)
  await primary.click()

  // A real route change, not a state flip in a single page: the URL is the
  // point, because it can be shared, reloaded and gone back from.
  await page.waitForURL(`**${href}`)
  await expect(page.locator('.project-stage')).toHaveCount(1)

  const supported = await page.evaluate(() => typeof document.startViewTransition === 'function')
  if (supported) {
    // Not "the animation looked right" — only that the mechanism is wired and
    // the browser was actually asked to transition.
    const count = await page.evaluate(
      () => (window as unknown as { __transitions: { count: number } }).__transitions.count,
    )
    expect(count).toBeGreaterThan(0)
  }
})

test('the work paints and the loading mark gets out of its way', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)

  await page.goto(await frontStageLink(page))

  // The mark is a handoff, not a permanent fixture. Leaving it up forever is
  // the exact failure this asserts against.
  await expect(page.locator('[data-stage-loading]')).toHaveCount(0, { timeout: 10_000 })

  // The stage fills the viewport rather than sitting in a column.
  const height = await page.locator('.project-stage').evaluate((node) => node.clientHeight)
  expect(height).toBeGreaterThan(page.viewportSize()!.height * 0.9)

  // And there is a way back out that does not require the browser chrome.
  await expect(page.getByRole('link', { name: /^Leave / })).toHaveCount(1)
})

test('the way in is reachable and operable from the keyboard alone', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)

  const href = await frontStageLink(page)

  const primary = page.locator(`.gallery-frame:not([inert]) a[href="${href}"]`)

  // Tab rather than .focus(), because :focus-visible is what draws the ring and
  // a programmatic focus does not necessarily set it.
  for (let press = 0; press < 40 && !(await primary.evaluate((n) => n === document.activeElement)); press += 1) {
    await page.keyboard.press('Tab')
  }
  await expect(primary).toBeFocused()

  // Visible focus, not merely focusable. The shell draws it as a broken stencil
  // ring on ::after and clears the native outline, so asserting on `outline`
  // would test the wrong half and pass on a control with no ring at all.
  const ring = await primary.evaluate((node) => {
    const after = getComputedStyle(node, '::after')
    return { content: after.content, image: after.backgroundImage }
  })
  expect(ring.content).not.toBe('none')
  expect(ring.image).toContain('gradient')

  await page.keyboard.press('Enter')
  await page.waitForURL(`**${href}`)
  await expect(page.locator('.project-stage')).toHaveCount(1)
})

test('escape leaves the stage', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)

  const href = await frontStageLink(page)
  await page.goto(href)
  await expect(page.locator('.project-stage')).toHaveCount(1)

  await page.keyboard.press('Escape')
  await page.waitForURL((url) => url.pathname === href.replace(/\/play$/, ''))
})

test('reduced motion still reaches the work', async ({ browser }) => {
  // Reduced motion is a supported mode, not a degraded one. The travel goes;
  // the destination and everything in it stays (docs/rules/05-experience.md).
  const context = await browser.newContext({ reducedMotion: 'reduce' })
  const page = await context.newPage()

  await page.goto('/')
  const href = await frontStageLink(page)

  const primary = page.locator(`.gallery-frame:not([inert]) a[href="${href}"]`)
  await primary.click()
  await page.waitForURL(`**${href}`)

  await expect(page.locator('.project-stage')).toHaveCount(1)
  await expect(page.locator('[data-stage-loading]')).toHaveCount(0, { timeout: 10_000 })
  await expect(page.getByRole('link', { name: /^Leave / })).toHaveCount(1)

  await context.close()
})
