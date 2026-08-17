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
 *
 * Everything here responds to the FRAME's width, not the viewport's. Since the
 * frame became an inset 64% of a gallery column that is itself a fraction of
 * the page, the two stopped tracking each other — a 1024px viewport gives a
 * narrower frame than a 640px one does, because that is where the page splits
 * into two columns. Viewport breakpoints could only ever be right by accident,
 * so the layout is driven by container queries and the title is sized in `cqi`
 * against the panel that has to hold it.
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
    /*
      The container is a wrapper rather than the article itself: a container
      query matches an ANCESTOR container, never the element declaring it, so
      the article cannot switch its own direction on its own width.
    */
    <div className="@container/frame h-full">
      <article className="stencil-frame flex h-full flex-col bg-(--color-surface-raised) @md/frame:flex-row">
        {/*
          A second container, because the title has to fit THIS box rather than
          the frame: `cqi` below resolves against this element's content width,
          so the type stays correct whatever share of the frame the panel takes.
        */}
        <div className="@container/panel flex min-h-0 flex-1 flex-col justify-between gap-4 p-6 @md/frame:w-[44%] @md/frame:flex-none @md/frame:shrink-0 @md/frame:gap-6 @md/frame:p-7 @2xl/frame:p-9">
          <div className="min-h-0">
            <ProjectNumber index={index} />

            {/*
              11.2cqi is the widest a title can be and still fit: an uppercase
              character in the title face averages ~0.74em including tracking,
              and the longest plausible single word is around twelve of them.
              Sized this way a long one-word title shrinks to fit instead of
              running out of the panel, and nothing has to know which title is
              longest. `break-words` is the backstop below the clamp's floor:
              something longer than that wraps rather than bleeding out.
            */}
            <h3 className="mt-5 font-title text-[clamp(1rem,11.2cqi,1.75rem)] font-light uppercase leading-(--leading-title) tracking-(--tracking-wide) text-(--color-text-primary) break-words @md/frame:mt-7">
              {project.title}
            </h3>

            {project.shortDescription && (
              <Label as="p" className="mt-3 !normal-case">
                {project.shortDescription}
              </Label>
            )}

            {/*
              The frame is a fixed-height launcher, not a page. Long prose is
              what overflowed it, so the description appears only once there is
              a panel wide enough to hold it, bounded either way. The project
              page has the rest.
            */}
            {project.description && (
              <p className="mt-5 hidden max-w-[30ch] text-sm leading-(--leading-body) text-(--color-text-secondary) @md/frame:line-clamp-3 @3xl/frame:line-clamp-5">
                {project.description}
              </p>
            )}
          </div>

          <div className="shrink-0">
            <StencilRule className="mb-4 @md/frame:mb-5" variant="late" />

            <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 @md/frame:mb-6">
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
                  resolves to "View <title>" rather than a bare "View project"
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

        {/*
          Stacked, the well takes a fixed share of the frame's height so the
          text above it can never squeeze it to nothing. Side by side it takes
          whatever the panel leaves.
        */}
        <div className="relative min-h-0 basis-[38%] overflow-hidden @md/frame:flex-1 @md/frame:basis-auto">
          <ProjectPreview
            project={project}
            priority={priority}
            sizes="(max-width: 767px) 100vw, 40vw"
          />
        </div>
      </article>
    </div>
  )
}
