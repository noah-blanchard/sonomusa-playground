'use client'

import { useEffect } from 'react'
import type { ProjectExperienceProps } from '@/features/project-experience'

/**
 * Zoomquilt, full screen.
 *
 * The piece is hosted elsewhere and embeddable, so the experience here is a
 * plain iframe of the live URL — the frame's preview and this stage point at
 * the same work, at different sizes. `onReady` fires when the document inside
 * reports it has loaded; the stage holds the poster until then.
 */

const SRC = 'https://www.zoomquilt.org'

export default function ZoomquiltExperience({
  onReady,
}: ProjectExperienceProps) {
  useEffect(() => {
    // Nothing to release — the browser tears the iframe down with the node.
    // The fallback timer only exists because cross-origin `load` can be
    // swallowed; the stage must never hold a black rectangle forever.
    const fallback = window.setTimeout(onReady, 5000)
    return () => window.clearTimeout(fallback)
  }, [onReady])

  return (
    <iframe
      src={SRC}
      title="Zoomquilt — an endlessly zooming collaborative painting"
      onLoad={onReady}
      allow="autoplay; fullscreen"
      sandbox="allow-scripts allow-same-origin"
      style={{ width: '100%', height: '100%', border: 0, display: 'block' }}
    />
  )
}
