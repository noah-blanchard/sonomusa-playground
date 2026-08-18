import { defineProject } from '@/domain/project/defineProject'

export const project = defineProject({
  schemaVersion: 1,

  slug: 'musai',
  title: 'Musai',
  year: 2026,

  shortDescription: 'Experimental AI',
  description:
    'A listening system that responds to the shape of a phrase rather than its content. The preview here runs live in the frame — a lattice that reorganises around whatever it is given.',

  status: 'wip',
  tags: ['ai', 'experimental', 'generative'],
  categories: ['research'],

  featured: true,
  order: 5,

  media: {
    poster: 'poster.webp',
    thumbnail: 'thumbnail.webp',
  },

  /*
   * An interactive preview implemented in this repository. The component is
   * resolved by id through the registry — never carried in the manifest — which
   * is what keeps this file serializable and a CMS possible later.
   */
  preview: { kind: 'component', componentId: 'musai-preview' },

  technologies: ['Canvas', 'TypeScript'],
  presentation: { accent: '#5FA8E8' },
})
