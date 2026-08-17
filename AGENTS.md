# AGENTS.md — SonoMusa Playground

**This file is normative.** It is the contract for every agent and every developer working in this repository. It is tool-agnostic; `CLAUDE.md` and any other assistant-specific file defer to it.

Read this file before your first edit. Read the scoped `AGENTS.md` in whichever directory you are about to touch.

---

## 1. What this is

SonoMusa Playground is an evolving digital gallery for heterogeneous creative work — audiovisual pieces, generative systems, games, sound, prototypes, and project types that do not exist yet.

It is **not** a portfolio, a landing page, or a feed. The distinction that governs every decision:

> **SonoMusa owns the frame. Projects own their content.**

The shell controls navigation, typography, spacing, metadata, numbering, transitions and accessibility. Each project controls its own visual language, colour, sound, rendering technology and interaction model. The gallery curates without homogenizing.

The full product specification is `Concept/CONCEPT.md`. This file is the operational subset — what you must actually obey while writing code. Where the two disagree, CONCEPT wins and this file is wrong and should be fixed.

---

## 2. The five invariants

These are non-negotiable. Each is machine-checked; the check is named beside it.

**I1 — One project contract.**
Every project conforms to the versioned schema in `src/domain/project/schemas/`. Shared UI never consumes an ad-hoc object.
→ `bun run validate:content`

**I2 — The manifest is the only source of truth.**
Routes, SEO metadata, index entries, ordering, media and status all derive from `project.ts`. The same fact is never written in two places.
→ `bun run validate:content`

**I3 — No project is ever named in shared code.**
No `slug === 'morphwave'`, no per-project branch, no project-specific CSS in the shell. Adding a project must not modify the carousel, the index, the cards, the routes or the navigation.
→ `bun run check:architecture`

**I4 — Invalid content fails the build.**
Static types are not enough. Manifests are parsed with Zod at load, in development, and in CI. A malformed project never reaches a deployment.
→ `bun run validate:content`, and `next.config.ts` refuses to build past type or lint errors.

**I5 — The domain layer is pure.**
`src/domain/**` imports no React, no Next, no animation library, and nothing from `src/features/**` or `src/app/**`.
→ `bun run lint` (see `eslint.config.mjs`)

If you believe an invariant must be broken, stop and say so explicitly, with the reason. Do not break one quietly.

---

## 3. Layer map

Imports flow **downward only**. This is enforced by `no-restricted-imports` zones in `eslint.config.mjs`, not by convention.

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

`src/components/ui/**` and `src/styles/**` are leaves. Anything above the domain may use them.

**The one exception**, deliberately narrow and documented: `src/domain/project/repository/sources/**` is the only place permitted to import `src/content/**`. That is the seam where the content directory binds to the repository port. Replacing that one file with a CMS adapter is the entire reason the boundary exists.

---

## 4. Where new code goes

Match your change to a row before you create a file.

| You are… | It belongs in | Notes |
| --- | --- | --- |
| Adding a project | `src/content/projects/<slug>/` | One directory, one `project.ts`, one poster. Nothing else. See `docs/rules/02-content.md`. |
| Adding a metadata field | `src/domain/project/schemas/` | Optional fields need no version bump. Required ones do — see §6. |
| Adding a preview technology | `src/features/project-preview/renderers/` | Add the variant to the union, add one renderer, register it in the map. Touch nothing else. |
| Adding a derived query | `src/domain/project/selectors/` | Pure function over `Project[]`. Never a hand-maintained array. |
| Changing gallery motion or layout | `src/features/gallery/` | Must stay project-agnostic. |
| Adding a colour, size, or duration | `src/styles/tokens.css` | Never an arbitrary literal in a component. |
| Adding a route | `src/app/` | Metadata comes from the manifest via `generateMetadata`. |
| Building a bespoke interactive preview | `src/content/projects/<slug>/preview.tsx` + registry entry | Registered by `componentId`, lazily imported. The manifest stays serializable. |

If your change does not fit a row, that is a signal worth raising before you write it.

