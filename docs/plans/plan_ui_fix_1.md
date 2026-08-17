# Plan 1 — Gallery overflow fix, then regression guards, index strip, SEO and CI

> **Status:** not started. Written 2026-08-17, after the first visual audit of the completed build.
> **Audience:** whoever picks this up next, human or agent, with no memory of the audit.

---

## 0. How to pick this up

```bash
bun install
bun run verify          # must be green before you change anything
bun run build && bun run start   # serves http://localhost:3000
```

Read `AGENTS.md` first — it is normative, and §2 lists five invariants this work must not break. The two that constrain this plan:

- **I3 — no project is ever named in shared code.** Everything here lives in `src/features/`, `src/styles/` and `src/app/`, so no file you touch may contain a project slug. `bun run check:architecture` enforces it.
- **I5 — the domain layer is pure.** `src/features/gallery/lib/depth.ts` is pure maths with no React import. Keep it that way; that is what makes the visual model testable without a browser.

Also relevant: `docs/rules/03-design-system.md` (use `token-(--name)`, **never** `token-[--name]` — the bracket form emits invalid CSS that browsers drop silently) and `docs/rules/05-experience.md` (reduced motion is a supported mode, not a degraded one).

The whole of Part 1 is CSS and numeric constants. No component structure changes, so the RSC composition and the project contract are untouched.

---

## 1. Context — what is wrong and how it was found

The build is complete and pushed (phases 0–8, branch `master`). The first visual audit found a layout bug that shipped because **nothing in the repo measured layout**.

### The measurements

Taken with headless Chrome driven over the DevTools Protocol:

| Width | `documentElement.scrollWidth` vs `clientWidth` | Overflow |
| --- | --- | --- |
| 1440 | 2120 vs 1424 | **696px** |
| 768 | 1320 vs 768 | **552px** |
| 390 | 734 vs 390 | **344px** |

At every width the furthest-right element in the document is `.gallery-frame`.

Frame geometry at 1440, in page coordinates (gallery column spans x 515→1392, `h1` spans x 32→467):

```
 1 of 6  (active)   left  515   right 1392   opacity 1
 2 of 6             left 1116   right 1879   opacity 0.45   ← 487px past the column
 3 of 6             left 1471   right 2120   opacity 0.18   ← entirely off-screen
 5 of 6             left -213   right  436   opacity 0.18   ← negative, over the h1
 6 of 6             left   29   right  791   opacity 0.45   ← squarely over the h1
```

### One root cause, three symptoms

The gallery container computes `overflow-x: visible`, so absolutely-positioned frames escape it and expand the document's scrollable area.

1. **Horizontal page scroll** at every breakpoint.
2. **Neighbouring frames cover the headline.** Frames 5 and 6 render on top of the `h1`, making it unreadable.
3. **Mobile looks shrunken and the header is cut off.** This is *downstream*, not separate: the overflow widens the layout viewport to ~734px, so the fixed header lays out at 661px inside a 390px screen and everything appears zoomed out.

**The headline was never too big.** It measures 350px inside a 390px viewport. It only looked broken because of symptom 3. Do not "fix" the typography.

`/projects`, `/projects/morphwave` and `/projects/interference` all measure **0px overflow** and need no changes. The damage is confined to the homepage gallery.

### Verified, not assumed

Injecting `overflow: hidden` on the gallery container via CDP dropped overflow to **exactly 0px** at 1440 and completely freed the headline. That experiment also exposed the deeper problem below, so do not stop at clipping.

### Reproducing the measurement

Useful while working, and the basis for `scripts/capture-shots.ts` in Part 2:

```bash
"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless --disable-gpu \
  --remote-debugging-port=9222 --window-size=1440,900 \
  --user-data-dir=/tmp/cdp-profile http://localhost:3000 &
```

Then fetch `http://localhost:9222/json`, open a WebSocket to the page target's `webSocketDebuggerUrl`, and send `Runtime.evaluate` with `returnByValue: true`. `Emulation.setDeviceMetricsOverride` changes width without relaunching; `Page.captureScreenshot` returns base64 PNG. Kill the browser afterwards — a stray headless Chrome with an open debug port is not something to leave running.

---

