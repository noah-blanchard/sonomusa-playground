import type { Page } from '@playwright/test'

/**
 * Every route the site serves, discovered rather than listed.
 *
 * A hard-coded array would name projects in a test — the same coupling that
 * AGENTS.md §2 (I3) forbids in shared code, and for the same reason: adding a
 * project would mean editing this file. The index page already derives itself
 * from the manifests, so reading its links keeps the suite correct for free.
 */
export async function allRoutes(page: Page): Promise<string[]> {
  await page.goto('/projects')

  const projectPaths = await page
    .locator('main a[href^="/projects/"]')
    .evaluateAll((links) =>
      [...new Set(links.map((link) => new URL((link as HTMLAnchorElement).href).pathname))].sort(),
    )

  if (projectPaths.length === 0) {
    throw new Error('No project links found on /projects — the suite would silently test nothing.')
  }

  return ['/', '/projects', ...projectPaths]
}

/** The three widths the original audit measured: phone, tablet, desktop. */
export const WIDTHS = [390, 768, 1440] as const
