# 05 — Experience: accessibility, motion, performance

Experimental design does not get an exemption from any of this. A gallery nobody can navigate is not immersive, it is broken.

---

## Accessibility

**Required, every time:**

- Semantic markup. The gallery is a list of projects; mark it up as one. `<div>` is not a control.
- Full keyboard operation — arrows move through the gallery, Tab reaches every control, Enter/Space activate, Escape closes the overlay.
- Visible focus on everything focusable. It follows the stencil motif — a broken ring, not a removed one. `outline: none` without a replacement is never acceptable.
- No hover-only affordances. Anything reachable by hover is reachable another way.
- Accessible names on project links and controls. "View project" alone is not a name; it must resolve to *which* project.
- Contrast that holds: bone on obsidian is the body pairing; steel is for secondary text at sufficient size, never for anything essential and small.
- Touch targets of a sensible size, and no interaction that requires a precise drag.

**Gallery specifics:**

- The active project is announced when it changes — a polite live region, not a barrage.
- Previous/next are real `<button>`s with real labels. Gesture is an enhancement layered on top; the gallery must be fully usable without it (CONCEPT §20).
- Pagination dots are controls, not decoration: labelled, focusable, and they say which one is current.
- Preview state (loading, ready, failed) is communicated to assistive technology where it matters, and silently where it does not.

**The INFO overlay** is a modal dialog and behaves like one: `role="dialog"`, `aria-modal`, focus moved in on open, focus trapped while open, focus returned to the trigger on close, Escape closes, background inert.

## Reduced motion

`prefers-reduced-motion: reduce` is a supported mode, not a degraded one.

When it is on:

- Large spatial transitions simplify — cross-fade instead of travel.
- Autoplay and looping video stop; posters hold.
- Every state change remains **visible**. Simplifying motion must never remove the feedback that something happened.
- Navigation stays complete. Nothing becomes unreachable.

Motion is enhancement, never structure. If information exists only in the movement, the design is wrong.

## Performance

Performance is architectural. It is decided when the boundaries are drawn, not recovered in a final optimization pass.

**Required:**

- The homepage never eagerly initializes every project preview. This is the invariant that stops the gallery from degrading as the collection grows.
- Off-screen media is lazy-loaded.
- Custom preview components are dynamically imported, through the central registry so the bundle boundaries stay visible.
- Images are optimized and responsive. Posters always exist and always load first.
- No unnecessary hydration — see the server/client boundary in `04-code-quality.md`.

**Expected:**

- Prefetch only the likely next and previous project, not the whole collection.
- Unload heavy previews once they are no longer active.
- Keep gallery navigation independent of preview runtime — moving between projects must stay responsive while a preview is loading or failing.
- Keep bundle boundaries per preview where practical, so one heavy project cannot tax the rest.

**The test that matters:** the gallery must feel identical with 50 projects and with 3. If adding projects slows the homepage, something is loading that should not be.

## Responsive

Mobile is a reinterpretation, not a compression.

| Desktop | Mobile |
| --- | --- |
| Partial neighbouring visibility | Full-width snap frames |
| Spatial depth composition | Simplified depth |
| Several frames in view | Fewer simultaneous previews |

Both share one state model — the same `activeIndex`, different derived layout. Two presentations of one reducer, never two implementations.

The identity holds at every width:

> **A curated gallery, not a social feed.**

## Resilience

Every project must stay presentable when JavaScript fails, an external URL is down, WebGL is unsupported, the user prefers reduced motion, mobile performance is insufficient, or the preview simply has not loaded yet.

The poster is the floor, and it is why `media.poster` is required. The gallery must never depend on live rendering to communicate that a project exists (CONCEPT §19).
