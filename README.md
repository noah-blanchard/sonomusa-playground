# SonoMusa Playground

An evolving digital gallery for heterogeneous creative work — audiovisual pieces, generative systems, games, sound, prototypes, and project types that do not exist yet.

> **SonoMusa owns the frame. Projects own their content.**

The shell controls navigation, typography, spacing, metadata, numbering, transitions and accessibility. Each project controls its own visual language, colour, sound, rendering technology and interaction model. The gallery curates without homogenizing.

---

## Getting started

```bash
bun install
bun dev
```

Then <http://localhost:3000>.

## Adding a project

```bash
mkdir -p src/content/projects/<slug>
# write project.ts, drop in poster.webp
bun run validate:content
```

That is the whole process. The project then appears in the gallery, the index, its own route and its metadata — because all of those derive from the one manifest. You never register it anywhere.

See `docs/rules/02-content.md` for the manifest fields.

## Commands

```bash
bun dev                     # prepare content, then serve
bun run build               # prepare content, then build

bun run validate:content    # manifests parse; declared media exists on disk
bun run registry:check      # the generated registry is current
bun run check:architecture  # no project named in shared UI; domain stays pure
bun run typecheck
bun run lint
bun run test

bun run verify              # all of the above, in the order CI runs them

bun run media:placeholders  # fill in any declared media that is missing
bun run brand:logos         # regenerate logo components from src/assets/brand
```

`bun run verify` is the gate. If it is red, the work is not done.

## How it fits together

```
src/content/projects/**    manifests + media          authored per project
        ↓
src/domain/project/**      schemas · migrations       pure TypeScript, zero React
                           repository · selectors
        ↓
src/features/**            gallery · project-index    React, project-agnostic
                           project-preview
        ↓
src/app/**                 routes · metadata          composition
```

Imports flow downward only, enforced by lint zones rather than by convention.

The load-bearing idea is that **adding a project must never require editing shared code**. A Zod schema is the canonical contract, a repository sits behind a port so the content source can change, and preview kinds resolve through a single typed map. Those are checked by scripts, not trusted.

## Documentation

| | |
| --- | --- |
| `AGENTS.md` | The contract. Read before your first edit. |
| `docs/rules/01-architecture.md` | Layers, boundaries, enforcement |
| `docs/rules/02-content.md` | Adding a project |
| `docs/rules/03-design-system.md` | Tokens, typography, the stencil motif |
| `docs/rules/04-code-quality.md` | TypeScript, server/client boundary, testing |
| `docs/rules/05-experience.md` | Accessibility, reduced motion, performance |
| `docs/adr/` | Decisions, with the reasoning that produced them |
| `docs/deployment.md` | Dokploy, self-hosted |
| `Concept/CONCEPT.md` | The product specification everything derives from |

## Stack

Next 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Zod 4 · Bun · Vitest.

Deployed on self-hosted **Dokploy** via Docker — not Vercel. No animation library: the gallery's transitions are CSS, which handles the mobile layout as a media query and honours `prefers-reduced-motion` at the platform level.

## Status

The architecture is complete and proven. The six projects currently in the gallery are placeholders with generated media — real work replaces them by dropping files in, with no code change.

None of them declares a live URL yet, because no project subdomain has shipped. The frame simply offers no destination and `status` carries the meaning; adding `links.live` to a manifest flips its call to action to the external site.
