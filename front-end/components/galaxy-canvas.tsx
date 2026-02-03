'use client'

import React, { useEffect, useRef } from 'react'

interface Galaxy {
  x: number
  y: number
  size: number
  speed: number
  opacity: number
  pulsePhase: number
}

const GalaxyCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const galaxiesRef = useRef<Galaxy[]>([])
  const starsRef = useRef<Array<{ x: number; y: number; opacity: number }>>([])
  const mouseRef = useRef({ x: 0, y: 0 })
  const animationFrameRef = useRef<number>()
  const timeRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const setCanvasSize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2)
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      ctx.scale(dpr, dpr)
    }
    setCanvasSize()

    // Initialize galaxies with varied sizes and speeds
    const initializeGalaxies = () => {
      galaxiesRef.current = [
        { x: 0.2, y: 0.3, size: 150, speed: 0.3, opacity: 0.6, pulsePhase: 0 },
        { x: 0.7, y: 0.2, size: 200, speed: 0.25, opacity: 0.5, pulsePhase: 2 },
        { x: 0.5, y: 0.7, size: 120, speed: 0.35, opacity: 0.55, pulsePhase: 4 },
        { x: 0.15, y: 0.65, size: 180, speed: 0.28, opacity: 0.5, pulsePhase: 1 },
        { x: 0.85, y: 0.75, size: 140, speed: 0.32, opacity: 0.6, pulsePhase: 3 },
      ]
    }

    // Initialize background stars
    const initializeStars = () => {
      starsRef.current = Array.from({ length: 100 }, () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        opacity: Math.random() * 0.5 + 0.1,
      }))
    }

    initializeGalaxies()
    initializeStars()

    // Mouse parallax tracking
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      }
    }

    // Draw single galaxy with radial gradient and glow
    const drawGalaxy = (
      galaxy: Galaxy,
      time: number,
      canvasWidth: number,
      canvasHeight: number
    ) => {
      const x = galaxy.x * canvasWidth
      const y = galaxy.y * canvasHeight

      // Calculate sinusoidal drift motion
      const driftX = Math.sin(time * galaxy.speed + 0) * (galaxy.size * 0.08)
      const driftY = Math.cos(time * galaxy.speed * 0.7 + 0) * (galaxy.size * 0.06)

      // Apply subtle parallax based on mouse position
      const parallaxX =
        (mouseRef.current.x - 0.5) * 30
      const parallaxY =
        (mouseRef.current.y - 0.5) * 30

      const finalX = x + driftX + parallaxX
      const finalY = y + driftY + parallaxY

      // Pulsing effect
      const pulse = Math.sin(time * 0.5 + galaxy.pulsePhase) * 0.15 + 0.85

      // Create radial gradient
      const gradient = ctx.createRadialGradient(
        finalX,
        finalY,
        0,
        finalX,
        finalY,
        galaxy.size * pulse
      )

      gradient.addColorStop(
        0,
        `hsla(200, 100%, 70%, ${galaxy.opacity * pulse * 0.8})`
      )
      gradient.addColorStop(
        0.5,
        `hsla(270, 100%, 50%, ${galaxy.opacity * pulse * 0.4})`
      )
      gradient.addColorStop(1, `hsla(280, 100%, 30%, 0)`)

      ctx.fillStyle = gradient
      ctx.fillRect(
        finalX - galaxy.size * pulse * 2,
        finalY - galaxy.size * pulse * 2,
        galaxy.size * pulse * 4,
        galaxy.size * pulse * 4
      )
    }

    // Draw twinkling stars
    const drawStars = (time: number) => {
      starsRef.current.forEach((star) => {
        const twinkle = Math.sin(time * 2 + Math.random()) * 0.5 + 0.5
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity * twinkle})`
        ctx.fillRect(star.x, star.y, 1, 1)
      })
    }

    // Main animation loop
    const animate = () => {
      const canvasWidth = canvas.width / (window.devicePixelRatio || 1)
      const canvasHeight = canvas.height / (window.devicePixelRatio || 1)

      // Clear with dark background
      ctx.fillStyle = '#0a0a14'
      ctx.fillRect(0, 0, canvasWidth, canvasHeight)

      // Set additive blending for galaxy glow
      ctx.globalCompositeOperation = 'lighter'

      // Draw galaxies
      galaxiesRef.current.forEach((galaxy) => {
        drawGalaxy(galaxy, timeRef.current, canvasWidth, canvasHeight)
      })

      // Draw stars
      ctx.globalCompositeOperation = 'source-over'
      drawStars(timeRef.current)

      timeRef.current += 0.016 // ~60fps

      if (document.hidden) {
        // Pause animation when tab is hidden
        animationFrameRef.current = requestAnimationFrame(animate)
      } else {
        animationFrameRef.current = requestAnimationFrame(animate)
      }
    }

    // Handle window resize
    const handleResize = () => {
      setCanvasSize()
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('resize', handleResize)

    // Respect prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches

    if (!prefersReducedMotion) {
      animate()
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('resize', handleResize)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full -z-10"
      style={{ filter: 'blur(36px)' }}
    />
  )
}

export default GalaxyCanvas
