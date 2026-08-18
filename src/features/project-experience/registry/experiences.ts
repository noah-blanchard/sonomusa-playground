import { lazy, type ComponentType } from 'react'

/**
 * Experiences the playground hosts itself, keyed by `componentId`.
 *
 * The sibling of `src/features/project-preview/registry/componentPreviews.ts`,
 * and deliberately a second registry rather than an extension of that one: a
 * preview is a two-second loop the frame shows at rest, and an experience is
 * the work itself. They have different props, different lifecycles and very
 * different bundle weights. Keeping the maps apart is what stops a heavy
 * experience chunk from being reachable from the homepage.
 *
 * This file naming project slugs is not a violation of invariant I3: it is a
 * registry, which is the sanctioned place for that mapping. Shared UI still
 * resolves experiences by id and knows nothing about which projects exist.
 *
 * To add one:
 *   1. write src/content/projects/<slug>/experience.tsx
 *   2. add a line here, e.g.
 *        'morphwave-experience': lazy(() => import('@/content/projects/morphwave/experience')),
 *   3. set `experience: { componentId: '<id>' }` in the manifest
 *
 * `bun run validate:content` fails the build if a manifest names an id that is
 * not registered here, so step 3 cannot ship without step 2.
 */

/**
 * What an experience receives. Notably NOT `isActive` — a stage is the only
 * thing on its route, so it is active by definition. That is the whole
 * difference from `ComponentPreviewProps`.
 */
export interface ProjectExperienceProps {
  reducedMotion: boolean
  /** Call when the first frame is painted. Until then the stage holds its poster. */
  onReady: () => void
  /** Call instead of throwing when the work cannot start. Never leave a blank stage. */
  onError: (reason: string) => void
}

export type ProjectExperienceModule = ComponentType<ProjectExperienceProps>

export const projectExperienceRegistry: Record<string, ProjectExperienceModule> = {
  'musicphone-experience': lazy(() => import('@/content/projects/musicphone/experience')),
  'zoomquilt-experience': lazy(() => import('@/content/projects/zoomquilt/experience')),
}

export function resolveProjectExperience(componentId: string): ProjectExperienceModule | null {
  // `hasOwn`, not a bare lookup: an id of "toString" or "constructor" would
  // otherwise resolve to something off Object.prototype and be handed to React
  // as a component. Manifest ids are authored, not user input — but a stage
  // that renders Object.prototype.toString is a hard crash on a route the
  // visitor deliberately opened, and this is one call.
  return Object.hasOwn(projectExperienceRegistry, componentId)
    ? (projectExperienceRegistry[componentId] ?? null)
    : null
}

export function registeredExperienceIds(): string[] {
  return Object.keys(projectExperienceRegistry).sort()
}
