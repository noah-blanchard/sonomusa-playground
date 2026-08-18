import { defineProject } from '@/domain/project/defineProject'

export const project = defineProject({
  schemaVersion: 1,

  slug: 'zoomquilt',
  title: 'Zoomquilt',
  year: 2026,

  shortDescription: 'Endlessly zooming collaborative painting',
  description:
    'A canvas that never ends: a collaborative painting you fall through forever, each artwork dissolving into the next. The frame embeds the live piece directly, and the stage opens it full screen.',

  status: 'live',
  tags: ['illustration', 'collaborative', 'infinite'],
  categories: ['audiovisual'],

  featured: true,
  order: 3,

  media: {
    poster: 'poster.webp',
    thumbnail: 'thumbnail.webp',
  },

  /*
   * The piece itself is embeddable — zoomquilt.org sets no framing
   * restrictions — so the frame can show the work rather than a still.
   */
  preview: { kind: 'iframe', src: 'https://www.zoomquilt.org' },

  /*
   * And the same URL, full screen, on the stage this repository serves.
   * `Try it out` opens it here.
   */
  experience: { componentId: 'zoomquilt-experience' },

  technologies: ['Canvas', 'Collaborative painting'],
  presentation: { accent: '#8A6FC9' },
})
