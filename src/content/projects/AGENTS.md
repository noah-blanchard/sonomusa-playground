# src/content/projects — scoped rules

**One directory per project. One `project.ts`. One poster.**

```
<slug>/
  project.ts       required — defineProject({ … })
  poster.webp      required — the static fallback
  thumbnail.webp   optional
  preview.mp4      optional — preview.kind 'video'
  preview.tsx      optional — preview.kind 'component'
  screenshots/01.webp
```

**A manifest is data.** It must not import from `@/features`, `@/app`, `@/components` or `@/styles`. Interactive previews register a `componentId` instead of embedding a component — that is what keeps manifests serializable and a CMS possible later.

**You never register a project anywhere.** `bun run registry:generate` discovers it. Never hand-edit `registry.generated.ts`.

**`media.poster` must exist on disk.** `validate:content` checks. The poster is the floor the entire resilience story rests on.

**`links.live` is optional.** Not every project has a live subdomain yet. When it is absent the frame offers no destination and `status` carries the meaning — never render a dead call to action.

**`slug` is permanent.** It is the route. Renaming one breaks links.

Then:

```bash
bun run validate:content
```

Full detail: `docs/rules/02-content.md`.
