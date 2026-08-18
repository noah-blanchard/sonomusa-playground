#!/usr/bin/env bun
/**
 * Validates every project manifest, and the assets each one promises.
 *
 * CONCEPT §3.4 and §36: static types are not sufficient and a malformed project
 * must never reach a deployment. This is the gate.
 *
 * It deliberately scans the content directory rather than reading the generated
 * registry — the manifests are the source of truth, and a validator that trusts
 * generated output cannot catch a stale generator.
 *
 * Every problem in the run is reported, not just the first. An author who added
 * three projects should learn about all three.
 */

import { readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, relative } from 'node:path'
import { pathToFileURL, fileURLToPath } from 'node:url'
import { parseProject } from '../src/domain/project/parse'
import type { Project } from '../src/domain/project/types'
import { registeredExperienceIds } from '../src/features/project-experience/registry/experiences'
import { registeredComponentIds } from '../src/features/project-preview/registry/componentPreviews'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const PROJECTS_DIR = join(ROOT, 'src', 'content', 'projects')

interface Problem {
  source: string
  message: string
}

const problems: Problem[] = []

function report(source: string, message: string) {
  problems.push({ source, message })
}

async function projectDirs(): Promise<string[]> {
  if (!existsSync(PROJECTS_DIR)) return []

  const entries = await readdir(PROJECTS_DIR, { withFileTypes: true })

  return entries
    .filter((entry) => entry.isDirectory() && existsSync(join(PROJECTS_DIR, entry.name, 'project.ts')))
    .map((entry) => entry.name)
    .sort()
}

/**
 * Every asset a manifest references must exist. A missing poster is the worst
 * possible failure here — it is the fallback everything else degrades to.
 */
function collectDeclaredAssets(project: Project): string[] {
  const assets = [project.media.poster]

  if (project.media.thumbnail) assets.push(project.media.thumbnail)
  assets.push(...project.media.screenshots)

  if (project.preview.kind === 'video') {
    assets.push(project.preview.src)
    if (project.preview.poster) assets.push(project.preview.poster)
  }

  if (project.preview.kind === 'static' && project.preview.src) {
    assets.push(project.preview.src)
  }

  return assets
}

async function main() {
  const dirs = await projectDirs()

  if (dirs.length === 0) {
    console.log('✓ No projects yet — nothing to validate.')
    console.log('  Add one under src/content/projects/ — see docs/rules/02-content.md')
    return
  }

  const validated: { dir: string; project: Project }[] = []

  for (const dir of dirs) {
    const manifestPath = join(PROJECTS_DIR, dir, 'project.ts')
    const source = relative(ROOT, manifestPath).replaceAll('\\', '/')

    let exported: unknown

    try {
      // defineProject validates on evaluation, so an invalid manifest throws
      // right here — which is exactly the intended authoring experience.
      const manifestModule = (await import(pathToFileURL(manifestPath).href)) as { project?: unknown }
      exported = manifestModule.project
    } catch (error) {
      report(source, error instanceof Error ? error.message : String(error))
      continue
    }

    if (exported === undefined) {
      report(source, 'No `project` export found. A manifest must `export const project = defineProject({ … })`.')
      continue
    }

    let project: Project

    try {
      // Re-parse rather than trusting the export: a manifest that skipped
      // defineProject would otherwise slip through unvalidated.
      project = parseProject(exported, { source })
    } catch (error) {
      report(source, error instanceof Error ? error.message : String(error))
      continue
    }

    // The slug is both the route and the directory name. If they disagree,
    // asset resolution and routing silently point at different places.
    if (project.slug !== dir) {
      report(
        source,
        `slug "${project.slug}" does not match its directory "${dir}". They must be identical.`,
      )
    }

    for (const asset of collectDeclaredAssets(project)) {
      if (!existsSync(join(PROJECTS_DIR, dir, asset))) {
        report(source, `declares "${asset}" but no such file exists in the project directory.`)
      }
    }

    // A componentId that resolves to nothing degrades to the poster at runtime,
    // which means it would ship silently. Catch it here instead.
    if (project.preview.kind === 'component') {
      const registered = registeredComponentIds()

      if (!registered.includes(project.preview.componentId)) {
        report(
          source,
          `preview.componentId "${project.preview.componentId}" is not registered.\n` +
            `Add it to src/features/project-preview/registry/componentPreviews.ts.` +
            (registered.length > 0 ? `\nRegistered: ${registered.join(', ')}` : '\nNothing is registered yet.'),
        )
      }
    }

    // Same reasoning for the stage: an unregistered id would route the visitor
    // to a full-screen poster with no work on it, and nothing would say why.
    if (project.experience) {
      const registered = registeredExperienceIds()

      if (!registered.includes(project.experience.componentId)) {
        report(
          source,
          `experience.componentId "${project.experience.componentId}" is not registered.\n` +
            `Add it to src/features/project-experience/registry/experiences.ts.` +
            (registered.length > 0 ? `\nRegistered: ${registered.join(', ')}` : '\nNothing is registered yet.'),
        )
      }
    }

    validated.push({ dir, project })
  }

  // ── Cross-project invariants ───────────────────────────────────────────
  const bySlug = new Map<string, string[]>()
  const byOrder = new Map<number, string[]>()

  for (const { dir, project } of validated) {
    bySlug.set(project.slug, [...(bySlug.get(project.slug) ?? []), dir])

    if (project.order !== undefined) {
      byOrder.set(project.order, [...(byOrder.get(project.order) ?? []), dir])
    }
  }

  for (const [slug, dirs_] of bySlug) {
    if (dirs_.length > 1) {
      report('content', `duplicate slug "${slug}" in: ${dirs_.join(', ')}. Slugs are routes and must be unique.`)
    }
  }

  for (const [order, dirs_] of byOrder) {
    if (dirs_.length > 1) {
      report(
        'content',
        `duplicate order ${order} in: ${dirs_.join(', ')}. Gallery sequence would be non-deterministic.`,
      )
    }
  }

  // ── Result ─────────────────────────────────────────────────────────────
  if (problems.length > 0) {
    console.error(`\n✗ ${problems.length} content problem(s)\n`)

    for (const problem of problems) {
      console.error(`  ${problem.source}`)
      console.error(`    ${problem.message.split('\n').join('\n    ')}\n`)
    }

    console.error('See docs/rules/02-content.md\n')
    process.exit(1)
  }

  const withLive = validated.filter(({ project }) => project.links.live).length
  const withStage = validated.filter(({ project }) => project.experience).length
  const wayIn = validated.filter(({ project }) => project.links.live || project.experience).length

  console.log(`✓ ${validated.length} project(s) valid`)
  console.log(`  ${withStage} hosted on a stage here, ${withLive} with a live URL of their own`)
  console.log(`  ${validated.length - wayIn} with nothing to try yet (status carries the meaning)`)
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
