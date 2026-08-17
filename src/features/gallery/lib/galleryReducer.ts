/**
 * The entire gallery interaction model.
 *
 * One index. Every visual property of every frame is derived from it (see
 * depth.ts), and every input — wheel, drag, keyboard, buttons, dots — reduces
 * to one of these actions. Desktop and mobile share this exact state and differ
 * only in how they render it.
 *
 * Pure and framework-free so it can be tested without mounting anything.
 */

export interface GalleryState {
  activeIndex: number
  count: number
  /**
   * Which direction the last move went, so transitions can lead the right way.
   * Zero on a direct jump, where there is no meaningful direction.
   */
  direction: -1 | 0 | 1
}

export type GalleryAction =
  | { type: 'next' }
  | { type: 'previous' }
  | { type: 'goTo'; index: number }
  | { type: 'first' }
  | { type: 'last' }

export function createGalleryState(count: number, activeIndex = 0): GalleryState {
  return {
    count,
    activeIndex: count > 0 ? clampIndex(activeIndex, count) : 0,
    direction: 0,
  }
}

function clampIndex(index: number, count: number): number {
  if (count <= 0) return 0
  return Math.min(Math.max(index, 0), count - 1)
}

/**
 * Wraps at both ends — the gallery is a loop, which is what makes continuous
 * scrolling feel like a space rather than a list with walls.
 */
function wrapIndex(index: number, count: number): number {
  if (count <= 0) return 0
  return ((index % count) + count) % count
}

export function galleryReducer(state: GalleryState, action: GalleryAction): GalleryState {
  // With nothing to show there is nowhere to go. Guarding here means no input
  // handler has to special-case an empty collection.
  if (state.count === 0) return state

  switch (action.type) {
    case 'next':
      return { ...state, activeIndex: wrapIndex(state.activeIndex + 1, state.count), direction: 1 }

    case 'previous':
      return { ...state, activeIndex: wrapIndex(state.activeIndex - 1, state.count), direction: -1 }

    case 'goTo': {
      const target = clampIndex(action.index, state.count)
      if (target === state.activeIndex) return state

      // A jump has no direction — it is not a step through the sequence.
      return { ...state, activeIndex: target, direction: 0 }
    }

    case 'first':
      return state.activeIndex === 0 ? state : { ...state, activeIndex: 0, direction: -1 }

    case 'last': {
      const last = state.count - 1
      return state.activeIndex === last ? state : { ...state, activeIndex: last, direction: 1 }
    }
  }
}
