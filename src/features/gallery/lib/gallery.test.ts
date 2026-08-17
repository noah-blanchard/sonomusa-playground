import { describe, expect, it } from 'vitest'
import {
  depthStyle,
  FRAME_INSET,
  mobileDepthStyle,
  neighbourRightEdge,
  signedOffset,
  VISIBLE_NEIGHBOURS,
} from './depth'
import { createGalleryState, galleryReducer, type GalleryState } from './galleryReducer'

/** Applies a sequence, for testing journeys rather than single steps. */
function run(state: GalleryState, ...actions: Parameters<typeof galleryReducer>[1][]): GalleryState {
  return actions.reduce(galleryReducer, state)
}

describe('galleryReducer', () => {
  const six = createGalleryState(6)

  it('starts at the first project', () => {
    expect(six.activeIndex).toBe(0)
    expect(six.direction).toBe(0)
  })

  it('moves forward and back', () => {
    expect(run(six, { type: 'next' }).activeIndex).toBe(1)
    expect(run(six, { type: 'next' }, { type: 'next' }, { type: 'previous' }).activeIndex).toBe(1)
  })

  it('wraps at both ends — the gallery is a loop', () => {
    expect(run(six, { type: 'previous' }).activeIndex).toBe(5)
    expect(run(createGalleryState(6, 5), { type: 'next' }).activeIndex).toBe(0)
  })

  it('records direction so transitions can lead the right way', () => {
    expect(run(six, { type: 'next' }).direction).toBe(1)
    expect(run(six, { type: 'previous' }).direction).toBe(-1)
  })

  it('treats a direct jump as having no direction', () => {
    // A dot press is not a step through the sequence, so leading it one way
    // or the other would be arbitrary.
    expect(run(six, { type: 'goTo', index: 3 }).direction).toBe(0)
  })

  it('clamps an out-of-range jump instead of wrapping it', () => {
    // Wrapping a jump would send a mis-typed index somewhere unrelated.
    expect(run(six, { type: 'goTo', index: 99 }).activeIndex).toBe(5)
    expect(run(six, { type: 'goTo', index: -4 }).activeIndex).toBe(0)
  })

  it('ignores a jump to where it already is', () => {
    const state = run(six, { type: 'next' })

    expect(galleryReducer(state, { type: 'goTo', index: 1 })).toBe(state)
  })

  it('jumps to first and last', () => {
    expect(run(six, { type: 'last' }).activeIndex).toBe(5)
    expect(run(six, { type: 'last' }, { type: 'first' }).activeIndex).toBe(0)
  })

  it('does nothing at all with an empty collection', () => {
    // Guarding here means no input handler has to special-case emptiness.
    const empty = createGalleryState(0)

    expect(galleryReducer(empty, { type: 'next' })).toBe(empty)
    expect(galleryReducer(empty, { type: 'goTo', index: 2 })).toBe(empty)
    expect(galleryReducer(empty, { type: 'last' })).toBe(empty)
  })

  it('handles a single project without moving', () => {
    const one = createGalleryState(1)

    expect(galleryReducer(one, { type: 'next' }).activeIndex).toBe(0)
    expect(galleryReducer(one, { type: 'previous' }).activeIndex).toBe(0)
  })

  it('clamps an initial index that is out of range', () => {
    expect(createGalleryState(3, 9).activeIndex).toBe(2)
  })

  it('returns to where it started after a full loop', () => {
    const actions = Array.from({ length: 6 }, () => ({ type: 'next' }) as const)

    expect(run(six, ...actions).activeIndex).toBe(0)
  })
})

describe('signedOffset', () => {
  it('is a plain difference near the middle', () => {
    expect(signedOffset(4, 2, 6)).toBe(2)
    expect(signedOffset(1, 3, 6)).toBe(-2)
  })

  it('takes the shorter way around the loop', () => {
    // Without this, last → first would send every frame travelling the whole
    // width of the collection instead of one step.
    expect(signedOffset(0, 5, 6)).toBe(1)
    expect(signedOffset(5, 0, 6)).toBe(-1)
  })

  it('is zero for the active frame', () => {
    expect(signedOffset(3, 3, 6)).toBe(0)
  })

  it('handles an empty collection', () => {
    expect(signedOffset(0, 0, 0)).toBe(0)
  })

  it('never exceeds half the collection in either direction', () => {
    const count = 9

    for (let active = 0; active < count; active += 1) {
      for (let index = 0; index < count; index += 1) {
        expect(Math.abs(signedOffset(index, active, count))).toBeLessThanOrEqual(count / 2)
      }
    }
  })
})

