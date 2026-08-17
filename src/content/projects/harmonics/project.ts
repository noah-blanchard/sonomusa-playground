import { defineProject } from '@/domain/project/defineProject'

export const project = defineProject({
  schemaVersion: 1,

  slug: 'harmonics',
  title: 'Harmonics',
  year: 2024,

  shortDescription: 'Sound experiment',
  description:
    'A study in additive synthesis, built to be played rather than configured. Every partial is a physical control, and the interface disappears once you stop thinking about it.',

  status: 'prototype',
  tags: ['audio', 'sound'],
  categories: ['sound'],

  order: 3,

  media: {
    poster: 'poster.webp',
    thumbnail: 'thumbnail.webp',
  },

  preview: { kind: 'static' },

  technologies: ['Web Audio API', 'TypeScript'],

  credits: [{ label: 'Sound design', value: 'SonoMusa' }],
})
