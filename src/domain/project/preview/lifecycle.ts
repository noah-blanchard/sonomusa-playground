/**
 * Preview lifecycle (CONCEPT §18).
 *
 * Shared UI understands these states generically, and project code never
 * redefines them — that is what stops each preview kind from inventing its own
 * notion of "loading" and forcing the frame to special-case it.
 *
 * Pure data and pure transitions, deliberately: it belongs to the domain so it
 * can be reasoned about and tested without mounting anything.
 *
 *   idle ──activate──▶ loading ──ready──▶ ready ──activate──▶ active
 *     ▲                   │                                      │
 *     └────── reset ──────┴──── fail ──▶ error          unload ──┘
 */

export type PreviewState = 'idle' | 'loading' | 'ready' | 'active' | 'error' | 'unloaded'

export type PreviewEvent =
  /** The visitor showed intent, or the frame became the active one. */
  | { type: 'activate' }
  /** Underlying media finished loading. */
  | { type: 'ready' }
  /** Anything went wrong. Always degrades to the poster. */
  | { type: 'fail'; reason?: string }
  /** Moved off-screen or out of focus; heavy resources are released. */
  | { type: 'unload' }
  /** Return to the beginning, e.g. after a retry. */
  | { type: 'reset' }

export interface PreviewStatus {
  state: PreviewState
  /** Present only in the error state; surfaced in dev, never to visitors. */
  reason?: string
}

export const initialPreviewStatus: PreviewStatus = { state: 'idle' }

/**
 * Whether the frame should be showing the poster.
 *
 * True in every state except `active`, which is the invariant that makes
 * CONCEPT §19 hold: something is always visible, and a preview that never
 * loads is indistinguishable from one that was never asked to.
 */
export function shouldShowPoster(status: PreviewStatus): boolean {
  return status.state !== 'active'
}

/** Whether heavy resources should currently be mounted at all. */
export function shouldMountPreview(status: PreviewStatus): boolean {
  return status.state === 'loading' || status.state === 'ready' || status.state === 'active'
}

export function previewReducer(status: PreviewStatus, event: PreviewEvent): PreviewStatus {
  switch (event.type) {
    case 'activate':
      switch (status.state) {
        case 'idle':
        case 'unloaded':
          return { state: 'loading' }
        case 'ready':
          return { state: 'active' }
        // Already active, still loading, or failed — activating again is a
        // no-op. In particular a failed preview must not retry on every
        // pointer move; that needs an explicit reset.
        default:
          return status
      }

    case 'ready':
      // Ignored unless we asked for it, so a late callback from an unloaded
      // preview cannot resurrect it.
      return status.state === 'loading' ? { state: 'active' } : status

    case 'fail':
      return status.state === 'unloaded'
        ? status
        : { state: 'error', ...(event.reason !== undefined && { reason: event.reason }) }

    case 'unload':
      // An error is preserved through unload so a broken preview is not
      // silently retried the next time the frame scrolls past.
      return status.state === 'error' ? status : { state: 'unloaded' }

    case 'reset':
      return initialPreviewStatus
  }
}
