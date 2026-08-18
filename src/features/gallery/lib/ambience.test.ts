import { describe, expect, it } from 'vitest'
import { FRAME_INSET } from './depth'
import {
  accentToRgb,
  fieldEllipse,
  reachFromCard,
  seededRandom,
  spawnParticles,
} from './ambience'

/** Deterministic, so a failure is reproducible rather than a coin flip. */
const seeded = seededRandom

/** The stage as it actually renders at 1440 wide, where the field is judged. */
const STAGE = { width: 888, height: 626 }

describe('fieldEllipse', () => {
  it('centres on the frame and takes its core from the inset CSS positions it with', () => {
    const ellipse = fieldEllipse(0.1)

    expect(ellipse.cx).toBe(0.5)
    expect(ellipse.cy).toBe(0.5)
    // If this drifts from gallery.css the field will hug the wrong rectangle.
    expect(ellipse.coreX).toBeCloseTo(0.5 - FRAME_INSET, 10)
    expect(ellipse.coreY).toBeCloseTo(0.4, 10)
  })

  it('tracks the bleed vertically, so the core stays against the card', () => {
    expect(fieldEllipse(0.05).coreY).toBeCloseTo(0.45, 10)
    expect(fieldEllipse(0.2).coreY).toBeCloseTo(0.3, 10)
  })

  it('reaches much further horizontally than vertically', () => {
    const ellipse = fieldEllipse(0.083)

    // Before the aspect stretches it further. A field that reached equally on
    // both axes would be the halo this replaced.
    expect(ellipse.reachX).toBeGreaterThan(ellipse.reachY * 2)
  })
})

describe('reachFromCard', () => {
  const ellipse = fieldEllipse(0.083)

  it('is zero anywhere on the card, which is what the card occludes', () => {
    // Exactly zero in the interior — both gaps clamp — which is what lets the
    // spawn tell a hidden mote from a visible one without an epsilon.
    expect(reachFromCard(ellipse, 0.5, 0.5)).toBe(0)
    expect(reachFromCard(ellipse, 0.5 + ellipse.coreX * 0.9, 0.5)).toBe(0)
    // On the edge itself, only to within rounding.
    expect(reachFromCard(ellipse, 0.5 + ellipse.coreX, 0.5)).toBeCloseTo(0, 10)
    expect(reachFromCard(ellipse, 0.5, 0.5 - ellipse.coreY)).toBeCloseTo(0, 10)
  })

  it('reaches 1 at the field edge on both axes, though they are far apart', () => {
    const side = reachFromCard(ellipse, 0.5 + ellipse.coreX + ellipse.reachX, 0.5)
    const above = reachFromCard(ellipse, 0.5, 0.5 - ellipse.coreY - ellipse.reachY)

    expect(side).toBeCloseTo(1, 10)
    expect(above).toBeCloseTo(1, 10)
    // Same reach, very different distances — the anisotropy that makes the
    // field stretch sideways lives entirely in this normalization.
    expect(ellipse.reachX).toBeGreaterThan(ellipse.reachY * 3)
  })

  it('never exceeds 1, so a mote past the envelope still shades correctly', () => {
    expect(reachFromCard(ellipse, 2, 2)).toBe(1)
    expect(reachFromCard(ellipse, -1, 0.5)).toBe(1)
  })

  it('is symmetric about the card', () => {
    expect(reachFromCard(ellipse, 0.5 + 0.4, 0.5)).toBeCloseTo(
      reachFromCard(ellipse, 0.5 - 0.4, 0.5),
      10,
    )
  })
})

