'use client'

import { useEffect } from 'react'
import type { ProjectExperienceProps } from '@/features/project-experience'

/**
 * SONO 303, full screen.
 */

const SRC = 'https://sono303.sonomusa.tech/'

export default function Sono303Experience({
  onReady,
}: ProjectExperienceProps) {
  useEffect(() => {
    const fallback = window.setTimeout(onReady, 5000)
    return () => window.clearTimeout(fallback)
  }, [onReady])

  return (
    <iframe
      src={SRC}
      title="SONO 303 — a TB-303 emulator with a built-in sequencer, playable in the browser"
      onLoad={onReady}
      allow="autoplay; fullscreen; microphone"
      sandbox="allow-scripts allow-same-origin allow-forms"
      style={{ width: '100%', height: '100%', border: 0, display: 'block' }}
    />
  )
}
