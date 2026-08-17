import { projectManifests } from '@/content/projects/registry.generated'
import type { ProjectSource } from '../types'

/**
 * Binds the local content directory to the repository port.
 *
 * THIS IS THE ONLY FILE PERMITTED TO IMPORT FROM src/content/**. The exception
 * is encoded in eslint.config.mjs and checked by scripts/check-architecture.ts,
 * and it is narrow on purpose: everything else goes through ProjectRepository.
 *
 * Swapping this one file for a CMS adapter is the entire reason the boundary
 * exists (CONCEPT §40).
 */
export const localProjectSource: ProjectSource = {
  name: 'local content directory',

  load() {
    // The registry is a generated static barrel, so this is already resolved —
    // no filesystem work happens while serving a request.
    return Promise.resolve(projectManifests)
  },
}
