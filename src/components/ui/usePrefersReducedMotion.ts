'use client'

import { useSyncExternalStore } from 'react'

/**
 * The OS reduced-motion preference.
 *
 * CSS already honours `prefers-reduced-motion` for the transitions themselves —
 * this is for the decisions CSS cannot make: whether to mount a video preview
 * at all, how many neighbouring frames to compose, and whether an experience
 * should animate or paint a single frame.
 *
 * It lives beside the UI primitives rather than inside a feature because it is
 * not about any of them: it reads a media query. The gallery and the stage both
 * need the answer, and neither should have to import the other to get it.
 *
 * The server snapshot is `false`, matching the CSS default, so hydration is
 * consistent; the real value arrives on the first client render.
 */

const QUERY = '(prefers-reduced-motion: reduce)'

function subscribe(onChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {}

  const list = window.matchMedia(QUERY)
  list.addEventListener('change', onChange)

  return () => list.removeEventListener('change', onChange)
}

function getSnapshot(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia(QUERY).matches
}

function getServerSnapshot(): boolean {
  return false
}

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