## 2. The geometry problem behind the obvious one

`.gallery-frame` is `position: absolute; inset: 0` — **the active frame fills 100% of its container.**

So clipping at the container hides every neighbour behind the active frame. The verification screenshot showed exactly that: one card floating in empty space, no depth at all.

In the concept art (`Concept/ConceptArt.png`) the active card occupies roughly 64–72% of the gallery area, and **the margins either side are what the neighbours peek into**. Frames must be inset before clipping will look like anything.

### Decisions taken with the user

| Decision | Choice |
| --- | --- |
| Edge treatment | **Clip + soft fade.** `overflow: hidden` is the hard guarantee; a `mask-image` gradient dissolves neighbours into the background rather than ending them on a crisp line |
| Composition | **~18% peek each side**, active frame ~64% of the gallery column |
| What follows | **All four** of Parts 2–5, in that order |

---

## 3. Part 1 — The gallery fix

```
gallery column (100%)
┌────┬────────────────────────┬────┐
│▓▓▓ │                        │ ▓▓▓│
│▓▓▓ │    001  MORPHWAVE      │ ▓▓▓│   active = 64%
│▓▓▓ │                        │ ▓▓▓│   peek   = 18% each side
└────┴────────────────────────┴────┘
```

### 3.1 `src/styles/gallery.css`

Currently `.gallery-frame` is `position: absolute; inset: 0` with no clipping anywhere in the file.

**Change the frame to be inset:**

```css
.gallery-frame {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 18%;
  right: 18%;
  /* everything else (transform, transition, will-change) stays as it is */
}
```

Use `left`/`right` rather than `width` + negative margin: the 64% falls out automatically, and the mobile override becomes two lines. Add `left: 0; right: 0` to the existing `@media (max-width: 767px)` block so mobile keeps full-width frames (CONCEPT §32).

**Add the clipping container:**

```css
.gallery-viewport {
  overflow: hidden;                    /* the guarantee — kills the overflow */
  -webkit-mask-image: linear-gradient(to right,
    transparent 0, #000 7%, #000 93%, transparent 100%);
          mask-image: linear-gradient(to right,
    transparent 0, #000 7%, #000 93%, transparent 100%);
}

@media (max-width: 767px) {
  .gallery-viewport {
    -webkit-mask-image: none;
            mask-image: none;
  }
}
```

The mask must be disabled under 768px. There the active frame spans the full width, so the gradient would fade *its* edges rather than a neighbour's. On desktop the active frame lives inside 18%–82% and the mask only touches 0–7% and 93–100%, so it never dims the active project.

`mask-image` alone does **not** fix the overflow — transparent pixels still contribute to the scrollable area. Both properties are needed.

### 3.2 `src/features/gallery/components/GalleryViewport.tsx`

One line. The container at line ~68 currently reads:

```tsx
className="relative h-[clamp(24rem,58vh,34rem)] touch-pan-y select-none"
```

Add `gallery-viewport` to it. Nothing else in the component changes.

### 3.3 `src/features/gallery/lib/depth.ts`

Current values: `x = direction * (62 + (distance - 1) * 34)`, `scale = 1 - distance * 0.13`, `opacity = distance === 1 ? 0.45 : 0.18`, and `mobileDepthStyle` at `±104`.

Target:

| Distance | x | scale | opacity | Result |
| --- | --- | --- | --- | --- |
| 0 | 0 | 1 | 1 | fills the inset area |
| 1 | ±91% | 0.88 | 0.5 | right edge at ~20% of the column — fills the margin and tucks just under the active frame, so there is no gap |
| 2 | ±120% | 0.78 | 0.2 | just off-stage |

`mobileDepthStyle` moves to `±110`.

**The derivation**, so these can be re-tuned rather than guessed at. Let `W` be the gallery column width. The frame is inset 18% each side, so its width is `F = 0.64W`. CSS `translate` percentages resolve against the element's own width, and `transform-origin` is `center`, so for offset `x` (percent) and scale `s`:

```
centre     = 0.5W + (x/100) · F
half-width = (F/2) · s
right edge = centre + half-width
```

For distance 1 with `x = -91`, `s = 0.88`:

