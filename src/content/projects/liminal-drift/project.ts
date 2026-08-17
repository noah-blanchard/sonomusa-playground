import { defineProject } from '@/domain/project/defineProject'

export const project = defineProject({
  schemaVersion: 1,

  slug: 'liminal-drift',
  title: 'Liminal Drift',
  year: 2025,

  shortDescription: 'Generative visual system',
  description:
    'A slow generative field that never quite settles. Colour and density drift on independent clocks, so the composition is always recognisable and never twice the same.',

  status: 'wip',
  tags: ['generative', 'visual'],
  categories: ['visual-system'],

  order: 2,

  media: {
    poster: 'poster.webp',
    thumbnail: 'thumbnail.webp',
  },

  // A moving still communicates this one better than a frozen frame. The video
  // is muted, looping, and only loaded once the frame becomes active.
  preview: { kind: 'video', src: 'preview.mp4' },

  technologies: ['Canvas', 'TypeScript'],
})
