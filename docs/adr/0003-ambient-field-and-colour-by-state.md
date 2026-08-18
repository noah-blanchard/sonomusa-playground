# ADR 0003 — The ambient field, and colour as a state channel

**Date:** 2026-08-17
**Status:** Accepted
**Closes:** the open question in ADR 0002, *"where the WebGL layer lives"*.

---

## Context

The gallery distinguished its fronting project by position, scale and opacity alone. Neighbours sat at 0.5 and 0.2 opacity, the active frame at 1, and that was the whole hierarchy. The brief was to make the fronting project unmistakably the live one: a restrained field of particles around its frame reacting very slightly to the pointer, its imagery in colour while everything else is desaturated, and the same reveal on hover in the index.

`ogl` had been installed in `25142ca` for exactly this and was still unused. ADR 0002 §4 accepted that on condition it was short-lived.

## The tension, stated plainly

`docs/rules/03-design-system.md` says the active indicator **"is a gap, not a glow"** and **"Reach for the gap before reaching for a colour, a shadow or a glow."** CONCEPT §25 forbids the brand depending on *"fluid waves; particles; purple glow; generative noise; a specific 3D shader"*, and §5.3 adds *"Do not introduce WebGL solely to make the navigation feel advanced."*

A ring of glowing particles around the active frame would be brand furniture — on every project, forever — and would break all of that.

## Decisions

### 1. The field is the stencil motif in motion, not an effect

ADR 0002 line 78 already sketched the sanctioned form: *"drifting interrupted hairlines in the existing monochrome, with no bloom and no colour fog."* That is what was built, and the constraints are load-bearing rather than stylistic:

- **Hard 1px points.** No radial falloff in the fragment shader. A falloff is precisely what turns a hairline point into a glowing mote.
- **No additive blending.** Overlaps do not accumulate into brightness, so the field can never bloom.
- **Low alpha**, in the same register as `--color-line` and `.stencil-rule`.

The result is the pen that draws the rest of the shell, drifting. **No CONCEPT amendment was needed** and no invariant is broken; `docs/rules/03` gains a section stating the constraints so this cannot later be read as permission for glow generally.

The honest caveat: this is a judgement about where a line falls, not a proof. If it ever reads as an effect rather than as the motif, it is wrong and the constraints above are the first place to look.

### 2. Saturation joins opacity as a hierarchy channel

`docs/rules/03` § Forbidden bans *"forcing a shared visual treatment onto project media to make the set feel consistent."* Desaturation-by-state is the opposite of that: it does not make projects resemble each other, it makes them differ **by state**, and the one being looked at is fully itself. CONCEPT §20 already lists the channels as *"scale, position, opacity, framing, and typography"*; saturation belongs beside opacity, which the gallery already varies per frame.

Keyed off `inert`, which the viewport already sets on every frame but the active one — so the rule cannot drift out of step with the real active index, because it *is* the real active index. Scoped to `.gallery-frame`, so the same `ProjectPreview` on a project's own page stays in colour.

The index reveal sits entirely inside `@media (hover: hover)`. On a touch device there is no way to reveal the colour, so the grey must never be applied there — `docs/rules/05` is explicit that nothing may be reachable by hover alone.

### 3. Colour is declared, never derived

`presentation.accent` is an optional field on the manifest. It is the single source for both a project's artwork and its ambient field — one fact, one home (invariant I2). Optional, so no version bump and no migration.

Sampling a dominant colour from the poster was considered and rejected: it would have made the colour a property of an image file rather than a decision, and it returns grey for any project whose art is monochrome, which is most of them.

The shell stays colourless. `--color-accent` remains aliased to bone, and *"the accent starts colourless"* is still true — project colour reaches the frame only through project media and this field.

### 4. `ogl`, and the field behind the frames

`ogl` for the reasons in ADR 0002 §3: no dependencies, ~8 kB, and a fullscreen point field needs a draw call rather than a scene graph.

Two structural choices did most of the work:

**The field sits behind every frame, at `z-index: 0`.** The active card is opaque at `z-index: 30`, so it occludes the middle and what remains is a band around it. There is no keep-out geometry and no mask — the card *is* the mask.

**Its geometry needs no measurement.** The active frame is always `left: 18%; right: 18%`, `scale: 1`, `x: 0`, so in canvas-normalized coordinates its box is a constant. `FRAME_INSET` is imported from `depth.ts` rather than restated; it is already duplicated into `gallery.css` under a "change both or neither" warning and a third copy would be the one that got missed.

Motion lives in the vertex shader. The CPU does nothing per frame, so the cost is O(1) in project count — which is the invariant `docs/rules/05` actually cares about. Spawn distribution stays in `lib/ambience.ts` as pure functions, tested the way `depth.ts` is.

### 5. The stage grew; the card did not move

`.gallery-viewport` gained `--gallery-bleed` on each side and `.gallery-frame` is inset by the same, so the card lands exactly where it did and the space is added around it. Without it the frame touched the clip on all four sides and anything drawn near it was cut on a hard line. The bleed is zero below 768px, where the frame is full width and there is no room to make.

### 6. Degradation

- **No WebGL** → nothing renders. The stencil frame is already the active indicator, so there is no blank state to leave behind (CONCEPT §19).
- **Reduced motion** → one painted frame, no loop, no pointer. The field stays; it stops moving. Removing it would delete a state cue rather than simplify one.
- **Below 768px** → the canvas is never rendered, so no GL context exists on the devices least able to spare one.
- **Hidden tab** → the loop stops.

## Two findings worth keeping

**Lossy WebP was destroying the colour before it reached anything.** It subsamples chroma at 4:2:0, and these compositions are 1px coloured hairlines on black — the exact signal that ruins. Quality 88 threw away 27% of peak chroma. `nearLossless` holds all of it and is still smaller than the old encoder for five of six posters. That will stop being true the day a photographic poster lands.

**`.next/cache/images` is keyed by URL, not by content.** Replacing a poster in place leaves Next serving the previous optimization indefinitely in development. Several minutes were spent chasing a filter bug that was a stale cache entry. Clear it after regenerating media.

## Consequences

- Adding a project may now declare one colour, and its art and its field both follow. Declaring nothing is still valid and falls back to bone.
- The shell has exactly one GPU layer, with the constraints that keep it inside §25 written down beside it.
- Three assertions now cover things no other test could see: that only the fronting frame is in colour, that the field paints, and that reduced motion stills it rather than removing it. The canvas keeps `preserveDrawingBuffer` so the second is possible at all.
- The pointer response is the one part with no automated coverage — a few pixels of displacement is below what a screenshot can resolve. It is verified by inspection.
