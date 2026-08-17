import Link from 'next/link'
import type { Project } from '@/domain/project'
import { ProjectPreview } from '@/features/project-preview'
import { Label } from '@/components/ui/Label'
import { ProjectNumber } from '@/components/ui/ProjectNumber'
import { StencilRule } from '@/components/ui/StencilRule'

/**
 * A neutral exhibition frame.
 *
 * The frame owns number, title, status, tags, proportions and the way in. The
 * project owns everything inside the media well — colour, motion, noise,
 * whatever it is. That division is the entire product idea (CONCEPT §22): the
 * set looks intentional together without any project being forced to look like
 * the others.
 *
 * A Server Component. It renders inside the client viewport as `children`, so
 * project content never hydrates — only the interaction layer does.
 */
export function ProjectFrame({
  project,
  index,
  priority = false,
}: {
  project: Project
  index: number
  priority?: boolean
}) {
  /*
   * Projects live on their own subdomains, so the primary action leaves the
   * site. When a project has not shipped one yet, the detail page is the
   * destination instead — and `status` is what explains why. A dead call to
   * action is worse than none (docs/rules/02-content.md).
   */
  const live = project.links.live
  const href = live ?? `/projects/${project.slug}`

  return (
    <article className="stencil-frame flex h-full flex-col bg-(--color-surface-raised) md:flex-row">
      <div className="flex flex-col justify-between gap-8 p-7 md:w-[38%] md:shrink-0 md:p-9">
        <div>
          <ProjectNumber index={index} />

          <h3 className="mt-7 font-title text-2xl font-light uppercase tracking-(--tracking-wide) text-(--color-text-primary) md:text-[1.75rem]">
            {project.title}
          </h3>

          {project.shortDescription && (
            <Label as="p" className="mt-3 !normal-case">
              {project.shortDescription}
            </Label>
          )}

          {project.description && (
            <p className="mt-6 max-w-[28ch] text-sm leading-(--leading-body) text-(--color-text-secondary)">
              {project.description}
            </p>
          )}
        </div>

        <div>
          <StencilRule className="mb-5" variant="late" />

          <div className="mb-6 flex flex-wrap items-center gap-x-5 gap-y-2">
            <Label>{project.status}</Label>
            {project.year && <Label>{project.year}</Label>}
            {project.tags.slice(0, 2).map((tag) => (
              <Label key={tag}>{tag}</Label>
            ))}
          </div>

          <Link
            href={href}
            {...(live && { target: '_blank', rel: 'noreferrer noopener' })}
            className="stencil-focus group inline-flex items-center gap-4 py-1"
          >
            {/* The project title is inside the accessible name, so the link
                resolves to "View Morphwave" rather than a bare "View project"
                repeated down the page. */}
            <span className="sr-only">
              View {project.title}
              {live ? ' (opens in a new tab)' : ''}
            </span>

            <Label aria-hidden tone="primary" className="stencil-underline pb-2">
              View project
            </Label>

            <span
              aria-hidden
              className="font-mono text-sm text-(--color-text-primary) transition-transform duration-(--duration-base) ease-(--ease-standard) group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
            >
              {live ? '↗' : '→'}
            </span>
          </Link>
        </div>
      </div>

      <div className="relative min-h-56 flex-1 md:min-h-0">
        <ProjectPreview
          project={project}
          priority={priority}
          sizes="(max-width: 768px) 100vw, 45vw"
        />
      </div>
    </article>
  )
}
