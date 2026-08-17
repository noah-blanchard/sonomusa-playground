'use client'

import { Component, type ErrorInfo, type ReactNode } from 'react'

/**
 * Stops one failing preview from taking down the gallery.
 *
 * CONCEPT §35: experimental previews are inherently failure-prone, and the
 * shell must stay navigable when an individual project breaks. Anything thrown
 * during render inside a preview lands here and is replaced by the poster —
 * the visitor sees a project that simply is not animating, rather than a blank
 * page.
 *
 * A class component because error boundaries have no hook equivalent.
 */
export class PreviewErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode; onError?: (error: Error) => void },
  { hasError: boolean }
> {
  override state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error)

    // Surfaced for the developer, never for the visitor — a broken preview is
    // not something they can act on.
    if (process.env.NODE_ENV !== 'production') {
      console.error('[preview] render failed, falling back to poster:', error, info.componentStack)
    }
  }

  override render() {
    return this.state.hasError ? this.props.fallback : this.props.children
  }
}
