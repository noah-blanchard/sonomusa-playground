import { createProjectRepository } from './createProjectRepository'
import { localProjectSource } from './sources/local'

export { createProjectRepository } from './createProjectRepository'
export { localProjectSource } from './sources/local'
export type { ProjectRepository, ProjectSource } from './types'

/**
 * The repository the application uses.
 *
 * Everything above the domain imports this rather than constructing its own,
 * so there is one cache and one validation pass per process. Tests build their
 * own with `createProjectRepository(fixtureSource)`.
 */
export const projectRepository = createProjectRepository(localProjectSource)
