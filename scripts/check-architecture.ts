#!/usr/bin/env bun
/**
 * Enforces the architectural invariants that ESLint cannot express.
 *
 * The important one is I3 — no project is ever named in shared code. It is the
 * invariant that erodes quietly: one `slug === 'morphwave'` looks harmless, and
 * six months later the gallery cannot be reasoned about without knowing every
 * project in it. Slugs are read from the content directory, so this check needs
 * no maintenance as the collection grows.
 *
 *   bun scripts/check-architecture.ts
 */

import { readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Glob } from 'bun'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const PROJECTS_DIR = join(ROOT, 'src', 'content', 'projects')

interface Violation {
  file: string
  line: number
  rule: string
  detail: string
  fix: string
}

const violations: Violation[] = []

function rel(path: string): string {
  return relative(ROOT, path).replaceAll('\\', '/')
}

async function filesIn(pattern: string): Promise<string[]> {
  const glob = new Glob(pattern)
  const found: string[] = []
  for await (const file of glob.scan({ cwd: ROOT, absolute: true })) {
    found.push(file)
  }
  return found.sort()
}

/**
 * Strips line comments, block comments and import statements before scanning
 * for slugs — a slug mentioned in a comment or imported by the one permitted
 * adapter is not a violation, and false positives would train people to ignore
 * this check.
 */
function strippedLines(source: string): string[] {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (match) => match.replace(/[^\n]/g, ' '))
    .split('\n')
    .map((line) => {
      const withoutLineComment = line.replace(/\/\/.*$/, '')
      return /^\s*import\s|^\s*}\s*from\s|^\s*export\s+\*\s+from\s/.test(withoutLineComment)
        ? ''
        : withoutLineComment
    })
}

async function knownSlugs(): Promise<string[]> {
  if (!existsSync(PROJECTS_DIR)) return []
  const entries = await readdir(PROJECTS_DIR, { withFileTypes: true })
  return entries
    .filter((entry) => entry.isDirectory() && existsSync(join(PROJECTS_DIR, entry.name, 'project.ts')))
    .map((entry) => entry.name)
}

/** I3 — no project named in shared UI. */
async function checkNoProjectNamesInSharedCode(slugs: string[]) {
  if (slugs.length === 0) return

  const files = [
    ...(await filesIn('src/features/**/*.{ts,tsx}')),
    ...(await filesIn('src/components/**/*.{ts,tsx}')),
    ...(await filesIn('src/app/**/*.{ts,tsx}')),
  ].filter(
    // The component-preview registry maps componentIds to lazy imports, so it
    // necessarily names projects. That mapping has to live somewhere, and a
    // single declared registry is exactly the sanctioned place — which is what
    // keeps every other file in shared UI free of project names.
    (file) => !rel(file).includes('src/features/project-preview/registry/'),
  )

  for (const file of files) {
    const lines = strippedLines(await Bun.file(file).text())

    lines.forEach((line, index) => {
      for (const slug of slugs) {
        // Match the slug only as a quoted string literal. A substring inside a
        // longer identifier is not a reference to the project.
        const quoted = new RegExp(`['"\`]${slug}['"\`]`)
        if (quoted.test(line)) {
          violations.push({
            file: rel(file),
            line: index + 1,
            rule: 'I3 — no project named in shared code',
            detail: `references the project "${slug}"`,
            fix: 'Add a field to the project contract, or handle it through a preview adapter. Shared UI must not know any project by name.',
          })
        }
      }
    })
  }
}

/** I5 — the domain layer is pure. ESLint covers this too; belt and braces. */
async function checkDomainPurity() {
  const files = await filesIn('src/domain/**/*.ts')
  const forbidden = /from\s+['"](react|react-dom|next|motion)(\/[^'"]*)?['"]/

  for (const file of files) {
    const source = await Bun.file(file).text()

    source.split('\n').forEach((line, index) => {
      const match = forbidden.exec(line)
      if (match) {
        violations.push({
          file: rel(file),
          line: index + 1,
          rule: 'I5 — the domain layer is pure',
          detail: `imports "${match[1]}"`,
          fix: 'Move the rendering concern into src/features/. The domain must serve every consumer, not one.',
        })
      }
    })
  }
}

/** Content may only be reached through the repository's source adapter. */
async function checkContentIsolation() {
  const files = [
    ...(await filesIn('src/features/**/*.{ts,tsx}')),
    ...(await filesIn('src/components/**/*.{ts,tsx}')),
    ...(await filesIn('src/domain/**/*.ts')),
  ].filter((file) => !rel(file).includes('src/domain/project/repository/sources/'))

  const contentImport = /from\s+['"]@\/content\/[^'"]*['"]/

  for (const file of files) {
    const source = await Bun.file(file).text()

    source.split('\n').forEach((line, index) => {
      if (contentImport.test(line)) {
        violations.push({
          file: rel(file),
          line: index + 1,
          rule: 'Content isolation',
          detail: 'imports project content directly',
          fix: 'Go through ProjectRepository. Only src/domain/project/repository/sources/** may bind to the content directory.',
        })
      }
    })
  }
}

/**
 * Tailwind v4: `tracking-[--token]` emits `letter-spacing: --token`, which is
 * invalid CSS that browsers drop silently. Nothing errors — the style simply
 * does not apply. Only `tracking-(--token)` expands to `var(--token)`.
 *
 * Cheap to check, genuinely hard to notice by eye, so it is checked.
 */
async function checkTokenSyntax() {
  const files = [
    ...(await filesIn('src/**/*.{ts,tsx}')),
  ]

  const bracketVar = /[a-z-]+-\[--[a-z-]+\]/

  for (const file of files) {
    const source = await Bun.file(file).text()

    source.split('\n').forEach((line, index) => {
      const match = bracketVar.exec(line)
      if (match) {
        violations.push({
          file: rel(file),
          line: index + 1,
          rule: 'Design token syntax',
          detail: `"${match[0]}" emits invalid CSS and is silently dropped`,
          fix: `Use the parenthesis form: ${match[0].replace('[', '(').replace(']', ')')}`,
        })
      }
    })
  }
}

async function main() {
  const slugs = await knownSlugs()

  await checkNoProjectNamesInSharedCode(slugs)
  await checkDomainPurity()
  await checkContentIsolation()
  await checkTokenSyntax()

  if (violations.length > 0) {
    console.error(`\n✗ ${violations.length} architectural violation(s)\n`)

    for (const violation of violations) {
      console.error(`  ${violation.file}:${violation.line}`)
      console.error(`    ${violation.rule}`)
      console.error(`    ${violation.detail}`)
      console.error(`    → ${violation.fix}\n`)
    }

    console.error('See AGENTS.md §2 and docs/rules/01-architecture.md.\n')
    process.exit(1)
  }

  console.log(
    `✓ Architecture clean — ${slugs.length} project(s), no shared code references any of them by name`,
  )
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
