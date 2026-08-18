import { Label } from '@/components/ui/Label'

/**
 * The beat between the frame expanding and the work appearing.
 *
 * It is deliberately thin. The poster is already filling the stage underneath —
 * rendered on the server, before any JavaScript — so this adds only the mark
 * that says something is still on its way. Nothing here is a spinner: the
 * gallery has no spinners, and the poster is a far better answer to "what am I
 * waiting for" than a rotating shape is.
 *
 * It is the Suspense fallback for the experience chunk, so how long it holds is
 * exactly how long that chunk takes — never a timer.
 */
export function StageLoading({ title }: { title: string }) {
  return (
    <div
      // The e2e suite needs to see this arrive and leave; nothing else reads it.
      data-stage-loading
      className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 flex-col items-center gap-4"
    >
      {/* The project's own colour if it has one, the shell's hairline if not. */}
      <span aria-hidden className="block h-px w-24 bg-(--stage-accent,var(--color-line-strong))" />
      <Label tone="secondary">Loading</Label>
      <p role="status" className="sr-only">{`Loading ${title}`}</p>
    </div>
  )
}
