'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface DiscoveryData {
  year: number
  count: number
}

interface RadiusData {
  range: string
  count: number
}

interface ScatterData {
  temperature: number
  radius: number
  name: string
}

interface Statistics {
  total_candidates: number
  confirmed_exoplanets: number
  habitable_zone_count: number
  avg_discovery_rate: number
  detection_efficiency: number
}

interface AnalyticsData {
  discovery_timeline: DiscoveryData[]
  radius_distribution: RadiusData[]
  temperature_radius_scatter: ScatterData[]
  statistics: Statistics
}

// ============================================================================
// ANIMATED COUNTER
// ============================================================================
function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (!isInView) return
    let start = 0
    const increment = value / (1800 / 16)
    const timer = setInterval(() => {
      start += increment
      if (start >= value) {
        setCount(value)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [value, isInView])

  return (
    <span ref={ref} className="tabular-nums">
      {count.toLocaleString()}{suffix}
    </span>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
}

const AnalyticsView: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const sectionRef = useRef(null)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/analytics')
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
        const data: AnalyticsData = await response.json()
        setAnalyticsData(data)
        setIsLoading(false)
      } catch (err) {
        console.error('Analytics fetch error:', err)
        setError('Failed to load analytics data. Ensure the backend is running.')
        setIsLoading(false)
      }
    }
    fetchAnalytics()
  }, [])

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-panel-strong px-4 py-3 text-sm">
          <p className="text-foreground/70 text-xs">{payload[0].name}</p>
          <p className="text-cyan-400 font-semibold">{payload[0].value}</p>
        </div>
      )
    }
    return null
  }

  // Loading state
  if (isLoading) {
    return (
      <section id="analytics" className="py-24 px-6 relative z-10 min-h-screen section-glow">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 space-y-3">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
              Visual Analytics
            </h2>
            <p className="text-lg text-foreground/50">Loading real data from Kepler dataset...</p>
          </div>
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
          </div>
        </div>
      </section>
    )
  }

  // Error state
  if (error || !analyticsData) {
    return (
      <section id="analytics" className="py-24 px-6 relative z-10 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 space-y-3">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
              Visual Analytics
            </h2>
          </div>
          <div className="glass-panel p-6 border-red-500/20">
            <p className="text-red-400">{error}</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="analytics" className="py-24 px-6 relative z-10 min-h-screen section-glow" ref={sectionRef}>
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={fadeIn}
          className="mb-14 space-y-3"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-400/20 bg-purple-400/5 text-purple-400 text-xs font-medium tracking-wider uppercase">
            Real NASA Data
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
            Visual Analytics
          </h2>
          <p className="text-lg text-foreground/50 font-light">
            Real insights from NASA Kepler dataset ({analyticsData.statistics.confirmed_exoplanets} confirmed exoplanets)
          </p>
        </motion.div>

        {/* Charts Grid */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
          className="grid lg:grid-cols-2 gap-6"
        >
          {/* Discovery Timeline */}
          <motion.div variants={fadeIn} className="glass-panel p-8">
            <h3 className="text-lg font-semibold text-foreground mb-6 tracking-tight">
              Discovery Timeline
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.discovery_timeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="year" stroke="rgba(255,255,255,0.3)" style={{ fontSize: '11px' }} />
                <YAxis stroke="rgba(255,255,255,0.3)" style={{ fontSize: '11px' }} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#67e8f9"
                  strokeWidth={2.5}
                  dot={{ fill: '#67e8f9', r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: '#67e8f9', stroke: '#0e7490', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Radius Distribution */}
          <motion.div variants={fadeIn} className="glass-panel p-8">
            <h3 className="text-lg font-semibold text-foreground mb-6 tracking-tight">
              Radius Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.radius_distribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="range" stroke="rgba(255,255,255,0.3)" style={{ fontSize: '11px' }} />
                <YAxis stroke="rgba(255,255,255,0.3)" style={{ fontSize: '11px' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="count"
                  fill="url(#purpleGradient)"
                  radius={[6, 6, 0, 0]}
                />
                <defs>
                  <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Scatter plot */}
          <motion.div variants={fadeIn} className="lg:col-span-2 glass-panel p-8">
            <h3 className="text-lg font-semibold text-foreground mb-6 tracking-tight">
              Stellar Temperature vs Planet Radius
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  dataKey="temperature"
                  name="Stellar Temperature (K)"
                  stroke="rgba(255,255,255,0.3)"
                  style={{ fontSize: '11px' }}
                  label={{ value: 'Stellar Temperature (K)', position: 'insideBottom', offset: -10, fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
                />
                <YAxis
                  dataKey="radius"
                  name="Planet Radius (R⊕)"
                  stroke="rgba(255,255,255,0.3)"
                  style={{ fontSize: '11px' }}
                  label={{ value: 'Planet Radius (R⊕)', angle: -90, position: 'insideLeft', fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.1)' }}
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="glass-panel-strong px-4 py-3 text-sm">
                          <p className="font-medium mb-1 text-foreground">{payload[0].payload.name}</p>
                          <p className="text-cyan-400 text-xs">Temp: {payload[0].payload.temperature.toFixed(0)}K</p>
                          <p className="text-purple-400 text-xs">Radius: {payload[0].payload.radius.toFixed(2)} R⊕</p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Scatter
                  name="Confirmed Exoplanets"
                  data={analyticsData.temperature_radius_scatter}
                  fill="#67e8f9"
                  fillOpacity={0.5}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </motion.div>
        </motion.div>

        {/* Statistics Cards */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={{ visible: { transition: { staggerChildren: 0.1, delayChildren: 0.3 } } }}
          className="grid md:grid-cols-3 gap-5 mt-8"
        >
          <motion.div variants={fadeIn} className="glass-panel p-6 glow-cyan">
            <p className="text-foreground/50 text-sm mb-2 tracking-wide">Average Discovery Rate</p>
            <p className="text-3xl font-bold text-gradient-cyan">
              <AnimatedCounter value={analyticsData.statistics.avg_discovery_rate} /> / year
            </p>
          </motion.div>
          <motion.div variants={fadeIn} className="glass-panel p-6 glow-purple">
            <p className="text-foreground/50 text-sm mb-2 tracking-wide">Habitable Zone Candidates</p>
            <p className="text-3xl font-bold text-gradient-cyan">
              <AnimatedCounter value={analyticsData.statistics.habitable_zone_count} />
            </p>
          </motion.div>
          <motion.div variants={fadeIn} className="glass-panel p-6 glow-cyan">
            <p className="text-foreground/50 text-sm mb-2 tracking-wide">Confirmation Rate</p>
            <p className="text-3xl font-bold text-gradient-cyan">
              <AnimatedCounter value={analyticsData.statistics.detection_efficiency} suffix="%" />
            </p>
          </motion.div>
        </motion.div>

        {/* Data Source */}
        <motion.div
          variants={fadeIn}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mt-8 glass-panel px-6 py-4 text-center"
        >
          <p className="text-xs text-foreground/40">
            All analytics computed from real NASA Kepler mission data •{' '}
            {analyticsData.statistics.total_candidates} total candidates analyzed
          </p>
        </motion.div>
      </div>
    </section>
  )
}

export default AnalyticsView
