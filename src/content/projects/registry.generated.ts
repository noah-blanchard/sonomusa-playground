// AUTO-GENERATED — DO NOT EDIT.
// Run `bun run registry:generate`. See docs/rules/01-architecture.md.

import { project as harmonics } from './harmonics/project'
import { project as interference } from './interference/project'
import { project as liminalDrift } from './liminal-drift/project'
import { project as morphwave } from './morphwave/project'
import { project as musai } from './musai/project'
import { project as orbitalData } from './orbital-data/project'

/**
 * Raw manifests, in directory order. The repository validates them — this file
 * only wires them up, and deliberately types them as unknown so nothing can
 * consume an unvalidated manifest by accident.
 */
export const projectManifests: readonly unknown[] = [
  harmonics,
  interference,
  liminalDrift,
  morphwave,
  musai,
  orbitalData,
]
