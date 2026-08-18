import { defineProject } from '@/domain/project/defineProject'

export const project = defineProject({
  schemaVersion: 1,

  slug: 'interference',
  title: 'Interference',

  shortDescription: 'Visual system',

  // Deliberately sparse: no year, no description, no credits, no technologies.
  // A project at this stage must still look intentional in the frame — that is
  // what CONCEPT §28 means by tolerating sparse data, and it is the reason
  // every section of the project route is conditional.
  status: 'wip',
  tags: ['visual', 'generative'],

  order: 4,

  media: { poster: 'poster.webp' },

  preview: { kind: 'static' },

  presentation: { accent: '#D2569B' },
})
