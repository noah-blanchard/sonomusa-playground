'use client'

import { useEffect, useRef, useSyncExternalStore } from 'react'
import { Geometry, Mesh, Program, Renderer } from 'ogl'
import { accentToRgb, fieldEllipse, seededRandom, spawnParticles } from '../lib/ambience'

/**
 * The ambient field that marks the fronting project.
 *
 * This is the one GPU layer in the shell. `docs/rules/03-design-system.md`
 * permits a glowing field here and nowhere else: each point is a soft mote
 * (radial falloff) and overlaps accumulate (additive blending), so the band
 * around the active card reads as a glow. That permission is scoped to this
 * single layer — see ADR 0003 and its 2026-08-17 amendment, which relaxed the
 * original "gap, not a glow" constraint at product direction.
 *
 * It sits *behind* every frame. The active card is opaque and painted at
 * z-index 30, so it occludes the middle of the field and what remains is a wide
 * shallow ellipse around it. That is why there is no keep-out geometry here and
 * no mask: the card is the mask.
 *
 * The colour is the active project's own accent. The shell stays colourless;
 * this is one of the two places a project's identity reaches the frame.
 */

const VERTEX = /* glsl */ `
  attribute vec2 position;
  attribute vec4 motion;   // phase, speed, amplitude, size
  attribute float alpha;
  attribute float reach;   // 0 against the card, 1 at the field's outer edge

  uniform float uTime;
  uniform vec2 uPointer;    // normalized viewport space; off-screen when idle
  uniform float uPointerStrength;
  uniform float uAspect;
  uniform float uDpr;

  varying float vAlpha;

  void main() {
    float phase = motion.x;
    float speed = motion.y;
    float amplitude = motion.z;

    /*
     * Two sines at unrelated rates. A single one reads as a pendulum and the
     * whole field ends up swinging together; the second, slower and on the
     * other axis, is what turns it into a drift.
     */
    vec2 wander = vec2(
      sin(uTime * speed + phase),
      cos(uTime * speed * 0.73 + phase * 1.7)
    ) * amplitude;

    vec2 pos = position + wander;

    /*
     * Repulsion. uPointer is already eased on the CPU, so this never sees the
     * cursor jump — a raw position made the whole field flick sideways on a
     * fast mouse move. Aspect-corrected so the falloff is a circle on screen
     * rather than an ellipse, and quadratic so a particle eases out of the way
     * instead of jumping.
     *
     * Weighted by reach: motes packed against the card barely move while the
     * loose outer cloud swings. Without that the field dents as one rigid
     * sheet; with it, the cursor stirs something diffuse.
     */
    vec2 toPointer = pos - uPointer;
    toPointer.x *= uAspect;
    float distance = length(toPointer);
    float radius = 0.34;
    float push = max(0.0, 1.0 - distance / radius);
    pos += normalize(toPointer + 1e-6)
         * push * push * 0.009 * uPointerStrength * (0.35 + reach * 1.3);

    vAlpha = alpha;

    // Viewport space (y down) to clip space (y up).
    gl_Position = vec4(pos.x * 2.0 - 1.0, 1.0 - pos.y * 2.0, 0.0, 1.0);
    // The fragment shader's radial falloff needs a few pixels to resolve, so a
    // point is drawn larger than its nominal hairline and softened back to a
    // mote by the glow.
    gl_PointSize = motion.w * uDpr * 3.0;
  }
`

const FRAGMENT = /* glsl */ `
  precision mediump float;

  uniform vec3 uColor;
  uniform float uOpacity;

  varying float vAlpha;

  void main() {
    /*
     * A radial falloff turns each point into a soft mote. gl_PointCoord is
     * the point-local 0–1 square; distance from its centre drives a smooth
     * falloff so the sprite reads as a glow rather than a hard pixel. Paired
     * with additive blending, overlaps accumulate into brightness.
     */
    float d = length(gl_PointCoord - 0.5);
    float glow = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(uColor, vAlpha * glow * uOpacity);
  }
`

/**
 * The field covers roughly three times the area a band around the frame did, so
 * the count rises with it — at 2000 the ellipse reads as sparse rather than
 * diffuse. The cost is still one draw call and nothing per frame on the CPU;
 * the only real term is point-sprite fill rate, negligible at this size.
 */
const PARTICLE_COUNT = 3400
/** Matches `--gallery-bleed`. CSS owns the value; this converts it to pixels. */
const BLEED_REM = 3.25

