import { describe, expect, it } from 'vitest'
import {
  initialPreviewStatus,
  previewReducer,
  shouldMountPreview,
  shouldShowPoster,
  type PreviewEvent,
  type PreviewStatus,
} from './lifecycle'

/** Applies a sequence of events, for testing whole journeys rather than steps. */
function run(events: PreviewEvent[], from: PreviewStatus = initialPreviewStatus): PreviewStatus {
  return events.reduce(previewReducer, from)
}

describe('previewReducer', () => {
  it('starts idle', () => {
    expect(initialPreviewStatus.state).toBe('idle')
  })

  it('walks the happy path to active', () => {
    expect(run([{ type: 'activate' }]).state).toBe('loading')
    expect(run([{ type: 'activate' }, { type: 'ready' }]).state).toBe('active')
  })

  it('goes straight to active when already ready', () => {
    expect(previewReducer({ state: 'ready' }, { type: 'activate' }).state).toBe('active')
  })

  it('records the reason on failure', () => {
    const status = run([{ type: 'activate' }, { type: 'fail', reason: 'decode error' }])

    expect(status).toEqual({ state: 'error', reason: 'decode error' })
  })

  it('does not retry a failed preview on further activation', () => {
    // Otherwise a broken preview would re-attempt on every pointer move, which
    // is how one bad project degrades the whole gallery.
    const failed = run([{ type: 'activate' }, { type: 'fail' }])

    expect(previewReducer(failed, { type: 'activate' }).state).toBe('error')
  })

  it('preserves an error through unload', () => {
    const failed = run([{ type: 'activate' }, { type: 'fail' }])

    expect(previewReducer(failed, { type: 'unload' }).state).toBe('error')
  })

  it('clears the error only on an explicit reset', () => {
    const failed = run([{ type: 'activate' }, { type: 'fail', reason: 'boom' }])

    expect(previewReducer(failed, { type: 'reset' })).toEqual({ state: 'idle' })
  })

  it('ignores a late ready from an unloaded preview', () => {
    // A resolved promise arriving after unmount must not resurrect it.
    const unloaded = run([{ type: 'activate' }, { type: 'ready' }, { type: 'unload' }])

    expect(previewReducer(unloaded, { type: 'ready' }).state).toBe('unloaded')
  })

  it('ignores a failure reported after unloading', () => {
    expect(previewReducer({ state: 'unloaded' }, { type: 'fail' }).state).toBe('unloaded')
  })

  it('reloads after being unloaded', () => {
    const unloaded = run([{ type: 'activate' }, { type: 'ready' }, { type: 'unload' }])

    expect(previewReducer(unloaded, { type: 'activate' }).state).toBe('loading')
  })

  it('treats repeated activation as a no-op', () => {
    const active = run([{ type: 'activate' }, { type: 'ready' }])

    expect(previewReducer(active, { type: 'activate' })).toEqual(active)
  })
})

describe('shouldShowPoster', () => {
  it.each(['idle', 'loading', 'ready', 'error', 'unloaded'] as const)(
    'shows the poster while %s',
    (state) => {
      expect(shouldShowPoster({ state })).toBe(true)
    },
  )

  it('hides the poster only once the preview is actually running', () => {
    expect(shouldShowPoster({ state: 'active' })).toBe(false)
  })

  it('always shows something — a failed preview is indistinguishable from an idle one', () => {
    // This is CONCEPT §19 stated as a test: the gallery never depends on live
    // rendering to communicate that a project exists.
    const states = ['idle', 'loading', 'ready', 'active', 'error', 'unloaded'] as const

    for (const state of states) {
      const visible = shouldShowPoster({ state }) || state === 'active'
      expect(visible).toBe(true)
    }
  })
})

describe('shouldMountPreview', () => {
  it('mounts nothing before activation', () => {
    // The homepage must never eagerly initialize every preview (CONCEPT §17).
    expect(shouldMountPreview({ state: 'idle' })).toBe(false)
  })

  it.each(['loading', 'ready', 'active'] as const)('mounts while %s', (state) => {
    expect(shouldMountPreview({ state })).toBe(true)
  })

  it.each(['error', 'unloaded'] as const)('releases resources when %s', (state) => {
    expect(shouldMountPreview({ state })).toBe(false)
  })
})
