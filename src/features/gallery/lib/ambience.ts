/**
 * Where the ambient field's particles start, and nothing about how they move.
 *
 * The motion itself lives in a vertex shader, because a per-frame JavaScript
 * loop over a few hundred particles is exactly the kind of cost the gallery
 * must not carry — `docs/rules/05-experience.md` asks that it feel identical
 * with fifty projects and with three, and the way to keep that true is for the
 * CPU to do nothing per frame at all. What the GPU cannot do is decide where a
 * particle should be born, so that decision lives here, in plain functions that
 * can be tested the way `depth.ts` is.
 *
 * Coordinates are normalized to the viewport: (0,0) top-left, (1,1)
 * bottom-right. The frame's box is expressible in the same units without
 * measuring anything, because CSS already positions it in percentages.
 */

import { FRAME_INSET } from './depth'

/** The active frame's box, in normalized viewport coordinates. */
export interface FieldBox {
  left: number
  right: number
  top: number
  bottom: number
}

export interface FieldParticle {
  /** Spawn position, normalized to the viewport. */
  x: number
  y: number
  /** Offsets this particle's wander so the field does not pulse in unison. */
  phase: number
  /** Multiplier on the shared drift rate — the field must not move as a sheet. */
  speed: number
  /** How far it wanders from where it was born, normalized. */
  amplitude: number
  /** 0–1, multiplied by the layer's own opacity in the shader. */
  alpha: number
  /** Device-independent pixels, before DPR. */
  size: number
}

/**
 * How far, as a fraction of the frame's height, a behind-the-card mote may
 * spawn from the frame's edge. Small on purpose: those are hidden behind the
 * opaque card, so a tight band is all that is ever seen slipping out from
 * under it.
 */
const BAND = 0.2

/**
 * Crowds the behind-the-card motes toward the frame's edge rather than letting
 * them scatter across its whole face, so the ones that peek out do so near the
 * border. The horizontal spread of the main field uses its own, weaker
 * exponent — see `spawnParticles`.
 */
const FALLOFF = 3.5

/**
 * The active frame's box.
 *
 * `FRAME_INSET` is imported rather than restated — it is already duplicated
 * between `depth.ts` and `gallery.css` under a "change both or neither"
 * warning, and a third copy would be the one that gets missed.
 *
 * `bleed` is the vertical clearance as a fraction of viewport height. The
 * caller derives it from `--gallery-bleed` against the measured height, since
 * a rem is not knowable from here.
 */
export function frameBox(bleed: number): FieldBox {
  return {
    left: FRAME_INSET,
    right: 1 - FRAME_INSET,
    top: bleed,
    bottom: 1 - bleed,
  }
}

/**
 * A point on the box's perimeter at `t`, with the outward normal there.
 *
 * `t` runs 0–1 clockwise from the top-left corner. Corners get the normal of
 * the edge arriving at them rather than a diagonal — the field is denser at the
 * corners as a result, which suits a motif whose corners are the part that
 * breaks.
 */
export function perimeterPoint(
  box: FieldBox,
  t: number,
): { x: number; y: number; nx: number; ny: number } {
  const width = box.right - box.left
  const height = box.bottom - box.top
  const perimeter = (width + height) * 2
  if (perimeter <= 0) return { x: box.left, y: box.top, nx: 0, ny: -1 }

  // Wrap rather than clamp, so callers can hand this a raw accumulating value.
  const distance = ((t % 1) + 1) % 1 * perimeter

  if (distance < width) {
    return { x: box.left + distance, y: box.top, nx: 0, ny: -1 }
  }

  if (distance < width + height) {
    return { x: box.right, y: box.top + (distance - width), nx: 1, ny: 0 }
  }

  if (distance < width * 2 + height) {
    return { x: box.right - (distance - width - height), y: box.bottom, nx: 0, ny: 1 }
  }

  return { x: box.left, y: box.bottom - (distance - width * 2 - height), nx: -1, ny: 0 }
}

/**
 * Particles distributed in a band hugging the frame.
 *
 * Born on the perimeter and pushed outward by a falloff, so density is highest
 * against the card and thins with distance. Some are pushed inward instead —
 * those are hidden behind the card, which is opaque and sits above this layer,
 * and they are what makes particles appear to pass *behind* the work rather
 * than orbit in front of it.
 *
 * `random` is injected so a caller can seed it and get a stable field; the
 * tests rely on that.
 */
export function spawnParticles(
  count: number,
  box: FieldBox,
  random: () => number,
): FieldParticle[] {
  const scale = Math.min(box.right - box.left, box.bottom - box.top)
  const particles: FieldParticle[] = []

  for (let index = 0; index < count; index += 1) {
    const edge = perimeterPoint(box, random())

    // random()^FALLOFF crowds toward 0, so most offsets are small.
    const reach = Math.pow(random(), FALLOFF) * BAND * scale
    // A fifth start inside the box, behind the card.
    const direction = random() < 0.2 ? -1 : 1
    const offset = reach * direction

    particles.push({
      x: edge.x + edge.nx * offset,
      y: edge.y + edge.ny * offset,
      phase: random() * Math.PI * 2,
      speed: 0.4 + random() * 0.9,
      // Wander scales with distance from the card: the ones furthest out are
      // the loosest, which keeps the edge of the field soft rather than a wall.
      amplitude: (0.006 + random() * 0.014) * (1 + reach * 2),
      // Bright: additive blending and the glow falloff spread each mote's
      // energy over several pixels, so the base alpha is high to keep the band
      // luminous. Still dimmer the further out, so the field fades rather
      // than ends.
      alpha: (0.6 + random() * 0.4) * (1 - Math.min(1, reach / (BAND * scale)) * 0.4),
      size: random() < 0.6 ? 1 : 2,
    })
  }

  return particles
}

/** Parsed to a 0–1 RGB triple for the shader. Falls back to bone. */
export function accentToRgb(accent: string | undefined): [number, number, number] {
  if (!accent || !/^#[0-9a-f]{6}$/i.test(accent)) return [0.941, 0.937, 0.918]

  return [1, 3, 5].map((at) => parseInt(accent.slice(at, at + 2), 16) / 255) as [
    number,
    number,
    number,
  ]
}
