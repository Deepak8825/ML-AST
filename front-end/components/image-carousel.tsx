'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface CarouselImage {
  id: number
  alt: string
  src: string
}

const ImageCarousel: React.FC<{ images: CarouselImage[] }> = ({ images }) => {
  const [current, setCurrent] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [isAutoPlay, setIsAutoPlay] = useState(true)

  useEffect(() => {
    if (!isAutoPlay || isHovered) return

    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length)
    }, 1000)

    return () => clearInterval(interval)
  }, [isAutoPlay, isHovered, images.length])

  const prev = () => {
    setCurrent((prev) => (prev - 1 + images.length) % images.length)
    setIsAutoPlay(false)
  }

  const next = () => {
    setCurrent((prev) => (prev + 1) % images.length)
    setIsAutoPlay(false)
  }

  const goToSlide = (index: number) => {
    setCurrent(index)
    setIsAutoPlay(false)
  }

  return (
    <div
      className="relative w-full h-[500px] rounded-2xl overflow-hidden group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Images */}
      <div className="relative w-full h-full">
        {images.map((image, index) => (
          <div
            key={image.id}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              index === current ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Image
              src={image.src || "/placeholder.svg"}
              alt={image.alt}
              fill
              className="object-cover"
              priority={index === current}
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-linear-to-t from-background via-transparent to-transparent" />
          </div>
        ))}
      </div>

      {/* Navigation Buttons */}
      <button
        onClick={prev}
        className={`absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full transition-all duration-300 ${
          isHovered
            ? 'opacity-80 hover:opacity-100'
            : 'opacity-0'
        }`}
        aria-label="Previous image"
      >
        <ChevronLeft className="w-6 h-6 text-accent" />
      </button>

      <button
        onClick={next}
        className={`absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full transition-all duration-300 ${
          isHovered
            ? 'opacity-80 hover:opacity-100'
            : 'opacity-0'
        }`}
        aria-label="Next image"
      >
        <ChevronRight className="w-6 h-6 text-accent" />
      </button>

      {/* Dot indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === current
                ? 'bg-accent w-8'
                : 'bg-foreground/30 w-2 hover:bg-foreground/50'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}

export default ImageCarousel
