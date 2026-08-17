import type { Project } from '@/domain/project'
import { ProjectIndexCard } from './ProjectIndexCard'

/**
 * The numbered row beneath the `//` divider on the home page.
 *
 * It is the counterweight to the gallery above it: the carousel shows one
 * project at a time and asks to be explored, this shows the whole collection at
 * a glance and asks to be scanned. Both derive from the same manifests, so
 * neither can disagree with the other about what exists (CONCEPT §26).
 *
 * The same `ProjectIndexCard` as the full index — a second card component would
 * be one more place for the two views to drift apart. The strip contributes
 * width and snap behaviour and nothing else.
 *
 * A Server Component. Scroll-snapping is a CSS behaviour and every card is a
 * link, so the whole strip ships no JavaScript and stays operable by keyboard:
 * tabbing to a card scrolls it into view, which is the same affordance a scroll
 * container would otherwise have to fake.
 */
export function ProjectIndexStrip({ projects }: { projects: readonly Project[] }) {
  if (projects.length === 0) return null

  return (
    /*
     * The scroll lives HERE, on a container bounded by the page's own width.
     * Overflow that escapes to the document is the bug this whole round of work
     * is about — e2e/overflow.spec.ts is what keeps that honest.
     */
    <ul className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
      {projects.map((project, index) => (
        <ProjectIndexCard
          key={project.slug}
          project={project}
          index={index}
          className="w-[14rem] shrink-0 snap-start sm:w-[16rem]"
        />
      ))}
    </ul>
  )
}
