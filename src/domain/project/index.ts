/**
 * Public surface of the project domain.
 *
 * Everything above this layer imports from here rather than reaching into
 * internal files, so the internals stay free to move.
 */

export { defineProject } from './defineProject'
export { parseProject, safeParseProject } from './parse'
export type { ParseContext, ParseResult } from './parse'

export { ProjectValidationError, UnsupportedSchemaVersionError } from './errors'

export {
  CURRENT_SCHEMA_VERSION,
  CurrentProjectSchema,
  PREVIEW_KINDS,
  SCHEMAS_BY_VERSION,
  SLUG_PATTERN,
} from './schemas'

export {
  createProjectRepository,
  localProjectSource,
  projectRepository,
} from './repository'
export type { ProjectRepository, ProjectSource } from './repository'

export {
  collectTags,
  compareProjects,
  experienceTarget,
  findBySlug,
  formatProjectNumber,
  selectByCategory,
  selectByStatus,
  selectByTag,
  selectFeatured,
  selectHosted,
  selectLinkable,
  selectNeighbours,
  selectRelated,
  sortProjects,
} from './selectors'
export type { ExperienceTarget, Neighbours, TagCount } from './selectors'

export type { Preview, PreviewKind, Project, ProjectInput, ProjectStatus } from './types'
