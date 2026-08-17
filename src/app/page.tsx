import { PlaygroundIntro } from '@/components/shell/PlaygroundIntro'
import { StencilRule } from '@/components/ui/StencilRule'

/**
 * Home.
 *
 * The immersive gallery lands here in Phase 5. The editorial column and the
 * page rhythm are in place first, because they are the frame the gallery has
 * to sit inside — building the gallery first would let it dictate the layout
 * rather than the other way round.
 */
export default function HomePage() {
  return (
    <div className="mx-auto max-w-(--layout-max) px-(--layout-gutter-sm) sm:px-(--layout-gutter)">
      <section className="flex min-h-dvh items-center pt-24">
        <PlaygroundIntro />
      </section>

      <div className="flex items-center gap-6 pb-6">
        {/* Braced because a bare `//` in JSX children reads as a comment. */}
        <span aria-hidden className="font-mono text-xs text-(--color-text-secondary)">
          {'//'}
        </span>
        <StencilRule className="flex-1" variant="late" />
      </div>
    </div>
  )
}
