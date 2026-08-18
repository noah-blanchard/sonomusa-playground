'use client'

import { Suspense, startTransition, useCallback, useEffect, useReducer } from 'react'
import { Label } from '@/components/ui/Label'
import { usePrefersReducedMotion } from '@/components/ui/usePrefersReducedMotion'
import { ViewTransition } from '@/components/ui/ViewTransition'
import { previewReducer, type PreviewStatus } from '@/domain/project/preview/lifecycle'
import { PreviewErrorBoundary } from '@/features/project-preview'
import { resolveProjectExperience } from '../registry/experiences'
import { StageLoading } from './StageLoading'

/**
 * The client island that runs one project's experience.
 *
 * Everything else on the stage — the poster floor, the plaque, the way out —
 * is server-rendered and already on screen before this file's chunk exists.
 * That ordering is the whole resilience story: this component can be slow, can
 * fail, or can never arrive, and the visitor still sees the work's poster with
 * a label and a way back rather than a black rectangle (CONCEPT §19, §35).
 *
 * It reuses the domain's preview lifecycle rather than inventing a second
 * vocabulary for "loading". A stage has no `isActive` — it is the only thing on
 * its route — so it never unloads, and it starts already loading.
 */

const LOADING: PreviewStatus = { state: 'loading' }

export function ExperienceMount({ componentId, title }: { componentId: string; title: string }) {
  const reducedMotion = usePrefersReducedMotion()

  /*
   * Loading from the very first render, rather than `idle` plus an activating
   * effect. A stage does not need activating — it is the only thing on its
   * route. Going through `idle` also lost the handoff outright when the chunk
   * was already cached: the experience's own effect fires before its parent's,
   * so `ready` arrived while the reducer was still `idle`, which ignores it,
   * and the loading mark never left.
   */
  const [status, dispatch] = useReducer(previewReducer, LOADING)

  const Experience = resolveProjectExperience(componentId)

  /*
   * Through a Transition, so the loading mark leaves on an animation rather
   * than vanishing. A plain setState is not enough — <ViewTransition> is
   * activated by Transitions, Suspense and useDeferredValue, and by nothing
   * else. `onReady` is the right moment for it: the chunk having arrived is not
   * the same thing as the first frame having been painted.
   */
  const onReady = useCallback(() => startTransition(() => dispatch({ type: 'ready' })), [])
  const onError = useCallback((reason: string) => dispatch({ type: 'fail', reason }), [])

  // An id that resolves to nothing is a content bug that validate:content
  // catches before it can ship — but if one ever gets through, it must degrade
  // like any other failure rather than hang on the loading mark forever.
  useEffect(() => {
    if (!Experience) onError(`No experience registered for "${componentId}"`)
  }, [Experience, componentId, onError])

  if (status.state === 'error') {
    return (
      <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center px-(--layout-gutter-sm)">
        <Label as="p" tone="secondary" className="!normal-case">
          This piece could not start here. The poster is the work at rest.
        </Label>
      </div>
    )
  }

  return (
    <PreviewErrorBoundary
      // Not `null` as the gallery does: there the poster alone reads as a
      // project that simply is not animating, but a stage the visitor
      // deliberately opened owes them an explanation.
      fallback={
        <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center px-(--layout-gutter-sm)">
          <Label as="p" tone="secondary" className="!normal-case">
            This piece stopped unexpectedly. The poster is the work at rest.
          </Label>
        </div>
      }
      onError={(error) => onError(error.message)}
    >
      {status.state !== 'active' && (
        <ViewTransition exit="stage-out" default="none">
          <StageLoading title={title} />
        </ViewTransition>
      )}

      {/*
        Covers the poster once the work is painting, and not a moment before.
        Kept as its own layer rather than as a background on the experience:
        if a project ever forgets to call `onReady`, its work still shows — on
        top of the poster rather than in place of it, which is untidy but
        visible. Nothing here may hide a project behind a black rectangle.
      */}
      <div
        aria-hidden
        className="absolute inset-0 bg-(--color-surface-well) transition-opacity duration-(--duration-base) ease-(--ease-standard)"
        style={{ opacity: status.state === 'active' ? 1 : 0 }}
      />

      {Experience && (
        <div className="absolute inset-0">
          <Suspense fallback={null}>
            {/*
              Read from the module-level registry, so the reference is stable
              for a given componentId — the lint rule cannot see through the
              lookup. Resolving by id is what keeps manifests serializable
              (CONCEPT §16). Same reasoning as LivePreview.
            */}
            {/* eslint-disable-next-line react-hooks/static-components */}
            <Experience reducedMotion={reducedMotion} onReady={onReady} onError={onError} />
          </Suspense>
        </div>
      )}
    </PreviewErrorBoundary>
  )
}
