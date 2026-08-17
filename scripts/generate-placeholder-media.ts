#!/usr/bin/env bun
/**
 * Generates on-brand placeholder media for any asset a manifest declares but
 * does not yet have on disk.
 *
 * Real posters replace these by dropping files in — no code changes, which is
 * itself a test of the media boundary.
 *
 * The compositions are deliberately varied rather than one template recoloured.
 * The product premise is that projects look nothing like each other and the
 * frame is what makes them cohere (CONCEPT §22); six identical placeholders
 * would quietly hide whether that actually works.
 *
 * Everything is derived from a hash of the slug, so output is deterministic —
 * regenerating never produces a spurious diff.
 *
 *   bun run media:placeholders
 */

import { existsSync } from 'node:fs'
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import sharp from 'sharp'
import { parseProject } from '../src/domain/project/parse'
import { sortProjects } from '../src/domain/project/selectors'
import type { Project } from '../src/domain/project/types'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const PROJECTS_DIR = join(ROOT, 'src', 'content', 'projects')
const TMP_DIR = join(ROOT, '.next', 'placeholder-frames')

const OBSIDIAN = '#0A0A0A'
const BONE = '#F0EFEA'

const POSTER = { width: 1600, height: 1200 }
const THUMBNAIL = { width: 800, height: 600 }
const VIDEO = { width: 1280, height: 960, frames: 60, fps: 20 }

// ── deterministic randomness ──────────────────────────────────────────────

