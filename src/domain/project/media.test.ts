import { describe, expect, it } from 'vitest'
import {
  posterUrl,
  previewPosterUrl,
  resolveMediaUrl,
  screenshotUrls,
  thumbnailUrl,
} from './media'
import { makeProject } from './testing/makeProject'

describe('resolveMediaUrl', () => {
  it('builds a served path from a slug and filename', () => {
    expect(resolveMediaUrl('morphwave', 'poster.webp')).toBe('/projects/morphwave/poster.webp')
  })

  it('preserves nested paths while encoding each segment', () => {
    expect(resolveMediaUrl('morphwave', 'screenshots/01.webp')).toBe(
      '/projects/morphwave/screenshots/01.webp',
    )
  })

  it('encodes characters that would break a URL', () => {
    expect(resolveMediaUrl('morphwave', 'wide shot.webp')).toBe(
      '/projects/morphwave/wide%20shot.webp',
    )
  })
})

describe('thumbnailUrl', () => {
  it('uses the thumbnail when declared', () => {
    const project = makeProject({
      slug: 'x',
      media: { poster: 'poster.webp', thumbnail: 'thumb.webp' },
    })

    expect(thumbnailUrl(project)).toBe('/projects/x/thumb.webp')
  })

  it('falls back to the poster so callers need no branch', () => {
    const project = makeProject({ slug: 'x', media: { poster: 'poster.webp' } })

    expect(thumbnailUrl(project)).toBe('/projects/x/poster.webp')
  })
})

describe('previewPosterUrl', () => {
  it('prefers a static preview override', () => {
    const project = makeProject({
      slug: 'x',
      media: { poster: 'poster.webp' },
      preview: { kind: 'static', src: 'alt.webp' },
    })

    expect(previewPosterUrl(project)).toBe('/projects/x/alt.webp')
  })

  it('prefers a video preview still', () => {
    const project = makeProject({
      slug: 'x',
      media: { poster: 'poster.webp' },
      preview: { kind: 'video', src: 'preview.mp4', poster: 'still.webp' },
    })

    expect(previewPosterUrl(project)).toBe('/projects/x/still.webp')
  })

  it('falls back to the project poster for every other kind', () => {
    // The invariant behind CONCEPT §19: there is always something to show.
    const iframe = makeProject({
      slug: 'x',
      media: { poster: 'poster.webp' },
      preview: { kind: 'iframe', src: 'https://example.com' },
    })
    const component = makeProject({
      slug: 'y',
      media: { poster: 'poster.webp' },
      preview: { kind: 'component', componentId: 'demo' },
    })

    expect(previewPosterUrl(iframe)).toBe('/projects/x/poster.webp')
    expect(previewPosterUrl(component)).toBe('/projects/y/poster.webp')
  })
})

describe('posterUrl and screenshotUrls', () => {
  it('resolves the poster', () => {
    expect(posterUrl(makeProject({ slug: 'x' }))).toBe('/projects/x/poster.webp')
  })

  it('resolves every screenshot in order', () => {
    const project = makeProject({
      slug: 'x',
      media: { poster: 'poster.webp', screenshots: ['screenshots/01.webp', 'screenshots/02.webp'] },
    })

    expect(screenshotUrls(project)).toEqual([
      '/projects/x/screenshots/01.webp',
      '/projects/x/screenshots/02.webp',
    ])
  })
})
