#!/usr/bin/env bun
/**
 * Renders every route at every breakpoint into `.shots/`.
 *
 * Not an assertion, and no substitute for one — `e2e/overflow.spec.ts` is what
 * fails a build. This exists because looking at the rendered page is what found
 * the bug those tests now guard, and nothing in the repository made that easy.
 * A green suite and a page that reads correctly are different claims.
 *
 * Drives whichever Chromium-family browser is installed over the DevTools
 * Protocol rather than adding a second browser-automation dependency: Playwright
 * is here for assertions, and this needs a screenshot, not a test runner.
 *
 *   bun run start   # in another terminal
 *   bun run shots
 */

import { existsSync } from 'node:fs'
import { mkdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

/*
 * Every path is resolved from this file rather than read from the environment.
 * An unexported shell variable during the original audit expanded to nothing
 * and created a literal `undefined/` directory inside the repository; there is
 * no reason for a script that knows where it lives to take that risk.
 */
const ROOT = fileURLToPath(new URL('..', import.meta.url))
const OUT_DIR = join(ROOT, '.shots')
/*
 * Outside the output directory on purpose. It used to live under `.shots/`,
 * which the script clears on every run — so a second run deleted the profile of
 * a browser that had not finished exiting from the first.
 */
const PROFILE_DIR = join(tmpdir(), 'sonomusa-capture-shots-profile')

const BASE_URL = 'http://localhost:3000'
const DEBUG_PORT = 9222
/** No CDP call here takes seconds. Waiting forever on a dead target does. */
const CALL_TIMEOUT_MS = 20_000

const BREAKPOINTS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'laptop', width: 1280, height: 800 },
  { name: 'desktop', width: 1440, height: 900 },
] as const

/** Chromium-family browsers, in the order they are worth trying. */
function findBrowser(): string | null {
  const programFiles = process.env['ProgramFiles'] ?? 'C:\\Program Files'
  const programFilesX86 = process.env['ProgramFiles(x86)'] ?? 'C:\\Program Files (x86)'
  const localAppData = process.env['LOCALAPPDATA'] ?? ''

  const candidates =
    process.platform === 'win32'
      ? [
          join(programFiles, 'Google/Chrome/Application/chrome.exe'),
          join(programFilesX86, 'Google/Chrome/Application/chrome.exe'),
          join(localAppData, 'Google/Chrome/Application/chrome.exe'),
          join(programFiles, 'Microsoft/Edge/Application/msedge.exe'),
          join(programFilesX86, 'Microsoft/Edge/Application/msedge.exe'),
        ]
      : process.platform === 'darwin'
        ? [
            '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
            '/Applications/Chromium.app/Contents/MacOS/Chromium',
          ]
        : ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser']

  return candidates.find((path) => existsSync(path)) ?? null
}

// ── the thinnest possible CDP client ──────────────────────────────────────

interface Session {
  send(method: string, params?: Record<string, unknown>): Promise<any>
  close(): void
}

async function connect(): Promise<Session> {
  const targets = (await (await fetch(`http://localhost:${DEBUG_PORT}/json`)).json()) as {
    type: string
    webSocketDebuggerUrl: string
  }[]

  const target = targets.find((candidate) => candidate.type === 'page')
  if (!target) throw new Error('The browser started but exposed no page to drive.')

  const socket = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((resolve) => socket.addEventListener('open', resolve, { once: true }))

  let nextId = 0
  const pending = new Map<number, (value: any) => void>()

  socket.addEventListener('message', (event) => {
    const message = JSON.parse(String(event.data)) as { id?: number; result?: unknown }
    if (message.id != null) {
      pending.get(message.id)?.(message.result)
      pending.delete(message.id)
    }
  })

  return {
    send(method, params = {}) {
      nextId += 1
      const id = nextId
      return new Promise((resolve, reject) => {
        /*
         * Every call is bounded. Without this, attaching to a browser whose
         * page target has gone away leaves the promise pending forever and the
         * script hangs with no output at all — which is precisely what it did.
         */
        const timer = setTimeout(() => {
          pending.delete(id)
          reject(new Error(`${method} did not answer within ${CALL_TIMEOUT_MS}ms.`))
        }, CALL_TIMEOUT_MS)

        pending.set(id, (value) => {
          clearTimeout(timer)
          resolve(value)
        })
        socket.send(JSON.stringify({ id, method, params }))
      })
    },
    close() {
      socket.close()
    },
  }
}

// ── routes ────────────────────────────────────────────────────────────────

