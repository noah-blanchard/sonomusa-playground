import type { Project } from '@/domain/project'
import { Label } from '@/components/ui/Label'
import { ProjectIndexCard } from './ProjectIndexCard'

/**
 * The rational counterpart to the immersive gallery (CONCEPT §26).
 *
 * A plain list, marked up as one. Search, tags, filters and sort are all
 * derivable from the same validated projects via the domain selectors — none of
 * them is built yet, because the collection is small and CONCEPT §26 warns
 * against overbuilding taxonomy before there is anything to taxonomize.
 * Adding one later is a component above this, not a change to it.
 */
export function ProjectIndexGrid({ projects }: { projects: readonly Project[] }) {
  if (projects.length === 0) {
    return (
      <p className="text-sm leading-(--leading-body) text-(--color-text-secondary)">
        No projects yet. Add a directory under{' '}
        <span className="font-mono">src/content/projects/</span> to populate the index.
      </p>
    )
  }

  return (
    <>
      <Label as="p" className="mb-8 block">
        {projects.length} {projects.length === 1 ? 'project' : 'projects'}
      </Label>

      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {projects.map((project, index) => (
          <ProjectIndexCard key={project.slug} project={project} index={index} />
        ))}
      </ul>
    </>
  )
}
