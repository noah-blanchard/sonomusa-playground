import { describe, expect, it } from 'vitest'
import { FRAME_INSET } from './depth'
import { accentToRgb, frameBox, perimeterPoint, spawnParticles } from './ambience'

/** Deterministic, so a failure is reproducible rather than a coin flip. */
function seeded(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

describe('frameBox', () => {
  it('matches the inset CSS positions the frame with', () => {
    const box = frameBox(0.1)

    // If this drifts from gallery.css the field will hug the wrong rectangle.
    expect(box.left).toBe(FRAME_INSET)
    expect(box.right).toBe(1 - FRAME_INSET)
    expect(box.top).toBe(0.1)
    expect(box.bottom).toBe(0.9)
  })
})

describe('perimeterPoint', () => {
  const box = frameBox(0.1)

  it('always lands on the boundary, never inside it', () => {
    for (let step = 0; step < 200; step += 1) {
      const { x, y } = perimeterPoint(box, step / 200)

      const onVerticalEdge = x === box.left || x === box.right
      const onHorizontalEdge = y === box.top || y === box.bottom

      expect(onVerticalEdge || onHorizontalEdge).toBe(true)
      expect(x).toBeGreaterThanOrEqual(box.left - 1e-9)
      expect(x).toBeLessThanOrEqual(box.right + 1e-9)
      expect(y).toBeGreaterThanOrEqual(box.top - 1e-9)
      expect(y).toBeLessThanOrEqual(box.bottom + 1e-9)
    }
  })

  it('points its normal away from the box', () => {
    const centreX = (box.left + box.right) / 2
    const centreY = (box.top + box.bottom) / 2

    for (let step = 0; step < 200; step += 1) {
      const { x, y, nx, ny } = perimeterPoint(box, step / 200)

      // Stepping along the normal must increase distance from the centre —
      // otherwise the outward half of the field spawns inside the card.
      const before = Math.hypot(x - centreX, y - centreY)
      const after = Math.hypot(x + nx * 0.01 - centreX, y + ny * 0.01 - centreY)

      expect(after).toBeGreaterThan(before)
    }
  })

  it('wraps, so a caller may pass an accumulating value', () => {
    expect(perimeterPoint(box, 1.25)).toEqual(perimeterPoint(box, 0.25))
    expect(perimeterPoint(box, -0.75)).toEqual(perimeterPoint(box, 0.25))
  })

  it('survives a degenerate box rather than dividing by zero', () => {
    const collapsed = { left: 0.5, right: 0.5, top: 0.5, bottom: 0.5 }
    const point = perimeterPoint(collapsed, 0.4)

    expect(Number.isFinite(point.x)).toBe(true)
    expect(Number.isFinite(point.y)).toBe(true)
  })
})

describe('spawnParticles', () => {
  const box = frameBox(0.1)

  it('produces the requested count with usable values throughout', () => {
    const particles = spawnParticles(300, box, seeded(7))

    expect(particles).toHaveLength(300)

    for (const particle of particles) {
      expect(Number.isFinite(particle.x)).toBe(true)
      expect(Number.isFinite(particle.y)).toBe(true)
      expect(particle.alpha).toBeGreaterThan(0)
      expect(particle.alpha).toBeLessThanOrEqual(1)
      expect(particle.speed).toBeGreaterThan(0)
      expect(particle.amplitude).toBeGreaterThan(0)
      expect(particle.size).toBeGreaterThanOrEqual(1)
    }
  })

  it('crowds against the frame rather than spreading evenly', () => {
    const particles = spawnParticles(2000, box, seeded(11))

    const distanceToBox = (x: number, y: number) => {
      const dx = Math.max(box.left - x, 0, x - box.right)
      const dy = Math.max(box.top - y, 0, y - box.bottom)
      return Math.hypot(dx, dy)
    }

    const outside = particles.filter((p) => distanceToBox(p.x, p.y) > 0)
    const near = outside.filter((p) => distanceToBox(p.x, p.y) < 0.05).length

    // The falloff is the whole reason the field reads as belonging to the card.
    // A uniform band would put far fewer than three quarters in the inner sliver.
    expect(near / outside.length).toBeGreaterThan(0.75)
  })

  it('puts a minority behind the card, so some appear to pass under it', () => {
    const particles = spawnParticles(2000, box, seeded(13))

    const inside = particles.filter(
      (p) => p.x > box.left && p.x < box.right && p.y > box.top && p.y < box.bottom,
    ).length

    expect(inside).toBeGreaterThan(0)
    expect(inside / particles.length).toBeLessThan(0.35)
  })

  it('is stable for a given seed, so the field does not reshuffle on resize', () => {
    expect(spawnParticles(50, box, seeded(3))).toEqual(spawnParticles(50, box, seeded(3)))
  })
})

describe('accentToRgb', () => {
  it('converts a declared accent to 0–1 channels', () => {
    expect(accentToRgb('#2FD3C0')).toEqual([47 / 255, 211 / 255, 192 / 255])
  })

  it('is case insensitive, because a manifest is hand-written', () => {
    expect(accentToRgb('#2fd3c0')).toEqual(accentToRgb('#2FD3C0'))
  })

  it('falls back to bone when a project declares no colour', () => {
    // The field must still draw for a project that never opted in — the accent
    // is optional in the schema and absence has to be a valid state.
    const [r, g, b] = accentToRgb(undefined)

    expect(r).toBeCloseTo(0.941, 3)
    expect(g).toBeCloseTo(0.937, 3)
    expect(b).toBeCloseTo(0.918, 3)
  })

  it('falls back rather than emitting NaN for a malformed value', () => {
    expect(accentToRgb('not-a-colour')).toEqual(accentToRgb(undefined))
    expect(accentToRgb('#abc')).toEqual(accentToRgb(undefined))
  })
})