/**
 * Any constant would do. What matters is that it is a constant: `build()` runs
 * again on every resize, and dealing a fresh field each time made a window drag
 * churn the whole layer. A rebuild is a new box, not a new field.
 */
const FIELD_SEED = 0x5f3a91

/**
 * The same 768px the gallery already reinterprets itself at.
 *
 * Below it the frame is full width and `--gallery-bleed` is zero, so there is
 * no space around the card for a field to occupy. The canvas is not merely
 * hidden there — it is never rendered, so no GL context is created on the
 * devices least able to spare one.
 */
const DESKTOP = '(min-width: 768px)'

function subscribeToWidth(onChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {}

  const list = window.matchMedia(DESKTOP)
  list.addEventListener('change', onChange)
  return () => list.removeEventListener('change', onChange)
}

/**
 * Server snapshot is `false`, so nothing renders until the client knows the
 * width. The same shape as `usePrefersReducedMotion` — a decision CSS cannot
 * make, resolved once, without measuring the viewport during render.
 */
function useIsDesktop(): boolean {
  return useSyncExternalStore(
    subscribeToWidth,
    () => (typeof window === 'undefined' ? false : window.matchMedia(DESKTOP).matches),
    () => false,
  )
}

export function GalleryAmbience({
  accent,
  reducedMotion,
}: {
  accent: string | undefined
  reducedMotion: boolean
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDesktop = useIsDesktop()
  /*
   * The accent changes as the gallery moves, but rebuilding the GL context for
   * a colour would be absurd — so it rides in a ref and the loop reads it,
   * easing toward the new value rather than cutting to it.
   */
  const targetColour = useRef(accentToRgb(accent))
  targetColour.current = accentToRgb(accent)

  useEffect(() => {
    // Null whenever `isDesktop` is false, since the canvas is not rendered.
    const canvas = canvasRef.current
    if (!canvas) return

    let renderer: Renderer
    try {
      renderer = new Renderer({
        canvas,
        alpha: true,
        antialias: false,
        dpr: Math.min(window.devicePixelRatio || 1, 2),
        premultipliedAlpha: false,
        /*
         * So the field can be asserted on. WebGL discards the drawing buffer
         * after compositing, which makes `readPixels` return nothing from
         * outside the frame — a canvas that mounted and drew nothing would
         * otherwise pass every structural check there is. See
         * e2e/emphasis.spec.ts. The cost is one buffer the browser cannot
         * reclaim early, for a few hundred points.
         */
        preserveDrawingBuffer: true,
      })
    } catch {
      // No WebGL is a complete recovery, not a degraded one: the stencil frame
      // already says which project is active (CONCEPT §19).
      return
    }

    const gl = renderer.gl
    gl.clearColor(0, 0, 0, 0)

    const parent = canvas.parentElement
    if (!parent) return

    let mesh: Mesh | undefined
    let frame = 0
    let stopped = false
    /*
     * The pointer is smoothed, not raw. `target` is where the cursor actually
     * is; the values fed to the shader trail it by a fixed lerp each frame, so
     * a fast mouse move reads as the field sweeping over rather than snapping.
     * Strength eases the same way, fading the response in on entry and out on
     * leave instead of cutting.
     */
    const pointerTarget = { x: -1, y: -1, strength: 0 }
    const pointer = { x: -1, y: -1, strength: 0 }
    const colour = [...targetColour.current] as [number, number, number]

    const build = () => {
      const { width, height } = parent.getBoundingClientRect()
      if (width <= 0 || height <= 0) return

      renderer.setSize(width, height)

      const bleedPx = BLEED_REM * parseFloat(getComputedStyle(document.documentElement).fontSize)
      const ellipse = fieldEllipse(Math.min(0.45, bleedPx / height))
      // Re-seeded, not carried over: the same draw for the same seed, so a
      // resize reflows this field rather than dealing another one.
      const particles = spawnParticles(PARTICLE_COUNT, ellipse, seededRandom(FIELD_SEED))

      const position = new Float32Array(PARTICLE_COUNT * 2)
      const motion = new Float32Array(PARTICLE_COUNT * 4)
      const alpha = new Float32Array(PARTICLE_COUNT)
      const reach = new Float32Array(PARTICLE_COUNT)

      particles.forEach((particle, index) => {
        position[index * 2] = particle.x
        position[index * 2 + 1] = particle.y
        motion[index * 4] = particle.phase
        motion[index * 4 + 1] = particle.speed
        motion[index * 4 + 2] = particle.amplitude
        motion[index * 4 + 3] = particle.size
        alpha[index] = particle.alpha
        reach[index] = particle.reach
      })

      const geometry = new Geometry(gl, {
        position: { size: 2, data: position },
        motion: { size: 4, data: motion },
        alpha: { size: 1, data: alpha },
        reach: { size: 1, data: reach },
      })

      const program = new Program(gl, {
        vertex: VERTEX,
        fragment: FRAGMENT,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        uniforms: {
          uTime: { value: 0 },
          uPointer: { value: [-1, -1] },
          uPointerStrength: { value: 0 },
          uAspect: { value: width / height },
          uDpr: { value: renderer.dpr },
          uColor: { value: colour },
          uOpacity: { value: 1 },
        },
      })

      /*
       * Additive blending: SRC_ALPHA / ONE rather than the default
       * SRC_ALPHA / ONE_MINUS_SRC_ALPHA. Overlapping motes accumulate into
       * brightness, which is what makes the band around the card read as a
       * glow rather than a dusting of separate points. The canvas sits on the
       * shell's near-black ground, so adding light can only brighten.
       */
      program.setBlendFunc(gl.SRC_ALPHA, gl.ONE)

      mesh?.geometry.remove()
      mesh = new Mesh(gl, { mode: gl.POINTS, geometry, program })
    }

    build()

    const draw = (time: number) => {
      if (stopped || !mesh) return

      const uniforms = mesh.program.uniforms
      uniforms.uTime!.value = time / 1000

      // Ease the colour toward the active project's rather than cutting to it,
      // so the field crossfades on the same beat the frames travel.
      const target = targetColour.current
      for (let channel = 0; channel < 3; channel += 1) {
        colour[channel]! += (target[channel]! - colour[channel]!) * 0.04
      }

      // Ease the pointer toward the cursor. A small factor keeps the trailing
      // motion languid rather than jerky — the field glides after the mouse.
      const ease = 0.03
      pointer.x += (pointerTarget.x - pointer.x) * ease
      pointer.y += (pointerTarget.y - pointer.y) * ease
      pointer.strength += (pointerTarget.strength - pointer.strength) * ease

      uniforms.uPointer!.value = [pointer.x, pointer.y]
      uniforms.uPointerStrength!.value = pointer.strength

      renderer.render({ scene: mesh })

      // A single painted frame under reduced motion: the field is still there,
      // it simply does not move (docs/rules/05-experience.md).
      if (reducedMotion) return
      frame = requestAnimationFrame(draw)
    }

    frame = requestAnimationFrame(draw)

    const onPointerMove = (event: PointerEvent) => {
      const rect = parent.getBoundingClientRect()
      pointerTarget.x = (event.clientX - rect.left) / rect.width
      pointerTarget.y = (event.clientY - rect.top) / rect.height
      pointerTarget.strength = 1
    }

    const onPointerLeave = () => {
      pointerTarget.strength = 0
    }

    /*
     * Passive, and its own listener. `useGalleryInput` holds a non-passive
     * wheel listener and a pointerdown drag on this same element; sharing a
     * handler would couple the field's lifetime to the gallery's input.
     */
    if (!reducedMotion) {
      parent.addEventListener('pointermove', onPointerMove, { passive: true })
      parent.addEventListener('pointerleave', onPointerLeave, { passive: true })
    }

    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(frame)
      } else if (!stopped && !reducedMotion) {
        frame = requestAnimationFrame(draw)
      }
    }

    document.addEventListener('visibilitychange', onVisibility)

    const observer = new ResizeObserver(() => {
      build()
      if (reducedMotion) requestAnimationFrame(draw)
    })
    observer.observe(parent)

    return () => {
      stopped = true
      cancelAnimationFrame(frame)
      observer.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      parent.removeEventListener('pointermove', onPointerMove)
      parent.removeEventListener('pointerleave', onPointerLeave)
      // Release the context rather than waiting for the GC: browsers cap how
      // many live WebGL contexts a page may hold, and this one is remounted
      // whenever reduced motion changes.
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    }
  }, [reducedMotion, isDesktop])

  if (!isDesktop) return null

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      /*
       * z-0 puts it under every frame — the active card occludes the middle and
       * leaves a band. pointer-events-none so it never intercepts a link or the
       * drag gesture.
       */
      className="pointer-events-none absolute inset-0 z-0 size-full"
    />
  )
}
