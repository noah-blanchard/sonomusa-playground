'use client'

import { useEffect } from 'react'
import type { ProjectExperienceProps } from '@/features/project-experience'

/**
 * MusicPhone, full screen.
 *
 * The game is hosted on its own subdomain and embeddable, so the experience
 * here is a plain iframe of the live URL — the frame's preview and this stage
 * point at the same work, at different sizes. `onReady` fires when the
 * document inside reports it has loaded; the stage holds the poster until
 * then.
 */

const SRC = 'https://musicphone.sonomusa.tech/'

export default function MusicPhoneExperience({
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
      title="MusicPhone — a real-time multiplayer music game"
      onLoad={onReady}
      allow="autoplay; fullscreen; microphone"
      sandbox="allow-scripts allow-same-origin allow-forms"
      style={{ width: '100%', height: '100%', border: 0, display: 'block' }}
    />
  )
}
