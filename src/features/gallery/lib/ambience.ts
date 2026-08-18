/**
 * Where the ambient field's particles start, and nothing about how they move.
 *
 * The motion itself lives in a vertex shader, because a per-frame JavaScript
 * loop over a few thousand particles is exactly the kind of cost the gallery
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

/**
 * The field's shape: a wide, shallow ellipse centred on the active frame.
 *
 * `docs/rules/03-design-system.md` asks for "a stretched field, not a halo" —
 * motes spread wide around the card, densest against it, thinning toward the
 * edges. Two shapes describe that, and they are not the same shape:
 *
 *   `core` is the **card's own half-extents**. Density is measured from its
 *   rectangle, because the card is a rectangle and it is the only occluder.
 *
 *   `core + reach` is the **ellipse** the field fills. Its curve is what tapers
 *   the far left and right ends to nothing, so a wide field reads as a field
 *   rather than as a band that stops.
 */
export interface FieldEllipse {
  cx: number
  cy: number
  /** Half-extents of the card, which the field crowds against. */
  coreX: number
  coreY: number
  /** How far past the card the field reaches, per axis. Wide, shallow. */
  reachX: number
  reachY: number
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
  /**
   * 0 against the card, 1 at the field's outer envelope. The organising value:
   * brightness, looseness and — in the shader — how far the pointer may push
   * this mote all derive from it.
   */
  reach: number
}

/**
 * How far past the core the field reaches, as a fraction of viewport size.
 *
 * These two numbers are the whole shape. Normalized units are already
 * anisotropic — at 1440×626 the stage's x maps to 1440px and y to 626px — so
 * equal reach would be 2.3× wider on screen before these constants stretch it
 * further.
 *
 * `REACH_X` puts the outer envelope at x ≈ -0.10 … 1.10. The tail is thin by
 * the time it enters the stage's mask (`gallery.css`, transparent outside
 * 7%–93%), so the gradient dissolves the field's ends rather than clipping
 * them. Anything past x = 1 is simply off-canvas.
 *
 * `REACH_Y` is a little under `--gallery-bleed`, because that is all the
 * clearance there is above and below the card and — unlike the sides — there is
 * no mask to soften an overshoot. Sized so the envelope lands just inside the
 * stage: the field's top and bottom are ended by their own falloff rather than
 * by a clip.
 */
const REACH_X = 0.28
const REACH_Y = 0.075

/**
 * Crowds motes toward the card: a mote at reach `r` survives with probability
 * `(1 - r)^FALLOFF`, so density is highest against the frame and thins outward.
 * Gentler than a tight band would want — the field is meant to be diffuse, with
 * a long populated tail rather than a wall that ends.
 */
const FALLOFF = 2.2

/**
 * How often a mote landing on the card is kept. Low because the card's face is
 * by far the largest area here and every mote on it is hidden: the few that
 * survive are the ones seen slipping out from under its edges.
 */
const INNER_SHARE = 0.06

/**
 * The field's shape, derived from the card's constant position.
 *
 * `FRAME_INSET` is imported rather than restated — it is already duplicated
 * between `depth.ts` and `gallery.css` under a "change both or neither"
 * warning, and a third copy would be the one that gets missed.
 *
 * `bleed` is the vertical clearance as a fraction of viewport height. The
 * caller derives it from `--gallery-bleed` against the measured height, since
 * a rem is not knowable from here.
 */
export function fieldEllipse(bleed: number): FieldEllipse {
  return {
    cx: 0.5,
    cy: 0.5,
    coreX: 0.5 - FRAME_INSET,
    coreY: 0.5 - bleed,
    reachX: REACH_X,
    reachY: REACH_Y,
  }
}

/**
 * How far a point sits from the card, as a fraction of the field's reach.
 *
 * 0 anywhere on or inside the card, 1 at the field's outer edge. The two axes
 * are normalized by their own reach, which is what makes the same falloff
 * produce a long horizontal spread and a shallow vertical one.
 *
 * Distance is measured to the card's **rectangle**, not to an ellipse. That
 * matters: the card is a rectangle and it is the only occluder, so measuring to
 * anything else puts the field's brightest ring somewhere the card is not.
 */
