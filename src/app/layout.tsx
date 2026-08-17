import type { Metadata, Viewport } from 'next'
import { SiteFooter } from '@/components/shell/SiteFooter'
import { SiteHeader } from '@/components/shell/SiteHeader'
import { siteOrigin } from '@/env'
import { fontVariables } from '@/styles/fonts'
import '@/styles/globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin),
  title: {
    default: 'SonoMusa Playground',
    template: '%s — SonoMusa Playground',
  },
  description: 'A gallery of coded experiences. Interactive works exploring sound, form and digital perception.',
  openGraph: {
    siteName: 'SonoMusa Playground',
    type: 'website',
    /*
     * The site-level default only. Project pages override `openGraph` wholesale
     * in their own `generateMetadata` and supply their poster instead, so a
     * shared project link shows the work rather than the gallery's front door.
     */
    images: [
      {
        url: '/og-default.png',
        width: 1200,
        height: 630,
        alt: 'SonoMusa Playground — a gallery of coded experiences.',
      },
    ],
  },
  twitter: {
    // Without this the card degrades to a thumbnail beside text, which for a
    // gallery is the wrong way round.
    card: 'summary_large_image',
  },
}

export const viewport: Viewport = {
  themeColor: '#0A0A0A',
  // The shell is a dark room by design — the work provides the colour.
  colorScheme: 'dark',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontVariables}>
      <body className="min-h-dvh">
        {/* First stop for keyboard users: the header is fixed and would
            otherwise sit between them and the gallery on every page. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-(--z-overlay) focus:bg-(--color-surface-raised) focus:px-4 focus:py-2 focus:font-mono focus:text-xs focus:uppercase focus:tracking-(--tracking-label)"
        >
          Skip to content
        </a>

        <SiteHeader />
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  )
}
