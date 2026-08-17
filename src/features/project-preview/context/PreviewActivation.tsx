'use client'

import { createContext, useContext, useMemo, type ReactNode } from 'react'

/**
 * Which project the visitor is currently looking at.
 *
 * The gallery owns this state, but preview islands live inside server-rendered
 * cards and cannot receive it as a prop. Context bridges the two: server
 * children render into the client tree, so a client island nested inside them
 * can still read from a client provider above.
 *
 * The dependency points the right way — the gallery imports this provider, not
 * the reverse. project-preview knows nothing about the gallery.
 */
interface PreviewActivation {
  activeSlug: string | null
  /** Set once, from the OS preference, so every renderer agrees. */
  reducedMotion: boolean
}

const PreviewActivationContext = createContext<PreviewActivation>({
  // Defaults chosen so a preview outside any provider stays inert rather than
  // autoplaying — e.g. on a project detail page with no gallery around it.
  activeSlug: null,
  reducedMotion: false,
})

export function PreviewActivationProvider({
  activeSlug,
  reducedMotion,
  children,
}: PreviewActivation & { children: ReactNode }) {
  const value = useMemo(
    () => ({ activeSlug, reducedMotion }),
    [activeSlug, reducedMotion],
  )

  return (
    <PreviewActivationContext.Provider value={value}>{children}</PreviewActivationContext.Provider>
  )
}

export function usePreviewActivation(slug: string) {
  const { activeSlug, reducedMotion } = useContext(PreviewActivationContext)

  return { isActive: activeSlug === slug, reducedMotion }
}
