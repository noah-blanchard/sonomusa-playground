# ADR 0002 — Icon, animation and WebGL libraries

**Date:** 2026-08-17
**Status:** Accepted
**Supersedes:** ADR 0001 §6, in part — the animation-library half of that decision only. The carousel half stands.

---

## Context

Three gaps in the shell had no library behind them, and each was starting to cost something concrete.

**Icons.** Every affordance in the product is a literal Unicode character inside an `aria-hidden` mono span: `→` `←` `↗` `✕`, four symbols across six call sites. Two problems. First, none of those code points are in Geist Mono's guaranteed subset, so they fall through to `ui-monospace` and render at a weight and baseline that does not match the text beside them — the glyph is the one part of the interface not under the design system's control. Second, the six spans have already drifted: `src/app/projects/[slug]/page.tsx:114` and `:211` omit the `ease-(--ease-standard)` that the other four carry, and `GalleryControls.tsx:98` uses `text-base` where the rest use `text-sm`. `docs/rules/03-design-system.md` names that exact failure: *"If two components animate at different speeds for no reason, that is a bug."*

**Animation.** There are zero `@keyframes`, zero `IntersectionObserver`, and zero scroll-driven reveals in the repository. All motion is a CSS transition on `.gallery-frame` plus one `requestAnimationFrame` loop belonging to a single project's preview. Everything the shell might want beyond the carousel — overlay enter/exit, reveal on scroll, route transitions — has no mechanism at all.

**WebGL.** None exists. The only rendering API in use is a Canvas 2D context in `src/content/projects/musai/preview.tsx`.

## Decisions

### 1. `motion@13.1.0` returns, and the carousel stays on CSS

ADR 0001 §6 removed `motion` after building the gallery without it. That decision was right and it is not being reversed. Read closely, its three arguments are all about **the carousel specifically**:

- the mobile arrangement is a media query rather than a viewport measurement, so there is no layout flash and no hydration mismatch;
- `prefers-reduced-motion` is honoured by the platform at the single place that decides how movement happens;
- interrupted transitions interpolate from the current computed value, so holding *next* stays smooth for free.

All three still hold. `.gallery-frame` keeps its CSS transition, and `depth.ts` keeps handing derived values to CSS as custom properties. A JavaScript tween would lose all three and buy nothing.

What ADR 0001 did not weigh is everything the shell has never had. Enter and exit on the `<dialog>` overlay, reveals as the index scrolls into view, and transitions between routes are cases where CSS either cannot express the thing or requires a state machine per component to fake it. That is what the library is for.

CONCEPT §5.3 permits this explicitly — *"A mature animation library MAY be used for: carousel transitions; enter/exit states; layout transitions; reduced-motion-aware interactions"* — so this is a change of implementation decision, not of the specification.

Motion over the alternatives because it is declarative in the way the rest of the codebase is, exposes `useReducedMotion` as a first-class hook rather than as something to remember, and was already named in `eslint.config.mjs`. ADR 0001 §6 left that restriction standing *"so re-adding it later cannot quietly cross a boundary,"* and that foresight is now load-bearing.

GSAP was the serious alternative: every plugin became free in 2025, and `SplitText` would suit the editorial typography. It was declined because `prefers-reduced-motion` has to be threaded through by hand, and this repository treats that mode as supported rather than as a courtesy.

**Constraint for future work:** use `LazyMotion` with the `m` component, not the full `motion` component. That is roughly 4.6 kB on first render with the ~15 kB `domAnimation` feature set deferred, against 34 kB for `motion`, which no bundler can tree-shake further.

### 2. `@phosphor-icons/react@2.1.10` for iconography

`docs/rules/03-design-system.md` asks for *"hairline weight everywhere — one pixel, low alpha"*, and the stencil motif is built from interrupted hairlines. Phosphor is the only major set that ships **Thin** and **Light** as a first-class weight prop, so an icon can be drawn at the same optical weight as the `.stencil-rule` beside it. Lucide is the more conventional default and tree-shakes slightly better, but its 2 px round-cap stroke on a 24 px grid is heavier than anything else in this interface, and correcting it means overriding `strokeWidth` at every call site.

**The cost, which must be respected:** Phosphor's default entry point uses React Context and is client-only.

