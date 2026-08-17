'use client'

import { useEffect, useReducer } from 'react'
import type { Project } from '@/domain/project'
import { initialPreviewStatus, previewReducer } from '@/domain/project/preview/lifecycle'
import { usePreviewActivation } from '../context/PreviewActivation'
import { resolvePreviewRenderer } from '../renderers'
import { PreviewErrorBoundary } from './PreviewErrorBoundary'

/**
 * The client island that drives one project's preview.
 *
 * It is deliberately small. The poster is rendered by the server component
 * around it and is always present underneath, so this only ever adds the live
 * layer on top — and when it fails, removing that layer is a complete recovery.
 *
 * Only mounted for kinds that actually have behaviour; `static` projects never
 * reach this file and cost no client JavaScript at all.
 */
export function LivePreview({ project }: { project: Project }) {
  const { isActive, reducedMotion } = usePreviewActivation(project.slug)
  const [status, dispatch] = useReducer(previewReducer, initialPreviewStatus)

  // Activation and release are driven purely by whether this is the frame in
  // view, which is what implements "unload inactive heavy previews" from
  // CONCEPT §31 without any renderer having to think about it.
  useEffect(() => {
    dispatch({ type: isActive ? 'activate' : 'unload' })
  }, [isActive])

  const Renderer = resolvePreviewRenderer(project.preview.kind)

  return (
    <PreviewErrorBoundary
      // Falling back to null leaves the poster beneath visible, which is the
      // whole recovery story — see CONCEPT §19 and §35.
      fallback={null}
      onError={(error) => dispatch({ type: 'fail', reason: error.message })}
    >
      {/*
        react-hooks/static-components warns that a component built during
        render loses its state. That premise does not hold here: the renderer
        is read from a module-level constant map, so for a given preview kind
        the reference is identical on every render — the lint rule simply
        cannot see through the lookup.

        The alternative it pushes toward is a switch over preview kinds, which
        is precisely the anti-pattern CONCEPT §15 and §43 forbid. One dynamic
        map is the architecture.
      */}
      {/* eslint-disable-next-line react-hooks/static-components */}
      <Renderer
        project={project}
        status={status}
        dispatch={dispatch}
        isActive={isActive}
        reducedMotion={reducedMotion}
      />
    </PreviewErrorBoundary>
  )
}
