import { expect, test } from '@playwright/test'

/**
 * The fronting project is the only one in colour, and the only one with a field.
 *
 * Both halves are invisible to every other kind of test: the desaturation is a
 * computed style on an element nothing queries, and the field is a canvas whose
 * output no assertion can read. Screenshots do not help either — the effect is
 * a difference between two frames, not a property of one.
 */

test('only the fronting frame renders its media in colour', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)

  const active = page.locator('.gallery-frame:not([inert]) [data-project-media]')
  const inactive = page.locator('.gallery-frame[inert] [data-project-media]')

  await expect(active).toHaveCount(1)
  expect(await inactive.count()).toBeGreaterThan(0)

  await expect(active).toHaveCSS('filter', 'grayscale(0)')
  await expect(inactive.first()).toHaveCSS('filter', 'grayscale(1)')
})

test('the colour follows the gallery rather than the position', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)

  const first = await page
    .locator('.gallery-frame:not([inert])')
    .getAttribute('aria-label')

  await page.getByRole('button', { name: 'Next project' }).click()
  // The travel is --duration-slow; give the filter transition room to finish.
  await page.waitForTimeout(900)

  const second = await page
    .locator('.gallery-frame:not([inert])')
    .getAttribute('aria-label')

  expect(second).not.toBe(first)
  await expect(page.locator('.gallery-frame:not([inert]) [data-project-media]')).toHaveCSS(
    'filter',
    'grayscale(0)',
  )
})

test('the ambient field mounts on desktop and paints something', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')

  const canvas = page.locator('.gallery-viewport canvas')
  await expect(canvas).toHaveCount(1)

  // A canvas that mounted but drew nothing would pass every structural check,
  // so read the drawing buffer and require at least one lit pixel.
  await page.waitForTimeout(500)
  const lit = await page.evaluate(() => {
    const node = document.querySelector<HTMLCanvasElement>('.gallery-viewport canvas')
    if (!node) return -1

    const gl = node.getContext('webgl2') ?? node.getContext('webgl')
    if (!gl) return -2

    const pixels = new Uint8Array(node.width * node.height * 4)
    gl.readPixels(0, 0, node.width, node.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels)

    let count = 0
    for (let i = 3; i < pixels.length; i += 4) if (pixels[i]! > 0) count += 1
    return count
  })

  expect(lit).toBeGreaterThan(0)
})

test('the field does not mount below the gallery breakpoint', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 })
  await page.goto('/')

  // Not merely hidden — never rendered, so no GL context is created on the
  // devices least able to spare one.
  await expect(page.locator('.gallery-viewport canvas')).toHaveCount(0)
})

test('reduced motion holds the field still rather than removing it', async ({ browser }) => {
  // Reduced motion is a supported mode, not a degraded one: the field stays,
  // it simply stops moving. Removing it would delete a state cue rather than
  // simplify one (docs/rules/05-experience.md).
  const context = await browser.newContext({ reducedMotion: 'reduce' })
  const page = await context.newPage()
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await page.waitForTimeout(500)

  await expect(page.locator('.gallery-viewport canvas')).toHaveCount(1)

  const lit = await page.evaluate(() => {
    const node = document.querySelector<HTMLCanvasElement>('.gallery-viewport canvas')
    const gl = node?.getContext('webgl2') ?? node?.getContext('webgl')
    if (!node || !gl) return -1

    const pixels = new Uint8Array(node.width * node.height * 4)
    gl.readPixels(0, 0, node.width, node.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels)

    let count = 0
    for (let i = 3; i < pixels.length; i += 4) if (pixels[i]! > 0) count += 1
    return count
  })

  expect(lit).toBeGreaterThan(0)
  await context.close()
})