> Server Components import from `@phosphor-icons/react/ssr`. Those variants do not use React Context and therefore cannot inherit `IconContext`.

This is not incidental here. `ProjectFrame.tsx` is a Server Component passed as `children` into the client `GalleryViewport`, and it documents why: *"project content never hydrates — only the interaction layer does."* Importing the context-based entry into it would pull the whole frame into the client tree and quietly delete that property. Any shared icon wrapper has to be built against `/ssr`, with the context entry reserved for components that are already `'use client'`.

Phosphor is also absent from Next's default-optimized package list, and it ships over 9,000 modules. `next.config.ts` therefore carries `experimental.optimizePackageImports: ['@phosphor-icons/react']`, without which the dev server transpiles the entire set on first import.

### 3. `ogl@1.0.11` for WebGL

`ogl` has no dependencies, no peer dependencies, ships its own TypeScript types, is marked `sideEffects: false`, and is roughly 8 kB for its core. The intended effect — a fullscreen fragment shader, or an instanced point cloud — needs a program, a buffer and a draw call. It does not need a scene graph.

`three` with `@react-three/fiber` was the alternative, and is the better tool the moment a real scene, a camera rig or post-processing is wanted. It was declined on two grounds: roughly 150 kB gzipped against a performance section whose stated test is *"the gallery must feel identical with 50 projects and with 3"*, and `@react-three/fiber@9` pinning `react >=19 <19.3`, which would put a ceiling on React upgrades in exchange for capability this project has not yet asked for. Revisit that trade the day a scene graph is actually needed; the choice is not expensive to reverse.

### 4. Nothing consumes any of the three yet

This is knowingly the *"dependency kept in case"* that CONCEPT §43 warns against and that ADR 0001 §6 cited when uninstalling `motion`. It is accepted here on the condition that it is short-lived: the libraries were installed as one deliberate act with the intended use written down, rather than accumulating one at a time. If a package is still unused when the next piece of work lands, remove it — that is what ADR 0001 §6 did, and it was correct.

## Open question — where the WebGL layer lives

**Deliberately not decided here.** The intended effect is an ambient particle-and-shader field. CONCEPT is unambiguous that it may not be brand furniture:

> §25 — *"The brand MUST NOT become dependent on: fluid waves; particles; purple glow; generative noise; a specific 3D shader. Those may belong to individual projects. They do not define SonoMusa."*

> §5.3 — *"Do not introduce WebGL solely to make the navigation feel advanced."*

and `docs/rules/03-design-system.md` § Forbidden repeats it as *"particle fields … as brand furniture."*

Two placements are open, and they are not equivalent:

- **Inside a project preview.** Compliant today, at no specification cost. CONCEPT §22 already allows a project's content to be 3D, and `src/domain/project/schemas/preview.ts` documents the extension path: one variant on the union, one renderer, one entry in the map. The lifecycle, the poster fallback and the reduced-motion freeze all already exist — `musai/preview.tsx` is the working example of the shape.
- **As a shell ambient layer.** Requires amending CONCEPT §25 and `docs/rules/03-design-system.md` § Forbidden first. That is a legitimate thing to do — the specification belongs to its author, not to scripture — but it has to be an explicit amendment with its own ADR, not a component that lands and leaves the documents contradicting the code.

A third reading is worth weighing before either. The stencil motif is *"an active indicator that is a gap, not a glow"*, and the rule is *"Reach for the gap before reaching for a colour, a shadow or a glow."* An ambient layer built from drifting interrupted hairlines in the existing monochrome, with no bloom and no colour fog, arguably satisfies §25's intent while still being GPU-driven. That is the version this design system can absorb without being rewritten.

## Consequences

- The shell gains a motion vocabulary for enter/exit, reveal and route change. The carousel is explicitly out of its scope.
- Any shared icon component must be built against `@phosphor-icons/react/ssr`, or the server/client boundary in `docs/rules/04-code-quality.md` erodes without an error to announce it.
- `next.config.ts` now carries one `experimental` flag. It is there for dev-server transpilation cost, not correctness, and can be dropped if the flag is ever removed upstream.
- ESLint's `RENDERING_MODULES` covers all three libraries, so none of them can reach `src/domain/**`. Invariant I5 holds unchanged.
- Three unused dependencies exist until the follow-up work lands. That debt is named above and has an expiry.
