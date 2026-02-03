'use client'

import React from 'react'
import ImageCarousel from './image-carousel'

const HeroSection: React.FC = () => {
  const carouselImages = [
    {
      id: 1,
      src: '/exoplanet-1.jpg',
      alt: 'Habitable exoplanet in distant system',
    },
    {
      id: 2,
      src: '/exoplanet-2.jpg',
      alt: 'Hot Jupiter in binary star system',
    },
    {
      id: 3,
      src: '/exoplanet-3.jpg',
      alt: 'Super-Earth exoplanet with rings',
    },
    {
      id: 4,
      src: '/exoplanet-4.jpg',
      alt: 'Kepler space telescope observation',
    },
    {
      id: 5,
      src: '/exoplanet-5.jpg',
      alt: 'Terrestrial exoplanet with auroras',
    },
  ]

  return (
    <section
      id="home"
      className="relative min-h-screen pt-32 pb-20 px-6 flex items-center justify-center overflow-hidden"
    >
      <div className="max-w-6xl mx-auto w-full grid lg:grid-cols-2 gap-12 items-center">
        {/* Left Content */}
        <div className="space-y-8 z-10">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-light text-foreground leading-tight text-balance">
              Explore the{' '}
              <span className="bg-linear-to-r from-accent to-primary bg-clip-text text-transparent">
                Cosmos
              </span>
            </h1>
            <p className="text-lg text-foreground/70 font-light leading-relaxed text-balance">
              Discover exoplanets through Kepler data. Interactive visualization
              and machine learning models for astronomical research.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button className="px-8 py-4 rounded-lg bg-linear-to-r from-accent to-primary text-background font-medium hover:shadow-lg hover:shadow-accent/50 transition-all duration-300">
              Begin Exploration
            </button>
            <button className="px-8 py-4 rounded-lg border border-accent/50 text-accent hover:bg-accent/10 transition-all duration-300 font-medium">
              View Documentation
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-6 pt-4">
            <div>
              <p className="text-3xl font-light text-accent">5,000+</p>
              <p className="text-sm text-foreground/60">Exoplanets Catalogued</p>
            </div>
            <div>
              <p className="text-3xl font-light text-accent">99.8%</p>
              <p className="text-sm text-foreground/60">Detection Accuracy</p>
            </div>
          </div>
        </div>

        {/* Right Image Carousel */}
        <div className="relative z-10">
          <div className="hidden lg:block">
            <ImageCarousel images={carouselImages} />
          </div>
          <div className="lg:hidden mt-8">
            <ImageCarousel images={carouselImages} />
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
        <div className="w-6 h-10 border border-accent/50 rounded-full flex items-center justify-center">
          <div className="w-1 h-2 bg-accent rounded-full" />
        </div>
      </div>
    </section>
  )
}

export default HeroSection
