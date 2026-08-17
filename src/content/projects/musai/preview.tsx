'use client'

import { useEffect, useRef } from 'react'
import type { ComponentPreviewProps } from '@/features/project-preview'

/**
 * A live in-frame preview, owned entirely by this project.
 *
 * This file is the demonstration that a project can bring its own rendering
 * technology and visual language without the gallery knowing anything about
 * it. The shell resolves it by id, mounts it only when the frame is active,
 * and replaces it with the poster if it throws.
 *
 * It obeys the same three obligations any component preview has:
 *   1. nothing heavy runs until `isActive`
 *   2. everything stops and is released when it goes inactive
 *   3. `onReady` when painted, `onError` when not — never a blank frame
 */
export default function MusaiPreview({
  isActive,
  reducedMotion,
  onReady,
  onError,
}: ComponentPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!isActive) return

    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext('2d')
    if (!context) {
      // No 2D context means no preview — the poster stays, which is a complete
      // recovery rather than a degraded one.
      onError('Canvas 2D is unavailable')
      return
    }

    let frame = 0
    let animation = 0
    let stopped = false

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      const { width, height } = canvas.getBoundingClientRect()

      canvas.width = Math.max(1, Math.floor(width * ratio))
      canvas.height = Math.max(1, Math.floor(height * ratio))
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
    }

    const draw = () => {
      if (stopped) return

      const { width, height } = canvas.getBoundingClientRect()
      const time = frame / 60

      context.clearRect(0, 0, width, height)
      context.strokeStyle = 'rgba(240, 239, 234, 0.5)'
      context.lineWidth = 1

      const columns = 22
      const rows = 14

      for (let row = 0; row < rows; row += 1) {
        context.beginPath()

        for (let column = 0; column <= columns; column += 1) {
          const x = (column / columns) * width
          const wave =
            Math.sin(column * 0.42 + time + row * 0.3) * (6 + row * 0.9) +
            Math.sin(column * 0.13 - time * 0.6) * 5

          const y = (row / rows) * height + height / rows / 2 + wave

          if (column === 0) context.moveTo(x, y)
          else context.lineTo(x, y)
        }

        context.globalAlpha = 0.1 + (row / rows) * 0.4
        context.stroke()
      }

      context.globalAlpha = 1

      // Reduced motion gets a single painted frame: the piece is still shown,
      // it simply does not move (docs/rules/05-experience.md).
      if (reducedMotion) return

      frame += 1
      animation = requestAnimationFrame(draw)
    }

    try {
      resize()
      draw()
      onReady()
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Preview failed to start')
      return
    }

    window.addEventListener('resize', resize)

    return () => {
      stopped = true
      cancelAnimationFrame(animation)
      window.removeEventListener('resize', resize)
    }
  }, [isActive, reducedMotion, onReady, onError])

  return <canvas ref={canvasRef} aria-hidden className="absolute inset-0 size-full" />
}
