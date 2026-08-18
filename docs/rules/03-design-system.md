# 03 — Design system

The shell is the constant. Projects are the variable. Everything here describes the constant.

---

## The governing rule

> **SonoMusa must curate projects without visually homogenizing them.**

The shell provides framing, hierarchy, rhythm and restraint. The colour, noise, motion and personality all come from the work inside the frame. If the shell starts competing with the projects, the shell is wrong.

Target balance (CONCEPT §23): 35% professional · 25% refined · 25% creative · 15% technological. It should not read as a cyberpunk dashboard, an AI startup, a gaming interface, a WebGL demo, or a creative-developer template.

## The stencil motif

The logo is the design system's source material. Look at it: a hairline monoline geometric sans in which **every glyph is interrupted** — the O's bowls are cut left and right, the U's stem breaks, the M's left stem breaks at the top, the A is unbarred with a cut apex, the N carries an angled shoulder cut.

That interruption is the identity. It is a *system*, not an effect — which is exactly what CONCEPT §25 asks for, and it is why SonoMusa does not need glow, particles or gradients to be recognizable.

It propagates through the shell as:

- **rules that break** rather than run edge to edge — the `//` divider in the concept art is already this
- **frames with interrupted borders**, gaps at the corners rather than closed rectangles
- **an active indicator that is a gap**, not a glow
- **focus rings that break**, matching the frames
- **hairline weight everywhere** — one pixel, low alpha, generous tracking, a lot of air

Reach for the gap before reaching for a colour, a shadow or a glow.

## Tokens

Every visual value lives in `src/styles/tokens.css` under Tailwind's `@theme`. No arbitrary literals in components — if you need a value that does not exist, add a token and say why.

> **Use `tracking-(--token)`, never `tracking-[--token]`.**
>
> In Tailwind v4 the parenthesis form is shorthand for `var(--token)`; the bracket form passes the text through raw and emits `letter-spacing: --tracking-label`, which is invalid CSS that browsers drop silently. Nothing errors — the style just does not apply, and a tracked label quietly loses the tracking that makes it read as editorial.
>
> This applies to every token-valued utility: `text-(--color-bone)`, `duration-(--duration-fast)`, `leading-(--leading-body)`. Grep for `\[--` before shipping; there should be no matches.

### Colour

| Token | Value | Role |
| --- | --- | --- |
| `--color-obsidian` | `#0A0A0A` | Page ground |
| `--color-soft-black` | `#151515` | Raised surfaces, frames |
| `--color-graphite` | `#1E1E1E` | Panels, inactive media wells |
| `--color-bone` | `#F0EFEA` | Primary text; warm, never pure white |
| `--color-steel` | `#8A8A8A` | Secondary text, metadata |
| `--color-accent` | starts as bone | Punctuation only |

**The accent starts colourless.** In the reference composition every drop of colour comes from project media — the shell is pure greyscale. The accent is permitted in an active indicator, a small dot, an underline, a focus state, a selection. It is forbidden as a full-screen gradient, a glow, a fog, or repeated neon decoration. Introducing a hue later is a deliberate one-token change, and it should stay restrained when it happens.

### Typography

Three families, three jobs, no overlap:

| Token | Family | Role |
| --- | --- | --- |
| `--font-title` | **Jost** | Project titles only — geometric, rhymes with the logo |
| `--font-display` | **Inter Tight** | Editorial headline and body — the neutral voice |
| `--font-mono` | **Geist Mono** | `001` numbering, metadata labels, tabular figures |

All three are open-licensed and self-hosted through `next/font/local` — no external requests, no layout shift, identical rendering offline.

Conventions that carry as much identity as the families themselves:

- Project numbers are **zero-padded to three digits** (`001`), always mono, always tabular.
- Metadata labels are **uppercase with wide tracking** (`--tracking-label`, ~0.18em).
- The display headline runs **Light at large sizes with tight leading**. Weight is the hierarchy; size alone is not.
- Never re-typeset the logo. It is an SVG asset with three lockups — stacked, one-line, and the `SO/MU` monogram for compact use.

### Space, line and motion

Spacing comes from a consistent scale. Hairlines are `--hairline: 1px` at roughly 12% bone — visible, never assertive.

Motion uses a small shared vocabulary. Every component draws from it; none invents its own spring:

| Token | Purpose |
| --- | --- |
| `--duration-fast` | UI feedback — hover, focus, small state |
| `--duration-base` | Standard transition |
| `--duration-slow` | Gallery movement between projects |
| `--ease-standard` | Default easing |
| `--ease-exit` | Departures |

Consistency should come from **rhythm**, not from effects. If two components animate at different speeds for no reason, that is a bug.

## Reduced motion

`prefers-reduced-motion` is not an afterthought — it is a supported mode. When it is on: spatial transitions simplify to opacity, autoplay stops, every state change stays visible, and navigation remains complete. Motion is enhancement; it is never structure. Nothing may be communicated by movement alone.

## Frames

Cards are neutral exhibition frames. The shell controls the number, title, status, tags, preview viewport, navigation affordance, proportions and metadata hierarchy. Inside the frame, the project may be colourful, monochrome, photographic, 3D, game-like, text-heavy, minimal, noisy, cinematic or UI-based — and the frame must make all of those look intentional side by side.

## The ambient field

The gallery's fronting project carries a drifting field of glowing motes, drawn on a single WebGL canvas behind the frames. It is **the one GPU layer in the shell**. This layer is permitted a glow that nothing else in the shell is:

