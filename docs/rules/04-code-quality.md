# 04 — Code quality

Optimize for the next reader. That reader is often an agent with no memory of why any of this exists, so the code has to explain itself.

---

## TypeScript

Strict mode, plus `noUncheckedIndexedAccess` and `verbatimModuleSyntax`. Both are on deliberately: the first makes array access honest, the second keeps type-only imports erasable.

**Types are inferred from schemas, never hand-written alongside them.**

```ts
// Correct — one definition, no drift.
export type Project = z.infer<typeof ProjectSchemaV1>

// Wrong — two definitions that will disagree within a month.
export interface Project { slug: string /* … */ }
```

A hand-maintained type next to a runtime schema is a bug waiting for a deadline. The schema is canonical.

Other rules:

- `unknown` at boundaries, never `any`. Parse it, then it is typed.
- No `enum` — union types or `as const` objects. They survive erasure and stay serializable.
- No non-null assertions (`!`) to silence a checker. Handle the absence.
- Discriminated unions over optional-field soup. `preview` is the model to follow.

## Server / client boundary

**Server Components by default.** `'use client'` is a deliberate decision with a reason, not a reflex.

| Server | Client |
| --- | --- |
| Project loading and validation | Gallery interaction and gestures |
| Metadata generation | Preview activation lifecycle |
| Index and route rendering | Animated transitions |
| Card markup and static copy | The INFO overlay |

**The composition that keeps this honest:** gallery cards render as Server Components and are passed as `children` into the client viewport.

```tsx
// Server
<GalleryViewport>
  {projects.map((p) => <ProjectCard key={p.slug} project={p} />)}
</GalleryViewport>
```

Project content stays server-rendered; only the interaction layer hydrates. An interactive gallery is not a reason to turn the site into an SPA (CONCEPT §30).

## Modules

- Small and focused. A file that needs a table of contents needs splitting.
- Pure functions wherever practical — every selector is one, which is why they are trivially testable.
- Composition over inheritance. No base classes.
- No prop drilling more than two levels; restructure or lift instead.
- No hidden side effects at import time. Modules define; they do not act.

## Naming

| Kind | Convention | Example |
| --- | --- | --- |
| Components | `PascalCase.tsx` | `ProjectCard.tsx` |
| Hooks | `useCamelCase.ts` | `useGallery.ts` |
| Domain modules | `camelCase.ts` | `defineProject.ts` |
| Directories | `kebab-case` | `project-preview/` |
| Tests | beside the subject | `selectors.test.ts` |

Name things after what they *are*, not what they currently happen to do. `ProjectFrame` outlives `CarouselSlide`.

## Comments

Comment the **why**, never the what. The diff shows what changed; only you know why it had to be that shape.

```ts
// Good — explains a decision the reader would otherwise undo.
// Committed rather than generated at request time: reproducible builds, and
// adding a project shows up in the diff.

// Useless — restates the code.
// Loop over the projects.
```

A comment explaining a non-obvious constraint is worth more than three explaining syntax.

## Testing

Test the contracts, not the pixels. The goal is confidence that the modular architecture still holds as the gallery grows — not a coverage number (CONCEPT §37).

**High value:**

- Schema parsing — valid manifests parse; invalid ones fail with a useful message; unknown `schemaVersion` is rejected explicitly.
- Migrations — a v1 manifest still produces a correct current model after the schema moves on.
- Selectors and sorting — pure functions, cheap to test, easy to break silently.
- Preview adapter resolution — each kind resolves to its renderer; failure falls back to the poster.
- The project frame rendered with genuinely different project shapes, including sparse ones.

**Low value:** snapshotting shell markup, asserting class names, testing that a library works.

Every bug fixed in domain logic gets a test that would have caught it. Presentation bugs usually do not need one.

## Errors

Experimental previews fail. That is expected, and it is designed for.

- Preview failures never crash the gallery — error boundaries plus poster fallback.
- Content errors fail **loudly at build time**, never silently at runtime. A malformed manifest must not reach a deployment.
- Error messages name the file and the field. "Invalid project" is not an error message.
- The shell stays navigable when an individual project is broken.

## Commits

Atomic: one coherent change each. The subject says what, the body says why — the constraint you hit, the alternative you rejected, the thing that will look wrong to a future reader who lacks the context.
