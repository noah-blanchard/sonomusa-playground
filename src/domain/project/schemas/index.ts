import { ProjectSchemaV1 } from './v1'

export * from './preview'
export * from './v1'

/**
 * The version this codebase's domain model represents.
 *
 * When the schema evolves: bump this, add the new schema file, register a
 * migration, and keep the old schema so existing manifests continue to parse.
 * Consumers only ever see the current model — see migrations/index.ts.
 */
export const CURRENT_SCHEMA_VERSION = 1

/**
 * The schema every project is ultimately validated against, whatever version
 * it was authored at. Aliased here so that bumping the version is a one-line
 * change rather than a search across the codebase.
 */
export const CurrentProjectSchema = ProjectSchemaV1

/** Every schema version we can still parse, keyed by version number. */
export const SCHEMAS_BY_VERSION = {
  1: ProjectSchemaV1,
} as const

export type SupportedSchemaVersion = keyof typeof SCHEMAS_BY_VERSION
