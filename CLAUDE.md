# CLAUDE.md

@AGENTS.md

The file above is the contract. Everything in it applies here. This file only adds what is specific to working through Claude Code.

---

## Before editing

Read the scoped `AGENTS.md` in the directory you are about to touch. They are short and they sit exactly where the mistake would happen:

- `src/domain/AGENTS.md`
- `src/features/AGENTS.md`
- `src/content/projects/AGENTS.md`

## While working

- **Bun, never npm or yarn.** `bun install`, `bun run <script>`, `bun <file>.ts`. Bun executes TypeScript directly, so scripts in `scripts/` need no build step.
- **Commit atomically.** One coherent change per commit. The message explains *why* the change is shaped the way it is — the diff already shows what changed.
- **Prefer `bun run verify`** over running the individual checks, unless you are iterating tightly on one of them.
- **Never hand-edit `src/content/projects/registry.generated.ts`.** Run `bun run registry:generate`.

## The check that matters most

Invariant I3 — no project named in shared code — is the one that quietly erodes. Before finishing any work that touches the project system:

```bash
bun run check:architecture
```

Adding a project should produce a `git status` containing only new files under `src/content/projects/`. If a shared file had to change to accommodate a project, that is an architecture bug to fix, not a project to special-case.

## Deployment

Self-hosted **Dokploy**, not Vercel. `next.config.ts` sets `output: 'standalone'`, and `sharp` is a runtime dependency because the container has to do its own image optimization. Do not add Vercel-specific APIs, adapters or configuration.

## When something is ambiguous

CONCEPT is the source of truth and it is opinionated — check `Concept/CONCEPT.md` before inventing an answer. If it genuinely does not cover the case, choose the simpler explicit option and note the assumption rather than building a general mechanism for a single use.
