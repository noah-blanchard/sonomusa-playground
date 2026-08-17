import { lazy, type ComponentType } from 'react'

/**
 * Interactive previews implemented in this repository, keyed by `componentId`.
 *
 * This is the one place dynamic imports for project code live (CONCEPT §16).
 * Centralizing them keeps manifests serializable — a manifest declares an id,
 * never a component — and keeps every heavy bundle boundary visible in a single
 * file rather than scattered across the gallery.
 *
 * This file naming project slugs is not a violation of invariant I3: it is a
 * registry, which is the sanctioned place for that mapping. Shared UI still
 * resolves previews by id and knows nothing about which projects exist.
 *
 * To add one:
 *   1. write src/content/projects/<slug>/preview.tsx
 *   2. add a line here, e.g.
 *        'morphwave-preview': lazy(() => import('@/content/projects/morphwave/preview')),
 *   3. set `preview: { kind: 'component', componentId: '<id>' }` in the manifest
 */
export interface ComponentPreviewProps {
  isActive: boolean
  reducedMotion: boolean
  onReady: () => void
  onError: (reason: string) => void
}

export type ComponentPreviewModule = ComponentType<ComponentPreviewProps>

export const componentPreviewRegistry: Record<string, ComponentPreviewModule> = {
  'musai-preview': lazy(() => import('@/content/projects/musai/preview')),
}

export function resolveComponentPreview(componentId: string): ComponentPreviewModule | null {
  return componentPreviewRegistry[componentId] ?? null
}

export function registeredComponentIds(): string[] {
  return Object.keys(componentPreviewRegistry).sort()
}
