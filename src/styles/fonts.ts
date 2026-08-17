import { Geist_Mono, Inter_Tight, Jost } from 'next/font/google'

/**
 * Three families, three jobs, no overlap (docs/rules/03-design-system.md).
 *
 * next/font downloads and self-hosts these at build time, so the running site
 * makes no external font requests and the fallback metrics are matched — no
 * layout shift, and identical rendering offline.
 *
 * Each is exposed as a CSS variable consumed by tokens.css, so replacing a
 * family is a change in two files rather than everywhere.
 */

/** Editorial voice — the large display line and all body copy. */
export const interTight = Inter_Tight({
  subsets: ['latin'],
  variable: '--font-inter-tight',
  display: 'swap',
})

/**
 * Project titles only.
 *
 * Geometric, with a circular O and an unbarred A — it rhymes with the logo,
 * which was itself drawn from Montserrat before the stencil cuts were added.
 * Using it anywhere else would put the shell in competition with the mark.
 */
export const jost = Jost({
  subsets: ['latin'],
  variable: '--font-jost',
  display: 'swap',
})

/** Numbering and metadata labels. Tabular figures keep `001` columns aligned. */
export const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
})

export const fontVariables = [interTight.variable, jost.variable, geistMono.variable].join(' ')
