import { describe, expect, it } from 'vitest'
import { makeProject, makeProjects } from '../testing/makeProject'
import {
  collectTags,
  compareProjects,
  findBySlug,
  formatProjectNumber,
  selectByCategory,
  selectByStatus,
  selectByTag,
  selectFeatured,
  selectLinkable,
  selectNeighbours,
  selectRelated,
  sortProjects,
} from './index'

describe('sortProjects', () => {
  it('honours explicit order ascending', () => {
    const projects = makeProjects([{ order: 3 }, { order: 1 }, { order: 2 }])

    expect(sortProjects(projects).map((p) => p.order)).toEqual([1, 2, 3])
  })

  it('places projects without an order after those with one', () => {
    // So adding a project without thinking about sequence appends it rather
    // than silently displacing something already placed.
    const projects = makeProjects([{}, { order: 2 }, {}, { order: 1 }])
    const sorted = sortProjects(projects)

    expect(sorted.slice(0, 2).map((p) => p.order)).toEqual([1, 2])
    expect(sorted.slice(2).every((p) => p.order === undefined)).toBe(true)
  })

  it('breaks ties by year, newest first', () => {
    const projects = makeProjects([{ year: 2023 }, { year: 2025 }, { year: 2024 }])

    expect(sortProjects(projects).map((p) => p.year)).toEqual([2025, 2024, 2023])
  })

  it('breaks remaining ties by title so the order is fully deterministic', () => {
    // An unstable order would make the 001/002 numbering meaningless.
    const projects = [
      makeProject({ slug: 'c', title: 'Carbon' }),
      makeProject({ slug: 'a', title: 'Amber' }),
      makeProject({ slug: 'b', title: 'Basalt' }),
    ]

    expect(sortProjects(projects).map((p) => p.title)).toEqual(['Amber', 'Basalt', 'Carbon'])
  })

  it('does not mutate its input', () => {
    const projects = makeProjects([{ order: 2 }, { order: 1 }])
    const before = projects.map((p) => p.slug)

    sortProjects(projects)

    expect(projects.map((p) => p.slug)).toEqual(before)
  })

  it('is a total order — sorting twice changes nothing', () => {
    const projects = makeProjects([{ order: 2 }, {}, { year: 2024 }, { order: 1 }, {}])
    const once = sortProjects(projects)

    expect(sortProjects(once).map((p) => p.slug)).toEqual(once.map((p) => p.slug))
  })
})

describe('compareProjects', () => {
  it('treats equal projects as equal', () => {
    expect(compareProjects(makeProject({ order: 1 }), makeProject({ order: 1 }))).toBe(0)
  })
})

describe('filters', () => {
  const projects = [
    makeProject({ slug: 'a', title: 'A', tags: ['audio'], status: 'live', featured: true }),
    makeProject({ slug: 'b', title: 'B', tags: ['Audio', 'visual'], status: 'wip' }),
    makeProject({ slug: 'c', title: 'C', tags: ['visual'], status: 'archive', categories: ['games'] }),
  ]

  it('finds by slug', () => {
    expect(findBySlug(projects, 'b')?.title).toBe('B')
  })

  it('returns null for an unknown slug rather than undefined', () => {
    expect(findBySlug(projects, 'nope')).toBeNull()
  })

  it('selects featured', () => {
    expect(selectFeatured(projects).map((p) => p.slug)).toEqual(['a'])
  })

  it('selects by status', () => {
    expect(selectByStatus(projects, 'wip').map((p) => p.slug)).toEqual(['b'])
  })

  it('matches tags case-insensitively', () => {
    // Authors will write 'Audio' and 'audio'; a filter that cares is a bug.
    expect(selectByTag(projects, 'audio').map((p) => p.slug)).toEqual(['a', 'b'])
  })

  it('selects by category', () => {
    expect(selectByCategory(projects, 'games').map((p) => p.slug)).toEqual(['c'])
  })

  it('selects only projects with a live destination', () => {
    const withLinks = [
      makeProject({ slug: 'x', links: { live: 'https://x.sonomusa.com' } }),
      makeProject({ slug: 'y' }),
    ]

    expect(selectLinkable(withLinks).map((p) => p.slug)).toEqual(['x'])
  })
})

