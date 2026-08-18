import * as React from 'react'
import type { ComponentType, ReactNode } from 'react'

/**
 * React's `<ViewTransition>`, with types and a floor.
 *
 * Next 16 aliases `react` to its own bundled build for the App Router, and that
 * build exports `ViewTransition` — but `@types/react@19` does not declare it
 * yet, so the export is invisible to TypeScript. The alternative to this file
 * was a `declare module 'react'` augmentation, which types the symbol without
 * proving it exists; this reads the real export and therefore cannot be wrong
 * about it.
 *
 * When the export is missing — a React that renames it, or a test environment
 * resolving the unaliased `react` package — the fallback renders the children
 * and nothing else happens. That is exactly the right failure: view transitions
 * are an enhancement over a real navigation, and the navigation still works.
 *
 * Delete this file the day `@types/react` ships the declaration; the call sites
 * change only their import.
 *
 * @see node_modules/next/dist/docs/01-app/02-guides/view-transitions.md
 */

export interface ViewTransitionProps {
  /**
   * The identity that pairs an element on the old page with one on the new.
   * Must be unique in the document at capture time — a duplicate aborts the
   * whole transition, so a name applied to a list has to be derived per item
   * rather than moved between them.
   */
  name?: string
  /** Class applied when this element is paired with one of the same name. */
  share?: string | Record<string, string>
  enter?: string | Record<string, string>
  exit?: string | Record<string, string>
  /** `"none"` keeps a named element out of every transition it is not part of. */
  default?: string
  children?: ReactNode
}

/**
 * The name shared between a gallery frame and the stage it opens into.
 *
 * Derived from the slug rather than fixed. React releases a name only when the
 * component holding it unmounts, so a single constant handed from the outgoing
 * frame to the incoming one on every carousel move leaves both registered at
 * once — which React reports as a duplicate and which aborts the transition it
 * was meant to enable. A name per frame never migrates, so nothing is ever
 * registered twice and the pair is the *same* project at both ends: arriving
 * from the third card and going back to it morph the same object.
 *
 * A derived name is not a project named in shared code (I3). This file has no
 * idea which slugs exist; it is handed one, and the stage builds the same
 * string from the project it was handed.
 */
export function stageViewTransitionName(slug: string): string {
  return `gallery-stage-${slug}`
}

const Fallback = ({ children }: ViewTransitionProps) => children

export const ViewTransition: ComponentType<ViewTransitionProps> =
  (React as unknown as { ViewTransition?: ComponentType<ViewTransitionProps> })
    .ViewTransition ?? Fallback
