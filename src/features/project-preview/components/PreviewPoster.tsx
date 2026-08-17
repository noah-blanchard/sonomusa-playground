import Image from 'next/image'
import type { Project } from '@/domain/project'
import { previewPosterUrl } from '@/domain/project/media'

/**
 * The static floor every preview degrades to.
 *
 * CONCEPT §19: a project must stay presentable when JavaScript fails, an
 * external URL is down, WebGL is unsupported, motion is reduced, or the
 * preview simply has not loaded. This renders in all of those cases, so the
 * gallery never depends on live rendering to show that a project exists.
 *
 * A Server Component — it is markup, not behaviour.
 */
export function PreviewPoster({
  project,
  priority = false,
  sizes = '(max-width: 768px) 100vw, 60vw',
}: {
  project: Project
  /** Set only for the initially active frame; everything else stays lazy. */
  priority?: boolean
  sizes?: string
}) {
  const focal = project.presentation?.focalPoint

  return (
    <Image
      src={previewPosterUrl(project)}
      alt=""
      fill
      priority={priority}
      sizes={sizes}
      className="object-cover"
      style={
        focal ? { objectPosition: `${focal.x * 100}% ${focal.y * 100}%` } : undefined
      }
      /*
       * Decorative: the frame already names the project in real text, so
       * announcing the poster too would just repeat it. See
       * docs/rules/05-experience.md.
       */
      aria-hidden
    />
  )
}
