'use client'

import React, { useEffect } from 'react'

const ScrollObserver: React.FC = () => {
  useEffect(() => {
    const observerOptions: IntersectionObserverInit = {
      threshold: 0.1,
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in-up')
          observer.unobserve(entry.target)
        }
      })
    }, observerOptions)

    // Observe all sections
    document.querySelectorAll('section').forEach((section) => {
      observer.observe(section)
    })

    return () => {
      observer.disconnect()
    }
  }, [])

  return null
}

export default ScrollObserver
