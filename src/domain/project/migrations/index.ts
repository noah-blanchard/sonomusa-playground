import { CURRENT_SCHEMA_VERSION } from '../schemas'

/**
 * Schema migrations, keyed by the version they migrate FROM.
 *
 * `migrations[1]` upgrades a v1 manifest to v2. The chain is applied in order
 * until the object reaches CURRENT_SCHEMA_VERSION, so a v1 manifest survives
 * any number of future bumps without the author touching it.
 *
 * The map is empty at v1 — there is nothing to migrate yet. It exists anyway,
 * because the seam is what makes the first bump a small change instead of a
 * refactor, and because CONCEPT §5 warns against assuming the first schema
 * survives forever.
 *
 * A migration must be a pure function over plain data. It runs before
 * validation, so it receives whatever the author wrote and cannot assume the
 * shape is already correct.
 */
export type Migration = (input: Record<string, unknown>) => Record<string, unknown>

export const migrations: Readonly<Record<number, Migration>> = {
  // 1: (input) => ({ ...input, schemaVersion: 2, newField: derive(input) }),
}

/**
 * Walks a raw manifest up to the current schema version.
 *
 * Returns the input untouched when it is already current, which is the whole
 * of today's behaviour.
 */
export function migrateToCurrent(
  input: Record<string, unknown>,
  fromVersion: number,
): Record<string, unknown> {
  let current = input
  let version = fromVersion

  while (version < CURRENT_SCHEMA_VERSION) {
    const migrate = migrations[version]

    if (!migrate) {
      throw new Error(
        `Missing migration from schemaVersion ${version} to ${version + 1}. ` +
          `Add one in src/domain/project/migrations/index.ts.`,
      )
    }

    current = migrate(current)
    version += 1
  }

  return current
}

/** Versions this build can parse, oldest first. */
export function supportedVersions(): number[] {
  return Array.from({ length: CURRENT_SCHEMA_VERSION }, (_, index) => index + 1)
}
