import { z } from 'zod'

/**
 * Thrown when a manifest cannot be turned into a valid project.
 *
 * "Invalid project" is not an error message. These carry the source file and
 * the offending field, because the person reading this is usually an author who
 * just added a project and needs to know which line to fix — not a debugger
 * tracing a stack.
 */
export class ProjectValidationError extends Error {
  readonly source: string | undefined
  readonly issues: readonly string[]

  constructor(message: string, options: { source?: string; issues?: readonly string[] } = {}) {
    const location = options.source ? `\n  in ${options.source}` : ''
    const detail =
      options.issues && options.issues.length > 0
        ? `\n${options.issues.map((issue) => `  ${issue}`).join('\n')}`
        : ''

    super(`${message}${location}${detail}`)

    this.name = 'ProjectValidationError'
    this.source = options.source
    this.issues = options.issues ?? []
  }

  static fromZod(error: z.ZodError, source?: string): ProjectValidationError {
    const issues = error.issues.map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join('.') : '(root)'
      return `• ${path}: ${issue.message}`
    })

    return new ProjectValidationError('Project manifest failed validation', { source, issues })
  }
}

/**
 * Thrown when a manifest declares a schema version this build cannot handle.
 *
 * Rejected loudly rather than coerced: silently parsing an unknown version with
 * the current schema is how a future manifest quietly loses fields.
 */
export class UnsupportedSchemaVersionError extends Error {
  constructor(
    readonly received: unknown,
    readonly supported: readonly number[],
    source?: string,
  ) {
    super(
      `Unsupported schemaVersion: ${JSON.stringify(received)}` +
        (source ? `\n  in ${source}` : '') +
        `\n  This build understands: ${supported.join(', ')}` +
        `\n  Add a schema and a migration before authoring against a newer version.`,
    )
    this.name = 'UnsupportedSchemaVersionError'
  }
}
