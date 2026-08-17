import { parseProject } from '../parse'
import { sortProjects } from '../selectors'
import type { Project } from '../types'
import type { ProjectRepository, ProjectSource } from './types'

/**
 * Builds a repository over any source.
 *
 * Responsibilities, all in one place so no consumer reimplements them
 * (CONCEPT §8): load, validate, normalize, sort, expose stable queries.
 */
export function createProjectRepository(source: ProjectSource): ProjectRepository {
  /**
   * Memoized as a promise rather than a value, so concurrent callers during a
   * single render share one load instead of racing.
   */
  let cache: Promise<readonly Project[]> | null = null

  async function loadAll(): Promise<readonly Project[]> {
    const raw = await source.load()

    const projects = raw.map((manifest, index) => {
      const slug =
        typeof manifest === 'object' && manifest !== null
          ? (manifest as { slug?: unknown }).slug
          : undefined

      const label =
        typeof slug === 'string' && slug.length > 0
          ? `src/content/projects/${slug}/project.ts`
          : `${source.name} — manifest #${index}`

      /**
       * Throws rather than skipping. A project that silently vanishes from the
       * gallery is far worse than a loud failure, and `bun run validate:content`
       * plus the build gate mean this path should be unreachable in a deployed
       * build. Preview failures degrade gracefully; content failures do not.
       */
      return parseProject(manifest, { source: label })
    })

    return sortProjects(projects)
  }

  return {
    getAll() {
      cache ??= loadAll()
      return cache
    },

    async getBySlug(slug: string) {
      const projects = await this.getAll()
      return projects.find((project) => project.slug === slug) ?? null
    },

    async getFeatured() {
      const projects = await this.getAll()
      return projects.filter((project) => project.featured)
    },

    invalidate() {
      cache = null
    },
  }
}
