import { Icon } from '@/components/ui/Icon'
import { Label } from '@/components/ui/Label'

/**
 * Minimal contextual footer.
 *
 * Copy follows CONCEPT §48 — confident, not promotional. "Things made to be
 * experienced" is the line the reference composition ends on, and it is the
 * whole positioning in five words.
 */

const LINKS = [
  { href: 'https://github.com/noah-blanchard', label: 'GitHub', external: true },
  { href: 'mailto:n.blanchard190302@gmail.com', label: 'Contact', external: false },
] as const

export function SiteFooter() {
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
            <a
              href={link.href}
              {...(link.external && { target: '_blank', rel: 'noreferrer noopener' })}
              className="stencil-focus group inline-flex items-center gap-2 py-1 text-(--color-text-secondary) transition-colors duration-(--duration-fast) hover:text-(--color-text-primary)"
            >
              <Label>{link.label}</Label>
              {/* Every other external link in the shell says so both visually
                  and to a screen reader. This one used to say neither. */}
              {link.external && (
                <>
                  <Icon name="arrow-up-right" nudge="forward" />
                  <span className="sr-only">(opens in a new tab)</span>
                </>
              )}
            </a>
          </li>
        ))}
      </ul>
    </footer>
  )
}
