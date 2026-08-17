/**
 * The spatial composition.
 *
 * Every frame's position, scale and opacity is derived from one number: its
 * offset from the active index. That is what makes this a depth composition
 * rather than a scroll track, and it is why no carousel library is involved —
 * a scrolling container models a different thing entirely (CONCEPT §5.4).
 *
 * Pure maths, so the whole visual model is testable without a browser.
 */

/**
 * How many frames stay mounted either side of the active one.
 *
 * Distance-2 frames are clipped out of sight by `.gallery-viewport`, which
 * makes this look like it should be 1. It must not be. A frame that is not
 * rendered mounts at its final position with no previous value to transition
 * from, so it pops into place instead of sliding in — the distance-2 frame is
 * what gives the arriving neighbour somewhere to travel from.
 */
export const VISIBLE_NEIGHBOURS = 2

/**
 * How far `.gallery-frame` is inset on each side, as a fraction of the gallery
 * column. The active frame therefore occupies the middle 64%, and the two 18%
 * margins are what neighbours peek into.
 *
 * Duplicated as `left`/`right` on `.gallery-frame` in src/styles/gallery.css.
 * CSS cannot import from TypeScript, so the two must be changed together —
 * `neighbourRightEdge` below is what tells you when they have drifted apart.
 */
export const FRAME_INSET = 0.18

/**
 * Where a left-hand neighbour's right edge lands, as a fraction of the gallery
 * column, given the frame inset and that neighbour's offset and scale.
 *
 * CSS `translate` percentages resolve against the element's own width and
 * `transform-origin` is `center`, so for a frame of width `F = 1 - 2·inset`:
 *
 *   centre     = 0.5 + (x / 100) · F
 *   half-width = (F / 2) · scale
 *   right edge = centre + half-width
 *
 * The peek is only correct when three numbers agree — the CSS inset, and `x`
 * and `scale` from `depthStyle`. Nothing else connects them, so this exists to
 * be asserted on: retune one of the three and the test says the peek broke,
 * rather than leaving it for a screenshot months later.
 *
 * Mirror it for a right-hand neighbour: its left edge is `1 - f(inset, -x, s)`.
 */
export function neighbourRightEdge(inset: number, x: number, scale: number): number {
  const width = 1 - inset * 2

  return 0.5 + (x / 100) * width + (width / 2) * scale
}

/**
 * Target *composited* alpha of a frame's separation edge, by role.
 *
 * The active frame's edge is the shell's strong hairline — it has to separate two
 * fills that differ by six sRGB levels, which no amount of dimming can widen. A
 * neighbour's sits just above the baseline hairline: enough to read as its own
 * object behind the front one, not enough to compete with it.
 */
const EDGE_TARGET_ACTIVE = 0.24
const EDGE_TARGET_NEIGHBOUR = 0.14

/**
 * The authored alpha that lands on `target` once the frame's own opacity is applied.
 *
 * `opacity` multiplies the whole subtree, pseudo elements included, so an edge
 * written at its target alpha arrives at a fraction of it — which is how the
 * neighbours' outlines ended up at 6% and dissolved into the background. Dividing
 * here is what lets the outline stay legible while the body recedes, so framing
 * carries hierarchy alongside scale, position and opacity (CONCEPT §20).
 *
 * The clamp only ever bites at distance 2, which is off-stage anyway — see the
 * `neighbourRightEdge` note below. It is a guard, not a visual decision.
 */
export function edgeAlpha(target: number, opacity: number): number {
  if (opacity <= 0) return 0

  return Math.min(1, target / opacity)
}

export interface DepthStyle {
  /** Horizontal offset as a percentage of the frame's own width. */
  x: number
  scale: number
  opacity: number
  /**
   * Alpha for the frame's separation edge, pre-divided by `opacity` above so the
   * composited result is the intended weight rather than the faded remainder.
   */
  edgeAlpha: number
  zIndex: number
  /** Neighbours are scenery — only the active frame takes pointer input. */
  interactive: boolean
  /** False when the frame is far enough out to skip rendering its media. */
  rendered: boolean
  /** Hidden from assistive tech when it is not meaningfully on screen. */
  hidden: boolean
}

