'use client'

import { Label } from '@/components/ui/Label'

/**
 * Previous / next and the position indicators.
 *
 * These are real buttons with real labels, which is what makes the gallery
 * fully usable without gesture input. The dots are controls too, not
 * decoration — labelled, focusable, and each states whether it is current.
 */
export function GalleryControls({
  items,
  activeIndex,
  onNext,
  onPrevious,
  onGoTo,
}: {
  items: { slug: string; title: string }[]
  activeIndex: number
  onNext: () => void
  onPrevious: () => void
  onGoTo: (index: number) => void
}) {
  if (items.length <= 1) return null

  return (
    <div className="flex items-center justify-center gap-8">
      <ArrowButton direction="previous" onClick={onPrevious} />

      <ul className="flex items-center gap-3">
        {items.map((item, index) => {
          const isActive = index === activeIndex

          return (
            <li key={item.slug}>
              <button
                type="button"
                onClick={() => onGoTo(index)}
                aria-current={isActive ? 'true' : undefined}
                className="stencil-focus flex size-5 items-center justify-center"
              >
                <span className="sr-only">
                  {item.title} — project {index + 1} of {items.length}
                </span>
                <span
                  aria-hidden
                  className={`size-1.5 rounded-full transition-colors duration-(--duration-base) ${
                    isActive ? 'bg-(--color-accent)' : 'bg-(--color-steel)/40'
                  }`}
                />
              </button>
            </li>
          )
        })}
      </ul>

      <ArrowButton direction="next" onClick={onNext} />
    </div>
  )
}

function ArrowButton({
  direction,
  onClick,
}: {
  direction: 'previous' | 'next'
  onClick: () => void
}) {
  const isNext = direction === 'next'

  return (
    <button
      type="button"
      onClick={onClick}
      /*
       * The visible label is hidden below sm, so the accessible name comes from
       * aria-label instead — that way it reads the same at every width rather
       * than degrading to an unnamed arrow on mobile. Everything inside is
       * hidden from assistive tech so the name is not announced twice.
       */
      aria-label={isNext ? 'Next project' : 'Previous project'}
      className="stencil-focus group flex items-center gap-3 py-2 text-(--color-text-secondary) transition-colors duration-(--duration-fast) hover:text-(--color-text-primary)"
    >
      {isNext && (
        <Label aria-hidden className="hidden sm:inline">
          Next
        </Label>
      )}
      <span
        aria-hidden
        className={`font-mono text-base transition-transform duration-(--duration-base) ease-(--ease-standard) motion-reduce:transition-none ${
          isNext
            ? 'group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0'
            : 'group-hover:-translate-x-1 motion-reduce:group-hover:translate-x-0'
        }`}
      >
        {isNext ? '→' : '←'}
      </span>
      {!isNext && (
        <Label aria-hidden className="hidden sm:inline">
          Previous
        </Label>
      )}
    </button>
  )
}
