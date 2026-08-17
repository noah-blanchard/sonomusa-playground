'use client'

import { useEffect, useRef } from 'react'
import { resolveMediaUrl } from '@/domain/project/media'
import { shouldMountPreview } from '@/domain/project/preview/lifecycle'
import type { PreviewRendererProps } from './types'

/**
 * A short muted loop, activated on intent rather than on load.
 *
 * `preload="none"` plus unmounting when inactive are what keep CONCEPT §31
 * true: a gallery of fifty video projects must cost the same on first paint as
 * a gallery of three.
 */
export function VideoPreview({
  project,
  status,
  dispatch,
  isActive,
  reducedMotion,
}: PreviewRendererProps) {
  const ref = useRef<HTMLVideoElement>(null)

  // Narrowed to a plain value up front so every hook below runs
  // unconditionally, whatever kind this project turns out to be.
  const src = project.preview.kind === 'video' ? project.preview.src : null

  // Reduced motion is a supported mode, not a degraded one: the poster stays.
  // See docs/rules/05-experience.md.
  const shouldPlay = Boolean(src) && isActive && !reducedMotion

  useEffect(() => {
    const video = ref.current
    if (!video) return

    if (!shouldPlay) {
      video.pause()
      return
    }

    // play() rejects when the browser blocks autoplay. That is not a broken
    // project, so it releases back to the poster rather than reporting an error.
    void video.play().catch(() => dispatch({ type: 'unload' }))
  }, [shouldPlay, dispatch])

  if (!src || reducedMotion || !shouldMountPreview(status)) return null

  return (
    <video
      ref={ref}
      src={resolveMediaUrl(project.slug, src)}
      muted
      loop
      playsInline
      preload="none"
      // Decorative: the frame already names the project in real text.
      aria-hidden
      tabIndex={-1}
      className="absolute inset-0 size-full object-cover"
      onCanPlay={() => dispatch({ type: 'ready' })}
      onError={() => dispatch({ type: 'fail', reason: 'video failed to load' })}
    />
  )
}
