'use client'

import { useEffect, useRef } from 'react'

/**
 * Advances the gallery on an interval, politely.
 *
 * The gallery is a loop (the reducer wraps at both ends), so autoplay is just
 * `next` on a timer — there is no end to stop at. The politeness is the whole
 * feature:
 *
 * - **Reduced motion turns it off entirely.** Motion the visitor did not ask
 *   for is exactly what the preference exists to prevent (CONCEPT §20).
 * - **Hover or focus anywhere inside the gallery pauses it.** Nobody should
 *   have to chase a frame they are reading or about to click.
 * - **A hidden tab pauses it.** No point animating for nobody, and it keeps
 *   the interval from drifting while throttled.
 * - **Any manual move restarts the countdown**, so the timer never yanks the
 *   gallery away right after the visitor took the wheel.
 */

export interface AutoplayOptions {
  /** Dispatch a step. Called with nothing; the reducer owns the wrap. */
  onTick: () => void
  /** Milliseconds between steps. */
  intervalMs: number
  /** False when there is one or zero frames, or under reduced motion. */
  enabled: boolean
  /** The element whose hover/focus pauses the timer. */
  regionRef: React.RefObject<HTMLElement | null>
}

export function useAutoplay({ onTick, intervalMs, enabled, regionRef }: AutoplayOptions) {
  // The latest tick without re-arming the timer on every render.
  const tickRef = useRef(onTick)
  useEffect(() => {
    tickRef.current = onTick
  }, [onTick])

  const paused = useRef(false)
  // When the countdown started; a resume after a pause gets the full interval
  // again rather than the confusing remainder.
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!enabled) return

    const region = regionRef.current
    if (!region) return

    const start = () => {
      if (timer.current || paused.current || document.hidden) return
      timer.current = setInterval(() => tickRef.current(), intervalMs)
    }

    const stop = () => {
      if (timer.current) clearInterval(timer.current)
      timer.current = null
    }

    const pause = () => {
      paused.current = true
      stop()
    }

    const resume = () => {
      paused.current = false
      start()
    }

    const onVisibility = () => {
      if (document.hidden) stop()
      else start()
    }

    // A manual move restarts the countdown: stop, then start fresh. The
    // viewport dispatches this from the same handlers that move the gallery.
    const onManual = () => {
      stop()
      start()
    }

    region.addEventListener('pointerenter', pause)
    region.addEventListener('pointerleave', resume)
    region.addEventListener('focusin', pause)
    region.addEventListener('focusout', resume)
    region.addEventListener('gallery:manual', onManual)
    document.addEventListener('visibilitychange', onVisibility)

    start()

    return () => {
      stop()
      region.removeEventListener('pointerenter', pause)
      region.removeEventListener('pointerleave', resume)
      region.removeEventListener('focusin', pause)
      region.removeEventListener('focusout', resume)
      region.removeEventListener('gallery:manual', onManual)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [enabled, intervalMs, regionRef])
}
