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
   * whole transition, so a name applied to a list has to be gated to one item.
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
 * The one name shared between the fronting gallery frame and the stage it
 * opens into. Constant rather than per-project on purpose: only one frame is
 * ever active and only one stage is ever mounted, so a single name is unique at
 * capture time — and no project identifier ever reaches shared code (I3).
 */
export const STAGE_VIEW_TRANSITION = 'gallery-stage'

const Fallback = ({ children }: ViewTransitionProps) => children

export const ViewTransition: ComponentType<ViewTransitionProps> =
  (React as unknown as { ViewTransition?: ComponentType<ViewTransitionProps> })
    .ViewTransition ?? Fallback
