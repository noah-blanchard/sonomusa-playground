import type { PreviewRendererProps } from './types'

/**
 * The poster is the preview.
 *
 * Renders nothing, because PreviewPoster is already beneath every frame. It
 * exists so the renderer map stays uniform and exhaustive over PreviewKind —
 * a `static` project takes exactly the same path through the system as any
 * other, it simply has nothing to add on top.
 *
 * This is the common case, and the cheapest: no client JavaScript at all.
 */
export function StaticPreview(_props: PreviewRendererProps) {
  return null
}
