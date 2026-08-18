// AUTO-GENERATED — DO NOT EDIT.
// Run `bun run registry:generate`. See docs/rules/01-architecture.md.

import { project as musicphone } from './musicphone/project'
import { project as sono303 } from './sono303/project'
import { project as zoomquilt } from './zoomquilt/project'

/**
 * Raw manifests, in directory order. The repository validates them — this file
 * only wires them up, and deliberately types them as unknown so nothing can
 * consume an unvalidated manifest by accident.
 */
export const projectManifests: readonly unknown[] = [
  musicphone,
  sono303,
  zoomquilt,
]
