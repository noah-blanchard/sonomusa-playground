import type { Metadata, Viewport } from 'next'
import '@/styles/globals.css'
import '@/env'

export const metadata: Metadata = {
  title: {
    default: 'SonoMusa Playground',
    template: '%s — SonoMusa Playground',
  },
  description: 'A gallery of coded experiences.',
}

export const viewport: Viewport = {
  themeColor: '#0A0A0A',
  colorScheme: 'dark',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
