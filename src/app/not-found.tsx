import Link from 'next/link'
import { Label } from '@/components/ui/Label'
import { StencilRule } from '@/components/ui/StencilRule'

/**
 * Not found.
 *
 * Projects come and go — CONCEPT §2.3 lists "projects that are no longer
 * online" as a case the system must tolerate — so this page will be reached
 * legitimately. It stays in the same editorial voice rather than apologising.
 */
export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-(--layout-max) flex-col justify-center px-(--layout-gutter-sm) py-32 sm:px-(--layout-gutter)">
      <div className="max-w-lg">
        <Label>404</Label>

        <h1 className="mt-8 font-display text-[clamp(2rem,5vw,3.5rem)] font-light leading-(--leading-display) tracking-(--tracking-tight) text-(--color-text-primary)">
          Nothing here.
        </h1>

        <p className="mt-6 text-base leading-(--leading-body) text-(--color-text-secondary)">
          This page has moved, or the project it pointed at is no longer on show.
        </p>

        <StencilRule className="my-10" variant="late" />

        <div className="flex flex-wrap gap-x-10 gap-y-4">
          <Link href="/" className="stencil-focus">
            <Label tone="primary" className="stencil-underline pb-2">
              Playground
            </Label>
          </Link>
          <Link href="/projects" className="stencil-focus">
            <Label tone="primary" className="stencil-underline pb-2">
              All projects
            </Label>
          </Link>
        </div>
      </div>
    </div>
  )
}