describe('collectTags', () => {
  it('counts usage and sorts by frequency', () => {
    const projects = [
      makeProject({ slug: 'a', tags: ['audio', 'generative'] }),
      makeProject({ slug: 'b', tags: ['audio'] }),
      makeProject({ slug: 'c', tags: ['audio', 'generative'] }),
    ]

    expect(collectTags(projects)).toEqual([
      { tag: 'audio', count: 3 },
      { tag: 'generative', count: 2 },
    ])
  })

  it('returns nothing when no project is tagged', () => {
    expect(collectTags(makeProjects([{}, {}]))).toEqual([])
  })
})

describe('selectNeighbours', () => {
  const projects = makeProjects([{ order: 1 }, { order: 2 }, { order: 3 }])

  it('finds the projects either side', () => {
    const { previous, next, index } = selectNeighbours(projects, 'fixture-2')

    expect(previous?.slug).toBe('fixture-1')
    expect(next?.slug).toBe('fixture-3')
    expect(index).toBe(1)
  })

  it('wraps at the ends — the gallery is a loop', () => {
    expect(selectNeighbours(projects, 'fixture-1').previous?.slug).toBe('fixture-3')
    expect(selectNeighbours(projects, 'fixture-3').next?.slug).toBe('fixture-1')
  })

  it('can be told not to wrap', () => {
    expect(selectNeighbours(projects, 'fixture-1', { wrap: false }).previous).toBeNull()
    expect(selectNeighbours(projects, 'fixture-3', { wrap: false }).next).toBeNull()
  })

  it('reports no neighbours for a lone project', () => {
    // Wrapping would otherwise make it its own previous AND next, which reads
    // as "there is somewhere to go" when there is not.
    const one = makeProjects([{}])

    expect(selectNeighbours(one, 'fixture-1')).toMatchObject({ previous: null, next: null, index: 0 })
  })

  it('reports index -1 for an unknown slug', () => {
    expect(selectNeighbours(projects, 'nope').index).toBe(-1)
  })

  it('handles an empty collection', () => {
    expect(selectNeighbours([], 'anything')).toMatchObject({ previous: null, next: null, index: -1 })
  })
})

describe('selectRelated', () => {
  const projects = [
    makeProject({ slug: 'a', tags: ['audio', 'generative', 'webgl'] }),
    makeProject({ slug: 'b', tags: ['audio', 'generative'] }),
    makeProject({ slug: 'c', tags: ['audio'] }),
    makeProject({ slug: 'd', tags: ['sculpture'] }),
  ]

  it('ranks by shared tags, most overlap first', () => {
    const related = selectRelated(projects, projects[0]!)

    expect(related.map((p) => p.slug)).toEqual(['b', 'c'])
  })

  it('never includes the project itself', () => {
    expect(selectRelated(projects, projects[0]!).map((p) => p.slug)).not.toContain('a')
  })

  it('respects the limit', () => {
    expect(selectRelated(projects, projects[0]!, 1)).toHaveLength(1)
  })

  it('returns nothing for an untagged project', () => {
    expect(selectRelated(projects, makeProject({ slug: 'z', tags: [] }))).toEqual([])
  })

  it('returns nothing when no tags overlap', () => {
    expect(selectRelated(projects, projects[3]!)).toEqual([])
  })
})

describe('formatProjectNumber', () => {
  it('zero-pads to three digits', () => {
    expect(formatProjectNumber(0)).toBe('001')
    expect(formatProjectNumber(8)).toBe('009')
    expect(formatProjectNumber(41)).toBe('042')
  })

  it('does not truncate beyond three digits', () => {
    expect(formatProjectNumber(999)).toBe('1000')
  })
})
