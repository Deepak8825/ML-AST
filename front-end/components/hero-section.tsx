'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import ImageCarousel from './image-carousel'

// Animated counter hook
function useCounter(end: number, duration: number = 2000, startOnMount: boolean = true) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!startOnMount) return
    let start = 0
    const increment = end / (duration / 16)
    const timer = setInterval(() => {
      start += increment
      if (start >= end) {
        setCount(end)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [end, duration, startOnMount])
  return count
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
}

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
}

const HeroSection: React.FC = () => {
  const carouselImages = [
    { id: 1, src: '/exoplanet-1.jpg', alt: 'Habitable exoplanet in distant system' },
    { id: 2, src: '/exoplanet-2.jpg', alt: 'Hot Jupiter in binary star system' },
    { id: 3, src: '/exoplanet-3.jpg', alt: 'Super-Earth exoplanet with rings' },
    { id: 4, src: '/exoplanet-4.jpg', alt: 'Kepler space telescope observation' },
    { id: 5, src: '/exoplanet-5.jpg', alt: 'Terrestrial exoplanet with auroras' },
  ]

  const exoplanetCount = useCounter(9000, 2200)
  const accuracyWhole = useCounter(99, 2000)

  return (
    <section
      id="home"
      className="relative min-h-screen pt-32 pb-20 px-6 flex items-center justify-center overflow-hidden"
    >
      {/* Radial glow behind hero */}
      <div className="hero-glow -top-40 -left-20 opacity-60" />
      <div className="hero-glow top-20 right-0 opacity-40" style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.06) 0%, transparent 70%)' }} />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="max-w-6xl mx-auto w-full grid lg:grid-cols-2 gap-12 items-center"
      >
        {/* Left Content */}
        <div className="space-y-8 z-10">
          <div className="space-y-5">
            {/* Tagline badge */}
            <motion.div variants={item}>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-400/20 bg-cyan-400/5 text-cyan-400 text-xs font-medium tracking-wider uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                AI-Powered Exoplanet Intelligence
              </span>
            </motion.div>

            {/* Heading */}
            <motion.h1
              variants={item}
              className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-[1.1] tracking-tight"
            >
              Explore the{' '}
              <span className="text-gradient-cyan">
                Exo-Pulse
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={item}
              className="text-lg md:text-xl text-foreground/60 font-light leading-relaxed max-w-lg"
            >
              Discover exoplanets through Kepler data. Interactive visualization
              and machine learning models for astronomical research.
            </motion.p>
          </div>

          {/* CTA Button */}
          <motion.div variants={item} className="flex flex-col sm:flex-row gap-4">
            <motion.a
              href="#explore"
              whileHover={{ scale: 1.04, boxShadow: '0 0 30px rgba(103, 232, 249, 0.25)' }}
              whileTap={{ scale: 0.97 }}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-semibold shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-300 text-center"
            >
              Begin Exploration
            </motion.a>
          </motion.div>

          {/* Stats */}
          <motion.div variants={item} className="grid grid-cols-2 gap-8 pt-2">
            <div className="glass-panel p-5">
              <p className="text-3xl md:text-4xl font-bold text-gradient-cyan tabular-nums">
                {exoplanetCount.toLocaleString()}+
              </p>
              <p className="text-sm text-foreground/50 mt-1 tracking-wide">Exoplanets Catalogued</p>
            </div>
            <div className="glass-panel p-5">
              <p className="text-3xl md:text-4xl font-bold text-gradient-cyan tabular-nums">
                {accuracyWhole}.22%
              </p>
              <p className="text-sm text-foreground/50 mt-1 tracking-wide">Detection Accuracy</p>
            </div>
          </motion.div>
        </div>

        {/* Right Image Carousel */}
        <motion.div variants={item} className="relative z-10">
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-3xl blur-2xl" />
            <div className="relative">
              <ImageCarousel images={carouselImages} />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}

export default HeroSection
