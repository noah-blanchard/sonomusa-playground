import Image from 'next/image'
import Link from 'next/link'
import type { Project } from '@/domain/project'
import { thumbnailUrl } from '@/domain/project/media'
import { Label } from '@/components/ui/Label'
import { ProjectNumber } from '@/components/ui/ProjectNumber'

/**
 * One numbered card in the index.
 *
 * Always links to the project's own page rather than straight to its
 * subdomain. The gallery is the launcher; the index is the map — and it is
 * what makes every detail page reachable and crawlable, which the external CTA
 * on the gallery card would otherwise leave orphaned.
 *
 * A Server Component. The whole index ships no JavaScript.
 */
export function ProjectIndexCard({
  project,
  index,
  className,
}: {
  project: Project
  index: number
  /**
   * Placement only — sizing and snap behaviour belong to whichever list is
   * holding the card. The grid needs nothing; the horizontal strip needs a
   * width. Everything inside the card stays the card's own business.
   */
  className?: string
}) {
  return (
    <li className={className}>
      <Link
        href={`/projects/${project.slug}`}
        className="stencil-focus stencil-frame group flex h-full flex-col bg-(--color-surface-raised) p-4 transition-colors duration-(--duration-base) hover:bg-(--color-surface-well)"
      >
        <ProjectNumber index={index} />

        <div className="relative mt-4 aspect-4/3 overflow-hidden bg-(--color-surface-well)">
          <Image
            src={thumbnailUrl(project)}
            alt=""
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
            className="media-reveal object-cover transition-transform duration-(--duration-slow) ease-(--ease-standard) group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            // Decorative: the title below is the real accessible name.
            aria-hidden
          />
        </div>

        <div className="mt-5 flex flex-1 flex-col justify-between gap-3">
          <h3 className="font-title text-sm uppercase tracking-(--tracking-wide) text-(--color-text-primary)">
            {project.title}
          </h3>

          {/* Sparse data is normal — every field below is optional. */}
          {project.shortDescription ? (
            <Label as="p">{project.shortDescription}</Label>
          ) : (
            <Label as="p">{project.status}</Label>
          )}
        </div>
      </Link>
    </li>
  )
}