/**
 * Read from the index page rather than listed here, for the same reason the E2E
 * suite does it: a hard-coded list would name projects, and adding one would
 * mean editing this script.
 */
async function discoverRoutes(session: Session): Promise<string[]> {
  await session.send('Page.navigate', { url: `${BASE_URL}/projects` })
  await Bun.sleep(1200)

  const result = await session.send('Runtime.evaluate', {
    expression: `[...new Set([...document.querySelectorAll('main a[href^="/projects/"]')]
      .map((a) => new URL(a.href).pathname))].sort()`,
    returnByValue: true,
  })

  const projects = (result?.result?.value ?? []) as string[]
  return ['/', '/projects', ...projects, '/this-route-does-not-exist']
}

function fileNameFor(route: string, breakpoint: string): string {
  const slug = route === '/' ? 'home' : route.replace(/^\//, '').replaceAll('/', '-')
  return `${slug}--${breakpoint}.png`
}

// ── main ──────────────────────────────────────────────────────────────────

async function main() {
  const browser = findBrowser()
  if (!browser) {
    console.error('✗ No Chrome, Edge or Chromium found. Install one, or set a path in this script.')
    process.exit(1)
  }

  try {
    await fetch(BASE_URL)
  } catch {
    console.error(`✗ Nothing is serving ${BASE_URL}. Run \`bun run start\` first.`)
    process.exit(1)
  }

  /*
   * A browser already holding the port is almost always one this script left
   * behind. Attaching to it looks like it works right up until a call never
   * comes back, so refuse instead of guessing.
   */
  let portInUse = false
  try {
    await fetch(`http://localhost:${DEBUG_PORT}/json/version`)
    portInUse = true
  } catch {
    // Free, which is what we want.
  }
  if (portInUse) {
    console.error(
      `✗ Something is already listening on ${DEBUG_PORT} — probably a headless browser left over ` +
        'from an earlier run. Close it and try again.',
    )
    process.exit(1)
  }

  await rm(OUT_DIR, { recursive: true, force: true })
  await mkdir(OUT_DIR, { recursive: true })
  await rm(PROFILE_DIR, { recursive: true, force: true })

  const child = Bun.spawn(
    [
      browser,
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      `--remote-debugging-port=${DEBUG_PORT}`,
      `--user-data-dir=${PROFILE_DIR}`,
      '--window-size=1440,900',
      BASE_URL,
    ],
    { stdout: 'ignore', stderr: 'ignore' },
  )

  // A stray headless browser holding an open debug port is not something to
  // leave behind, so every exit path goes through here.
  const shutdown = () => {
    try {
      child.kill()
    } catch {
      // Already gone; nothing to do.
    }
  }
  process.on('exit', shutdown)
  process.on('SIGINT', () => process.exit(130))

  try {
    let session: Session | null = null
    for (let attempt = 0; attempt < 20 && !session; attempt += 1) {
      await Bun.sleep(400)
      try {
        session = await connect()
      } catch {
        // The browser is still starting up.
      }
    }
    if (!session) throw new Error('Could not reach the browser on its debug port.')

    const routes = await discoverRoutes(session)
    let written = 0

    for (const breakpoint of BREAKPOINTS) {
      await session.send('Emulation.setDeviceMetricsOverride', {
        width: breakpoint.width,
        height: breakpoint.height,
        deviceScaleFactor: 1,
        mobile: breakpoint.width < 768,
      })

      for (const route of routes) {
        await session.send('Page.navigate', { url: `${BASE_URL}${route}` })
        // Long enough for fonts to resolve and the gallery transition to
        // settle. A shot taken mid-transition is worse than no shot.
        await Bun.sleep(1800)

        /*
         * The whole page, not the viewport. Half of what is worth checking
         * lives below the fold — it was a viewport-only shot that let the
         * gallery's neighbours look fine while the page scrolled sideways.
         */
        const shot = await session.send('Page.captureScreenshot', {
          format: 'png',
          captureBeyondViewport: true,
        })
        const target = join(OUT_DIR, fileNameFor(route, breakpoint.name))
        await Bun.write(target, Buffer.from(shot.result?.data ?? shot.data, 'base64'))
        written += 1
      }

      console.log(`  ✓ ${breakpoint.name} (${breakpoint.width}px) — ${routes.length} route(s)`)
    }

    session.close()
    console.log(`\n✓ ${written} screenshot(s) in .shots/ — now go and look at them.`)
  } finally {
    shutdown()
    await rm(PROFILE_DIR, { recursive: true, force: true }).catch(() => {})
  }
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
