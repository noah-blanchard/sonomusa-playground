import { PlaygroundIntro } from '@/components/shell/PlaygroundIntro'
import { Button } from '@/components/ui/Button'
import { Label } from '@/components/ui/Label'
import { StencilRule } from '@/components/ui/StencilRule'
import { projectRepository } from '@/domain/project'
import { GalleryViewport, ProjectFrame } from '@/features/gallery'
import { ProjectIndexStrip } from '@/features/project-index'

/**
 * Home — roughly 70% immersive, 30% informational (CONCEPT §20).
 *
 * A Server Component. It loads projects, renders every frame on the server,
 * and hands them to the client viewport as children. The only JavaScript that
 * ships for the gallery is the interaction layer.
 */
export default async function HomePage() {
  const projects = await projectRepository.getAll()

  // The viewport needs names for labels and announcements; it never sees the
  // projects themselves, which is what keeps it project-agnostic.
  const items = projects.map((project) => ({ slug: project.slug, title: project.title }))

  return (
    <div className="mx-auto max-w-(--layout-max) px-(--layout-gutter-sm) sm:px-(--layout-gutter)">
      <section className="grid min-h-dvh items-center gap-16 pt-28 pb-16 lg:grid-cols-[minmax(0,32%)_minmax(0,1fr)] lg:gap-12">
        <PlaygroundIntro galleryHref="#gallery" />

        <div id="gallery" className="scroll-mt-24">
          {projects.length > 0 ? (
            <GalleryViewport items={items}>
              {projects.map((project, index) => (
                <ProjectFrame
                  key={project.slug}
                  project={project}
                  index={index}
                  // Only the initially active frame is eager; everything else
                  // stays lazy so first paint does not grow with the collection.
                  priority={index === 0}
                />
              ))}
            </GalleryViewport>
          ) : (
            <EmptyGallery />
          )}
        </div>
      </section>

      <div className="flex items-center gap-6 pb-8">
        {/* Braced because a bare `//` in JSX children reads as a comment. */}
        <span aria-hidden className="font-mono text-xs text-(--color-text-secondary)">
          {'//'}
        </span>
        <StencilRule className="flex-1" variant="late" />
      </div>

      <section className="pb-24">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <h2 className="font-display text-2xl font-light leading-(--leading-title) text-(--color-text-primary)">
              Project
              <br />
              Index
            </h2>
            <p className="mt-5 max-w-[26ch] text-sm leading-(--leading-body) text-(--color-text-secondary)">
              A growing collection of interactive works, generative systems and digital
              explorations.
            </p>
          </div>

          <Button href="/projects" icon="arrow-right">
            Browse all projects
          </Button>
        </div>

        <ProjectIndexStrip projects={projects} />
      </section>
    </div>
  )
}

/**
 * The gallery must be presentable with zero projects — it is the state the
 * repository starts in, and a broken empty state is a bad first impression for
 * whoever clones this.
 */
function EmptyGallery() {
  return (
    <div className="stencil-frame flex h-[clamp(20rem,44vh,28rem)] flex-col items-center justify-center gap-4 bg-(--color-surface-raised) p-10 text-center">
      <Label>No projects yet</Label>
      <p className="max-w-[34ch] text-sm leading-(--leading-body) text-(--color-text-secondary)">
        Add a directory under <span className="font-mono">src/content/projects/</span> with a
        manifest and a poster, and it will appear here.
      </p>
    </div>
  )
}
