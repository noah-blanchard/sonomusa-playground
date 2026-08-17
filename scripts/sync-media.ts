#!/usr/bin/env bun
/**
 * Copies project media from the content directory into public/.
 *
 * Projects stay self-contained — manifest and media live together under
 * src/content/projects/<slug>/ (CONCEPT §12) — but Next can only serve static
 * files from public/. This bridges the two without splitting a project across
 * two directories or making manifests import their own images.
 *
 * public/projects/ is generated and gitignored. src/domain/project/media.ts is
 * the only module that knows about the resulting URL shape.
 */

import { cp, mkdir, readdir, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const PROJECTS_DIR = join(ROOT, 'src', 'content', 'projects')
const PUBLIC_DIR = join(ROOT, 'public', 'projects')

/** Everything except the code and docs that live beside the media. */
const NOT_MEDIA = new Set(['project.ts', 'preview.tsx', 'AGENTS.md', 'README.md'])

async function main() {
  if (!existsSync(PROJECTS_DIR)) {
    console.log('✓ No content directory yet — nothing to sync.')
    return
  }

  const dirs = (await readdir(PROJECTS_DIR, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && existsSync(join(PROJECTS_DIR, entry.name, 'project.ts')))
    .map((entry) => entry.name)
    .sort()

  // Cleared each run so deleting a project's media actually removes it from
  // the served output, rather than leaving an orphan that still resolves.
  await rm(PUBLIC_DIR, { recursive: true, force: true })

  if (dirs.length === 0) {
    console.log('✓ No projects yet — nothing to sync.')
    return
  }

  let copied = 0

  for (const dir of dirs) {
    const from = join(PROJECTS_DIR, dir)
    const to = join(PUBLIC_DIR, dir)

    const entries = await readdir(from, { withFileTypes: true })
    const media = entries.filter((entry) => !NOT_MEDIA.has(entry.name))

    if (media.length === 0) continue

    await mkdir(to, { recursive: true })

    for (const entry of media) {
      await cp(join(from, entry.name), join(to, entry.name), { recursive: true })
      copied += 1
    }
  }

  console.log(
    `✓ Synced media for ${dirs.length} project(s) → ${relative(ROOT, PUBLIC_DIR).replaceAll('\\', '/')} (${copied} item(s))`,
  )
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
