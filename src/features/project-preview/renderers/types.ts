import type { ComponentType } from 'react'
import type { Project } from '@/domain/project'
import type { PreviewEvent, PreviewStatus } from '@/domain/project/preview/lifecycle'

/**
 * Every renderer sees the same thing: the project, where its lifecycle is, and
 * a way to report progress. Nothing kind-specific appears in the signature —
 * that is what lets the map be uniform and a new kind be a drop-in.
 */
export interface PreviewRendererProps {
  project: Project
  status: PreviewStatus
  dispatch: (event: PreviewEvent) => void
  /** True when this is the frame the visitor is currently looking at. */
  isActive: boolean
  /** Honour reduced motion — no autoplay, no looping movement. */
  reducedMotion: boolean
}

export type PreviewRenderer = ComponentType<PreviewRendererProps>
