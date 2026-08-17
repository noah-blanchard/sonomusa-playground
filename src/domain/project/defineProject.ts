import { parseProject } from './parse'
import type { Project, ProjectInput } from './types'

/**
 * Authoring helper for project manifests (CONCEPT §11).
 *
 *   export const project = defineProject({ schemaVersion: 1, slug: 'morphwave', … })
 *
 * It validates, applies defaults, and gives the author full autocomplete on the
 * contract. Validation happens at module evaluation, which is deliberate: a bad
 * manifest fails the moment it is imported, naming the field — rather than
 * surfacing three layers later as an undefined in a component.
 *
 * This is the one place in the codebase where an import-time side effect is
 * intended. Everywhere else, modules define rather than act.
 */
export function defineProject(input: ProjectInput): Project {
  return parseProject(input, { source: inferSource(input) })
}

/**
 * Best-effort source label for error messages. The slug is the most useful
 * identifier an author has at this point — the stack trace supplies the path.
 */
function inferSource(input: ProjectInput): string {
  const slug = typeof input === 'object' && input !== null ? (input as { slug?: unknown }).slug : undefined

  return typeof slug === 'string' && slug.length > 0
    ? `src/content/projects/${slug}/project.ts`
    : 'a project manifest'
}
