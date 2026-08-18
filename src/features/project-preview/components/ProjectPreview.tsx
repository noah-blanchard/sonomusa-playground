import type { Project } from '@/domain/project'
import { LivePreview } from './LivePreview'
import { PreviewPoster } from './PreviewPoster'

/**
 * A project's preview viewport.
 *
 * A SERVER component, and that is the point. The poster always renders on the
 * server, and a client island is mounted on top only for kinds that have
 * behaviour. A `static` project — the common case — ships zero client
 * JavaScript for its preview, so the homepage cost does not grow with the
 * collection (CONCEPT §31).
 *
 * `project` crosses the boundary as a prop because the domain model is
 * serializable by design. That is the payoff for keeping React out of manifests.
 */
export function ProjectPreview({
  project,
  priority = false,
  sizes,
}: {
  project: Project
  /** Set only for the initially active frame; everything else stays lazy. */
  priority?: boolean
  sizes?: string
}) {
  const hasLiveLayer = project.preview.kind !== 'static'

  return (
    <div
      /*
       * The only common ancestor of the poster, the video, the iframe and a
       * component preview's canvas — so one filter here covers every preview
       * kind, and no renderer has to know about saturation. The gallery uses
       * it to desaturate everything but the fronting project; nothing styles
       * it elsewhere, so the detail page's hero stays in colour.
       */
      data-project-media
      className="relative size-full overflow-hidden bg-(--color-surface-well)"
    >
      <PreviewPoster project={project} priority={priority} {...(sizes && { sizes })} />
      {/*
        A preview shows the work; it is never a control. The live layer may
        move — an iframe plays, a video loops, a canvas animates — but it takes
        no clicks, so a visitor exploring the frame can never fall into the
        piece by accident. Interaction belongs to the stage, one route away.
      */}
      {hasLiveLayer && (
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <LivePreview project={project} />
        </div>
      )}
    </div>
  )
}
