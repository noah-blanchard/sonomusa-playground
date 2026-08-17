import type { Project } from '../types'

/**
 * Where raw manifests come from.
 *
 * Today the only implementation reads the generated registry of local files.
 * Later it could be a CMS, a database, an API, or object storage — and nothing
 * above this interface would change (CONCEPT §40).
 *
 * We are not building the CMS. We are declining to make it impossible, which
 * costs one interface.
 */
export interface ProjectSource {
  /** Named so error messages can say where a bad manifest came from. */
  readonly name: string
  /** Raw and unvalidated — the repository owns validation. */
  load(): Promise<readonly unknown[]>
}

/**
 * The single entry point for reading projects (CONCEPT §8).
 *
 * It exists so that discovery, validation, normalization and sorting happen in
 * exactly one place rather than being reinvented by every consumer.
 */
export interface ProjectRepository {
  /** Every project, validated and in gallery order. */
  getAll(): Promise<readonly Project[]>
  getBySlug(slug: string): Promise<Project | null>
  getFeatured(): Promise<readonly Project[]>
  /** Drops any memoized result. Used by tests and by content reloads. */
  invalidate(): void
}
