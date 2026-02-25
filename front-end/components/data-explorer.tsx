'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { ChevronDown, Search, X, Eye, Loader2 } from 'lucide-react'

interface KeplerCandidate {
  name: string
  status: string
  radius: number | null
  temperature: number | null
  orbital_period: number | null
  stellar_flux: number | null
  habitable_zone: boolean
}

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
}

const SORT_OPTIONS = [
  { value: 'name', label: 'Feature Name' },
  { value: 'temperature', label: 'Temperature' },
  { value: 'radius', label: 'Radius' },
]

const DataExplorer: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterHabitable, setFilterHabitable] = useState(false)
  const [sortBy, setSortBy] = useState('name')
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false)
  const sortDropdownRef = useRef<HTMLDivElement>(null)
  const [radiusRange, setRadiusRange] = useState([0, 50])
  const [temperatureRange, setTemperatureRange] = useState([0, 5000])

  const [exoplanets, setExoplanets] = useState<KeplerCandidate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [offset, setOffset] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const LIMIT = 20

  // Light Curve Modal State
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isImageLoading, setIsImageLoading] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [modalError, setModalError] = useState<string | null>(null)

  const sectionRef = useRef(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' })

  // Open modal and fetch light curve
  const openLightCurveModal = useCallback(async (targetName: string) => {
    const cleanTarget = targetName.replace(/\s+[b-i]$/i, '').trim()

    setSelectedTarget(targetName)
    setIsModalOpen(true)
    setIsImageLoading(true)
    setModalError(null)
    setImageUrl(null)

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/lightcurve?target=${encodeURIComponent(cleanTarget)}`
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        const message = errorData?.error || `Server returned ${response.status}`
        throw new Error(message)
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      setImageUrl(url)
    } catch (err: any) {
      setModalError(err.message || 'Failed to load light curve.')
    } finally {
      setIsImageLoading(false)
    }
  }, [])

  // Close modal and clean up blob URL
  const closeModal = useCallback(() => {
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl)
    }
    setIsModalOpen(false)
    setSelectedTarget(null)
    setImageUrl(null)
    setModalError(null)
  }, [imageUrl])

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) closeModal()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isModalOpen, closeModal])

  // Close sort dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target as Node)) {
        setSortDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fetch real data from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(
          `http://127.0.0.1:8000/kepler-candidates?offset=0&limit=${LIMIT}`
        )
        if (!response.ok) throw new Error('Failed to fetch data')
        const result = await response.json()
        setExoplanets(result.data)
        setTotalCount(result.total_count)
        setOffset(LIMIT)
        setError(null)
      } catch (err) {
        setError('Failed to load Kepler data. Make sure the backend is running.')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  // Load more candidates
  const loadMore = async () => {
    try {
      setIsLoadingMore(true)
      const response = await fetch(
        `http://127.0.0.1:8000/kepler-candidates?offset=${offset}&limit=${LIMIT}`
      )
      if (!response.ok) throw new Error('Failed to fetch more data')
      const result = await response.json()
      setExoplanets((prev) => [...prev, ...result.data])
      setOffset((prev) => prev + LIMIT)
    } catch (err) {
      console.error('Failed to load more data:', err)
    } finally {
      setIsLoadingMore(false)
    }
  }

  const hasMore = exoplanets.length < totalCount

  // Apply filters
  const filteredData = exoplanets
    .filter((planet) => {
      if (searchTerm && !planet.name.toLowerCase().includes(searchTerm.toLowerCase())) return false
      if (filterHabitable && !planet.habitable_zone) return false
      if (planet.radius !== null && (planet.radius < radiusRange[0] || planet.radius > radiusRange[1])) return false
      if (planet.temperature !== null && (planet.temperature < temperatureRange[0] || planet.temperature > temperatureRange[1])) return false
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'temperature': return (a.temperature || 0) - (b.temperature || 0)
        case 'radius': return (a.radius || 0) - (b.radius || 0)
        default: return a.name.localeCompare(b.name)
      }
    })

  return (
    <section id="explore" className="py-24 px-6 relative z-10 min-h-screen section-glow" ref={sectionRef}>
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={fadeIn}
          className="mb-12 space-y-3"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-400/20 bg-cyan-400/5 text-cyan-400 text-xs font-medium tracking-wider uppercase">
            Kepler Mission Data
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
            Data Explorer
          </h2>
          <p className="text-lg text-foreground/50 font-light">
            Explore and filter exoplanet data from the Kepler mission
          </p>
        </motion.div>

        {/* Filters Section */}
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={fadeIn}
          className="glass-panel p-6 mb-8"
        >
          <div className="space-y-6">
            {/* Search */}
            <div>
              <label className="text-sm font-medium text-foreground/70 block mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-foreground/30" />
                <input
                  type="text"
                  placeholder="Search by planet or star name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/3 border border-white/8 rounded-xl text-foreground placeholder-foreground/30 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 focus:border-cyan-400/20 transition-all"
                />
              </div>
            </div>

            {/* Grid of filters */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Habitable Zone Toggle */}
              <div>
                <label className="text-sm font-medium text-foreground/70 block mb-2">Habitable Zone</label>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setFilterHabitable(!filterHabitable)}
                  className={`w-full py-2.5 rounded-xl border transition-all duration-300 ${filterHabitable
                    ? 'bg-cyan-400/10 border-cyan-400/30 text-cyan-400 shadow-lg shadow-cyan-400/5'
                    : 'border-white/8 text-foreground/50 hover:border-white/20'
                    }`}
                >
                  {filterHabitable ? 'Only Habitable' : 'All Zones'}
                </motion.button>
              </div>

              {/* Sort By — Custom Dropdown */}
              <div ref={sortDropdownRef}>
                <label className="text-sm font-medium text-foreground/70 block mb-2">Sort By</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                    className={`w-full py-3 px-4 rounded-xl border text-left text-sm font-medium transition-all duration-300 flex items-center justify-between
                      bg-slate-900/80 backdrop-blur-sm
                      ${sortDropdownOpen
                        ? 'border-cyan-400/40 ring-2 ring-cyan-400/20 shadow-lg shadow-cyan-500/10 text-cyan-300'
                        : 'border-white/10 text-white hover:border-cyan-400/25 hover:shadow-md hover:shadow-cyan-500/5'
                      }`}
                  >
                    {SORT_OPTIONS.find(o => o.value === sortBy)?.label}
                    <motion.div
                      animate={{ rotate: sortDropdownOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-4 h-4 text-cyan-400/60" />
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {sortDropdownOpen && (
                      <motion.ul
                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 4, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.97 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        className="absolute z-50 mt-1 w-full rounded-xl border border-cyan-400/15 bg-slate-900/95 backdrop-blur-xl shadow-2xl shadow-black/40 overflow-hidden"
                      >
                        {SORT_OPTIONS.map((option) => (
                          <li key={option.value}>
                            <button
                              type="button"
                              onClick={() => {
                                setSortBy(option.value)
                                setSortDropdownOpen(false)
                              }}
                              className={`w-full text-left px-4 py-3 text-sm font-medium transition-all duration-200
                                ${sortBy === option.value
                                  ? 'text-cyan-300 bg-cyan-400/10'
                                  : 'text-foreground/50 hover:text-white hover:bg-white/5'
                                }`}
                            >
                              {option.label}
                            </button>
                          </li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Radius Range — Dual Control */}
              <div className="group">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-foreground/70 flex items-center gap-1.5" title="Planet radius relative to Earth (R⊕)">
                    Radius (R⊕)
                    <span className="text-foreground/25 text-xs cursor-help" title="Planet radius in Earth radii. Earth = 1.0, Jupiter ≈ 11.2">ⓘ</span>
                  </label>
                  <motion.button
                    whileHover={{ scale: 1.15, rotate: -45 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setRadiusRange([0, 50])}
                    className="text-foreground/25 hover:text-cyan-400 transition-colors"
                    title="Reset radius filter"
                  >
                    <X className="w-3.5 h-3.5" />
                  </motion.button>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={0}
                    max={radiusRange[1]}
                    step={0.1}
                    value={radiusRange[0]}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value)
                      if (!isNaN(v)) setRadiusRange([Math.min(Math.max(v, 0), radiusRange[1]), radiusRange[1]])
                    }}
                    className="w-16 px-2 py-1.5 text-xs font-mono text-cyan-400 bg-slate-900/80 border border-white/10 rounded-lg
                               focus:outline-none focus:ring-2 focus:ring-cyan-400/30 focus:border-cyan-400/25
                               text-center transition-all"
                  />
                  <input
                    type="range"
                    min={0}
                    max={50}
                    step={0.1}
                    value={radiusRange[1]}
                    onChange={(e) => setRadiusRange([radiusRange[0], Math.max(parseFloat(e.target.value), radiusRange[0])])}
                    className="flex-1"
                  />
                  <input
                    type="number"
                    min={radiusRange[0]}
                    max={50}
                    step={0.1}
                    value={radiusRange[1]}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value)
                      if (!isNaN(v)) setRadiusRange([radiusRange[0], Math.max(Math.min(v, 50), radiusRange[0])])
                    }}
                    className="w-16 px-2 py-1.5 text-xs font-mono text-cyan-400 bg-slate-900/80 border border-white/10 rounded-lg
                               focus:outline-none focus:ring-2 focus:ring-cyan-400/30 focus:border-cyan-400/25
                               text-center transition-all"
                  />
                </div>
                <p className="text-xs text-foreground/30 mt-2 font-mono tracking-wide text-center">
                  Selected: {radiusRange[0].toFixed(1)} – {radiusRange[1].toFixed(1)} R⊕
                </p>
              </div>

              {/* Temperature Range — Dual Control */}
              <div className="group">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-foreground/70 flex items-center gap-1.5" title="Stellar effective temperature in Kelvin">
                    Temp (K)
                    <span className="text-foreground/25 text-xs cursor-help" title="Stellar effective temperature. Sun ≈ 5778 K">ⓘ</span>
                  </label>
                  <motion.button
                    whileHover={{ scale: 1.15, rotate: -45 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setTemperatureRange([0, 5000])}
                    className="text-foreground/25 hover:text-cyan-400 transition-colors"
                    title="Reset temperature filter"
                  >
                    <X className="w-3.5 h-3.5" />
                  </motion.button>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={0}
                    max={temperatureRange[1]}
                    step={50}
                    value={temperatureRange[0]}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value)
                      if (!isNaN(v)) setTemperatureRange([Math.min(Math.max(v, 0), temperatureRange[1]), temperatureRange[1]])
                    }}
                    className="w-16 px-2 py-1.5 text-xs font-mono text-cyan-400 bg-slate-900/80 border border-white/10 rounded-lg
                               focus:outline-none focus:ring-2 focus:ring-cyan-400/30 focus:border-cyan-400/25
                               text-center transition-all"
                  />
                  <input
                    type="range"
                    min={0}
                    max={5000}
                    step={50}
                    value={temperatureRange[1]}
                    onChange={(e) => setTemperatureRange([temperatureRange[0], Math.max(parseFloat(e.target.value), temperatureRange[0])])}
                    className="flex-1"
                  />
                  <input
                    type="number"
                    min={temperatureRange[0]}
                    max={5000}
                    step={50}
                    value={temperatureRange[1]}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value)
                      if (!isNaN(v)) setTemperatureRange([temperatureRange[0], Math.max(Math.min(v, 5000), temperatureRange[0])])
                    }}
                    className="w-16 px-2 py-1.5 text-xs font-mono text-cyan-400 bg-slate-900/80 border border-white/10 rounded-lg
                               focus:outline-none focus:ring-2 focus:ring-cyan-400/30 focus:border-cyan-400/25
                               text-center transition-all"
                  />
                </div>
                <p className="text-xs text-foreground/30 mt-2 font-mono tracking-wide text-center">
                  Selected: {temperatureRange[0].toLocaleString()} – {temperatureRange[1].toLocaleString()} K
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Data Table */}
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={fadeIn}
          className="glass-panel overflow-hidden"
        >
          {isLoading ? (
            <div className="p-12 text-center text-foreground/50 flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
              <span>Loading Kepler data...</span>
            </div>
          ) : error ? (
            <div className="p-12 text-center text-red-400">{error}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/2 border-b border-white/6">
                  <tr>
                    {['Planet / Candidate', 'Status', 'Radius (R⊕)', 'Temperature (K)', 'Orbital Period (days)', 'Stellar Flux', 'Habitable Zone', 'Signal'].map(h => (
                      <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-foreground/50 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((planet, index) => (
                    <motion.tr
                      key={index}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.02, duration: 0.3 }}
                      className="border-b border-white/4 hover:bg-white/2 transition-colors duration-200"
                    >
                      <td className="px-6 py-4 text-foreground font-medium text-sm">{planet.name}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-medium ${planet.status === 'CONFIRMED'
                          ? 'bg-cyan-400/10 text-cyan-400 border border-cyan-400/20'
                          : planet.status === 'CANDIDATE'
                            ? 'bg-blue-400/10 text-blue-400 border border-blue-400/20'
                            : 'bg-white/5 text-foreground/50 border border-white/10'
                          }`}>
                          {planet.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-foreground/60 text-sm font-mono">
                        {planet.radius !== null ? planet.radius.toFixed(2) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-foreground/60 text-sm font-mono">
                        {planet.temperature !== null ? planet.temperature.toLocaleString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-foreground/60 text-sm font-mono">
                        {planet.orbital_period !== null ? planet.orbital_period.toFixed(2) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-foreground/60 text-sm font-mono">
                        {planet.stellar_flux !== null ? planet.stellar_flux.toFixed(2) : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${planet.habitable_zone
                          ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20'
                          : 'bg-white/5 text-foreground/40 border border-white/10'
                          }`}>
                          {planet.habitable_zone ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <motion.button
                          whileHover={{ scale: 1.08 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => openLightCurveModal(planet.name)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-cyan-400/10 text-cyan-400 border border-cyan-400/20 hover:bg-cyan-400/15 hover:border-cyan-400/40 hover:shadow-lg hover:shadow-cyan-400/10 transition-all duration-200"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Signal
                        </motion.button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Results summary */}
        {!isLoading && !error && (
          <div className="mt-6 text-center space-y-4">
            <div className="text-foreground/40 text-sm">
              Showing {exoplanets.length} of {totalCount.toLocaleString()} candidates
            </div>
            {hasMore && (
              <motion.button
                whileHover={{ scale: 1.04, boxShadow: '0 0 20px rgba(103, 232, 249, 0.15)' }}
                whileTap={{ scale: 0.97 }}
                onClick={loadMore}
                disabled={isLoadingMore}
                className={`px-8 py-3 rounded-xl font-medium transition-all duration-300 ${isLoadingMore
                  ? 'bg-cyan-400/30 text-white/50 cursor-not-allowed'
                  : 'bg-linear-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-400/30 text-cyan-400 hover:border-cyan-400/50'
                  }`}
              >
                {isLoadingMore ? 'Loading...' : 'Show More'}
              </motion.button>
            )}
          </div>
        )}
      </div>

      {/* ========================= LIGHT CURVE MODAL ========================= */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={closeModal}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="relative z-10 w-full max-w-3xl glass-panel-strong overflow-hidden border border-cyan-400/10 shadow-2xl shadow-cyan-500/5"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground tracking-tight">
                    Light Curve — {selectedTarget}
                  </h3>
                  <p className="text-xs text-foreground/40 mt-0.5">
                    Kepler mission transit signal data
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={closeModal}
                  className="p-2 rounded-lg text-foreground/50 hover:text-foreground hover:bg-white/5 transition-colors"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Body */}
              <div className="p-6 min-h-[300px] flex items-center justify-center">
                {isImageLoading && (
                  <div className="flex flex-col items-center gap-4 text-foreground/50">
                    <div className="relative">
                      <div className="w-12 h-12 border-2 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin" />
                      <div className="absolute inset-0 w-12 h-12 border-2 border-purple-400/10 border-b-purple-400/40 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
                    </div>
                    <p className="text-sm">Fetching light curve from MAST...</p>
                    <p className="text-xs text-foreground/30">This may take 10–30 seconds for first-time targets</p>
                  </div>
                )}

                {modalError && (
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                      <X className="w-7 h-7 text-red-400" />
                    </div>
                    <p className="text-sm text-red-400 max-w-md">{modalError}</p>
                    <motion.button
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => selectedTarget && openLightCurveModal(selectedTarget)}
                      className="mt-2 px-5 py-2.5 rounded-xl text-xs font-medium bg-cyan-400/10 text-cyan-400 border border-cyan-400/20 hover:bg-cyan-400/15 transition-colors"
                    >
                      Retry
                    </motion.button>
                  </div>
                )}

                {imageUrl && !isImageLoading && (
                  <motion.img
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    src={imageUrl}
                    alt={`Light curve for ${selectedTarget}`}
                    className="w-full h-auto rounded-xl"
                  />
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-3 border-t border-white/[0.06] flex items-center justify-between">
                <p className="text-xs text-foreground/30">
                  Source: NASA Kepler Mission via MAST Archive
                </p>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={closeModal}
                  className="px-4 py-1.5 rounded-lg text-xs font-medium text-foreground/50 hover:text-foreground border border-white/10 hover:border-white/20 transition-colors"
                >
                  Close
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

export default DataExplorer
