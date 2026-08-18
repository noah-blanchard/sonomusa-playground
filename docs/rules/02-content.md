# 02 — Content authoring

How to add a project. This should be the shortest interesting document in the repository, and it should stay that way.

---

## Adding a project

```bash
mkdir -p src/content/projects/<slug>
# write project.ts, drop in poster.webp
bun run validate:content
bun dev
```

The project then appears in the gallery, the index, its own route, and its metadata — because all of those derive from the one manifest. You do not register it anywhere.

## The directory

```
src/content/projects/<slug>/
  project.ts            required — the manifest
  poster.webp           required — the static fallback
  thumbnail.webp        optional — index strip; falls back to poster
  preview.mp4           optional — only for preview.kind 'video'
  preview.tsx           optional — only for preview.kind 'component'
  screenshots/
    01.webp
    02.webp
```

Naming is conventional on purpose: predictable names mean less special-case code and less guessing for whoever — or whatever — reads this next.

## The manifest

```ts
import { defineProject } from '@/domain/project/defineProject'

export const project = defineProject({
  schemaVersion: 1,
  slug: 'morphwave',
  title: 'Morphwave',
  year: 2025,
  shortDescription: 'Audio reactive visual experiment',
  description: 'An exploration of wave interference and organic transformation.',
  status: 'live',
  tags: ['audio', 'generative'],
  featured: true,
  order: 1,
  media: { poster: 'poster.webp' },
  preview: { kind: 'static' },
  links: { live: 'https://morphwave.sonomusa.com' },
  technologies: ['WebGL', 'Web Audio API'],
})
```

`defineProject` validates at author time, applies defaults, and preserves type inference. A bad manifest fails immediately with the offending file path, not three layers later in a component.

## Field notes

**`slug`** — lowercase, hyphenated, URL-safe, unique. It is the route and it is permanent. Renaming one breaks links.

**`status`** — `live` · `prototype` · `wip` · `archive`. This is real information, not decoration: it is what the frame says when there is no live URL to offer.

**`order`** — controls gallery sequence. Must be unique; `validate:content` rejects collisions. Projects without one sort after those with one.

**`media.poster`** — required, and it must actually exist on disk. This is the fallback the entire resilience story rests on (CONCEPT §19): the gallery must never depend on live rendering to communicate that a project exists.

**`links.live`** — optional. Projects live on their own subdomains and not every project has shipped one yet. When it is absent the frame simply offers no destination and lets `status` carry the meaning. Never render a dead call to action.

**`preview.kind`** — what renders *inside the frame*:

| Kind | Use when |
| --- | --- |
| `static` | The poster is the preview. The common case, and the right default. |
| `video` | A short muted loop communicates the work better than a still. |
| `iframe` | The live piece can be safely embedded and sandboxed. |
| `component` | The preview is implemented in this repository. Register a `componentId`. |

Reach for `static` first. A preview kind is a cost — in bytes, in failure modes, in attention taken from the work.

## Interactive previews

Never put a React component in the manifest. Manifests must stay serializable — that is what keeps a CMS possible later.

```ts
preview: { kind: 'component', componentId: 'morphwave-preview' }
```

Then register the lazy import in `src/features/project-preview/registry/componentPreviews.ts`. That file is the one central place where heavy code is dynamically imported, so the bundle boundaries stay visible.

Your preview must: render nothing heavy until activated, unload when inactive, and fall back to the poster on failure. A project is never permitted to degrade the gallery (CONCEPT §17).

## Assets

- **`.webp`** for stills. Posters around 1600px on the long edge.
- **`.mp4`** (H.264) for video previews. Muted, loopable, and short — a few seconds, not a film.
- Optimize before committing. The repository is not an image pipeline.
- Media is referenced by filename relative to the project directory, never by absolute path. That keeps remote assets possible later without touching manifests.

## Declaring a colour

`presentation.accent` is an optional six-digit hex — a project's own colour, in its own hands.

```ts
presentation: { accent: '#2FD3C0' },
```

One value, two uses. It draws the placeholder artwork, and it colours the ambient field the gallery puts around the project while it is fronting. Declaring it in two places would let them disagree, which is what invariant I2 exists to prevent.

Absence is valid and means bone. It is not a licence to colour the shell: the accent never touches navigation, type or chrome, which stay bone on obsidian (CONCEPT §24).

Two things worth knowing when the art is generated rather than real:

- The generator **never overwrites** — a real poster that lands survives every run. Pass `--force` only when the generator itself has changed and its own output needs redrawing.
- Next caches optimized images by URL, not by content. Replacing a poster in place leaves the old optimization being served; clear `.next/cache/images` after regenerating.

## What does not belong here

A manifest is data. It must not import from `src/features/`, `src/app/`, `src/components/` or `src/styles/` — ESLint will stop you. If a project needs bespoke presentation, it goes behind a `componentId` or a custom route, never inline in the content layer.
