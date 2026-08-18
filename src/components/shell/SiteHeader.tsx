import Link from 'next/link'
import { Logo } from '@/components/brand/Logo'
import { Button } from '@/components/ui/Button'
import { InfoOverlay } from './InfoOverlay'

/**
 * Restrained global navigation.
 *
 * Mark left, sections centred, INFO right — the composition from the reference
 * art. It stays quiet on purpose: the navigation is the frame, and the frame
 * must not compete with the work inside it (CONCEPT §2.2).
 *
 * A Server Component apart from the INFO trigger, which is the only part with
 * behaviour.
 */

const SECTIONS = [
  { href: '/', label: 'Playground' },
  { href: '/projects', label: 'Index' },
] as const

export function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-(--z-nav) bg-linear-to-b from-(--color-obsidian) via-(--color-obsidian)/80 to-transparent">
      <div className="mx-auto flex max-w-(--layout-max) items-center justify-between px-(--layout-gutter-sm) py-5 sm:px-(--layout-gutter)">
        <Link
          href="/"
          className="stencil-focus text-(--color-text-primary) transition-opacity duration-(--duration-fast) hover:opacity-70"
        >
          {/* The mark is the only thing naming the site here, so it carries the name. */}
          <Logo lockup="wordmark" title="SonoMusa — home" className="h-3.5 sm:h-4" />
        </Link>

        <nav aria-label="Sections" className="absolute left-1/2 hidden -translate-x-1/2 md:block">
          <ul className="flex items-center gap-10">
            {SECTIONS.map((section) => (
              <li key={section.href}>
                <Button variant="ghost" tone="secondary" href={section.href}>
                  {section.label}
                </Button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-6">
          {/* Below md the centred nav is hidden, so Index needs a home here. */}
          <Button variant="ghost" tone="secondary" href="/projects" className="md:hidden">
            Index
          </Button>
          <InfoOverlay />
        </div>
      </div>
    </header>
  )
}
