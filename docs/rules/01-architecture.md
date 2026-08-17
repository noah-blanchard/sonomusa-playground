# 01 — Architecture

Expands §2 and §3 of `AGENTS.md`. Read that first.

---

## The shape of the system

```
Project content            src/content/projects/<slug>/project.ts
      ↓
Validation / parsing       src/domain/project/parse.ts      (Zod, versioned)
      ↓
Domain model               src/domain/project/types.ts      (normalized, current)
      ↓
Repository                 src/domain/project/repository/   (port + source adapter)
      ↓
Selectors                  src/domain/project/selectors/    (pure derived queries)
      ↓
Features                   src/features/{gallery,project-index,project-preview}
      ↓
Routes / SEO               src/app/
```

Each arrow is a one-way dependency. Nothing points back up.

## Why the boundaries are where they are

**Why the domain has no React.** Because the same `Project` objects have to serve the gallery, the index, the routes, the metadata generator, and every layout that does not exist yet (CONCEPT §21). The moment the domain knows about rendering, it starts being shaped by one consumer — and the second consumer pays for it.

**Why content goes through a repository.** Today projects are local files. Later they may come from a CMS, a database, or an API (CONCEPT §40). Shared UI must not care. `ProjectRepository` is the seam that makes that swap a one-file change instead of a rewrite. We are not building the CMS. We are declining to make it impossible.

**Why shared UI cannot import content.** If a component can reach the project list directly, it will eventually reach for one specific project. Cutting the import is what makes invariant I3 structurally true rather than merely intended.

## The repository port

```ts
interface ProjectSource {
  load(): Promise<unknown[]>   // raw, unvalidated manifests
}

interface ProjectRepository {
  getAll(): Promise<Project[]>
  getBySlug(slug: string): Promise<Project | null>
  getFeatured(): Promise<Project[]>
}
```

The repository is responsible for discovery, validation, default normalization, sorting, and exposing stable queries — so none of that logic gets duplicated across the app.

`src/domain/project/repository/sources/local.ts` is the only file in the codebase permitted to import from `src/content/**`. That exception is encoded in `eslint.config.mjs`; it is narrow on purpose.

## Discovery and the generated registry

Manifests are TypeScript, which means the bundler has to be able to see them statically. Reading the directory at runtime and calling `import()` with a template literal defeats that analysis, so instead:

`scripts/generate-registry.ts` scans `src/content/projects/*/project.ts` and writes `src/content/projects/registry.generated.ts` — a plain explicit barrel.

- It runs automatically inside `bun dev` and `bun run build`.
- The file **is committed**: builds stay reproducible, and adding a project shows up in the diff.
- `bun run registry:check` fails when it is stale.
- Never hand-edit it.

This still satisfies CONCEPT §13. The author never maintains an array — the generator does.

## Preview architecture

A project declares **what kind** of preview it has. The gallery decides **how** that kind renders. The mapping lives in exactly one place:

```ts
// src/features/project-preview/renderers/index.ts
const renderers = {
  static: StaticPreview,
  video: VideoPreview,
  iframe: IframePreview,
  component: ComponentPreview,
}
```

Adding a future kind — `webgpu`, `audio`, `canvas`, `remote-stream` — means: one variant on the union, one renderer, one map entry. No other file changes.

**`preview` and `links` are different concerns.** `preview` describes what renders inside the frame. `links.live` describes where the visitor can go. Projects live on their own subdomains, so the primary action leaves the site — but that is a *destination*, never a render mode. Keeping them separate is what stops link logic from leaking into the preview adapters. See `docs/adr/0001-baseline.md`.

## Enforcement

The rules above are checked, not trusted:

| Mechanism | Catches |
| --- | --- |
| `eslint.config.mjs` import zones | Any upward or sideways import across a layer |
| `scripts/check-architecture.ts` | A project slug appearing in shared UI; React inside the domain |
| `scripts/validate-content.ts` | Malformed manifests, missing posters, duplicate slugs or orders |
| `scripts/generate-registry.ts --check` | A stale registry |
| `next.config.ts` | Type or lint errors reaching a production build |

If you find a way to violate an invariant that no check catches, the correct response is to add the check.
