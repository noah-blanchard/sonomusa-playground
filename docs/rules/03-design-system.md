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

## Forbidden

- Fluid waves, particle fields, purple glow, generative noise or a signature shader as brand furniture. Those belong to individual projects; they do not define SonoMusa.
- Full-bleed gradients or ambient colour fog.
- Project-specific CSS anywhere in the shell.
- Arbitrary one-off values where a token belongs.
- Forcing a shared visual treatment onto project media to make the set feel consistent. Consistency comes from the frame. That is the entire idea.

## Copy

Concise and confident, never promotional. "A gallery of coded experiences." "Experiments in sound, code and perception." "Things made to be experienced." Not "cutting-edge AI-powered experiences redefining creativity."
