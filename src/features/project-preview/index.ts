/**
 * Public surface of the preview feature.
 *
 * The gallery and the project routes consume these; nothing reaches past them
 * into the renderers or the registry.
 */

export { ProjectPreview } from './components/ProjectPreview'
export { PreviewPoster } from './components/PreviewPoster'
export { PreviewErrorBoundary } from './components/PreviewErrorBoundary'
export { PreviewActivationProvider, usePreviewActivation } from './context/PreviewActivation'
export { previewRenderers, resolvePreviewRenderer } from './renderers'
export type { PreviewRenderer, PreviewRendererProps } from './renderers'
export {
  registeredComponentIds,
  resolveComponentPreview,
  type ComponentPreviewProps,
} from './registry/componentPreviews'
