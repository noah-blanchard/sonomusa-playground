'use client'

import { shouldMountPreview } from '@/domain/project/preview/lifecycle'
import type { PreviewRendererProps } from './types'

/**
 * An embedded live piece, sandboxed.
 *
 * Isolation is the point (CONCEPT §17): a project rendered here cannot reach
 * the shell's DOM, cannot navigate the top frame, and cannot block the main
 * thread. The sandbox comes from the manifest with a restrictive default.
 *
 * Never mounted until activated, so an unopened iframe costs nothing.
 */
export function IframePreview({ project, status, dispatch, isActive }: PreviewRendererProps) {
  const preview = project.preview.kind === 'iframe' ? project.preview : null

  if (!preview || !isActive || !shouldMountPreview(status)) return null

  return (
    <iframe
      src={preview.src}
      title={`${project.title} — live preview`}
      sandbox={preview.sandbox.join(' ')}
      loading="lazy"
      // Deny the embedded document access to hardware and navigation it has no
      // business with, regardless of what its own headers ask for.
      allow=""
      referrerPolicy="no-referrer"
      className="absolute inset-0 size-full border-0"
      onLoad={() => dispatch({ type: 'ready' })}
      onError={() => dispatch({ type: 'fail', reason: 'iframe failed to load' })}
    />
  )
}
