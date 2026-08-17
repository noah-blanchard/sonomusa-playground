import { describe, expect, it } from 'vitest'
import { defineProject } from './defineProject'
import { ProjectValidationError } from './errors'

describe('defineProject', () => {
  it('returns a normalized project with defaults applied', () => {
    const project = defineProject({
      schemaVersion: 1,
      slug: 'morphwave',
      title: 'Morphwave',
      status: 'live',
      media: { poster: 'poster.webp' },
      preview: { kind: 'static' },
    })

    expect(project.slug).toBe('morphwave')
    expect(project.tags).toEqual([])
    expect(project.featured).toBe(false)
  })

  it('fails at authoring time, naming the manifest path', () => {
    // The whole value of the helper: the author learns which file is wrong
    // immediately, rather than seeing an undefined in a component later.
    try {
      defineProject({
        schemaVersion: 1,
        slug: 'morphwave',
        title: '',
        status: 'live',
        media: { poster: 'poster.webp' },
        preview: { kind: 'static' },
      })
      expect.unreachable('should have thrown')
    } catch (error) {
      expect(error).toBeInstanceOf(ProjectValidationError)
      expect((error as Error).message).toContain('src/content/projects/morphwave/project.ts')
    }
  })
})
