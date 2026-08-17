import type { Project } from './types'

/**
 * Resolves manifest filenames to servable URLs.
 *
 * Manifests reference media by filename relative to the project's own
 * directory (`poster.webp`), which keeps projects self-contained (CONCEPT §12)
 * and keeps manifests serializable. Assets are synced from the content
 * directory into `public/projects/<slug>/` at dev and build time, because Next
 * cannot serve files out of `src/`.
 *
 * This module is the single place that knows about that mapping. Moving media
 * to remote storage later (CONCEPT §39, §40) changes these functions and
 * nothing else — no manifest, no component.
 */

export const MEDIA_BASE_PATH = '/projects'

export function resolveMediaUrl(slug: string, file: string): string {
  // Encode each segment so filenames with spaces or unicode survive, without
  // encoding the separators themselves.
  const encoded = file
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')

  return `${MEDIA_BASE_PATH}/${slug}/${encoded}`
}

/** Always present — the fallback everything else degrades to (CONCEPT §19). */
export function posterUrl(project: Project): string {
  return resolveMediaUrl(project.slug, project.media.poster)
}

/** Index strip image, falling back to the poster so callers need no branch. */
export function thumbnailUrl(project: Project): string {
  return resolveMediaUrl(project.slug, project.media.thumbnail ?? project.media.poster)
}

export function screenshotUrls(project: Project): string[] {
  return project.media.screenshots.map((file) => resolveMediaUrl(project.slug, file))
}

/**
 * The image a preview frame shows before — or instead of — anything live.
 *
 * A `static` preview may override the poster; a `video` preview may declare its
 * own still. Everything else falls back to the project poster.
 */
export function previewPosterUrl(project: Project): string {
  const { preview } = project

  if (preview.kind === 'static' && preview.src) {
    return resolveMediaUrl(project.slug, preview.src)
  }

  if (preview.kind === 'video' && preview.poster) {
    return resolveMediaUrl(project.slug, preview.poster)
  }

  return posterUrl(project)
}