/**
 * Signed distance from active to index, taking the shorter way around the loop.
 *
 * Without this, moving from the last project to the first would send every
 * frame travelling the full width of the collection instead of one step.
 */
export function signedOffset(index: number, activeIndex: number, count: number): number {
  if (count <= 0) return 0

  const raw = index - activeIndex
  const half = count / 2

  if (raw > half) return raw - count
  if (raw < -half) return raw + count

  return raw
}

/**
 * Desktop: the active frame sits centre, neighbours bleed off both edges at
 * reduced scale and opacity — the hierarchy is carried by scale, position and
 * opacity rather than by chrome.
 */
export function depthStyle(offset: number, options: { reducedMotion?: boolean } = {}): DepthStyle {
  const { reducedMotion = false } = options
  const distance = Math.abs(offset)
  const direction = Math.sign(offset)

  if (distance === 0) {
    return {
      x: 0,
      scale: 1,
      opacity: 1,
      edgeAlpha: edgeAlpha(EDGE_TARGET_ACTIVE, 1),
      zIndex: 30,
      interactive: true,
      rendered: true,
      hidden: false,
    }
  }

  /*
   * Reduced motion collapses the spatial arrangement entirely: one frame at a
   * time, cross-faded. Simplifying travel is the point (CONCEPT §34), and a
   * pile of scaled neighbours sliding past is exactly the movement being
   * opted out of.
   */
  if (reducedMotion) {
    return {
      x: 0,
      scale: 1,
      opacity: 0,
      edgeAlpha: 0,
      zIndex: 0,
      interactive: false,
      rendered: distance <= 1,
      hidden: true,
    }
  }

  if (distance > VISIBLE_NEIGHBOURS) {
    // Parked out of sight. Still positioned so that becoming a neighbour is a
    // move rather than an appearance.
    return {
      x: direction * 150,
      scale: 0.6,
      opacity: 0,
      edgeAlpha: 0,
      zIndex: 0,
      interactive: false,
      rendered: false,
      hidden: true,
    }
  }

  /*
   * Tuned against the 18% margin rather than chosen by eye. At distance 1 the
   * right edge lands at ~0.199 of the column: the neighbour fills the whole
   * margin and slips ~2% under the active frame, which sits above it at
   * zIndex 30 vs 29, so there is no seam and no gap. Distance 2 computes to
   * ~-0.018 — fully off-stage, mounted only so the next arrival has somewhere
   * to come from.
   *
   * Spacing still compresses with distance, so the stack reads as receding
   * depth rather than as evenly spaced cards.
   */
  const x = direction * (91 + (distance - 1) * 29)
  const scale = 0.88 - (distance - 1) * 0.1
  const opacity = distance === 1 ? 0.5 : 0.2

  return {
    x,
    scale,
    opacity,
    edgeAlpha: edgeAlpha(EDGE_TARGET_NEIGHBOUR, opacity),
    zIndex: 30 - distance,
    interactive: false,
    rendered: true,
    hidden: true,
  }
}

/**
 * Mobile: full-width frames, one at a time. Same reducer, same offsets — only
 * the derived layout changes, so there is one interaction model rather than two
 * implementations (CONCEPT §32).
 */
export function mobileDepthStyle(offset: number): DepthStyle {
  const distance = Math.abs(offset)

  /*
   * No `edgeAlpha` at any offset. Frames are full-width and shown one at a time,
   * so nothing overlaps and there is no boundary to draw — a vertical hairline
   * here would just sit on the screen gutter. `.gallery-frame::after` is switched
   * off below 768px to match.
   */
  if (distance === 0) {
    return {
      x: 0,
      scale: 1,
      opacity: 1,
      edgeAlpha: 0,
      zIndex: 30,
      interactive: true,
      rendered: true,
      hidden: false,
    }
  }

  return {
    // Frames are full-width here, so anything past 100 is off-screen. The
    // margin above that is what keeps a fast swipe from revealing an edge.
    x: Math.sign(offset) * 110,
    scale: 1,
    opacity: 0,
    edgeAlpha: 0,
    zIndex: 0,
    interactive: false,
    // The immediate neighbour stays mounted so a swipe reveals something
    // already painted rather than a blank frame.
    rendered: distance === 1,
    hidden: true,
  }
}
