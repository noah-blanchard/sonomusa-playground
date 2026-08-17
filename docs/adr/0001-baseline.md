# ADR 0001 — Baseline architecture and stack

**Date:** 2026-08-16
**Status:** Accepted

Records the decisions taken when the repository was created, and why. Later ADRs supersede rather than edit this one.

---

## Context

`Concept/CONCEPT.md` specifies an evolving, modular, runtime-validated gallery whose shared shell stays stable while projects, preview technologies and visual identities evolve independently. The repository was empty; every choice below was open.

## Decisions

### 1. Next 16.3.1, App Router, React 19, Bun

Mandated by CONCEPT §4. Server Components are the default; the client boundary is drawn only around interaction.

### 2. TypeScript 5.9.3, not 7.0.2

TypeScript 7 (the native compiler) is the latest stable release, but `typescript-eslint@8` declares a peer range of `>=4.8.4 <6.1.0`. Adopting TS 7 would mean giving up typed linting.

Typed lint rules are what enforce the layer map — they are the mechanism that makes invariant I5 real rather than aspirational. In a project whose central risk is architectural erosion, enforcement is worth more than a faster compiler.

Revisit when typescript-eslint supports the 7.x line.

### 3. Zod 4 as the canonical contract

CONCEPT §3.4 and §10. The runtime schema is the single definition of a valid project; the TypeScript type is inferred from it. No hand-written type sits alongside a schema, because the two always drift.

### 4. `preview` and `links` are separate concerns

**This is a deliberate deviation from the illustrative schema in CONCEPT §9**, flagged as §0.5 requires.

CONCEPT §9 lists `preview: { kind: 'external', url }` as a variant of the preview union. But the user's projects each live on their own subdomain, and the primary action is to leave for that subdomain. "External" therefore describes a *destination*, not a way of rendering something inside a frame.

Keeping it in the union would push link handling into the preview adapters — every renderer would need to know about navigation, and the one place that maps kind to renderer would stop being purely about rendering.

So:

- `preview` — what renders inside the frame: `static` · `video` · `iframe` · `component`
- `links.live` — where the visitor can go, optional

The binding MUST from CONCEPT §3.1 and §15 — that preview be a discriminated union resolved through an adapter map — is fully preserved. CONCEPT §9 describes itself as "an initial design, not an immutable final schema". The change is reversible at no cost.

### 5. `links.live` is optional, and absence is meaningful

No project subdomains exist yet. Rather than model a URL that is not real, the field is optional: when absent the frame offers no destination and `status` carries the meaning. A dead call to action is worse than none.

### 6. No carousel library, and in the end no animation library either

CONCEPT §5.4 permits a carousel library but insists the visual model stay custom. The reference composition is not a scroll track — it is a depth composition where each frame's transform derives from its offset from the active index. Scroll-snap libraries model a scrolling container, which fights that directly.

So: an index-driven reducer, with every frame's position, scale and opacity derived from `signedOffset`. Mobile reuses the same reducer with a different derived layout.

**Motion was planned and then removed**, because CSS turned out to do the job better here. The derived values are handed to CSS as custom properties and the transition is a CSS transition, which buys three things a JS animation library could not:

- the mobile arrangement is a **media query** rather than a viewport measurement, so there is no layout flash on first paint and no server/client mismatch;
- `prefers-reduced-motion` is honoured by the platform at the single place that decides how movement happens, rather than being threaded through component props;
- interrupted transitions interpolate from the current computed value, so holding *next* stays smooth without any extra work.

`motion` was uninstalled once nothing imported it. A dependency kept "in case" is one CONCEPT §43 explicitly warns against. The ESLint restriction on importing it into the domain layer is left in place, so re-adding it later cannot quietly cross a boundary.

### 7. The generated registry is committed

Manifests are TypeScript and must stay statically analyzable, which rules out runtime directory reads with template-literal imports.

`scripts/generate-registry.ts` writes an explicit barrel, committed to the repository: builds are reproducible, adding a project is visible in the diff, and no filesystem work happens at request time. `registry:check` fails when it is stale.

CONCEPT §13 is still satisfied — the author never maintains an array by hand.

### 8. Tailwind v4 with `@theme` tokens

Tokens live in CSS and are the single source of truth for colour, type, spacing and motion. Project previews stay isolated because they render inside iframes or lazily-imported components that do not inherit shell utilities.

### 9. Jost · Inter Tight · Geist Mono

Three families, three jobs: Jost for project titles (geometric, rhyming with the logo's circular O and unbarred A), Inter Tight for the editorial voice, Geist Mono for numbering and metadata. All open-licensed and self-hosted via `next/font/local` — no external requests, no layout shift.

Each sits behind a CSS variable, so any one can be replaced in a single place.

### 10. Deployment on Dokploy, self-hosted

Not Vercel. Consequences that shape the code:

- `output: 'standalone'` in `next.config.ts` for a minimal runtime image
- `sharp` is a **runtime** dependency — the container performs its own image optimization
- No Vercel-specific APIs, adapters or configuration anywhere

### 11. Scope of the first build

Architecture first (CONCEPT §52 phases 1–7), visual polish after. Routes: `/`, `/index`, `/projects/[slug]`, plus an INFO overlay. About and Me are deferred.

Media is generated placeholder posters until real assets exist — they swap in with no code change, which is itself a test of the boundary.

## Consequences

- Adding a project costs one directory, one manifest, one poster.
- A new preview technology costs one union variant, one renderer, one map entry.
- Moving to a CMS later replaces one file behind the repository port.
- Schema changes are versioned and migrated rather than breaking old manifests.
- The cost is more indirection than a hand-built gallery needs at three projects. That is accepted deliberately: the collection is expected to grow, and the invariants are cheap now and expensive to retrofit.
