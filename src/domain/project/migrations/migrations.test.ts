import { describe, expect, it } from 'vitest'
import { CURRENT_SCHEMA_VERSION } from '../schemas'
import { migrateToCurrent, migrations, supportedVersions } from './index'

/**
 * The migration chain is empty today. These tests exist so that the first
 * schema bump is caught by a failing test rather than by a broken deployment —
 * the seam is only worth having if it is known to work.
 */
describe('migrations', () => {
  it('leaves a current-version manifest untouched', () => {
    const input = { schemaVersion: CURRENT_SCHEMA_VERSION, slug: 'x' }

    expect(migrateToCurrent(input, CURRENT_SCHEMA_VERSION)).toEqual(input)
  })

  it('lists every parseable version', () => {
    expect(supportedVersions()).toEqual([1])
  })

  it('has a migration for every gap below the current version', () => {
    // The guard that matters: bumping CURRENT_SCHEMA_VERSION without adding
    // the corresponding migration fails here instead of at runtime.
    for (let version = 1; version < CURRENT_SCHEMA_VERSION; version += 1) {
      expect(migrations[version], `missing migration from v${version} to v${version + 1}`).toBeTypeOf(
        'function',
      )
    }
  })

  it('refuses to migrate across a missing step', () => {
    expect(() => migrateToCurrent({}, 0)).toThrow(/Missing migration from schemaVersion 0/)
  })
})