describe('depthStyle', () => {
  it('gives the active frame full presence and the only pointer input', () => {
    const active = depthStyle(0)

    expect(active).toMatchObject({ x: 0, scale: 1, opacity: 1, interactive: true, hidden: false })
  })

  it('recedes neighbours by scale, position and opacity', () => {
    const near = depthStyle(1)
    const far = depthStyle(2)

    expect(near.scale).toBeGreaterThan(far.scale)
    expect(near.opacity).toBeGreaterThan(far.opacity)
    expect(Math.abs(far.x)).toBeGreaterThan(Math.abs(near.x))
  })

  it('mirrors left and right', () => {
    const left = depthStyle(-1)
    const right = depthStyle(1)

    expect(left.x).toBe(-right.x)
    expect(left.scale).toBe(right.scale)
    expect(left.opacity).toBe(right.opacity)
  })

  it('stacks the active frame above its neighbours', () => {
    expect(depthStyle(0).zIndex).toBeGreaterThan(depthStyle(1).zIndex)
    expect(depthStyle(1).zIndex).toBeGreaterThan(depthStyle(2).zIndex)
  })

  it('stops rendering media beyond the visible neighbours', () => {
    // This is the invariant that keeps a 50-project gallery costing the same
    // as a 3-project one (CONCEPT §31).
    expect(depthStyle(VISIBLE_NEIGHBOURS).rendered).toBe(true)
    expect(depthStyle(VISIBLE_NEIGHBOURS + 1).rendered).toBe(false)
  })

  it('takes only the active frame out of the accessibility tree exemption', () => {
    expect(depthStyle(0).hidden).toBe(false)
    expect(depthStyle(1).hidden).toBe(true)
  })

  it('never leaves a neighbour interactive', () => {
    // A partially visible frame that can be clicked is a trap for pointer and
    // keyboard users alike.
    for (const offset of [-3, -2, -1, 1, 2, 3]) {
      expect(depthStyle(offset).interactive).toBe(false)
    }
  })

  describe('reduced motion', () => {
    it('collapses the composition to one frame at a time', () => {
      const active = depthStyle(0, { reducedMotion: true })
      const neighbour = depthStyle(1, { reducedMotion: true })

      expect(active.opacity).toBe(1)
      expect(neighbour.opacity).toBe(0)
      // No travel and no scaling — the movement is what was opted out of.
      expect(neighbour.x).toBe(0)
      expect(neighbour.scale).toBe(1)
    })

    it('still keeps the next frame painted so a move is instant', () => {
      expect(depthStyle(1, { reducedMotion: true }).rendered).toBe(true)
      expect(depthStyle(3, { reducedMotion: true }).rendered).toBe(false)
    })
  })
})

/**
 * The composition depends on three numbers agreeing: the frame inset in
 * gallery.css, and `x` and `scale` from depthStyle. The viewport clips, so a
 * disagreement does not break the page — it silently produces either a gap
 * beside the active frame or a neighbour covering it. Nothing but this catches
 * that.
 */
describe('the peek geometry', () => {
  /** Where a left-hand neighbour's right edge lands, in column fractions. */
  function edgeAt(distance: number): number {
    const { x, scale } = depthStyle(-distance)

    return neighbourRightEdge(FRAME_INSET, x, scale)
  }

  it('fills the whole margin beside the active frame', () => {
    // Anything short of the inset leaves a strip of empty background between
    // the neighbour and the frame, which reads as a broken layout.
    expect(edgeAt(1)).toBeGreaterThan(FRAME_INSET)
  })

  it('tucks only just under the active frame', () => {
    // It has to overlap — a butt joint shows a seam — but the active project
    // is the subject, so the intrusion stays small. It is covered anyway:
    // zIndex 30 over 29.
    expect(edgeAt(1)).toBeLessThan(FRAME_INSET + 0.05)
    expect(depthStyle(0).zIndex).toBeGreaterThan(depthStyle(1).zIndex)
  })

  it('keeps the far neighbour entirely off-stage', () => {
    // Mounted for the transition, never seen.
    expect(edgeAt(2)).toBeLessThan(0)
  })

  it('is symmetrical', () => {
    const right = depthStyle(1)
    const rightLeftEdge = 1 - neighbourRightEdge(FRAME_INSET, -right.x, right.scale)

    expect(rightLeftEdge).toBeCloseTo(1 - edgeAt(1), 10)
  })

  it('reduces to the frame itself for the active offset', () => {
    const active = depthStyle(0)

    // A sanity check on the maths rather than on the tuning: an unmoved,
    // unscaled frame ends exactly where CSS puts it.
    expect(neighbourRightEdge(FRAME_INSET, active.x, active.scale)).toBeCloseTo(
      1 - FRAME_INSET,
      10,
    )
  })
})

describe('mobileDepthStyle', () => {
  it('shows exactly one frame', () => {
    expect(mobileDepthStyle(0).opacity).toBe(1)
    expect(mobileDepthStyle(1).opacity).toBe(0)
    expect(mobileDepthStyle(-1).opacity).toBe(0)
  })

  it('does not scale — mobile is a reinterpretation, not a compression', () => {
    expect(mobileDepthStyle(1).scale).toBe(1)
  })

  it('keeps the immediate neighbour painted so a swipe reveals something', () => {
    expect(mobileDepthStyle(1).rendered).toBe(true)
    expect(mobileDepthStyle(2).rendered).toBe(false)
  })

  it('parks frames off-screen in the direction they came from', () => {
    expect(mobileDepthStyle(1).x).toBeGreaterThan(100)
    expect(mobileDepthStyle(-1).x).toBeLessThan(-100)
  })
})
