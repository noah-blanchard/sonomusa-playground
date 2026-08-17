import type { Metadata } from 'next'
import { StencilRule } from '@/components/ui/StencilRule'
import { Label } from '@/components/ui/Label'
import { projectRepository } from '@/domain/project'
import { ProjectIndexGrid } from '@/features/project-index'

export const metadata: Metadata = {
  title: 'Index',
  description: 'Every project in the SonoMusa Playground.',
}

/**
 * The full collection.
 *
 * Entirely server-rendered — no JavaScript ships for this route. It is also
 * where every project page is linked from, which is what keeps the detail
 * pages crawlable given that the gallery's own call to action leaves the site.
 *
 * Lives at /projects, NOT /index. `app/index/page.tsx` builds and is listed in
 * the route table, but the router normalizes /index to / and silently serves
 * the home page instead — the build gives no warning at all. /projects is also
 * the better shape, since /projects/[slug] already sits beneath it.
 *
 * The nav still labels it "Index"; that is the editorial name, not the path.
 */
export default async function ProjectIndexPage() {
  const projects = await projectRepository.getAll()

  return (
    <div className="mx-auto max-w-(--layout-max) px-(--layout-gutter-sm) pt-32 pb-24 sm:px-(--layout-gutter)">
      <header className="max-w-2xl">
        <div className="flex items-center gap-4">
          <span aria-hidden className="h-px w-8 bg-(--color-line-strong)" />
          <Label>Index</Label>
        </div>

        <h1 className="mt-8 font-display text-[clamp(2.25rem,5vw,3.5rem)] font-light leading-(--leading-display) tracking-(--tracking-tight) text-(--color-text-primary)">
          Every project.
        </h1>

        <p className="mt-6 max-w-md text-base leading-(--leading-body) text-(--color-text-secondary)">
          A growing collection of interactive works, generative systems and digital explorations.
        </p>
      </header>

      <StencilRule className="my-14" variant="late" />

      <ProjectIndexGrid projects={projects} />
    </div>
  )
}
