# src/content/projects — scoped rules

**One directory per project. One `project.ts`. One poster.**

```
<slug>/
  project.ts       required — defineProject({ … })
  poster.webp      required — the static fallback
  thumbnail.webp   optional
  preview.mp4      optional — preview.kind 'video'
  preview.tsx      optional — preview.kind 'component'
  experience.tsx   optional — the whole piece, on its own route
  screenshots/01.webp
```

**A manifest is data.** It must not import from `@/features`, `@/app`, `@/components` or `@/styles`. Interactive previews register a `componentId` instead of embedding a component — that is what keeps manifests serializable and a CMS possible later.

**A preview is not an experience.** `preview` is what the frame shows at rest and has to be cheap enough for the whole gallery to carry it. `experience` is the work itself, served at `/projects/<slug>/play`, and it is allowed to cost what it costs. Declare it as `experience: { componentId: '<slug>-experience' }`, write `experience.tsx` beside `project.ts`, and register the lazy import in `src/features/project-experience/registry/experiences.ts`. `validate:content` refuses a manifest naming an id nobody registered.

**You never register a project anywhere.** `bun run registry:generate` discovers it. Never hand-edit `registry.generated.ts`.

**`media.poster` must exist on disk.** `validate:content` checks. The poster is the floor the entire resilience story rests on.

**`links.live` is optional, and so is `experience`.** Between them they decide the frame's primary control: `experience` opens the stage here, `links.live` opens the project's own site, and with neither there is no primary control at all — `status` carries the meaning. Never render a dead call to action. A project declaring both prefers the stage.

**`slug` is permanent.** It is the route. Renaming one breaks links.

Then:

```bash
bun run validate:content
```

Full detail: `docs/rules/02-content.md`.