```
centre     = 0.5W − 0.91 × 0.64W = −0.0824W
half-width = 0.32W × 0.88        =  0.2816W
right edge = 0.1992W  →  just past the active frame's left edge at 0.18W
```

The neighbour therefore fills the entire 0–18% margin and slips ~2% underneath the active frame (which sits above it at `zIndex: 30` vs `29`), leaving no seam. Distance 2 computes to a right edge of `−0.018W`, i.e. fully off-stage.

**Keep `VISIBLE_NEIGHBOURS = 2`.** Distance-2 frames are now clipped out of sight, which makes the constant look wrong — but they must stay mounted. If they are not rendered, the incoming frame mounts at its final position with no previous value to transition from, and pops in instead of sliding. Leave a comment saying so; the next reader will otherwise "fix" it.

### 3.4 Guarding the geometry

The peek width is implied by three numbers that have to agree: the CSS inset, and `x` and `scale` from `depth.ts`. Nothing currently connects them.

Add a small pure helper to `depth.ts` — something like `neighbourRightEdge(inset, x, scale)` returning a fraction of the column — and a test in `src/features/gallery/lib/gallery.test.ts` asserting it lands inside the margin. If someone retunes `x` or `scale`, the test tells them the peek broke instead of leaving it for a future screenshot.

Also add a named constant for the 18% inset with a comment pointing at `gallery.css`, since CSS cannot import from TypeScript and the two must be changed together.

**The existing tests survive unchanged.** They assert relationships — mirroring (`left.x === -right.x`), ordering (`depthStyle(1).scale > depthStyle(2).scale`), z-index stacking, render thresholds at `VISIBLE_NEIGHBOURS` — not literals. The one near-literal is `mobileDepthStyle(1).x > 100`, which `110` still satisfies. Verified by reading the file; re-run `bun run test` to confirm.

---

## 4. Part 2 — Regression guards

This bug shipped because nothing measured layout. Two additions, in this order.

### 4.1 `e2e/overflow.spec.ts` — the assertion that would have caught it

Playwright is **not currently installed**:

```bash
bun add -d @playwright/test
bunx playwright install chromium
```

Configure `webServer` in `playwright.config.ts` to run `bun run build && bun run start` against port 3000, so the suite tests the real production output rather than dev.

The test itself: for each of `/`, `/projects`, `/projects/morphwave`, `/projects/interference`, at viewport widths 390, 768 and 1440, assert

```ts
await page.evaluate(() => {
  const el = document.documentElement
  return el.scrollWidth === el.clientWidth
})
```

This is the single highest-value test in the repository. It is four routes × three widths of the exact condition that broke.

While Playwright is there, add a second spec covering what the unit tests cannot: arrow keys and the prev/next buttons change the active project, the INFO dialog traps focus and returns it to its trigger on Escape, and every route renders its `h1`.

### 4.2 `scripts/capture-shots.ts` — a way to actually look

Drives headless Chrome over CDP (recipe in §1) to write every route × breakpoint into a gitignored `.shots/` directory. Wire it up as `bun run shots` and add `.shots/` to `.gitignore`.

Not an assertion, and not a substitute for one — but looking at the rendered page is what surfaced this bug, and nothing in the repo made that easy.

---

## 5. Part 3 — Homepage project index strip

The one element of the concept-art composition that is genuinely missing. The art has a horizontal row of numbered thumbnails below the `//` divider, with the "Project Index" heading beside it; `src/app/page.tsx` currently has only a "Browse all projects" text link.

Build `src/features/project-index/components/ProjectIndexStrip.tsx`, reusing the existing `ProjectIndexCard` (`src/features/project-index/components/ProjectIndexCard.tsx`) rather than writing a second card. A scroll-snap row with `overflow-x: auto`.

The scrolling must be **contained** — it must not reintroduce page-level overflow. The Part 2 guard covers this, which is why Part 2 comes first.

Server Component; the strip should ship no JavaScript.

---

## 6. Part 4 — SEO and brand completion

