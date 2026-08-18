import type { CSSProperties } from 'react'
import { Label } from '@/components/ui/Label'
import { ProjectNumber } from '@/components/ui/ProjectNumber'
import { StencilRule } from '@/components/ui/StencilRule'
import { stageViewTransitionName, ViewTransition } from '@/components/ui/ViewTransition'
import type { Project } from '@/domain/project'
import { PreviewPoster } from '@/features/project-preview'
import { ExperienceMount } from './ExperienceMount'
import { StageExit } from './StageExit'

/**
 * The work, full bleed.
 *
 * This is the far end of the gallery frame: the same object, opened. It keeps
 * the frame's division of labour exactly — SonoMusa owns the plaque, the way
 * out and the proportions; the project owns every pixel inside the surface
 * (CONCEPT §22). Nothing here knows which project it is showing.
 *
 * A Server Component, and almost all of it is markup. The poster paints first
 * and stays underneath everything, so the stage is never an empty black
 * rectangle — not while the chunk loads, not if it fails, not with JavaScript
 * off entirely.
 *
 * The site header is already `position: fixed`, so this section runs genuinely
 * edge to edge beneath it with no layout to restructure. The plaque sits at the
 * bottom, well clear of it.
 */
export function ProjectStage({ project, index }: { project: Project; index: number }) {
  const componentId = project.experience?.componentId
  const accent = project.presentation?.accent

  return (
    /*
     * The far end of the pair. This project's own gallery frame carries the
     * same name, so the browser moves one object from card to full screen
     * instead of cutting between two pages — and because the name is the
     * project's, going back lands on the card the visitor actually left. Where
     * view transitions are unsupported this renders as a plain section and the
     * navigation is simply instant.
     */
    <ViewTransition name={stageViewTransitionName(project.slug)} share="morph" default="none">
    <section
      aria-labelledby="stage-title"
      className="project-stage relative h-dvh w-full overflow-hidden bg-(--color-surface-well)"
      style={accent ? ({ '--stage-accent': accent } as CSSProperties) : undefined}
    >
      {/* The floor. Everything above it is an enhancement that may not arrive. */}
      <div data-project-media className="absolute inset-0">
        <PreviewPoster project={project} priority sizes="100vw" />
      </div>

      {componentId && <ExperienceMount componentId={componentId} title={project.title} />}

      {/*
        Over the work, not under it. A scrim rather than a solid: the bottom of
        the piece should still read while the plaque on top of it stays legible
        whatever the piece happens to be doing down there.
      */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-linear-to-t from-(--color-obsidian) to-transparent"
      />

      <div className="absolute inset-x-0 bottom-0 px-(--layout-gutter-sm) pb-8 sm:px-(--layout-gutter)">
        <div className="mx-auto max-w-(--layout-max)">
          <StencilRule className="mb-5" variant="late" />

          <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <ProjectNumber index={index} />
              {/*
                The page's only heading, and it belongs on the plaque rather
                than floating over the work: the visitor came here to use the
                piece, not to read a title over it. An h1 in label type is still
                an h1 — the outline is what has to be right, not the point size.
              */}
              <Label as="h1" id="stage-title" tone="primary">
                {project.title}
              </Label>
              <Label>{project.status}</Label>
              {project.year && <Label>{project.year}</Label>}
            </div>

            <StageExit slug={project.slug} title={project.title} />
          </div>
        </div>
      </div>
    </section>
    </ViewTransition>
  )
}
