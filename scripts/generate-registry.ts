#!/usr/bin/env bun
/**
 * Generates src/content/projects/registry.generated.ts.
 *
 * Why generate rather than discover at runtime: manifests are TypeScript, so
 * the bundler has to see them statically. Reading the directory at request
 * time and calling import() with a template literal defeats that analysis and
 * breaks tree-shaking, so instead we emit an explicit barrel.
 *
 * The output is committed: builds stay reproducible, adding a project shows up
 * in the diff, and no filesystem work happens while serving. CONCEPT §13 still
 * holds — the author never maintains the array, this does.
 *
 *   bun scripts/generate-registry.ts           write the file
 *   bun scripts/generate-registry.ts --check   fail if it is stale (CI)
 */

import { readdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const PROJECTS_DIR = join(ROOT, 'src', 'content', 'projects')
const OUTPUT_FILE = join(PROJECTS_DIR, 'registry.generated.ts')

const BANNER = `// AUTO-GENERATED — DO NOT EDIT.
// Run \`bun run registry:generate\`. See docs/rules/01-architecture.md.
`

/** A directory is a project when it contains a project.ts manifest. */
async function discoverProjectDirs(): Promise<string[]> {
  if (!existsSync(PROJECTS_DIR)) return []

  const entries = await readdir(PROJECTS_DIR, { withFileTypes: true })

  const dirs = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => existsSync(join(PROJECTS_DIR, name, 'project.ts')))

  // Sorted so the output is deterministic regardless of filesystem ordering —
  // otherwise the --check comparison would be flaky across platforms.
  return dirs.sort()
}

/**
 * Directory names become identifiers in the generated file, so they have to be
 * valid ones. Enforcing it here means slugs stay URL-safe by construction.
 */
function toIdentifier(dirName: string): string {
  return dirName.replace(/-([a-z0-9])/g, (_, char: string) => char.toUpperCase())
}

function render(dirNames: string[]): string {
  if (dirNames.length === 0) {
    return `${BANNER}
/** No projects yet. Add one under src/content/projects/ — see docs/rules/02-content.md. */
export const projectManifests: readonly unknown[] = []
`
  }

  const imports = dirNames
    .map((dir) => `import { project as ${toIdentifier(dir)} } from './${dir}/project'`)
    .join('\n')

  const members = dirNames.map((dir) => `  ${toIdentifier(dir)},`).join('\n')

  return `${BANNER}
${imports}

/**
 * Raw manifests, in directory order. The repository validates them — this file
 * only wires them up, and deliberately types them as unknown so nothing can
 * consume an unvalidated manifest by accident.
 */
export const projectManifests: readonly unknown[] = [
${members}
]
`
}

async function main() {
  const isCheck = process.argv.includes('--check')

  const dirNames = await discoverProjectDirs()

  const invalid = dirNames.filter((dir) => !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(dir))
  if (invalid.length > 0) {
    console.error(
      `✗ Project directory names must be lowercase kebab-case (they become URL slugs):\n` +
        invalid.map((dir) => `    ${dir}`).join('\n'),
    )
    process.exit(1)
  }

  const next = render(dirNames)
  const current = existsSync(OUTPUT_FILE) ? await readFile(OUTPUT_FILE, 'utf8') : null
  const relOutput = relative(ROOT, OUTPUT_FILE).replaceAll('\\', '/')

  // Normalize line endings before comparing — Windows checkouts would
  // otherwise report a stale registry on every run.
  const unchanged = current !== null && current.replaceAll('\r\n', '\n') === next.replaceAll('\r\n', '\n')

  if (isCheck) {
    if (!unchanged) {
      console.error(
        `✗ ${relOutput} is stale.\n` +
          `  Run \`bun run registry:generate\` and commit the result.`,
      )
      process.exit(1)
    }
    console.log(`✓ ${relOutput} is current (${dirNames.length} project(s))`)
    return
  }

  if (unchanged) {
    console.log(`✓ ${relOutput} already current (${dirNames.length} project(s))`)
    return
  }

  await writeFile(OUTPUT_FILE, next, 'utf8')
  console.log(`✓ Wrote ${relOutput} (${dirNames.length} project(s))`)
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