- **`src/app/sitemap.ts`** and **`src/app/robots.ts`** — derive from `projectRepository.getAll()` so they stay correct as projects are added, with nothing to maintain by hand. This is invariant I2 (the manifest is the only source) applied to SEO.
- **`src/app/icon.svg`** — there is no favicon at all today. Use the `SO/MU` monogram from `src/assets/brand/monogram.svg`; the compact lockup exists for exactly this.
- **Default Open Graph image** — one on-brand 1200×630 asset. Extend `scripts/generate-placeholder-media.ts`, which already draws the six compositions and the stencil frame, rather than pulling in `next/og`. Per-project OG images already work (they use the project poster via `generateMetadata`); this is only the site-level default.

---

## 7. Part 5 — CI

`.github/workflows/verify.yml`: `bun install --frozen-lockfile`, then `bun run verify`, then the Playwright suite, on push and pull request.

Nothing enforces the gates today — they run only when someone remembers. `bun run verify` already chains registry check → content validation → architecture check → typecheck → lint → test → build, so the workflow is thin.

---

## 8. Files

```
# Part 1 — the fix
src/styles/gallery.css                                   clip, mask, frame inset
src/features/gallery/lib/depth.ts                        retuned offsets + peek helper
src/features/gallery/components/GalleryViewport.tsx      add .gallery-viewport class
src/features/gallery/lib/gallery.test.ts                 peek geometry test

# Part 2 — guards
playwright.config.ts · e2e/overflow.spec.ts · e2e/gallery.spec.ts
scripts/capture-shots.ts · .gitignore (.shots/)

# Part 3 — index strip
src/features/project-index/components/ProjectIndexStrip.tsx
src/features/project-index/index.ts · src/app/page.tsx

# Part 4 — SEO and brand
src/app/sitemap.ts · src/app/robots.ts · src/app/icon.svg
scripts/generate-placeholder-media.ts

# Part 5 — CI
.github/workflows/verify.yml
```

---

## 9. Verification

```bash
bun run verify          # green throughout — this is the gate
bun run shots           # capture every route × breakpoint, then look at them
bunx playwright test    # overflow guard + gallery E2E
```

**The assertion that matters** — every route, at 390, 768 and 1440:

```
document.documentElement.scrollWidth === document.documentElement.clientWidth
```

**By eye, on the homepage:**

- The headline is fully legible with nothing overlapping it, at every width.
- A neighbour slab is visible either side of the active frame, fading into the background rather than ending on a hard line.
- Arrow keys and the prev/next buttons move the gallery; frames slide rather than pop — including the frame arriving from distance 2.
- At 390 the header shows the full nav and INFO, and frames are full-width with no fade.
- With OS reduced motion enabled, frames cross-fade in place and every state change stays visible.

**Then re-run the architectural acid test** (`AGENTS.md` §7): add a throwaway project, confirm `git status` shows only new files under `src/content/projects/` plus the generated registry, and remove it.

### Done when

- [ ] Zero horizontal overflow on all four routes at all three widths, asserted by a test.
- [ ] Neighbour slabs visible and fading; headline never obscured.
- [ ] `bun run verify` green; Playwright green.
- [ ] Index strip on the homepage, with no page-level scroll introduced.
- [ ] `sitemap.xml`, `robots.txt` and a favicon all served.
- [ ] CI runs on push.

---

## 10. Pitfalls

- **Do not drop `VISIBLE_NEIGHBOURS` to 1.** See §3.3 — invisible distance-2 frames are what make the transition smooth.
- **`mask-image` needs the `-webkit-` prefix** for Safari. Ship both.
- **The mask must be off below 768px**, or it fades the active frame's own edges.
- **`overflow: hidden` clips the focus ring** of anything near a frame edge. The "View project" link sits ~30px inside the frame and the ring is inset 6.4px, so it is safe today — but keep it in mind if the frame padding shrinks.
- **Tailwind v4 token syntax**: `duration-(--duration-slow)`, never `duration-[--duration-slow]`. The bracket form emits invalid CSS that browsers drop silently. `bun run check:architecture` fails on it.
- **Kill the headless Chrome** when you finish measuring. `taskkill //F //IM chrome.exe //T` on Windows.
- **Watch shell variables in `bun -e` scripts.** During the audit an unexported `$SP` produced a literal `undefined/` directory inside the repo. It was removed, but the same mistake is easy to repeat when writing `capture-shots.ts` — resolve paths inside the script rather than passing them through the environment.
