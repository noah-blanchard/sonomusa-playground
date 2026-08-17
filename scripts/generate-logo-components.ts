#!/usr/bin/env bun
/**
 * Turns the brand SVGs in src/assets/brand/ into React components.
 *
 * The sources are Inkscape exports: editor metadata, hard-coded black fills,
 * and duplicate element ids across all three lockups — inlining them as-is
 * would produce invalid HTML the moment two appeared on one page.
 *
 * This strips all of that and keeps the geometry exactly as drawn, including
 * the nested group transforms, so the marks are never re-typeset by hand
 * (docs/rules/03-design-system.md). Fill becomes currentColor so a lockup
 * inherits the surrounding text colour.
 *
 *   bun run brand:logos
 */

import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const SOURCE_DIR = join(ROOT, 'src', 'assets', 'brand')
const OUTPUT = join(ROOT, 'src', 'components', 'brand', 'marks.generated.tsx')

interface Lockup {
  file: string
  component: string
  /** Used for the accessible name when the mark is not decorative. */
  label: string
  description: string
}

const LOCKUPS: Lockup[] = [
  {
    file: 'wordmark.svg',
    component: 'SonoMusaWordmark',
    label: 'SonoMusa',
    description: 'Single-line lockup. The default — navigation, footers, anywhere horizontal.',
  },
  {
    file: 'stacked.svg',
    component: 'SonoMusaStacked',
    label: 'SonoMusa',
    description: 'Two-line lockup (SONO / MUSA). For square-ish space and large statements.',
  },
  {
    file: 'monogram.svg',
    component: 'SonoMusaMonogram',
    label: 'SonoMusa',
    description: 'SO/MU monogram. Compact contexts — favicons, avatars, tight corners.',
  },
]

function extract(svg: string, componentName: string): { viewBox: string; body: string } {
  const viewBox = /viewBox="([^"]+)"/.exec(svg)?.[1]
  if (!viewBox) throw new Error(`No viewBox in source for ${componentName}`)

  // Take the drawing layer whole, transforms included, rather than
  // reconstructing coordinates — the nested translates are load-bearing.
  const layerStart = svg.search(/<g\b[^>]*inkscape:groupmode="layer"/)
  if (layerStart === -1) throw new Error(`No drawing layer in source for ${componentName}`)

  const layerEnd = svg.lastIndexOf('</g>')
  let body = svg.slice(layerStart, layerEnd + 4)

  body = body
    // Editor metadata carries no geometry.
    .replace(/\s(?:inkscape|sodipodi):[\w-]+="[^"]*"/g, '')
    // Hard-coded #000 fills would defeat currentColor.
    .replace(/\s(?:style|fill|stroke)="[^"]*"/g, '')
    // Ids are duplicated across all three lockups; two on one page is invalid.
    .replace(/\sid="[^"]*"/g, '')
    // JSX needs camelCase attribute names.
    .replace(/\sstroke-width="/g, ' strokeWidth="')
    .replace(/\saria-label="/g, ' aria-label="')
    .replace(/\s+/g, ' ')
    .replace(/> </g, '><')
    .trim()

  return { viewBox, body }
}

async function main() {
  const parts: string[] = []

  for (const lockup of LOCKUPS) {
    const svg = await readFile(join(SOURCE_DIR, lockup.file), 'utf8')
    const { viewBox, body } = extract(svg, lockup.component)

    parts.push(`
/**
 * ${lockup.description}
 *
 * Decorative by default — pass \`title\` when the mark is the only thing
 * carrying the name, e.g. a logo that is also the home link.
 */
export function ${lockup.component}({ title, className, ...props }: MarkProps) {
  return (
    <svg
      viewBox="${viewBox}"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
      {...props}
    >
      {title ? <title>{title}</title> : null}
      ${body}
    </svg>
  )
}`)
  }

  const output = `// AUTO-GENERATED from src/assets/brand/*.svg — DO NOT EDIT.
// Run \`bun run brand:logos\`. See docs/rules/03-design-system.md.
//
// The logo is never re-typeset by hand: it is an asset with three lockups,
// and its interrupted letterforms are the identity (CONCEPT §25).

import type { SVGProps } from 'react'

export interface MarkProps extends Omit<SVGProps<SVGSVGElement>, 'title'> {
  /** Accessible name. Omit when the mark is decorative and text names it. */
  title?: string
}
${parts.join('\n')}
`

  await writeFile(OUTPUT, output, 'utf8')

  console.log(`✓ Generated ${LOCKUPS.length} lockups → src/components/brand/marks.generated.tsx`)
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
