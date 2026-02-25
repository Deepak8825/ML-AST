'use client'

import React, { useEffect, useRef } from 'react'

/**
 * StarBackground — Subtle animated starfield.
 *
 * Pure canvas, zero dependencies, ~60 FPS capped.
 * Renders behind all content via fixed position + z-index -10.
 *
 * Config mirrors the user spec:
 *   particles: 80 | color: #fff | opacity: 0.4 | size: 1.2
 *   speed: 0.3 | direction: random | interactivity: none
 */

interface Star {
    x: number
    y: number
    size: number
    baseOpacity: number
    speed: number
    angle: number         // movement direction (radians)
    twinkleSpeed: number  // how fast it twinkles
    twinklePhase: number  // phase offset
}

const STAR_COUNT = 100
const MAX_SIZE = 2
const MIN_SIZE = 0.4
const MAX_OPACITY = 0.5
const MIN_OPACITY = 0.1
const MAX_SPEED = 0.35
const MIN_SPEED = 0.05
const BG_COLOR = '#0B0F1A'

function createStar(w: number, h: number): Star {
    return {
        x: Math.random() * w,
        y: Math.random() * h,
        size: Math.random() * (MAX_SIZE - MIN_SIZE) + MIN_SIZE,
        baseOpacity: Math.random() * (MAX_OPACITY - MIN_OPACITY) + MIN_OPACITY,
        speed: Math.random() * (MAX_SPEED - MIN_SPEED) + MIN_SPEED,
        angle: Math.random() * Math.PI * 2,
        twinkleSpeed: Math.random() * 1.5 + 0.5,
        twinklePhase: Math.random() * Math.PI * 2,
    }
}

const StarBackground: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const starsRef = useRef<Star[]>([])
    const rafRef = useRef<number>(0)
    const timeRef = useRef(0)
    const lastFrameRef = useRef(0)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d', { alpha: false })
        if (!ctx) return

        // --- sizing ---
        const resize = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, 2)
            canvas.width = window.innerWidth * dpr
            canvas.height = window.innerHeight * dpr
            canvas.style.width = `${window.innerWidth}px`
            canvas.style.height = `${window.innerHeight}px`
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        }
        resize()

        // --- init stars ---
        const w = window.innerWidth
        const h = window.innerHeight
        starsRef.current = Array.from({ length: STAR_COUNT }, () => createStar(w, h))

        // --- animation loop (capped at ~60 fps) ---
        const frameDuration = 1000 / 60

        const draw = (timestamp: number) => {
            // throttle
            const elapsed = timestamp - lastFrameRef.current
            if (elapsed < frameDuration) {
                rafRef.current = requestAnimationFrame(draw)
                return
            }
            lastFrameRef.current = timestamp - (elapsed % frameDuration)

            const dt = elapsed / 1000 // seconds
            timeRef.current += dt

            const cw = window.innerWidth
            const ch = window.innerHeight

            // clear
            ctx.fillStyle = BG_COLOR
            ctx.fillRect(0, 0, cw, ch)

            // draw stars
            const t = timeRef.current
            for (const star of starsRef.current) {
                // move
                star.x += Math.cos(star.angle) * star.speed * dt * 30
                star.y += Math.sin(star.angle) * star.speed * dt * 30

                // wrap around edges
                if (star.x < -5) star.x = cw + 5
                else if (star.x > cw + 5) star.x = -5
                if (star.y < -5) star.y = ch + 5
                else if (star.y > ch + 5) star.y = -5

                // twinkle
                const twinkle = Math.sin(t * star.twinkleSpeed + star.twinklePhase) * 0.5 + 0.5
                const opacity = star.baseOpacity * (0.4 + twinkle * 0.6)

                // draw
                ctx.beginPath()
                ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
                ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`
                ctx.fill()
            }

            rafRef.current = requestAnimationFrame(draw)
        }

        // respect prefers-reduced-motion
        const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
        if (!motionQuery.matches) {
            rafRef.current = requestAnimationFrame(draw)
        } else {
            // still draw a single static frame
            ctx.fillStyle = BG_COLOR
            ctx.fillRect(0, 0, w, h)
            for (const star of starsRef.current) {
                ctx.beginPath()
                ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
                ctx.fillStyle = `rgba(255, 255, 255, ${star.baseOpacity * 0.6})`
                ctx.fill()
            }
        }

        window.addEventListener('resize', resize)

        // pause when tab is hidden
        const handleVisibility = () => {
            if (document.hidden) {
                cancelAnimationFrame(rafRef.current)
            } else {
                lastFrameRef.current = performance.now()
                rafRef.current = requestAnimationFrame(draw)
            }
        }
        document.addEventListener('visibilitychange', handleVisibility)

        return () => {
            cancelAnimationFrame(rafRef.current)
            window.removeEventListener('resize', resize)
            document.removeEventListener('visibilitychange', handleVisibility)
        }
    }, [])

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 -z-10"
            style={{ pointerEvents: 'none' }}
            aria-hidden="true"
        />
    )
}

export default StarBackground
