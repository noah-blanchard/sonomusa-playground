'use client'

import { useEffect, useRef } from 'react'
import type { ProjectExperienceProps } from '@/features/project-experience'

/**
 * Musai, full size and in your hands.
 *
 * The sibling `preview.tsx` is a short loop that says what this is. This is the
 * thing itself: the same lattice, but it now takes input. Point at it and the
 * field bends toward you; strike it and a wave crosses the whole surface and
 * decays. That is the piece — a system that reorganises around whatever it is
 * given.
 *
 * Kept as its own file rather than a flag on the preview because they are not
 * the same object. The preview has to be cheap enough for six of them to sit on
 * a homepage; this one is allowed to cost what it costs, because the visitor
 * asked for it.
 *
 * The three obligations of the contract, same as any preview:
 *   1. nothing heavy runs until this component actually mounts
 *   2. everything stops and is released on unmount
 *   3. `onReady` when painted, `onError` when not — never a blank stage
 */

const ACCENT = [95, 168, 232] as const
const BONE = [240, 239, 234] as const

interface Strike {
  x: number
  y: number
  born: number
}

export default function MusaiExperience({
  reducedMotion,
  onReady,
  onError,
}: ProjectExperienceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext('2d')
    if (!context) {
      // No 2D context means no piece. The stage keeps its poster and says so,
      // which is a complete recovery rather than a degraded one.
      onError('Canvas 2D is unavailable')
      return
    }

    let width = 0
    let height = 0
    let animation = 0
    let stopped = false
    let started = 0

    /** Where the field is being pulled. Centre until the visitor says otherwise. */
    const focus = { x: 0.5, y: 0.5 }
    let strikes: Strike[] = []

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      const rect = canvas.getBoundingClientRect()

      width = rect.width
      height = rect.height
      canvas.width = Math.max(1, Math.floor(width * ratio))
      canvas.height = Math.max(1, Math.floor(height * ratio))
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
    }

    /** Bone at rest, the project's own blue where the field is listening. */
    const mix = (amount: number) =>
      BONE.map((channel, index) =>
        Math.round(channel + (ACCENT[index]! - channel) * amount),
      ).join(', ')

    const paint = (time: number) => {
      const elapsed = (time - started) / 1000
      // Reduced motion holds the field at a single moment. It still answers
      // input — it simply does not drift on its own.
      const clock = reducedMotion ? 0 : elapsed

      const focusX = focus.x * width
      const focusY = focus.y * height

      context.clearRect(0, 0, width, height)
      context.lineWidth = 1

      const rows = Math.max(12, Math.min(48, Math.round(height / 22)))
      const columns = Math.max(24, Math.min(160, Math.round(width / 12)))
      const reach = Math.max(width, height) * 0.42

      strikes = strikes.filter((entry) => elapsed - entry.born < 4)

      for (let row = 0; row <= rows; row += 1) {
        const baseY = (row / rows) * height
        let nearest = Infinity

        context.beginPath()

        for (let column = 0; column <= columns; column += 1) {
          const x = (column / columns) * width

          // The resting field: two slow waves that never quite line up.
          let y =
            baseY +
            Math.sin(column * 0.08 + clock * 0.9 + row * 0.24) * 7 +
            Math.sin(column * 0.031 - clock * 0.5) * 5

          // The pull. Closer to the focus, the more the row leans into it.
          const dx = x - focusX
          const dy = baseY - focusY
          const distance = Math.hypot(dx, dy)
          if (distance < nearest) nearest = distance

          const pull = Math.exp(-(distance * distance) / (2 * reach * reach))
          y -= Math.sign(dy || 1) * pull * 46
          y += Math.sin(distance * 0.03 - clock * 1.8) * pull * 12

          // Strikes: a ring crossing the surface, fading as it travels.
          for (const entry of strikes) {
            const age = elapsed - entry.born
            const ring = Math.hypot(x - entry.x, baseY - entry.y) - age * 620

            y +=
              Math.sin(ring * 0.045) *
              Math.exp(-(ring * ring) / 26000) *
              Math.exp(-age * 0.8) *
              34
          }

          if (column === 0) context.moveTo(x, y)
          else context.lineTo(x, y)
        }

        const proximity = Math.exp(-(nearest * nearest) / (2 * reach * reach))
        const alpha = 0.08 + proximity * 0.55

        context.strokeStyle = `rgba(${mix(proximity)}, ${alpha.toFixed(3)})`
        context.stroke()
      }

      if (stopped || reducedMotion) return
      animation = requestAnimationFrame(paint)
    }

    /** Reduced motion runs no loop, so every input has to repaint explicitly. */
    const repaint = () => {
      if (reducedMotion) paint(performance.now())
    }

    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      focus.x = (event.clientX - rect.left) / rect.width
      focus.y = (event.clientY - rect.top) / rect.height
      repaint()
    }

    const addStrike = () => {
      strikes.push({
        x: focus.x * width,
        y: focus.y * height,
        born: (performance.now() - started) / 1000,
      })
      repaint()
    }

    /** Everything the pointer can do, the keyboard can do (CONCEPT §20). */
    const onKeyDown = (event: KeyboardEvent) => {
      const step = event.shiftKey ? 0.12 : 0.04

      switch (event.key) {
        case 'ArrowLeft':
          focus.x = Math.max(0, focus.x - step)
          break
        case 'ArrowRight':
          focus.x = Math.min(1, focus.x + step)
          break
        case 'ArrowUp':
          focus.y = Math.max(0, focus.y - step)
          break
        case 'ArrowDown':
          focus.y = Math.min(1, focus.y + step)
          break
        case ' ':
        case 'Enter':
          addStrike()
          event.preventDefault()
          return
        default:
          return
      }

      event.preventDefault()
      repaint()
    }

    try {
      resize()
      started = performance.now()
      paint(started)
      onReady()
    } catch (error) {
      onError(error instanceof Error ? error.message : 'The piece failed to start')
      return
    }

    const observer = new ResizeObserver(() => {
      resize()
      repaint()
    })
    observer.observe(canvas)

    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerdown', addStrike)
    canvas.addEventListener('keydown', onKeyDown)

    return () => {
      stopped = true
      cancelAnimationFrame(animation)
      observer.disconnect()
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerdown', addStrike)
      canvas.removeEventListener('keydown', onKeyDown)
    }
  }, [reducedMotion, onReady, onError])

  return (
    <>
      <canvas
        ref={canvasRef}
        tabIndex={0}
        role="img"
        aria-label="Musai — an interactive lattice. Move the pointer or use the arrow keys to bend the field; click or press Space to strike it."
        className="absolute inset-0 size-full"
      />

      {/* The controls are not discoverable by looking, so they are stated. */}
      <p className="pointer-events-none absolute inset-x-0 bottom-28 text-center font-mono text-[0.6875rem] uppercase leading-none tracking-(--tracking-label) text-(--color-text-secondary)">
        Move to bend · click or space to strike
      </p>
    </>
  )
}
