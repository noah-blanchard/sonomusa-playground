/**
 * Public surface of the gallery feature.
 *
 * Routes compose these two: server-rendered frames passed as children into the
 * client viewport.
 */

export { GalleryViewport } from './components/GalleryViewport'
export { ProjectFrame } from './components/ProjectFrame'
export { depthStyle, mobileDepthStyle, signedOffset, VISIBLE_NEIGHBOURS } from './lib/depth'
export type { DepthStyle } from './lib/depth'
export { createGalleryState, galleryReducer } from './lib/galleryReducer'
export type { GalleryAction, GalleryState } from './lib/galleryReducer'
