import { defineConfig, devices } from '@playwright/test'

/**
 * End-to-end configuration.
 *
 * These tests exist because a layout bug shipped that nothing in the repository
 * could have caught: every unit test passed while the homepage carried 696px of
 * horizontal overflow. Vitest tests the reducers and the geometry; this tests
 * what a browser actually does with them.
 *
 * The suite runs against `bun run build && bun run start`, not `next dev`. The
 * bug was in production CSS, and dev-only differences (unminified output, the
 * dev overlay, no static optimization) are exactly the kind of thing that lets
 * a real regression through a green run.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,

  // A `.only` left behind is a silently reduced suite. Locally it is a
  // convenience; in CI it is a false pass.
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['list']] : [['list']],

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'bun run build && bun run start',
    url: 'http://localhost:3000',
    // Locally, reuse whatever is already serving; in CI always build fresh.
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
})
