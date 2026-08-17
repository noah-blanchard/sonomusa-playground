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

/** How many frames stay visible either side of the active one. */
export const VISIBLE_NEIGHBOURS = 2

export interface DepthStyle {
  /** Horizontal offset as a percentage of the frame's own width. */
  x: number
  scale: number
  opacity: number
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
    return { x: 0, scale: 1, opacity: 1, zIndex: 30, interactive: true, rendered: true, hidden: false }
  }

  /*
   * Reduced motion collapses the spatial arrangement entirely: one frame at a
   * time, cross-faded. Simplifying travel is the point (CONCEPT §34), and a
   * pile of scaled neighbours sliding past is exactly the movement being
   * opted out of.
   */
  if (reducedMotion) {
    return { x: 0, scale: 1, opacity: 0, zIndex: 0, interactive: false, rendered: distance <= 1, hidden: true }
  }

  if (distance > VISIBLE_NEIGHBOURS) {
    // Parked out of sight. Still positioned so that becoming a neighbour is a
    // move rather than an appearance.
    return {
      x: direction * 150,
      scale: 0.6,
      opacity: 0,
      zIndex: 0,
      interactive: false,
      rendered: false,
      hidden: true,
    }
  }

  // Spacing compresses with distance so the stack reads as receding depth
  // rather than as evenly spaced cards.
  const x = direction * (62 + (distance - 1) * 34)
  const scale = 1 - distance * 0.13
  const opacity = distance === 1 ? 0.45 : 0.18

  return {
    x,
    scale,
    opacity,
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

  if (distance === 0) {
    return { x: 0, scale: 1, opacity: 1, zIndex: 30, interactive: true, rendered: true, hidden: false }
  }

  return {
    x: Math.sign(offset) * 104,
    scale: 1,
    opacity: 0,
    zIndex: 0,
    interactive: false,
    // The immediate neighbour stays mounted so a swipe reveals something
    // already painted rather than a blank frame.
    rendered: distance === 1,
    hidden: true,
  }
}
