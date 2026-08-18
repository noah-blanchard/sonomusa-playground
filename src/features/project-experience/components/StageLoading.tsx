import { Label } from '@/components/ui/Label'

/**
 * The beat between the frame expanding and the work appearing.
 *
 * An opaque curtain, on purpose: the navigation morph ends on this surface,
 * the experience loads and paints behind it, and only then does it leave — so
 * the handoff reads as one continuous motion (card → curtain → work) rather
 * than as a page that is still assembling itself. Until it lifts, nothing
 * underneath is half-visible: not the poster, not a half-mounted iframe.
 *
 * Nothing here is a spinner. The gallery has no spinners; a hairline in the
 * project's own colour and a quiet label are the whole vocabulary.
 *
 * It is the Suspense fallback for the experience chunk, so how long it holds
 * is exactly how long that chunk takes — never a timer.
 */
export function StageLoading({ title }: { title: string }) {
  return (
    <div
      // The e2e suite needs to see this arrive and leave; nothing else reads it.
      data-stage-loading
      className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-(--color-obsidian)"
    >
      {/*
        The work's own name, in the gallery's title face — the same typography
        the frame gave it, so the curtain reads as the same object still
        opening rather than as a generic splash screen.
      */}
      <p aria-hidden className="font-title text-xl font-light uppercase leading-(--leading-title) tracking-(--tracking-wide) text-(--color-text-primary)">
        {title}
      </p>
      {/* The project's own colour if it has one, the shell's hairline if not. */}
      <span aria-hidden className="block h-px w-24 bg-(--stage-accent,var(--color-line-strong))" />
      <Label tone="secondary">Loading</Label>
      <p role="status" className="sr-only">{`Loading ${title}`}</p>
    </div>
  )
}
