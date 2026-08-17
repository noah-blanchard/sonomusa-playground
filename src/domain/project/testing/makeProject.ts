import { parseProject } from '../parse'
import type { Project, ProjectInput } from '../types'

/**
 * Builds a valid project for tests.
 *
 * It goes through the real parser rather than casting a literal, so a fixture
 * can never drift out of conformance with the schema — if the contract changes
 * in a way that breaks projects, these break first.
 */
export function makeProject(overrides: Partial<ProjectInput> = {}): Project {
  return parseProject({
    schemaVersion: 1,
    slug: 'fixture',
    title: 'Fixture',
    status: 'live',
    media: { poster: 'poster.webp' },
    preview: { kind: 'static' },
    ...overrides,
  })
}

/** Several projects at once; `slug` and `title` are derived when not given. */
export function makeProjects(overrides: Partial<ProjectInput>[]): Project[] {
  return overrides.map((override, index) =>
    makeProject({
      slug: `fixture-${index + 1}`,
      title: `Fixture ${index + 1}`,
      ...override,
    }),
  )
}
