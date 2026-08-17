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
    <div className="relative size-full overflow-hidden bg-(--color-surface-well)">
      <PreviewPoster project={project} priority={priority} {...(sizes && { sizes })} />
      {hasLiveLayer && <LivePreview project={project} />}
    </div>
  )
}
