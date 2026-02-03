'use client'

import React from 'react'
import Link from 'next/link'

const Navigation: React.FC = () => {
  const navItems = [
    { label: 'Home', href: '#home' },
    { label: 'Explore Data', href: '#explore' },
    { label: 'Visual Analytics', href: '#analytics' },
    { label: 'ML Models', href: '#models' },
    { label: 'Live Prediction', href: '#prediction' },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/40 border-b border-border">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-accent to-primary flex items-center justify-center">
            <span className="text-foreground font-bold text-sm">K</span>
          </div>
          <span className="font-light text-lg text-foreground">PSG Tech Observatory</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-sm text-foreground/70 hover:text-accent transition-colors duration-300 font-light"
            >
              {item.label}
            </a>
          ))}
        </div>

        <button className="px-4 py-2 rounded-lg border border-accent/50 text-accent text-sm font-light hover:bg-accent/10 transition-colors duration-300">
          Explore Now
        </button>
      </div>
    </nav>
  )
}

export default Navigation