---

## 5. Commands

```bash
bun install

bun dev                     # regenerates the registry, then serves
bun run build               # regenerates the registry, then builds

bun run validate:content    # every manifest parses; posters exist on disk
bun run registry:check      # generated registry is current
bun run check:architecture  # no project names in shared UI; domain stays pure
bun run typecheck
bun run lint
bun run test

bun run verify              # all of the above, in the order CI runs them
```

`bun run verify` is the gate. If it is red, the work is not done.

---

## 6. Schema evolution

The contract carries `schemaVersion`. Never assume it stays at 1.

- **Adding an optional field** — no version bump. Add it to the current schema.
- **Adding a required field, removing a field, or changing a meaning** — bump the version, add a migration in `src/domain/project/migrations/`, and keep the old schema so existing manifests continue to parse.
- **Unsupported versions are rejected loudly**, never silently coerced.

`parseProject` detects the version, validates against that version's schema, then migrates upward to the current domain model. The UI only ever sees the current normalized model, so an old manifest can never leak old shapes into presentation.

---

## 7. Definition of done

Before you call any piece of work complete:

- [ ] `bun run verify` passes.
- [ ] No project slug appears anywhere under `src/features/`, `src/components/` or `src/app/`.
- [ ] New visual values are tokens, not literals.
- [ ] Interactive elements are reachable and operable by keyboard, with visible focus.
- [ ] Motion has a `prefers-reduced-motion` path that keeps every state change legible.
- [ ] Anything that can fail degrades to a poster or a fallback rather than an empty frame.
- [ ] Server Components by default; `'use client'` only where interaction genuinely requires it.
- [ ] The work is committed atomically, with a message explaining *why*.

**The acid test.** If your change touched the project system, add a throwaway project with a different preview kind and confirm that `git status` shows only new files inside `src/content/projects/`. If a shared file had to change, the architecture is not modular enough yet — that is the bug, not the project.

---

## 8. Anti-patterns — reject these on sight

Drawn from CONCEPT §43. Each has burned a real gallery somewhere.

**Hard-coded gallery.** A `const projects = [morphwave, musai]` array inside a page component, with manual placement.

**Duplicated metadata.** The title in the manifest, the poster in a config, the SEO string in a third file. One fact, one home.

**UI-coupled content.** React nodes or JSX inside the project schema. Manifests must stay serializable — that is what keeps a CMS possible later.

**Scattered preview branching.** `if (kind === 'video') … else if (kind === 'iframe') …` repeated across unrelated components. There is exactly one map, in `renderers/`.

**Project CSS in the global shell.** A project must never mutate brand styles. Its identity lives inside its own frame.

**Premature abstraction.** No plugin framework, no event bus, no DI container, no CMS, no state-machine library — until something concrete demands it. An abstraction with one accidental use case is worse than the duplication it replaced.

**Visual homogeneity.** Do not apply the same fluid/neon/generative treatment to every project to make the set feel consistent. Consistency comes from the shell. That is the whole idea.

---

## 9. Judgment

Three tie-breakers, in order:

1. Between a visually convenient shortcut and a content-driven architecture — **choose the architecture**.
2. Between a generic abstraction and a simple explicit module — **choose the explicit module**.
3. When project-specific behaviour has nowhere obvious to live — **keep the shell generic and isolate the behaviour behind the project contract or a dedicated adapter**.

---

## 10. Detailed rules

| Document | Covers |
| --- | --- |
| `docs/rules/01-architecture.md` | Layers, boundaries, the repository port, enforcement mechanics |
| `docs/rules/02-content.md` | Adding a project, manifest fields, asset conventions |
| `docs/rules/03-design-system.md` | Tokens, typography, the stencil motif, banned visual effects |
| `docs/rules/04-code-quality.md` | TypeScript, the server/client boundary, naming, testing |
| `docs/rules/05-experience.md` | Accessibility, reduced motion, performance invariants |
| `docs/adr/` | Decisions, with the reasoning that produced them |
