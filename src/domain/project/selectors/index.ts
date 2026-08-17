import type { Project, ProjectStatus } from '../types'

/**
 * Derived queries over validated projects.
 *
 * CONCEPT §27: never hand-maintain `const audioProjects = [...]`. Anything that
 * can be derived from metadata is derived here, in pure functions that are
 * trivial to test and impossible to leave stale.
 *
 * Everything is pure and non-mutating — callers frequently hold the same array.
 */

/**
 * Gallery order.
 *
 * Explicit `order` wins, ascending. Projects without one sort after those with,
 * so adding a project without thinking about sequence appends it rather than
 * silently displacing something. Ties break by year (newest first) and then
 * title, so the sequence is fully deterministic — an unstable gallery order
 * would make the numbering meaningless.
 */
export function compareProjects(a: Project, b: Project): number {
  const aHasOrder = a.order !== undefined
  const bHasOrder = b.order !== undefined

  if (aHasOrder && bHasOrder) {
    if (a.order !== b.order) return a.order! - b.order!
  } else if (aHasOrder !== bHasOrder) {
    return aHasOrder ? -1 : 1
  }

  const aYear = a.year ?? 0
  const bYear = b.year ?? 0
  if (aYear !== bYear) return bYear - aYear

  return a.title.localeCompare(b.title)
}

export function sortProjects(projects: readonly Project[]): Project[] {
  return [...projects].sort(compareProjects)
}

export function findBySlug(projects: readonly Project[], slug: string): Project | null {
  return projects.find((project) => project.slug === slug) ?? null
}

export function selectFeatured(projects: readonly Project[]): Project[] {
  return projects.filter((project) => project.featured)
}

export function selectByStatus(projects: readonly Project[], status: ProjectStatus): Project[] {
  return projects.filter((project) => project.status === status)
}

export function selectByTag(projects: readonly Project[], tag: string): Project[] {
  const needle = tag.toLowerCase()
  return projects.filter((project) => project.tags.some((value) => value.toLowerCase() === needle))
}

export function selectByCategory(projects: readonly Project[], category: string): Project[] {
  const needle = category.toLowerCase()
  return projects.filter((project) =>
    project.categories.some((value) => value.toLowerCase() === needle),
  )
}

/** Projects with a live destination — the only ones that can offer a CTA. */
export function selectLinkable(projects: readonly Project[]): Project[] {
  return projects.filter((project) => project.links.live !== undefined)
}

export interface TagCount {
  tag: string
  count: number
}

/**
 * Every tag in use, most common first. Filters are derived from this rather
 * than from a maintained taxonomy, so they cannot fall out of sync with the
 * projects that actually exist.
 */
export function collectTags(projects: readonly Project[]): TagCount[] {
  const counts = new Map<string, number>()

  for (const project of projects) {
    for (const tag of project.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1)
    }
  }

  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
}

export interface Neighbours {
  previous: Project | null
  next: Project | null
  /** Zero-based position in the sorted collection; -1 when not found. */
  index: number
}

/**
 * The projects either side of `slug`, for gallery movement and prefetching.
 *
 * Wraps by default: the gallery is a loop, and CONCEPT §31 asks that only the
 * likely next and previous be prefetched — which requires knowing who they are
 * at the ends too.
 */
export function selectNeighbours(
  projects: readonly Project[],
  slug: string,
  options: { wrap?: boolean } = {},
): Neighbours {
  const { wrap = true } = options

  const index = projects.findIndex((project) => project.slug === slug)
  if (index === -1) return { previous: null, next: null, index: -1 }

  const count = projects.length
  // A single project is its own neighbour in a loop, which reads as "nowhere to
  // go" — so treat it as having none.
  if (count <= 1) return { previous: null, next: null, index }

  const previousIndex = wrap ? (index - 1 + count) % count : index - 1
  const nextIndex = wrap ? (index + 1) % count : index + 1

  return {
    previous: projects[previousIndex] ?? null,
    next: projects[nextIndex] ?? null,
    index,
  }
}

/**
 * Other projects sharing tags with this one, most overlap first.
 *
 * Deliberately simple — shared-tag counting, no scoring model. CONCEPT §26
 * warns against overbuilding taxonomy while the collection is small, and this
 * is easy to replace once there is enough content to judge it.
 */
export function selectRelated(
  projects: readonly Project[],
  project: Project,
  limit = 3,
): Project[] {
  const tags = new Set(project.tags.map((tag) => tag.toLowerCase()))
  if (tags.size === 0) return []

  return projects
    .filter((candidate) => candidate.slug !== project.slug)
    .map((candidate) => ({
      project: candidate,
      overlap: candidate.tags.filter((tag) => tags.has(tag.toLowerCase())).length,
    }))
    .filter((entry) => entry.overlap > 0)
    .sort((a, b) => b.overlap - a.overlap || compareProjects(a.project, b.project))
    .slice(0, limit)
    .map((entry) => entry.project)
}

/**
 * Display number for the gallery and index — `001`, `002`, …
 *
 * Derived from position rather than stored, so it can never disagree with the
 * order actually rendered.
 */
export function formatProjectNumber(index: number): string {
  return String(index + 1).padStart(3, '0')
}
