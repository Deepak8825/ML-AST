'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

const Navigation: React.FC = () => {
  const [scrolled, setScrolled] = useState(false)
  const [activeSection, setActiveSection] = useState('home')

  const navItems = [
    { label: 'Home', href: '#home' },
    { label: 'Explore Data', href: '#explore' },
    { label: 'Visual Analytics', href: '#analytics' },
    { label: 'ML Models', href: '#models' },
    { label: 'Live Prediction', href: '#prediction' },
  ]

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)

      // Detect active section
      const sections = navItems.map(item => item.href.replace('#', ''))
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i])
        if (el && el.getBoundingClientRect().top <= 150) {
          setActiveSection(sections[i])
          break
        }
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled
        ? 'bg-background/60 backdrop-blur-2xl border-b border-white/[0.06] shadow-lg shadow-black/20'
        : 'bg-transparent border-b border-transparent'
        }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <span className="text-white font-bold text-sm tracking-wide">K</span>
          </div>
          <span className="font-medium text-lg text-foreground tracking-tight">
            PSG Tech Observatory
          </span>
        </div>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const id = item.href.replace('#', '')
            const isActive = activeSection === id
            return (
              <a
                key={item.label}
                href={item.href}
                className={`relative px-4 py-2 text-sm rounded-lg transition-all duration-300 ${isActive
                  ? 'text-cyan-400'
                  : 'text-foreground/60 hover:text-foreground/90'
                  }`}
              >
                {item.label}
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute bottom-0 left-2 right-2 h-[2px] bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </a>
            )
          })}
        </div>

        {/* CTA */}
        <motion.a
          href="#explore"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-400/30 text-cyan-400 text-sm font-medium hover:border-cyan-400/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-300"
        >
          Explore Now
        </motion.a>
      </div>
    </motion.nav>
  )
}

export default Navigation
