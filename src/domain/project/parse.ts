import { z } from 'zod'
import { ProjectValidationError, UnsupportedSchemaVersionError } from './errors'
import { migrateToCurrent, supportedVersions } from './migrations'
import { CurrentProjectSchema, SCHEMAS_BY_VERSION } from './schemas'
import type { Project } from './types'

/**
 * Turns an unvalidated manifest into a normalized domain Project.
 *
 *   detect version → validate against that version's schema
 *                  → migrate up to current → validate the result
 *
 * The double validation is deliberate. Validating at the authored version
 * produces errors that point at what the author actually wrote; validating
 * again after migration proves the migration chain itself is correct, which is
 * exactly the bug class that is otherwise found in production.
 */

/** Just enough to read the version before we know which schema applies. */
const EnvelopeSchema = z.object({
  schemaVersion: z.number().int().positive(),
})

export interface ParseContext {
  /** Where this manifest came from, so errors can name the file. */
  source?: string
}

export function parseProject(input: unknown, context: ParseContext = {}): Project {
  const { source } = context

  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw new ProjectValidationError(
      'A project manifest must be an object. Did the module forget to `export const project`?',
      { source },
    )
  }

  const envelope = EnvelopeSchema.safeParse(input)
  if (!envelope.success) {
    throw new ProjectValidationError(
      'A project manifest must declare a numeric `schemaVersion`.',
      { source, issues: ['• schemaVersion: missing or not a positive integer'] },
    )
  }

  const version = envelope.data.schemaVersion
  const versionedSchema = SCHEMAS_BY_VERSION[version as keyof typeof SCHEMAS_BY_VERSION]

  if (!versionedSchema) {
    throw new UnsupportedSchemaVersionError(version, supportedVersions(), source)
  }

  // Validate at the authored version so messages match what the author wrote.
  const authored = versionedSchema.safeParse(input)
  if (!authored.success) {
    throw ProjectValidationError.fromZod(authored.error, source)
  }

  const migrated = migrateToCurrent(authored.data as Record<string, unknown>, version)

  // Validate again: this is what catches a broken migration, rather than
  // letting a malformed object reach the UI.
  const normalized = CurrentProjectSchema.safeParse(migrated)
  if (!normalized.success) {
    throw new ProjectValidationError(
      `Migration from schemaVersion ${version} produced an invalid project. ` +
        `This is a bug in src/domain/project/migrations/, not in the manifest.`,
      { source, issues: normalized.error.issues.map((issue) => `• ${issue.path.join('.')}: ${issue.message}`) },
    )
  }

  return normalized.data
}

export type ParseResult =
  | { success: true; project: Project }
  | { success: false; error: Error }

/** Non-throwing variant, for collecting every failure in one validation run. */
export function safeParseProject(input: unknown, context: ParseContext = {}): ParseResult {
  try {
    return { success: true, project: parseProject(input, context) }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error(String(error)) }
  }
}
