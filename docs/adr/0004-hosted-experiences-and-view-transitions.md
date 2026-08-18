# ADR 0004 — Hosted experiences, and the morph into them

**Date:** 2026-08-18
**Status:** Accepted
**Amends:** ADR 0002 §1 and §4 — the animation-library decision. The icon and WebGL halves stand.

---

## Context

A gallery frame offered one way in: a `View project` link pointing at `links.live` when a project had one, and at `/projects/<slug>` when it did not. Three problems compounded.

**It answered two different questions with one control.** *Let me use this* and *tell me about this* are not the same request. The most interesting thing a project can offer — the work, running — had no affordance of its own.

**The branch was dead.** No project has ever declared `links.live`, so in practice every frame linked to its detail page and the external half of that ternary had never rendered.

**There was nowhere for the work to live.** CONCEPT §28 lists *live experience* among what a project route may contain, and §29 anticipates a custom project page, but neither had a mechanism. A project could bring an in-frame preview and nothing more.

Separately, the shell had never had a route transition. Moving from the gallery to anywhere was a hard cut, which reads as *you left* rather than *you went deeper*.

## Decisions

### 1. `experience` is a field on the contract, not a flag on `preview`

`schemas/v1.ts` gains an optional `experience: { componentId }`. Optional, so no version bump and no migration (AGENTS §6). The route `/projects/<slug>/play` exists exactly for projects that declare it, and `generateStaticParams`, the sitemap and the frame's primary control all derive from the same selector.

The contract now separates three ideas that had been two:

| | what it is | where it renders |
| --- | --- | --- |
| `preview` | what the frame shows at rest | inside the gallery card |
| `experience` | the work itself, served by us | `/projects/<slug>/play` |
| `links.live` | the work itself, served by someone else | their domain |

`schemas/preview.ts` already argued that a preview is not a destination, *"keeping the two apart is what stops navigation logic from leaking into the preview adapters."* This applies the same reasoning one level up.

**Why not a flag on `preview`.** The two have incompatible budgets. A preview has to be cheap enough for the whole gallery to carry six at once on the homepage; an experience is opened deliberately, one at a time, and may cost what it costs. A single `preview` with a `fullSize` flag would put the expensive artefact behind the homepage's import graph. Two registries keeps the heavy chunk unreachable from `/`.

**Why hosted wins over `links.live`.** Continuity between the frame and the running work is the entire reason for hosting it. The external URL is still offered on the project page.

### 2. The stage is a sibling route, not a section of the project page

`/projects/<slug>/play` rather than a block inside `/projects/<slug>`, because the two calls to action need two destinations. It nests under the project's stable slug route, which keeps CONCEPT §28's hierarchy.

No layout restructuring was needed: `SiteHeader` is already `position: fixed`, so a `h-dvh` section runs genuinely edge to edge beneath it. A route group to strip the chrome was considered and rejected — the header floating over the work is what makes the stage read as part of the same site rather than as a popup.

### 3. Native View Transitions, not a JavaScript overlay

The morph is React's `<ViewTransition>` with one shared name, `gallery-stage`, on the fronting gallery frame and on the stage section. Two things fall out that an overlay could not have bought:

- The browser lifts the snapshot into its top layer, so it **escapes `.gallery-viewport`'s `overflow: hidden` and its edge mask** without either being touched. An overlay would have had to portal out and re-derive the card's geometry.
- It is a **real navigation**. Reload, share, back and forward all behave, because nothing is being simulated in a single page.

**The name is constant, not per-project.** Only one frame is ever active and only one stage is ever mounted, so one name is unique at capture time — and no project identifier reaches shared code (I3). It lives in `src/components/ui/ViewTransition.tsx` so both ends read it from one place.

**The name is toggled, the wrapper is not.** Every frame is wrapped unconditionally and only `name` changes with `isActive`. Wrapping conditionally would change the tree shape on every carousel move, remounting each frame and reloading each preview. And gating the name is mandatory: a duplicate `view-transition-name` aborts the whole transition, so six frames sharing one name would mean no morph at all.

**The loading beat is the handoff, not a timer.** The poster fills the stage from the server render; a mark sits over it until the experience calls `onReady`, and then leaves on an exit animation. That dispatch goes through `startTransition`, because `<ViewTransition>` is activated by Transitions, Suspense and `useDeferredValue` and by nothing else — a plain `setState` would swap the mark without animating it.

**Availability.** Next 16 aliases `react` to its own bundled build for the App Router, and that build exports `ViewTransition` in both the client and RSC entries. No config flag. Where the browser lacks the API the navigation is simply instant, which is a perfectly good floor.

### 4. `motion@13.1.0` is removed

ADR 0002 §1 re-added it for *"enter and exit on the `<dialog>` overlay, reveals as the index scrolls into view, and transitions between routes"* — and §4 set an expiry: *"If a package is still unused when the next piece of work lands, remove it."*

Route transitions were the largest of those three cases, and they turned out not to need it. What the browser gives natively is strictly better here: the snapshot escapes the clip, the reverse morph is free, and the whole thing costs no client JavaScript. Carrying 34 kB (or 4.6 kB under `LazyMotion`) against the two cases that remain — a dialog that already animates acceptably and a reveal nobody has asked for — is not a trade worth making on speculation.

The `no-restricted-imports` entry in `eslint.config.mjs` **stays**, for the same reason ADR 0001 §6 left it: re-adding the package later must not quietly cross a boundary. That foresight has now been load-bearing twice.

Re-add it the day something genuinely needs interruptible, physics-based, or gesture-driven motion. View transitions cannot do those, and pretending otherwise would be the mistake in the other direction.

### 5. `<ViewTransition>` is wrapped rather than type-shimmed

`@types/react@19.2.18` does not declare the export. The obvious fix was `declare module 'react'`, which types a symbol without proving it exists — a lie the compiler would then enforce. `src/components/ui/ViewTransition.tsx` reads the real export instead and falls back to a pass-through component when it is absent, so a React that renames it degrades to no animation rather than to a crash.

Delete that file when the types ship; the call sites change only their import.

## Consequences

- Adding a hosted experience is three steps and touches one shared file — a line in `src/features/project-experience/registry/experiences.ts`. The route, the sitemap entry, the static params and the frame's control all follow from the manifest.
- `check:architecture` now exempts `src/features/*/registry/**` by location rather than by naming one directory, because there are two registries and there may be more.
- `usePrefersReducedMotion` moved from `src/features/gallery/hooks/` to `src/components/ui/`. The gallery and the stage both need it, and neither should import the other to get it.
- The stage carries the page's only `<h1>`, on the plaque. `e2e/overflow.spec.ts` caught its absence, which is exactly what that test is for.
- Both component registries now resolve through `Object.hasOwn`. A `componentId` of `toString` previously resolved to `Object.prototype.toString` and would have been handed to React as a component.

## Alternatives considered

**A FLIP overlay driven by `motion`.** Measure the card, portal a clone, tween it to full screen, then `router.push`. Rejected: it duplicates the destination, has to re-derive geometry the browser already knows, and gives nothing back on the reverse navigation. It was also the only option that needed the animation library, which is why removing the library and choosing this were one decision rather than two.

**Cross-document view transitions (`@view-transition { navigation: auto }`).** Same-origin only, and it would have applied to every navigation in the site rather than this one. Worth revisiting if the whole shell ever wants a default transition.

**Putting the experience on `/projects/<slug>` behind a query parameter.** Cheaper, and wrong: the two controls would have pointed at the same URL, and the state would not have survived a reload.
