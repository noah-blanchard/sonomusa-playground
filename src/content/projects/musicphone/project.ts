import { defineProject } from '@/domain/project/defineProject'

export const project = defineProject({
  schemaVersion: 1,

  slug: 'musicphone',
  title: 'MusicPhone',
  year: 2026,

  shortDescription: 'Real-time multiplayer music game — Gartic Phone with looped songs',
  description:
    'A real-time multiplayer music game: Gartic Phone, but with looped songs. Each player starts a song with an assigned kit, then rotates through every other player\'s song adding one layer at a time — drums, bass, lead, keys, pad — without necessarily hearing the full arrangement. When the rotations complete, the room reveals each finished song layer by layer. Musical choices are deliberately constrained so a group of 2–8 players lands somewhere coherent, whatever their production experience. The network carries note data, never audio: every browser renders the layers locally through Tone.js.',

  status: 'live',
  tags: ['music', 'multiplayer', 'game', 'realtime'],
  categories: ['audiovisual'],

  featured: true,
  order: 1,

  media: {
    poster: 'poster.webp',
  },

  /*
   * The live game is embeddable, so the frame shows the work itself rather
   * than a still — the same URL the stage opens full screen.
   */
  preview: { kind: 'iframe', src: 'https://musicphone.sonomusa.tech/' },

  /* `Try it out` opens the game full screen on the stage this repo serves. */
  experience: { componentId: 'musicphone-experience' },

  links: { live: 'https://musicphone.sonomusa.tech/' },

  technologies: ['Next.js', 'Tone.js', 'Elysia', 'WebSocket', 'Bun'],
  presentation: { accent: '#E8B84B' },
})
