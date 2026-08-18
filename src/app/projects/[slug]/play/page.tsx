import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { projectRepository, selectHosted } from '@/domain/project'
import { previewPosterUrl } from '@/domain/project/media'
import { ProjectStage } from '@/features/project-experience'

/**
 * The work, running.
 *
 * A sibling of the project page rather than a section inside it, because they
 * answer different questions: `/projects/<slug>` is *what is this*, and this
 * route is *let me use it*. The frame's two calls to action map onto exactly
 * that split.
 *
 * The route exists only for projects that declare an `experience`. Everything
 * else 404s, and `generateStaticParams` never emits them — a URL that resolves
 * to an empty stage would be worse than one that does not resolve.
 */

type Params = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const projects = await projectRepository.getAll()

  return selectHosted(projects).map((project) => ({ slug: project.slug }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const project = await projectRepository.getBySlug(slug)

  if (!project?.experience) return { title: 'Not found' }

  const description = project.shortDescription ?? project.description

  return {
    title: `${project.title} — live`,
    ...(description && { description }),
    alternates: { canonical: `/projects/${project.slug}/play` },
    openGraph: {
      title: `${project.title} — SonoMusa Playground`,
      ...(description && { description }),
      type: 'article',
      images: [{ url: previewPosterUrl(project) }],
    },
  }
}

export default async function ProjectStagePage({ params }: Params) {
  const { slug } = await params
  const project = await projectRepository.getBySlug(slug)

  // Two ways to miss: no such project, or a project with nothing to run.
  if (!project?.experience) notFound()

  /*
   * The plaque carries the same number the gallery gave it, so the stage reads
   * as the same object opened rather than as a different page about it. Derived
   * from position for the same reason it is everywhere else — a stored number
   * can disagree with the order actually rendered.
   */
  const ordered = await projectRepository.getAll()
  const index = ordered.findIndex((candidate) => candidate.slug === project.slug)

  return <ProjectStage project={project} index={index} />
}
