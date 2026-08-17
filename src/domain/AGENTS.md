# src/domain — scoped rules

**This layer is pure TypeScript. It renders nothing.**

- No `react`, `react-dom`, `next`, or `motion` imports. Ever. ESLint enforces it.
- No imports from `@/features`, `@/app`, `@/components` or `@/styles`.
- No imports from `@/content` — except `repository/sources/**`, the one documented seam.

**The schema is canonical.** Types are `z.infer`'d from Zod schemas, never hand-written beside them. Two definitions always drift.

**Selectors are pure functions** over `Project[]`. Never a hand-maintained array of grouped projects — derive it.

**Migrations are additive.** Old schema versions keep parsing. Unsupported versions are rejected loudly, never coerced.

Why this layer is sealed: the same `Project` objects must serve the gallery, the index, the routes, the metadata generator, and layouts that do not exist yet. The moment the domain knows about rendering, it starts being shaped by one consumer.

Full detail: `docs/rules/01-architecture.md`.
