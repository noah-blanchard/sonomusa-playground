'use client'

import { useCallback, useEffect, useRef, type KeyboardEvent, type PointerEvent } from 'react'

/**
 * Wheel, drag and keyboard input for the gallery.
 *
 * Every input reduces to next/previous — the same two actions the buttons
 * dispatch — so gesture support is genuinely an enhancement and the gallery is
 * fully operable without it (CONCEPT §20).
 *
 * Deliberately NOT scroll-jacking. Vertical wheel is left alone so the page
 * keeps scrolling normally; only horizontal intent (a trackpad swipe) moves the
 * gallery. Trapping vertical scroll inside a full-height section is a genuine
 * accessibility failure, and the arrow keys and buttons already cover the case.
 */

/** Horizontal wheel delta before a gesture counts as intent. */
const WHEEL_THRESHOLD = 24
/** Ignore further wheel events while a transition settles. */
const WHEEL_COOLDOWN_MS = 420
/** Pointer travel before a drag counts as a move rather than a click. */
const DRAG_THRESHOLD_PX = 60

export interface GalleryInputHandlers {
  onNext: () => void
  onPrevious: () => void
  onFirst: () => void
  onLast: () => void
  enabled: boolean
}

export function useGalleryInput({
  onNext,
  onPrevious,
  onFirst,
  onLast,
  enabled,
}: GalleryInputHandlers) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const dragOrigin = useRef<number | null>(null)

  // Wheel needs a native listener because React attaches passively, and a
  // passive listener cannot preventDefault the browser's horizontal
  // back-navigation gesture.
  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport || !enabled) return

    let coolingDown = false
    let timer: ReturnType<typeof setTimeout> | undefined

    function handleWheel(event: WheelEvent) {
      // Vertical scroll belongs to the page, not to us.
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return
      if (Math.abs(event.deltaX) < WHEEL_THRESHOLD) return

      event.preventDefault()

      if (coolingDown) return
      coolingDown = true
      timer = setTimeout(() => {
        coolingDown = false
      }, WHEEL_COOLDOWN_MS)

      if (event.deltaX > 0) onNext()
      else onPrevious()
    }

    viewport.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      viewport.removeEventListener('wheel', handleWheel)
      if (timer) clearTimeout(timer)
    }
  }, [enabled, onNext, onPrevious])

  const onPointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      // Mouse drag competes with text selection and link clicks; touch and pen
      // are where dragging is the natural gesture.
      if (!enabled || event.pointerType === 'mouse') return

      dragOrigin.current = event.clientX
    },
    [enabled],
  )

  const onPointerUp = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const origin = dragOrigin.current
      dragOrigin.current = null

      if (origin === null) return

      const travel = event.clientX - origin
      if (Math.abs(travel) < DRAG_THRESHOLD_PX) return

      if (travel < 0) onNext()
      else onPrevious()
    },
    [onNext, onPrevious],
  )

  const onPointerCancel = useCallback(() => {
    dragOrigin.current = null
  }, [])

  /**
   * Arrow keys work whenever focus is anywhere inside the gallery, because
   * keydown bubbles from the controls and links within it.
   */
  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (!enabled) return

      switch (event.key) {
        case 'ArrowRight':
          event.preventDefault()
          onNext()
          break
        case 'ArrowLeft':
          event.preventDefault()
          onPrevious()
          break
        case 'Home':
          event.preventDefault()
          onFirst()
          break
        case 'End':
          event.preventDefault()
          onLast()
          break
      }
    },
    [enabled, onNext, onPrevious, onFirst, onLast],
  )

  return { viewportRef, onKeyDown, onPointerDown, onPointerUp, onPointerCancel }
}
