import { describe, expect, it, vi } from 'vitest'
import { ProjectValidationError } from '../errors'
import { createProjectRepository } from './createProjectRepository'
import type { ProjectSource } from './types'

function sourceOf(...manifests: unknown[]): ProjectSource {
  return { name: 'test source', load: () => Promise.resolve(manifests) }
}

function manifest(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: 1,
    slug: 'one',
    title: 'One',
    status: 'live',
    media: { poster: 'poster.webp' },
    preview: { kind: 'static' },
    ...overrides,
  }
}

describe('createProjectRepository', () => {
  it('validates raw manifests on the way through', async () => {
    const repository = createProjectRepository(sourceOf(manifest()))
    const projects = await repository.getAll()

    expect(projects).toHaveLength(1)
    // Defaults applied, so consumers never handle undefined collections.
    expect(projects[0]!.tags).toEqual([])
  })

  it('returns projects already in gallery order', async () => {
    // Sorting happens once, here — no consumer re-sorts and none can disagree.
    const repository = createProjectRepository(
      sourceOf(
        manifest({ slug: 'third', title: 'Third', order: 3 }),
        manifest({ slug: 'first', title: 'First', order: 1 }),
        manifest({ slug: 'second', title: 'Second', order: 2 }),
      ),
    )

    expect((await repository.getAll()).map((p) => p.slug)).toEqual(['first', 'second', 'third'])
  })

  it('throws on an invalid manifest rather than skipping it', async () => {
    // A project that silently vanishes from the gallery is worse than a loud
    // failure — and validate:content means this should be unreachable in a
    // deployed build.
    const repository = createProjectRepository(sourceOf(manifest({ status: 'nope' })))

    await expect(repository.getAll()).rejects.toThrow(ProjectValidationError)
  })

  it('names the offending manifest', async () => {
    const repository = createProjectRepository(sourceOf(manifest({ slug: 'broken', title: '' })))

    await expect(repository.getAll()).rejects.toThrow(/src\/content\/projects\/broken\/project\.ts/)
  })

  it('falls back to a positional label when the slug is unusable', async () => {
    const repository = createProjectRepository(sourceOf({ schemaVersion: 1 }))

    await expect(repository.getAll()).rejects.toThrow(/test source — manifest #0/)
  })

  describe('getBySlug', () => {
    it('finds a project', async () => {
      const repository = createProjectRepository(sourceOf(manifest({ slug: 'morphwave' })))

      expect((await repository.getBySlug('morphwave'))?.slug).toBe('morphwave')
    })

    it('returns null when absent, so routes can render a 404', async () => {
      const repository = createProjectRepository(sourceOf(manifest()))

      expect(await repository.getBySlug('missing')).toBeNull()
    })
  })

  describe('getFeatured', () => {
    it('returns only featured projects, in order', async () => {
      const repository = createProjectRepository(
        sourceOf(
          manifest({ slug: 'b', title: 'B', featured: true, order: 2 }),
          manifest({ slug: 'a', title: 'A', featured: true, order: 1 }),
          manifest({ slug: 'c', title: 'C', order: 3 }),
        ),
      )

      expect((await repository.getFeatured()).map((p) => p.slug)).toEqual(['a', 'b'])
    })
  })

  describe('caching', () => {
    it('loads the source once however many queries run', async () => {
      const load = vi.fn(() => Promise.resolve([manifest()]))
      const repository = createProjectRepository({ name: 'counted', load })

      await repository.getAll()
      await repository.getAll()
      await repository.getBySlug('one')
      await repository.getFeatured()

      expect(load).toHaveBeenCalledTimes(1)
    })

    it('shares one load between concurrent callers', async () => {
      // Memoizing the promise rather than the value is what prevents a render
      // with several server components from racing the same load.
      const load = vi.fn(() => Promise.resolve([manifest()]))
      const repository = createProjectRepository({ name: 'concurrent', load })

      await Promise.all([repository.getAll(), repository.getAll(), repository.getAll()])

      expect(load).toHaveBeenCalledTimes(1)
    })

    it('reloads after invalidate', async () => {
      const load = vi.fn(() => Promise.resolve([manifest()]))
      const repository = createProjectRepository({ name: 'invalidated', load })

      await repository.getAll()
      repository.invalidate()
      await repository.getAll()

      expect(load).toHaveBeenCalledTimes(2)
    })
  })

  it('handles an empty source — the gallery must work with zero projects', async () => {
    const repository = createProjectRepository(sourceOf())

    expect(await repository.getAll()).toEqual([])
    expect(await repository.getFeatured()).toEqual([])
    expect(await repository.getBySlug('anything')).toBeNull()
  })
})
