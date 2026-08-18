'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Icon } from '@/components/ui/Icon'

/**
 * The floating way out, top left.
 *
 * The stage has no header, so this is the one piece of chrome over the work —
 * and it is not there until the visitor reaches for it. A hotspot sits in the
 * corner; the cross appears when the pointer enters and fades when it leaves.
 * Keyboard users get the same control rendered always, because focus is the
 * signal there is no pointer to watch.
 *
 * It goes where the Gallery button goes: home with the slug in the query
 * string, so the carousel opens on the frame the visitor was just inside.
 */
export function StageClose({ slug, title }: { slug: string; title: string }) {
  const [revealed, setRevealed] = useState(false)

  return (
    <>
      {/*
        The hotspot. Pointer-only by design — it exists to catch the mouse
        heading for the corner, and it is not a tab stop because the cross
        itself is the control.
      */}
      <div
        aria-hidden
        onPointerEnter={() => setRevealed(true)}
        onPointerLeave={() => setRevealed(false)}
        className="absolute left-0 top-0 z-(--z-overlay) h-28 w-28"
      />

      <Link
        href={`/?project=${slug}`}
        aria-label={`Close ${title} and return to the gallery`}
        onFocus={() => setRevealed(true)}
        onBlur={() => setRevealed(false)}
        onPointerEnter={() => setRevealed(true)}
        className={[
          'stencil-focus group absolute left-5 top-5 z-(--z-overlay) flex size-10 items-center justify-center',
          'border border-(--color-text-secondary)/40 bg-(--color-obsidian)/60 text-(--color-text-primary) backdrop-blur-sm',
          'transition-all duration-(--duration-base) ease-(--ease-standard) motion-reduce:transition-none',
          'hover:border-(--color-text-primary) hover:bg-(--color-obsidian)/90',
          revealed
            ? 'translate-y-0 opacity-100'
            : '-translate-y-2 opacity-0 pointer-events-none focus:pointer-events-auto focus:translate-y-0 focus:opacity-100',
        ].join(' ')}
      >
        <Icon name="close" />
      </Link>
    </>
  )
}
