'use client'

import { Suspense, useCallback, useEffect } from 'react'
import { shouldMountPreview } from '@/domain/project/preview/lifecycle'
import { resolveComponentPreview } from '../registry/componentPreviews'
import type { PreviewRendererProps } from './types'

/**
 * An interactive preview implemented in this repository.
 *
 * The component is resolved by id through the registry, never carried in the
 * manifest — that is what keeps manifests serializable (CONCEPT §16) and keeps
 * heavy code behind a dynamic import.
 *
 * Nothing is imported until the preview is actually activated.
 */
export function ComponentPreview({
  project,
  status,
  dispatch,
  isActive,
  reducedMotion,
}: PreviewRendererProps) {
  const componentId = project.preview.kind === 'component' ? project.preview.componentId : null
  const Preview = componentId ? resolveComponentPreview(componentId) : null

  const onReady = useCallback(() => dispatch({ type: 'ready' }), [dispatch])
  const onError = useCallback(
    (reason: string) => dispatch({ type: 'fail', reason }),
    [dispatch],
  )

  // An id that resolves to nothing is a content bug, but it must not blank the
  // frame — it degrades to the poster like any other failure. validate:content
  // catches this before it can ship.
  const unresolved = componentId !== null && Preview === null

  useEffect(() => {
    if (unresolved && componentId) {
      onError(`No component preview registered for "${componentId}"`)
    }
  }, [unresolved, componentId, onError])

  if (!Preview || !isActive || !shouldMountPreview(status)) return null

  return (
    <div className="absolute inset-0">
      {/* No visible fallback: the poster beneath is already the loading state. */}
      <Suspense fallback={null}>
        {/*
          Read from the module-level registry, so the reference is stable for a
          given componentId — the rule cannot see through the lookup. Resolving
          by id is what keeps manifests serializable (CONCEPT §16).
        */}
        {/* eslint-disable-next-line react-hooks/static-components */}
        <Preview isActive={isActive} reducedMotion={reducedMotion} onReady={onReady} onError={onError} />
      </Suspense>
    </div>
  )
}
