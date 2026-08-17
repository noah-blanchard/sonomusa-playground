import type { PreviewKind } from '@/domain/project'
import { ComponentPreview } from './ComponentPreview'
import { IframePreview } from './IframePreview'
import { StaticPreview } from './StaticPreview'
import { VideoPreview } from './VideoPreview'
import type { PreviewRenderer } from './types'

/**
 * The single mapping from preview kind to renderer (CONCEPT §15).
 *
 * A project declares WHAT KIND of preview it has. The gallery decides HOW that
 * kind renders. This file is the entire seam between those two statements —
 * there is no `if (kind === …)` anywhere else in the codebase, which is what
 * makes a future kind a drop-in rather than a refactor.
 *
 * Adding `webgpu`, `audio`, `canvas` or `remote-stream` later:
 *   1. add the variant to PreviewSchema
 *   2. write the renderer
 *   3. add one line here
 *
 * The Record<PreviewKind, …> type means step 3 cannot be forgotten — omitting
 * a kind is a compile error.
 */
export const previewRenderers: Record<PreviewKind, PreviewRenderer> = {
  static: StaticPreview,
  video: VideoPreview,
  iframe: IframePreview,
  component: ComponentPreview,
}

export function resolvePreviewRenderer(kind: PreviewKind): PreviewRenderer {
  return previewRenderers[kind]
}

export type { PreviewRenderer, PreviewRendererProps } from './types'
