import React from 'react'

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="relative z-10 border-t border-white/[0.06] py-10 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-foreground/40 text-sm tracking-wide">
            © {currentYear} Kepler Observatory. All rights reserved.
          </div>
          <div className="text-foreground/40 text-sm">
            Built with Next.js, React, and advanced ML techniques
          </div>
          <div className="text-foreground/40 text-sm">
            Data sourced from NASA Kepler Mission
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