describe('spawnParticles', () => {
  const ellipse = fieldEllipse(0.083)

  it('produces the requested count with usable values throughout', () => {
    const particles = spawnParticles(300, ellipse, seeded(7))

    expect(particles).toHaveLength(300)

    for (const particle of particles) {
      expect(Number.isFinite(particle.x)).toBe(true)
      expect(Number.isFinite(particle.y)).toBe(true)
      expect(particle.alpha).toBeGreaterThan(0)
      expect(particle.alpha).toBeLessThanOrEqual(1)
      expect(particle.speed).toBeGreaterThan(0)
      expect(particle.amplitude).toBeGreaterThan(0)
      expect(particle.size).toBeGreaterThanOrEqual(1)
      expect(particle.reach).toBeGreaterThanOrEqual(0)
      expect(particle.reach).toBeLessThanOrEqual(1)
    }
  })

  it('stays inside the ellipse, which is the silhouette that tapers the ends', () => {
    const particles = spawnParticles(2000, ellipse, seeded(19))
    const envelopeX = ellipse.coreX + ellipse.reachX
    const envelopeY = ellipse.coreY + ellipse.reachY

    for (const particle of particles) {
      const ex = (particle.x - ellipse.cx) / envelopeX
      const ey = (particle.y - ellipse.cy) / envelopeY

      expect(ex * ex + ey * ey).toBeLessThanOrEqual(1 + 1e-9)
    }
  })

  it('is far wider than it is tall, measured on screen', () => {
    // The property the whole shape exists for — and the one a ring could not
    // deliver, because a curve through the card's top edge dips behind the card
    // as soon as it moves sideways.
    const particles = spawnParticles(4000, ellipse, seeded(23))

    const wide = Math.max(...particles.map((p) => Math.abs(p.x - ellipse.cx))) * STAGE.width
    const tall = Math.max(...particles.map((p) => Math.abs(p.y - ellipse.cy))) * STAGE.height

    expect(wide).toBeGreaterThan(tall * 1.5)
  })

  it('ends its vertical tail inside the stage rather than on a clip', () => {
    // There is no vertical mask, so a mote past the stage edge is cut on a hard
    // line. Horizontally the opposite is true and intended: the field runs past
    // the edge and the stage's gradient dissolves it.
    const particles = spawnParticles(4000, ellipse, seeded(29))

    expect(particles.some((p) => p.y < 0 || p.y > 1)).toBe(false)
    expect(particles.some((p) => p.x < 0 || p.x > 1)).toBe(true)
  })

  it('puts most of its motes clear of the card, where they can be seen', () => {
    // The card is opaque and above this layer, so motes within its span are
    // hidden. A field whose motes mostly land behind the card is a field nobody
    // sees — this is what makes it reach left and right.
    const particles = spawnParticles(4000, ellipse, seeded(31))
    const clear = particles.filter((p) => Math.abs(p.x - ellipse.cx) > ellipse.coreX)

    expect(clear.length / particles.length).toBeGreaterThan(0.5)
  })

  it('spreads across the stage in the band above the card, not just its middle', () => {
    // The band between the card's top edge and the stage's is the field's most
    // visible region. A ring lit only the middle of it; this must light the
    // width.
    const particles = spawnParticles(6000, ellipse, seeded(37))
    const band = particles.filter((p) => p.y < ellipse.cy - ellipse.coreY)

    const lit = new Set(band.map((p) => Math.floor(Math.min(0.999, Math.max(0, p.x)) * 10)))
    // Every tenth of the stage that is not off-canvas carries some of it.
    expect(lit.size).toBeGreaterThanOrEqual(6)
  })

  it('crowds against the card rather than spreading evenly through the field', () => {
    const particles = spawnParticles(2000, ellipse, seeded(11))

    const reaches = particles.map((p) => p.reach).sort((a, b) => a - b)
    const median = reaches[Math.floor(reaches.length / 2)]!

    // The falloff is the whole reason the field reads as belonging to the card.
    // An even spread would sit at 0.5; this must stay well under it, so the
    // bright core survives any later retune of the exponent.
    expect(median).toBeLessThan(0.3)
  })

  it('puts a minority behind the card, so some appear to pass under it', () => {
    const particles = spawnParticles(2000, ellipse, seeded(13))
    const behind = particles.filter((p) => p.reach === 0).length

    expect(behind).toBeGreaterThan(0)
    expect(behind / particles.length).toBeLessThan(0.35)
  })

  it('is stable for a given seed, so the field does not reshuffle on resize', () => {
    expect(spawnParticles(50, ellipse, seeded(3))).toEqual(
      spawnParticles(50, ellipse, seeded(3)),
    )
  })

  it('terminates on a degenerate ellipse rather than sampling forever', () => {
    const collapsed = { cx: 0.5, cy: 0.5, coreX: 0, coreY: 0, reachX: 0, reachY: 0 }

    expect(() => spawnParticles(10, collapsed, seeded(3))).not.toThrow()
  })
})

describe('seededRandom', () => {
  it('replays the same sequence, which is what keeps a rebuild from redealing', () => {
    const first = seededRandom(42)
    const second = seededRandom(42)

    for (let step = 0; step < 50; step += 1) {
      const value = first()

      expect(value).toBe(second())
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })

  it('differs between seeds, so it is a generator and not a constant', () => {
    expect(seededRandom(1)()).not.toBe(seededRandom(2)())
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