- **Soft motes.** Each point carries a radial falloff in the fragment shader, so it reads as a glow rather than a hard pixel.
- **Additive blending.** Overlaps accumulate into brightness, so the field can bloom.
- **A stretched field, not a halo.** Motes spread wide across the page in a shallow ellipse around the active card, densest and brightest against it, thinning toward the edges.

This permission is scoped to this single layer and was granted by the 2026-08-17 amendment to `docs/adr/0003`. It is not permission for glow generally — everything under Forbidden still stands. If a second GPU layer is ever proposed, it needs its own argument and its own ADR.

The colour is the fronting project's declared `presentation.accent`. The shell stays colourless: `--color-accent` is still bone, and project colour reaches the frame only through project media and this field.

## Colour as a state channel

Saturation sits beside opacity in the list CONCEPT §20 gives for hierarchy. In the gallery every frame but the fronting one is desaturated; in the index a card's image is grey until the card is hovered.

This is not the Forbidden case of forcing one treatment onto project media to make the set cohere. It makes projects differ **by state** — the one being looked at is fully itself, and no two projects are made to resemble each other.

Two rules that are easy to get wrong:

- The gallery rule keys off `inert`, which the viewport already sets on every frame but the active one, and is scoped to `.gallery-frame`. A project's own page shows its hero in colour — it is unambiguously the subject there.
- The index reveal lives entirely inside `@media (hover: hover)`. On a touch device there is no way to reveal the colour, so the grey must never be applied in the first place.

## Controls

Every deliberate action goes through `src/components/ui/Button.tsx`. It renders whichever element the props imply — `<button>` with no `href`, `next/link` for an internal one, `<a target="_blank">` for an external one — because in this system a control's appearance does not depend on whether it navigates or acts.

Five variants, and the list is meant to stay this short:

| Variant | For |
| --- | --- |
| `link` | The editorial default — a tracked label on a retracting stencil underline |
| `ghost` | Navigation and secondary controls; colour carries the state, no underline |
| `outline` | A control that must read as a target. Uses the stencil frame, corners open |
| `solid` | The loudest thing available, and still only bone on obsidian. Use sparingly |
| `icon` | Icon alone. Requires `srLabel` — there is no visible text to name it |

Two sizes (`sm`, `md`) and two tones (`primary`, `secondary`), for the same reason motion has three durations: a component that invents its own padding is the bug.

**`external` is one decision, not three.** It sets `target="_blank"`, the `↗` marker and the screen-reader warning together. They were separate once, and the footer's GitHub link shipped with the first and neither of the others.

**`srLabel` replaces the accessible name** and hides the visible label from assistive tech. Reach for it when the visible text is too terse to stand alone — six "View project" links on one page should each announce their own project.

**Anything clickable shows a pointer.** `globals.css` sets it for `button`, `[role="button"]` and `summary`, since the UA stylesheet gives only `<a href>` one; `e2e/affordance.spec.ts` sweeps every route and fails if a control does not. Do not hand-apply `cursor-pointer` — if something needs it and does not have it, the element is probably wrong.

## Iconography

The set is **Phosphor at `light`**. That weight is the point: it is the only major icon family that ships a stroke thin enough to sit beside a `.stencil-rule` without out-weighing it. `regular` is heavier than anything else in the interface and is not used.

Every icon comes through `src/components/ui/Icon.tsx`. Never import from `@phosphor-icons/react` at a call site — the wrapper is what stops the hover nudge, the size and the accessibility contract drifting apart, which is exactly what happened to the six hand-written arrow spans it replaced.

Three rules the wrapper enforces so you do not have to:

- **Imports come from `@phosphor-icons/react/ssr`.** The package's root entry reads React context and cannot render in a Server Component; the `/ssr` build has no hooks and works in both trees. See `docs/adr/0002-icon-animation-and-webgl-libraries.md` §2.
- **Icons are always `aria-hidden`.** The accessible name comes from adjacent `sr-only` text or the parent's `aria-label` — never from the icon. Phosphor sets no ARIA attributes of its own.
- **Two sizes only**, `sm` and `md`, the same small-vocabulary rule the duration tokens follow. `md` is for the gallery's primary navigation controls; everything else is `sm`.

**An icon is never the sole carrier of meaning.** Every one in the shell today sits beside a word. An icon-only control needs a real accessible name and a reason it could not be labelled.

**The stencil marks are not icons.** `StencilRule`, the `//` divider, the accent dot and the eyebrow ticks are the identity, drawn with CSS gradients and hairline rules. Do not replace them with glyphs from an icon set — reach for the gap before reaching for a symbol.

## Forbidden

- Fluid waves, particle fields, purple glow, generative noise or a signature shader as brand furniture. Those belong to individual projects; they do not define SonoMusa.
- Icons imported directly from `@phosphor-icons/react` instead of through `src/components/ui/Icon.tsx`, or icons standing in for the stencil marks.
- Full-bleed gradients or ambient colour fog.
- Project-specific CSS anywhere in the shell.
- Arbitrary one-off values where a token belongs.
- Forcing a shared visual treatment onto project media to make the set feel consistent. Consistency comes from the frame. That is the entire idea.

## Copy

Concise and confident, never promotional. "A gallery of coded experiences." "Experiments in sound, code and perception." "Things made to be experienced." Not "cutting-edge AI-powered experiences redefining creativity."
