import { defineProject } from '@/domain/project/defineProject'

export const project = defineProject({
  schemaVersion: 1,

  slug: 'orbital-data',
  title: 'Orbital Data',
  year: 2023,

  shortDescription: 'Data visualization',
  description:
    'Two years of orbital telemetry drawn as a single continuous line. Archived, and kept here because the drawing outlived the dataset it came from.',

  // Projects leave the collection without leaving the site. CONCEPT §2.3 lists
  // "projects that are no longer online" as a case the system must tolerate.
  status: 'archive',
  tags: ['data', 'visual'],
  categories: ['visualization'],

  order: 6,

  media: {
    poster: 'poster.webp',
    thumbnail: 'thumbnail.webp',
    screenshots: ['screenshots/01.webp'],
  },

  preview: { kind: 'static' },

  technologies: ['D3', 'SVG'],

  credits: [
    { label: 'Data', value: 'Public telemetry archive' },
    { label: 'Design', value: 'SonoMusa' },
  ],

  presentation: { accent: '#E2683C' },
})
