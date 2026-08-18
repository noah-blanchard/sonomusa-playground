import { describe, expect, it } from 'vitest'
import {
  projectExperienceRegistry,
  registeredExperienceIds,
  resolveProjectExperience,
} from './experiences'

/**
 * The registry is the seam between a manifest's `componentId` and real code.
 * `bun run validate:content` checks the other direction — that every id a
 * manifest names is registered here. These check that the map itself behaves.
 */
describe('project experience registry', () => {
  it('resolves every registered id to a component', () => {
    for (const id of registeredExperienceIds()) {
      expect(resolveProjectExperience(id)).toBeTruthy()
    }
  })

  it('returns null for an id nobody registered', () => {
    // Null rather than throwing: the stage degrades to the poster and says so.
    // A throw here would take out a route the visitor deliberately opened.
    expect(resolveProjectExperience('nothing-registered-under-this')).toBeNull()
  })

  it('cannot be tricked by an inherited property', () => {
    // `registry[id]` on a plain object would happily return Object.prototype's
    // `toString` for the id "toString", handing the stage a function to render.
    expect(resolveProjectExperience('toString')).toBeNull()
    expect(resolveProjectExperience('constructor')).toBeNull()
  })

  it('maps every id to a distinct component', () => {
    const modules = Object.values(projectExperienceRegistry)

    expect(new Set(modules).size).toBe(modules.length)
  })

  it('reports its ids sorted, so error messages are stable', () => {
    expect(registeredExperienceIds()).toEqual([...registeredExperienceIds()].sort())
  })
})
