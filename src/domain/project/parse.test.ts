import { describe, expect, it } from 'vitest'
import { ProjectValidationError, UnsupportedSchemaVersionError } from './errors'
import { parseProject, safeParseProject } from './parse'
import type { ProjectInput } from './types'

/**
 * These tests guard the contract, not the pixels. Every one of them describes
 * a way the gallery could silently break as projects are added.
 */

/** The smallest manifest that is legal — the floor an author must clear. */
function minimalManifest(overrides: Partial<ProjectInput> = {}): Record<string, unknown> {
  return {
    schemaVersion: 1,
    slug: 'test-project',
    title: 'Test Project',
    status: 'live',
    media: { poster: 'poster.webp' },
    preview: { kind: 'static' },
    ...overrides,
  }
}

describe('parseProject', () => {
  it('accepts a minimal manifest', () => {
    const project = parseProject(minimalManifest())

    expect(project.slug).toBe('test-project')
    expect(project.title).toBe('Test Project')
    expect(project.status).toBe('live')
  })

  it('applies defaults so consumers never handle undefined collections', () => {
    const project = parseProject(minimalManifest())

    // Every consumer would otherwise reinvent the same `?? []` fallback.
    expect(project.tags).toEqual([])
    expect(project.categories).toEqual([])
    expect(project.technologies).toEqual([])
    expect(project.credits).toEqual([])
    expect(project.media.screenshots).toEqual([])
    expect(project.links).toEqual({})
    expect(project.featured).toBe(false)
  })

  it('preserves authored values over defaults', () => {
    const project = parseProject(
      minimalManifest({
        tags: ['audio', 'generative'],
        featured: true,
        order: 3,
        year: 2025,
      }),
    )

    expect(project.tags).toEqual(['audio', 'generative'])
    expect(project.featured).toBe(true)
    expect(project.order).toBe(3)
    expect(project.year).toBe(2025)
  })

  describe('schema versioning', () => {
    it('rejects an unknown version loudly instead of coercing it', () => {
      // Silently parsing a future manifest with the current schema is how
      // fields get dropped without anyone noticing.
      expect(() => parseProject(minimalManifest({ schemaVersion: 99 } as never))).toThrow(
        UnsupportedSchemaVersionError,
      )
    })

    it('names the supported versions in the error', () => {
      try {
        parseProject(minimalManifest({ schemaVersion: 99 } as never))
        expect.unreachable('should have thrown')
      } catch (error) {
        expect((error as Error).message).toContain('This build understands: 1')
      }
    })

    it('requires a schemaVersion at all', () => {
      const { schemaVersion: _omitted, ...withoutVersion } = minimalManifest()

      expect(() => parseProject(withoutVersion)).toThrow(ProjectValidationError)
    })
  })

  describe('validation failures', () => {
    it('rejects a manifest that is not an object', () => {
      expect(() => parseProject(null)).toThrow(ProjectValidationError)
      expect(() => parseProject([])).toThrow(ProjectValidationError)
      expect(() => parseProject('nope')).toThrow(ProjectValidationError)
    })

    it('rejects a missing title', () => {
      const { title: _omitted, ...withoutTitle } = minimalManifest()

      expect(() => parseProject(withoutTitle)).toThrow(ProjectValidationError)
    })

    it('rejects a missing poster — the fallback is not optional', () => {
      expect(() => parseProject(minimalManifest({ media: {} } as never))).toThrow(
        ProjectValidationError,
      )
    })

    it('names the offending field and the source file', () => {
      try {
        parseProject(minimalManifest({ status: 'published' } as never), {
          source: 'src/content/projects/test-project/project.ts',
        })
        expect.unreachable('should have thrown')
      } catch (error) {
        const message = (error as Error).message
        // An author needs the file and the field, not a stack trace.
        expect(message).toContain('src/content/projects/test-project/project.ts')
        expect(message).toContain('status')
      }
    })
  })

  describe('slugs', () => {
    it.each(['morphwave', 'liminal-drift', 'a1', 'orbital-data-2'])('accepts %s', (slug) => {
      expect(parseProject(minimalManifest({ slug })).slug).toBe(slug)
    })

    it.each(['Morphwave', 'liminal drift', 'trailing-', '-leading', 'double--hyphen', 'under_score'])(
      'rejects %s',
      (slug) => {
        // Slugs are routes and directory names; a bad one breaks both.
        expect(() => parseProject(minimalManifest({ slug }))).toThrow(ProjectValidationError)
      },
    )
  })

  describe('preview kinds', () => {
    it('accepts static without a src', () => {
      const project = parseProject(minimalManifest({ preview: { kind: 'static' } }))
      expect(project.preview.kind).toBe('static')
    })

    it('accepts video with a relative src', () => {
      const project = parseProject(
        minimalManifest({ preview: { kind: 'video', src: 'preview.mp4' } }),
      )
      expect(project.preview).toMatchObject({ kind: 'video', src: 'preview.mp4' })
    })

    it('requires a src for video', () => {
      expect(() => parseProject(minimalManifest({ preview: { kind: 'video' } } as never))).toThrow(
        ProjectValidationError,
      )
    })

    it('rejects absolute or remote media paths', () => {
      // Media is resolved relative to the project directory so that moving
      // assets to remote storage later needs no manifest changes.
      expect(() =>
        parseProject(minimalManifest({ preview: { kind: 'video', src: '/videos/x.mp4' } })),
      ).toThrow(ProjectValidationError)

      expect(() =>
        parseProject(
          minimalManifest({ preview: { kind: 'video', src: 'https://cdn.example.com/x.mp4' } }),
        ),
      ).toThrow(ProjectValidationError)
    })

    it('applies a restrictive sandbox default to iframes', () => {
      const project = parseProject(
        minimalManifest({ preview: { kind: 'iframe', src: 'https://example.com' } }),
      )

      expect(project.preview).toMatchObject({
        kind: 'iframe',
        sandbox: ['allow-scripts', 'allow-same-origin'],
      })
    })

    it('requires a real URL for iframes', () => {
      expect(() =>
        parseProject(minimalManifest({ preview: { kind: 'iframe', src: 'preview.html' } })),
      ).toThrow(ProjectValidationError)
    })

    it('requires a componentId for component previews', () => {
      expect(() =>
        parseProject(minimalManifest({ preview: { kind: 'component', componentId: '' } })),
      ).toThrow(ProjectValidationError)
    })

    it('rejects an unknown preview kind', () => {
      // A future kind must be added to the union, not smuggled in by a manifest.
      expect(() =>
        parseProject(minimalManifest({ preview: { kind: 'webgpu' } } as never)),
      ).toThrow(ProjectValidationError)
    })
  })

  describe('links', () => {
    it('treats a missing live URL as valid — not every project has shipped', () => {
      const project = parseProject(minimalManifest())
      expect(project.links.live).toBeUndefined()
    })

    it('accepts a subdomain', () => {
      const project = parseProject(
        minimalManifest({ links: { live: 'https://morphwave.sonomusa.com' } }),
      )
      expect(project.links.live).toBe('https://morphwave.sonomusa.com')
    })

    it('rejects a malformed live URL rather than rendering a broken link', () => {
      expect(() => parseProject(minimalManifest({ links: { live: 'morphwave.sonomusa' } }))).toThrow(
        ProjectValidationError,
      )
    })
  })

  describe('presentation hints', () => {
    it('accepts a CSS aspect ratio', () => {
      const project = parseProject(
        minimalManifest({ presentation: { preferredAspectRatio: '16 / 9' } }),
      )
      expect(project.presentation?.preferredAspectRatio).toBe('16 / 9')
    })

    it('rejects a ratio the frame cannot use', () => {
      expect(() =>
        parseProject(minimalManifest({ presentation: { preferredAspectRatio: 'wide' } })),
      ).toThrow(ProjectValidationError)
    })

    it('constrains a focal point to 0–1', () => {
      expect(() =>
        parseProject(minimalManifest({ presentation: { focalPoint: { x: 1.5, y: 0 } } })),
      ).toThrow(ProjectValidationError)
    })
  })
})

describe('safeParseProject', () => {
  it('reports success without throwing', () => {
    const result = safeParseProject(minimalManifest())

    expect(result.success).toBe(true)
    if (result.success) expect(result.project.slug).toBe('test-project')
  })

  it('captures the failure so a whole run can be reported at once', () => {
    // validate:content needs every error, not just the first.
    const result = safeParseProject({ schemaVersion: 1 })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBeInstanceOf(ProjectValidationError)
  })
})
