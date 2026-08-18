import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Label } from '@/components/ui/Label'
import { ProjectNumber } from '@/components/ui/ProjectNumber'
import { StencilRule } from '@/components/ui/StencilRule'
import { projectRepository, selectRelated } from '@/domain/project'
import { previewPosterUrl, screenshotUrls } from '@/domain/project/media'
import { ProjectPreview } from '@/features/project-preview'

/**
 * A project's own page.
 *
 * Everything here derives from the manifest — copy, metadata, media, links.
 * Nothing is written twice, which is invariant I2.
 *
 * **Every section is conditional.** Sparse projects are the normal case, not
 * an edge case (CONCEPT §28): a work-in-progress with a title and a poster has
 * to look deliberate, not broken.
 */

type Params = { params: Promise<{ slug: string }> }

/** Pre-renders every project at build time, straight from the registry. */
export async function generateStaticParams() {
  const projects = await projectRepository.getAll()

  return projects.map((project) => ({ slug: project.slug }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const project = await projectRepository.getBySlug(slug)

  if (!project) return { title: 'Not found' }

  const description = project.description ?? project.shortDescription

  return {
    title: project.title,
    ...(description && { description }),
    alternates: { canonical: `/projects/${project.slug}` },
    openGraph: {
      title: `${project.title} — SonoMusa Playground`,
      ...(description && { description }),
      type: 'article',
      // The poster doubles as the share image; there is no separate SEO config
      // per project, and no second place for it to fall out of date.
      images: [{ url: previewPosterUrl(project) }],
    },
  }
}

export default async function ProjectPage({ params }: Params) {
  const { slug } = await params
  const project = await projectRepository.getBySlug(slug)

  if (!project) notFound()

  const allProjects = await projectRepository.getAll()
  const index = allProjects.findIndex((candidate) => candidate.slug === project.slug)
  const related = selectRelated(allProjects, project)
  const screenshots = screenshotUrls(project)

  const links = [
    project.links.live && { href: project.links.live, label: 'Visit the project' },
    project.links.source && { href: project.links.source, label: 'Source' },
    project.links.repository && { href: project.links.repository, label: 'Repository' },
  ].filter(Boolean) as { href: string; label: string }[]

  return (
    <article className="mx-auto max-w-(--layout-max) px-(--layout-gutter-sm) pt-32 pb-24 sm:px-(--layout-gutter)">
      <header className="grid gap-10 lg:grid-cols-[minmax(0,34%)_minmax(0,1fr)] lg:gap-16">
        <div>
          {index >= 0 && <ProjectNumber index={index} />}

          <h1 className="mt-6 font-title text-[clamp(2rem,4.5vw,3rem)] font-light uppercase tracking-(--tracking-wide) text-(--color-text-primary)">
            {project.title}
          </h1>

          {project.shortDescription && (
            <p className="mt-4 text-sm leading-(--leading-body) text-(--color-text-secondary)">
              {project.shortDescription}
            </p>
          )}

          <StencilRule className="my-8" variant="late" />

          <dl className="space-y-4">
            <Meta term="Status" value={project.status} />
            {project.year && <Meta term="Year" value={String(project.year)} />}
            {project.technologies.length > 0 && (
              <Meta term="Built with" value={project.technologies.join(', ')} />
            )}
            {project.tags.length > 0 && <Meta term="Tags" value={project.tags.join(', ')} />}
          </dl>

          {links.length > 0 && (
            <ul className="mt-10 space-y-3">
              {links.map((link) => (
                <li key={link.href}>
                  <Button href={link.href} external className="gap-3">
                    {link.label}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="relative aspect-16/10 overflow-hidden lg:aspect-4/3">
          <ProjectPreview project={project} priority sizes="(max-width: 1024px) 100vw, 62vw" />
        </div>
      </header>

      {project.description && (
        <section className="mt-20 max-w-2xl">
          <Label as="h2">About</Label>
          <p className="mt-6 text-lg leading-(--leading-body) text-balance text-(--color-text-primary)">
            {project.description}
          </p>
        </section>
      )}

      {screenshots.length > 0 && (
        <section className="mt-20">
          <Label as="h2">Stills</Label>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {screenshots.map((src, position) => (
              <li key={src} className="relative aspect-16/10 overflow-hidden bg-(--color-surface-well)">
                <Image
                  src={src}
                  alt={`${project.title} — still ${position + 1}`}
                  fill
                  sizes="(max-width: 640px) 100vw, 45vw"
                  className="object-cover"
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {project.credits.length > 0 && (
        <section className="mt-20 max-w-2xl">
          <Label as="h2">Credits</Label>
          <dl className="mt-6 space-y-3">
            {project.credits.map((credit) => (
              <div key={`${credit.label}-${credit.value}`} className="flex flex-wrap gap-x-6 gap-y-1">
                <dt className="w-32 shrink-0">
                  <Label>{credit.label}</Label>
                </dt>
                <dd className="text-sm text-(--color-text-primary)">
                  {credit.url ? (
                    <a
                      href={credit.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="stencil-focus stencil-underline pb-0.5"
                    >
                      {credit.value}
                    </a>
                  ) : (
                    credit.value
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {related.length > 0 && (
        <section className="mt-24">
          <StencilRule className="mb-10" />
          <Label as="h2">Related</Label>
          <ul className="mt-8 flex flex-wrap gap-x-10 gap-y-4">
            {related.map((other) => (
              <li key={other.slug}>
                <Link
                  href={`/projects/${other.slug}`}
                  className="stencil-focus font-title text-lg uppercase tracking-(--tracking-wide) text-(--color-text-secondary) transition-colors duration-(--duration-fast) hover:text-(--color-text-primary)"
                >
                  {other.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <nav className="mt-24 flex flex-wrap items-center gap-x-8 gap-y-4" aria-label="Back">
        {/*
          Home carries the slug so the carousel opens on this project — the
          visitor lands back on the frame they were reading about, not on the
          first frame of the set.
        */}
        <Button
          variant="ghost"
          tone="secondary"
          href={`/?project=${project.slug}`}
          icon="arrow-left"
          iconPosition="leading"
          className="gap-4"
        >
          Back to gallery
        </Button>

        <Button
          variant="ghost"
          tone="secondary"
          href="/projects"
          icon="arrow-right"
          className="gap-4"
        >
          All projects
        </Button>
      </nav>
    </article>
  )
}

function Meta({ term, value }: { term: string; value: string }) {
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-1">
      <dt className="w-24 shrink-0">
        <Label>{term}</Label>
      </dt>
      <dd className="text-sm text-(--color-text-primary)">{value}</dd>
    </div>
  )
}
