'use client'

import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Label } from '@/components/ui/Label'

/**
 * Minimal contextual footer.
 *
 * Copy follows CONCEPT §48 — confident, not promotional. "Things made to be
 * experienced" is the line the reference composition ends on, and it is the
 * whole positioning in five words.
 *
 * Absent on the stage: a full-bleed experience is the one place chrome from
 * the shell would sit on top of the work, and the stage already carries its
 * own way out.
 */

const LINKS = [
  { href: 'https://github.com/noah-blanchard', label: 'GitHub', external: true },
  { href: 'mailto:n.blanchard190302@gmail.com', label: 'Contact', external: false },
] as const

export function SiteFooter() {
  const pathname = usePathname()

  if (pathname.endsWith('/play')) return null

  return (
    <footer className="mx-auto flex max-w-(--layout-max) flex-col gap-4 px-(--layout-gutter-sm) py-8 sm:flex-row sm:items-center sm:justify-between sm:px-(--layout-gutter)">
      <div className="flex items-center gap-6">
        <Label>© SonoMusa</Label>
        <Label>{new Date().getFullYear()}</Label>
      </div>

      <p className="font-display text-sm italic text-(--color-text-secondary)">
        Things made to be experienced.
      </p>

      <ul className="flex items-center gap-6">
        {LINKS.map((link) => (
          <li key={link.href}>
            {/* `external` is the whole treatment at once — new tab, the ↗
                marker and the screen-reader warning. This link used to have
                the first and neither of the others. */}
            <Button variant="ghost" tone="secondary" href={link.href} external={link.external}>
              {link.label}
            </Button>
          </li>
        ))}
      </ul>
    </footer>
  )
}
