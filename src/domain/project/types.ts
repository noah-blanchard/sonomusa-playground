import type { z } from 'zod'
import type { CurrentProjectSchema } from './schemas'

/**
 * The normalized domain model — the only project shape the rest of the
 * application ever sees.
 *
 * Old manifests are migrated up to this shape before anything renders, so a
 * v1 manifest can never leak a v1-shaped object into presentation logic
 * (CONCEPT §41). Every default is applied here: arrays are arrays, never
 * undefined, so consumers do not each reinvent the same fallback.
 */
export type Project = z.output<typeof CurrentProjectSchema>

/** What an author writes in a manifest, before defaults are applied. */
export type ProjectInput = z.input<typeof CurrentProjectSchema>

export type { Preview, PreviewKind } from './schemas/preview'
export type { ProjectStatus } from './schemas/v1'