export function reachFromCard(ellipse: FieldEllipse, x: number, y: number): number {
  const gapX = Math.max(0, Math.abs(x - ellipse.cx) - ellipse.coreX) / ellipse.reachX
  const gapY = Math.max(0, Math.abs(y - ellipse.cy) - ellipse.coreY) / ellipse.reachY

  return Math.min(1, Math.hypot(gapX, gapY))
}

/**
 * Particles filling a wide, shallow ellipse around the frame.
 *
 * A **filled** cloud, not a ring. A ring was the first attempt and it does not
 * work here: a curve drawn through the midpoint of the card's top edge dips
 * behind the card the moment it moves sideways, so everything but a clump above
 * and below the card is hidden. Motes have to occupy the area between the card
 * and the field's edge for the field to read as wide at all.
 *
 * Two shapes do the work, and they are deliberately different shapes:
 *
 *   The **ellipse** is the silhouette. Points are drawn uniformly inside it, so
 *   the field tapers to nothing at the far left and right — that taper is what
 *   makes a wide field read as a field rather than as a band with two ends.
 *
 *   The **card's rectangle** is what density is measured from. Motes crowd
 *   against it and thin outward, so the glow belongs to the work rather than
 *   floating around it.
 *
 * Motes landing on the card itself are kept at a low rate. They are hidden
 * behind it — it is opaque and sits above this layer — and they are what makes
 * particles appear to pass *behind* the work rather than orbit in front of it.
 * There is no keep-out geometry and no mask here; the card is the mask.
 *
 * `random` is injected so a caller can seed it and get a stable field; the
 * tests and the component both rely on that.
 */
export function spawnParticles(
  count: number,
  ellipse: FieldEllipse,
  random: () => number,
): FieldParticle[] {
  const envelopeX = ellipse.coreX + ellipse.reachX
  const envelopeY = ellipse.coreY + ellipse.reachY
  const particles: FieldParticle[] = []

  /*
   * Rejection sampling: propose a point in the ellipse's bounding box, keep it
   * with the probability the density asks for. Roughly eight tries per mote,
   * once, at spawn — the loop the CPU must not run is the per-frame one, and
   * this is not it. The guard bounds it against a degenerate ellipse.
   */
  let attempts = 0
  const ceiling = count * 64

  while (particles.length < count && attempts < ceiling) {
    attempts += 1

    const x = ellipse.cx + (random() * 2 - 1) * envelopeX
    const y = ellipse.cy + (random() * 2 - 1) * envelopeY

    const ex = (x - ellipse.cx) / envelopeX
    const ey = (y - ellipse.cy) / envelopeY
    if (ex * ex + ey * ey > 1) continue

    const reach = reachFromCard(ellipse, x, y)
    const behind = reach === 0

    if (random() >= (behind ? INNER_SHARE : Math.pow(1 - reach, FALLOFF))) continue

    particles.push({
      x,
      y,
      phase: random() * Math.PI * 2,
      speed: 0.4 + random() * 0.9,
      // Wander scales with distance from the card: the ones furthest out are
      // the loosest, which keeps the edge of the field soft rather than a wall.
      // No axis term — the shader's wander is isotropic in normalized units,
      // which is already wider on screen, and that is what reads as floating
      // sideways.
      amplitude: (0.005 + random() * 0.013) * (1 + reach * 2.5),
      // Bright: additive blending and the glow falloff spread each mote's
      // energy over several pixels, so the base alpha is high to keep the core
      // luminous. Dimmer the further out, so the field thins into the mask
      // rather than ending on a line.
      alpha: (0.55 + random() * 0.45) * (1 - reach * 0.65),
      size: random() < 0.6 ? 1 : 2,
      reach,
    })
  }

  return particles
}

/**
 * A deterministic generator (mulberry32).
 *
 * The field is seeded rather than dealt from `Math.random`, so a resize reflows
 * the same field instead of replacing it with a different one — a rebuild is a
 * new box, not a new field.
 */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
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
