import { defineProject } from '@/domain/project/defineProject'

export const project = defineProject({
  schemaVersion: 1,

  slug: 'morphwave',
  title: 'Morphwave',
  year: 2025,

  shortDescription: 'Audio reactive visual experiment',
  description:
    'An exploration of wave interference and organic transformation. Incoming audio drives a field of overlapping wavefronts, so the geometry is never authored directly — only the rules that let it emerge are.',

  status: 'prototype',
  tags: ['audio', 'generative'],
  categories: ['audiovisual'],

  featured: true,
  order: 1,

  media: {
    poster: 'poster.webp',
    thumbnail: 'thumbnail.webp',
    screenshots: ['screenshots/01.webp', 'screenshots/02.webp'],
  },

  preview: { kind: 'static' },

  // No `links.live` yet — the subdomain has not shipped. The frame simply
  // offers no destination and `status` carries the meaning.

  technologies: ['WebGL', 'Web Audio API', 'TypeScript'],
  presentation: { preferredAspectRatio: '4 / 3', accent: '#2FD3C0' },
})
