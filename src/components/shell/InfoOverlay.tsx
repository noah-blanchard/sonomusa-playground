'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Label } from '@/components/ui/Label'
import { StencilRule } from '@/components/ui/StencilRule'

/**
 * The INFO panel from the top-right of the composition.
 *
 * Built on the native <dialog> element deliberately: `showModal()` gives focus
 * containment, Escape-to-close, background inertness and correct dialog
 * semantics from the platform. A hand-rolled focus trap would be more code and
 * less correct — see docs/rules/05-experience.md.
 */

const SHORTCUTS: { keys: string; action: string }[] = [
  { keys: '← →', action: 'Move between projects' },
  { keys: 'Home / End', action: 'First or last project' },
  { keys: 'Enter', action: 'Open the focused project' },
  { keys: 'Esc', action: 'Close this panel' },
]

export function InfoOverlay() {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [isOpen, setIsOpen] = useState(false)

  const close = useCallback(() => {
    dialogRef.current?.close()
  }, [])

  const open = useCallback(() => {
    dialogRef.current?.showModal()
    setIsOpen(true)
  }, [])

  // The platform closes the dialog on Escape without telling React, so mirror
  // its state from the element rather than assuming our own is authoritative.
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    const handleClose = () => {
      setIsOpen(false)
      // Returning focus to the trigger is the part <dialog> does not do.
      triggerRef.current?.focus()
    }

    dialog.addEventListener('close', handleClose)
    return () => dialog.removeEventListener('close', handleClose)
  }, [])

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={open}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className="stencil-focus group flex items-center gap-2 py-1 transition-colors duration-(--duration-fast) hover:text-(--color-text-primary)"
      >
        {/* The dot is the accent's entire job here: punctuation, not atmosphere. */}
        <span
          aria-hidden
          className="size-1 rounded-full bg-(--color-text-secondary) transition-colors duration-(--duration-fast) group-hover:bg-(--color-accent)"
        />
        <Label>Info</Label>
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="info-overlay-title"
        // Clicking the backdrop closes. The check compares against the dialog
        // itself because the backdrop is not a separate event target.
        onClick={(event) => {
          if (event.target === dialogRef.current) close()
        }}
        className="m-auto w-[min(34rem,calc(100vw-2rem))] bg-(--color-surface-raised) p-0 text-(--color-text-primary) backdrop:bg-black/70 backdrop:backdrop-blur-sm"
      >
        <div className="stencil-frame p-8 sm:p-10">
          <div className="flex items-start justify-between gap-6">
            <h2 id="info-overlay-title" className="font-title text-lg tracking-(--tracking-wide) uppercase">
              SonoMusa Playground
            </h2>
            <button
              type="button"
              onClick={close}
              className="stencil-focus -m-2 p-2 text-(--color-text-secondary) transition-colors duration-(--duration-fast) hover:text-(--color-text-primary)"
            >
              <span className="sr-only">Close</span>
              <span aria-hidden className="font-mono text-sm leading-none">
                ✕
              </span>
            </button>
          </div>

          <StencilRule className="my-6" />

          <p className="max-w-prose text-sm leading-(--leading-body) text-(--color-text-secondary)">
            An evolving gallery of coded experiences — interactive works, generative systems and
            experiments in sound, form and digital perception. Each project keeps its own identity;
            the frame around them is the only thing held in common.
          </p>

          <div className="mt-8">
            <Label as="h3">Keyboard</Label>
            <dl className="mt-4 space-y-2">
              {SHORTCUTS.map((shortcut) => (
                <div key={shortcut.keys} className="flex items-baseline gap-4">
                  <dt className="w-24 shrink-0 font-mono text-xs text-(--color-text-primary)">
                    {shortcut.keys}
                  </dt>
                  <dd className="text-sm text-(--color-text-secondary)">{shortcut.action}</dd>
                </div>
              ))}
            </dl>
          </div>

          <StencilRule className="my-6" variant="late" />

          <p className="font-mono text-[0.6875rem] uppercase tracking-(--tracking-label) text-(--color-text-secondary)">
            Things made to be experienced.
          </p>
        </div>
      </dialog>
    </>
  )
}