function hashOf(text: string): number {
  let hash = 2166136261
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

/** mulberry32 — small, fast, and stable across platforms. */
function makeRandom(seed: number): () => number {
  let state = seed >>> 0

  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ── compositions ──────────────────────────────────────────────────────────

type Composition = (context: {
  width: number
  height: number
  random: () => number
  /** 0–1, loops seamlessly. Static images use 0. */
  phase: number
}) => string

/** Overlapping wavefronts — dense, organic, centre-weighted. */
const interference: Composition = ({ width, height, random, phase }) => {
  const parts: string[] = []
  const centres = [
    { x: width * (0.32 + random() * 0.08), y: height * (0.4 + random() * 0.14) },
    { x: width * (0.64 + random() * 0.1), y: height * (0.54 + random() * 0.12) },
  ]

  for (const centre of centres) {
    for (let ring = 0; ring < 44; ring += 1) {
      const drift = Math.sin(phase * Math.PI * 2 + ring * 0.22) * 16
      const radius = 24 + ring * 24 + drift
      const opacity = Math.max(0.08, 0.62 - ring * 0.011).toFixed(3)

      parts.push(
        `<circle cx="${centre.x.toFixed(1)}" cy="${centre.y.toFixed(1)}" r="${radius.toFixed(1)}" fill="none" stroke="${BONE}" stroke-width="1.4" opacity="${opacity}"/>`,
      )
    }
  }

  return parts.join('')
}

/** Raking hairlines — flat, graphic, edge to edge. */
const lineField: Composition = ({ width, height, random, phase }) => {
  const parts: string[] = []
  const angle = -26 + random() * 16
  // Few and separated rather than many and dense: at thumbnail size a tight
  // field aliases into an even grey and stops reading as lines at all.
  const count = 42
  const span = height * 2.2

  for (let i = 0; i < count; i += 1) {
    const t = i / count
    const wobble = Math.sin(t * Math.PI * 3 + phase * Math.PI * 2) * 0.5 + 0.5
    const opacity = (0.14 + wobble * 0.7).toFixed(3)
    const y = -height * 0.6 + t * span

    parts.push(
      `<line x1="${-width * 0.3}" y1="${y.toFixed(1)}" x2="${(width * 1.3).toFixed(1)}" y2="${y.toFixed(1)}" stroke="${BONE}" stroke-width="${(1.4 + wobble * 2.2).toFixed(2)}" opacity="${opacity}"/>`,
    )
  }

  return `<g transform="rotate(${angle.toFixed(2)} ${width / 2} ${height / 2})">${parts.join('')}</g>`
}

/** Points settling towards a horizon — sparse, atmospheric, asymmetric. */
const drift: Composition = ({ width, height, random, phase }) => {
  const parts: string[] = []

  for (let i = 0; i < 560; i += 1) {
    const t = random()
    const x = random() * width
    const baseY = height * (0.12 + t * 0.8)
    const y = baseY + Math.sin(phase * Math.PI * 2 + t * 8) * 12
    const radius = (0.8 + (1 - t) * 3.4).toFixed(2)
    const opacity = (0.12 + (1 - t) * 0.75).toFixed(3)

    parts.push(
      `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${radius}" fill="${BONE}" opacity="${opacity}"/>`,
    )
  }

  return parts.join('')
}

/** Concentric arcs, each interrupted — the logo's own device, enlarged. */
const arcs: Composition = ({ width, height, random, phase }) => {
  const parts: string[] = []
  const cx = width * 0.5
  const cy = height * 0.5
  const seed = random()

  for (let ring = 0; ring < 18; ring += 1) {
    const radius = 54 + ring * 32
    const gap = 0.14 + (ring % 4) * 0.07
    const rotation = (seed * 360 + ring * 27 + phase * 40) % 360
    const sweep = (1 - gap) * Math.PI * 2

    const x1 = cx + radius * Math.cos(0)
    const y1 = cy + radius * Math.sin(0)
    const x2 = cx + radius * Math.cos(sweep)
    const y2 = cy + radius * Math.sin(sweep)
    const largeArc = sweep > Math.PI ? 1 : 0
    const opacity = Math.max(0.12, 0.78 - ring * 0.03).toFixed(3)

    parts.push(
      `<path d="M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${radius} ${radius} 0 ${largeArc} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}" fill="none" stroke="${BONE}" stroke-width="1.6" opacity="${opacity}" transform="rotate(${rotation.toFixed(2)} ${cx} ${cy})"/>`,
    )
  }

  return parts.join('')
}

/** A warped mesh — structural, technical, filling the frame. */
const lattice: Composition = ({ width, height, random, phase }) => {
  const parts: string[] = []
  const columns = 26
  const rows = 18
  const amplitude = 14 + random() * 12

  const pointAt = (column: number, row: number) => {
    const x = (column / columns) * width
    const baseY = (row / rows) * height
    const y =
      baseY +
      Math.sin(column * 0.4 + phase * Math.PI * 2 + row * 0.28) * amplitude +
      Math.sin(column * 0.11 - phase * Math.PI * 2) * amplitude * 0.6
    return { x, y }
  }

  for (let row = 0; row <= rows; row += 1) {
    const points: string[] = []
    for (let column = 0; column <= columns; column += 1) {
      const { x, y } = pointAt(column, row)
      points.push(`${x.toFixed(1)},${y.toFixed(1)}`)
    }
    const opacity = (0.14 + (row / rows) * 0.5).toFixed(3)
    parts.push(
      `<polyline points="${points.join(' ')}" fill="none" stroke="${BONE}" stroke-width="1.2" opacity="${opacity}"/>`,
    )
  }

  return parts.join('')
}

/** Horizontal strata — architectural, minimal, the quietest of the set. */
const strata: Composition = ({ width, height, random, phase }) => {
  const parts: string[] = []
  const bands = 9

  for (let band = 0; band < bands; band += 1) {
    const t = band / bands
    const y = height * (0.08 + t * 0.84)
    const drift = Math.sin(phase * Math.PI * 2 + band * 0.7) * 8
    const thickness = 1 + Math.round(random() * 5)
    const inset = width * (0.04 + random() * 0.22)
    const opacity = (0.16 + random() * 0.55).toFixed(3)

    parts.push(
      `<rect x="${inset.toFixed(1)}" y="${(y + drift).toFixed(1)}" width="${(width - inset * 2).toFixed(1)}" height="${thickness}" fill="${BONE}" opacity="${opacity}"/>`,
    )
  }

  return parts.join('')
}

/**
 * Six families, deliberately unalike: dense/sparse, organic/geometric,
 * centred/edge-weighted. The product premise is that projects look nothing
 * like each other and the frame is what makes them cohere — six variations on
 * one template would quietly hide whether that actually works.
 */
const COMPOSITIONS: Composition[] = [interference, lineField, drift, arcs, lattice, strata]

// ── frame assembly ────────────────────────────────────────────────────────

function renderSvg(options: {
  slug: string
  number: string
  width: number
  height: number
  phase: number
  /**
   * Which composition to draw.
   *
   * Chosen by the project's position rather than by a hash of its slug: hashing
   * gave three of six the same family, and even spread matters more here than
   * per-slug stability, since every one of these is meant to be replaced by a
   * real poster anyway.
   */
  family: number
}): string {
  const { slug, number, width, height, phase, family } = options

  const seed = hashOf(slug)
  const composition = COMPOSITIONS[family % COMPOSITIONS.length]!
  // Re-seeded per call so a video's frames stay coherent with its poster.
  const body = composition({ width, height, random: makeRandom(seed), phase })

  const inset = Math.round(width * 0.035)
  const gap = Math.round(width * 0.06)
  const numberSize = Math.round(height * 0.055)

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="${OBSIDIAN}"/>
  ${body}
  <radialGradient id="vignette" cx="50%" cy="50%" r="80%">
    <stop offset="62%" stop-color="${OBSIDIAN}" stop-opacity="0"/>
    <stop offset="100%" stop-color="${OBSIDIAN}" stop-opacity="0.62"/>
  </radialGradient>
  <rect width="${width}" height="${height}" fill="url(#vignette)"/>
  <g stroke="${BONE}" stroke-width="1" opacity="0.18">
    <line x1="${inset + gap}" y1="${inset}" x2="${width - inset - gap}" y2="${inset}"/>
    <line x1="${inset + gap}" y1="${height - inset}" x2="${width - inset - gap}" y2="${height - inset}"/>
    <line x1="${inset}" y1="${inset + gap}" x2="${inset}" y2="${height - inset - gap}"/>
    <line x1="${width - inset}" y1="${inset + gap}" x2="${width - inset}" y2="${height - inset - gap}"/>
  </g>
  <text x="${inset + gap}" y="${inset + gap + numberSize * 0.4}" fill="${BONE}" opacity="0.32"
        font-family="ui-monospace, monospace" font-size="${numberSize}" letter-spacing="${numberSize * 0.14}">${number}</text>
</svg>`
}

async function writeImage(svg: string, target: string) {
  await mkdir(dirname(target), { recursive: true })
  await sharp(Buffer.from(svg)).webp({ quality: 88 }).toFile(target)
}

async function writeVideo(slug: string, number: string, family: number, target: string) {
  await rm(TMP_DIR, { recursive: true, force: true })
  await mkdir(TMP_DIR, { recursive: true })

  for (let frame = 0; frame < VIDEO.frames; frame += 1) {
    const svg = renderSvg({
      slug,
      number,
      family,
      width: VIDEO.width,
      height: VIDEO.height,
      // Ends exactly where it began, so the loop has no visible seam.
      phase: frame / VIDEO.frames,
    })

    const padded = String(frame).padStart(4, '0')
    await sharp(Buffer.from(svg)).png().toFile(join(TMP_DIR, `${padded}.png`))
  }

  await mkdir(dirname(target), { recursive: true })

  const result = Bun.spawnSync([
    'ffmpeg',
    '-y',
    '-framerate', String(VIDEO.fps),
    '-i', join(TMP_DIR, '%04d.png'),
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-crf', '26',
    // Required for the video to start playing before it is fully downloaded.
    '-movflags', '+faststart',
    '-an',
    target,
  ])

  await rm(TMP_DIR, { recursive: true, force: true })

  if (result.exitCode !== 0) {
    throw new Error(`ffmpeg failed for ${slug}:\n${result.stderr.toString()}`)
  }
}

// ── main ──────────────────────────────────────────────────────────────────

/** Everything the manifest promises, so the generator satisfies validation. */
function declaredAssets(project: Project): { file: string; kind: 'image' | 'video' }[] {
  const assets: { file: string; kind: 'image' | 'video' }[] = [
    { file: project.media.poster, kind: 'image' },
  ]

  if (project.media.thumbnail) assets.push({ file: project.media.thumbnail, kind: 'image' })
  for (const shot of project.media.screenshots) assets.push({ file: shot, kind: 'image' })

  if (project.preview.kind === 'video') {
    assets.push({ file: project.preview.src, kind: 'video' })
    if (project.preview.poster) assets.push({ file: project.preview.poster, kind: 'image' })
  }

  if (project.preview.kind === 'static' && project.preview.src) {
    assets.push({ file: project.preview.src, kind: 'image' })
  }

  return assets
}

async function main() {
  if (!existsSync(PROJECTS_DIR)) {
    console.log('✓ No content directory yet — nothing to generate.')
    return
  }

  const dirs = (await readdir(PROJECTS_DIR, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && existsSync(join(PROJECTS_DIR, entry.name, 'project.ts')))
    .map((entry) => entry.name)
    .sort()

  const loaded: { dir: string; project: Project }[] = []

  for (const dir of dirs) {
    const manifestPath = join(PROJECTS_DIR, dir, 'project.ts')
    const manifestModule = (await import(pathToFileURL(manifestPath).href)) as { project?: unknown }
    loaded.push({ dir, project: parseProject(manifestModule.project, { source: manifestPath }) })
  }

  /*
   * Sorted with the domain's own comparator, not by directory name. The number
   * burned into a poster has to be the number the gallery will show beside it,
   * and gallery order comes from `order`, not from the alphabet.
   */
  const ordered = sortProjects(loaded.map((entry) => entry.project)).map((project) => {
    const entry = loaded.find((candidate) => candidate.project.slug === project.slug)!
    return entry
  })

  let created = 0

  for (const [position, { dir, project }] of ordered.entries()) {
    const number = String(position + 1).padStart(3, '0')

    for (const asset of declaredAssets(project)) {
      const target = join(PROJECTS_DIR, dir, asset.file)

      // Never overwrite: a real poster that has landed must survive a run.
      if (existsSync(target)) continue

      if (asset.kind === 'video') {
        await writeVideo(project.slug, number, position, target)
      } else {
        const isThumb = asset.file.includes('thumb')
        const size = isThumb ? THUMBNAIL : POSTER
        // Screenshots vary by filename so a set does not repeat itself, while
        // staying in the same family as the project's poster.
        const variantSeed = `${project.slug}:${asset.file}`

        await writeImage(
          renderSvg({
            slug: variantSeed,
            number,
            family: position,
            width: size.width,
            height: size.height,
            phase: 0,
          }),
          target,
        )
      }

      created += 1
      console.log(`  + ${dir}/${asset.file}`)
    }
  }

  if (created === 0) {
    console.log(`✓ All declared media already present (${dirs.length} project(s))`)
  } else {
    console.log(`✓ Generated ${created} placeholder asset(s) across ${dirs.length} project(s)`)
  }
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
