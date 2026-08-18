'use client'

import { Children, useCallback, useMemo, useReducer, type CSSProperties, type ReactNode } from 'react'
import { PreviewActivationProvider } from '@/features/project-preview'
import { useGalleryInput } from '../hooks/useGalleryInput'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import { depthStyle, mobileDepthStyle, signedOffset } from '../lib/depth'
import { createGalleryState, galleryReducer } from '../lib/galleryReducer'
import { GalleryAmbience } from './GalleryAmbience'
import { GalleryControls } from './GalleryControls'

/**
 * The only hydrated part of the gallery.
 *
 * Frames arrive as `children`, already rendered on the server, so project
 * content never hydrates — this component positions what it is given and owns
 * the interaction. That is how an interactive gallery avoids turning the site
 * into an SPA (CONCEPT §30).
 *
 * It knows nothing about any particular project: an array of {slug, title} for
 * labelling, and an equal number of opaque nodes to place.
 */
export function GalleryViewport({
  items,
  children,
}: {
  /**
   * Names for labels and announcements, plus each project's own colour for the
   * ambient field. Still no project object — the viewport never sees one, which
   * is what keeps it project-agnostic.
   */
  items: { slug: string; title: string; accent?: string }[]
  children: ReactNode
}) {
  const [state, dispatch] = useReducer(galleryReducer, items.length, (count) =>
    createGalleryState(count),
  )
  const prefersReducedMotion = usePrefersReducedMotion()

  const onNext = useCallback(() => dispatch({ type: 'next' }), [])
  const onPrevious = useCallback(() => dispatch({ type: 'previous' }), [])
  const onFirst = useCallback(() => dispatch({ type: 'first' }), [])
  const onLast = useCallback(() => dispatch({ type: 'last' }), [])
  const onGoTo = useCallback((index: number) => dispatch({ type: 'goTo', index }), [])

  const { viewportRef, onKeyDown, onPointerDown, onPointerUp, onPointerCancel } = useGalleryInput({
    onNext,
    onPrevious,
    onFirst,
    onLast,
    enabled: items.length > 1,
  })

  // Children are opaque server-rendered nodes; toArray gives a stable list to
  // position without ever inspecting what they contain.
  const frames = useMemo(() => Children.toArray(children), [children])

  const active = items[state.activeIndex]

  if (items.length === 0) return null

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Projects"
      onKeyDown={onKeyDown}
      className="flex flex-col gap-10"
    >
      <div
        ref={viewportRef}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        className="gallery-viewport relative touch-pan-y select-none"
      >
        {/* Behind every frame, so the opaque active card occludes its middle
            and what is left reads as a band around the fronting project. */}
        <GalleryAmbience accent={active?.accent} reducedMotion={prefersReducedMotion} />

        <PreviewActivationProvider
          activeSlug={active?.slug ?? null}
          reducedMotion={prefersReducedMotion}
        >
          {frames.map((frame, index) => {
            const item = items[index]
            if (!item) return null

            const offset = signedOffset(index, state.activeIndex, items.length)

            /*
             * Both arrangements are computed and handed to CSS as custom
             * properties; a media query picks which applies. No viewport
             * measurement, so no layout flash and no hydration mismatch — one
             * reducer, two derived layouts.
             */
            const desktop = depthStyle(offset, { reducedMotion: prefersReducedMotion })
            const mobile = mobileDepthStyle(offset)

            if (!desktop.rendered && !mobile.rendered) return null

            const isActive = offset === 0

            return (
              <div
                key={item.slug}
                role="group"
                aria-roledescription="slide"
                aria-label={`${index + 1} of ${items.length}`}
                aria-hidden={desktop.hidden}
                /*
                 * Inert rather than merely non-interactive: without it a
                 * partly visible neighbour still holds tabbable links sitting
                 * behind the active frame.
                 */
                inert={!isActive}
                className="gallery-frame"
                style={
                  {
                    '--frame-x': `${desktop.x}%`,
                    '--frame-scale': desktop.scale,
                    '--frame-opacity': desktop.opacity,
                    '--frame-edge': desktop.edgeAlpha,
                    '--frame-x-sm': `${mobile.x}%`,
                    '--frame-opacity-sm': mobile.opacity,
                    zIndex: desktop.zIndex,
                  } as CSSProperties
                }
              >
                {frame}
              </div>
            )
          })}
        </PreviewActivationProvider>
      </div>

      <GalleryControls
        items={items}
        activeIndex={state.activeIndex}
        onNext={onNext}
        onPrevious={onPrevious}
        onGoTo={onGoTo}
      />

      {/*
        Announced politely on change, so a screen reader user knows where they
        are without being interrupted mid-sentence.
      */}
      <p aria-live="polite" className="sr-only">
        {active ? `${active.title}, project ${state.activeIndex + 1} of ${items.length}` : ''}
      </p>
    </section>
  )
}
