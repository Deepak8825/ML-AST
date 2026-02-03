import React from 'react'

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border py-8 px-6 relative z-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-foreground/60 font-light text-sm">
            © {currentYear} Kepler Observatory. All rights reserved.
          </div>
          <div className="text-foreground/60 font-light text-sm">
            Built with Next.js, React, and advanced ML techniques
          </div>
          <div className="text-foreground/60 font-light text-sm">
            Data sourced from NASA Kepler Mission
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
