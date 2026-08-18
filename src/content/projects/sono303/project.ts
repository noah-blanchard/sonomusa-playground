import { defineProject } from '@/domain/project/defineProject'

export const project = defineProject({
  schemaVersion: 1,

  slug: 'sono303',
  title: 'SONO 303',
  year: 2026,

  shortDescription: 'A TB-303 emulator with a built-in sequencer, playable in the browser',
  description:
        'A TB-303 emulator with a built-in sequencer, playable in the browser. The 303 is a classic bass synthesizer that defined the sound of acid house music in the late 1980s. This project recreates the iconic sound and functionality of the original hardware, allowing users to create and manipulate acid basslines directly in their web browser.',

  status: 'live',
  tags: ['music', 'synthesizer', 'emulator', 'browser'],
  categories: ['audiovisual'],

  featured: true,
  order: 2,

  media: {
    poster: 'poster.webp',
    thumbnail: 'thumbnail.webp',
  },

  /*
   * The frame shows the game's lobby at rest — the live piece is one click
   * away on the stage, and the gallery carries six frames, not six apps.
   */
  preview: { kind: 'iframe', src: 'https://sono303.sonomusa.tech/' },

  /* `Try it out` opens the game full screen on the stage this repo serves. */
  experience: { componentId: 'sono303-experience' },

  links: { live: 'https://sono303.sonomusa.tech/' },

  technologies: ['React', 'Tone.js', 'Vite', 'Bun'],
  presentation: { accent: '#89ff00' },
})
