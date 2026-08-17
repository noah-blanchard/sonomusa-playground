# src/features — scoped rules

**No project is ever named here.**

- No `slug === 'morphwave'`. No per-project branch. No project-specific CSS.
- No imports from `@/content` — receive validated `Project` objects as props.
- No imports from `@/app`.

Adding a project must not require editing a single file in this directory. `bun run check:architecture` fails the build if a known slug appears here.

**Preview behaviour lives in exactly one map** — `project-preview/renderers/index.ts`. A new preview kind means one union variant, one renderer, one map entry. If you find yourself writing `if (kind === …)` in a second file, the map is the answer.

**Server Components by default.** `'use client'` only where interaction genuinely requires it — gesture handling, preview lifecycle, animated transitions. Cards render on the server and are passed as `children` into the client viewport.

**Every visual value is a token.** No arbitrary colours, sizes or durations.

If a project seems to need special treatment, the answer is a new field on the contract or a new adapter — never a branch here.

Full detail: `docs/rules/01-architecture.md`, `docs/rules/03-design-system.md`.
