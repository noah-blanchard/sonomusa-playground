import { describe, expect, it } from 'vitest'
import { PREVIEW_KINDS } from '@/domain/project'
import { previewRenderers, resolvePreviewRenderer } from './index'
import { ComponentPreview } from './ComponentPreview'
import { IframePreview } from './IframePreview'
import { StaticPreview } from './StaticPreview'
import { VideoPreview } from './VideoPreview'

describe('preview renderer map', () => {
  it('covers every preview kind', () => {
    // The guard that matters: adding a variant to the schema without a
    // renderer fails here rather than blanking a frame in production.
    expect(Object.keys(previewRenderers).sort()).toEqual([...PREVIEW_KINDS].sort())
  })

  it('resolves each kind to its own renderer', () => {
    expect(resolvePreviewRenderer('static')).toBe(StaticPreview)
    expect(resolvePreviewRenderer('video')).toBe(VideoPreview)
    expect(resolvePreviewRenderer('iframe')).toBe(IframePreview)
    expect(resolvePreviewRenderer('component')).toBe(ComponentPreview)
  })

  it('maps every kind to a distinct renderer', () => {
    // A copy-paste in the map would otherwise silently render the wrong thing.
    const renderers = Object.values(previewRenderers)

    expect(new Set(renderers).size).toBe(renderers.length)
  })

  it('never returns undefined for a valid kind', () => {
    for (const kind of PREVIEW_KINDS) {
      expect(resolvePreviewRenderer(kind)).toBeTypeOf('function')
    }
  })
})
