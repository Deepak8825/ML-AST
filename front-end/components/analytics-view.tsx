'use client'

import React, { useState, useEffect } from 'react'
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
  Legend,
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
// MAIN COMPONENT
// ============================================================================

const AnalyticsView: React.FC = () => {
  // State for real analytics data from backend
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch real analytics data from backend on component mount
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/analytics')
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
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
        <div className="bg-input border border-border rounded-lg p-3 text-foreground text-sm">
          <p className="font-light">{payload[0].name}</p>
          <p className="text-accent">{payload[0].value}</p>
        </div>
      )
    }
    return null
  }

  // Loading state
  if (isLoading) {
    return (
      <section id="analytics" className="py-20 px-6 relative z-10 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 space-y-2">
            <h2 className="text-4xl md:text-5xl font-light text-foreground">
              Visual Analytics
            </h2>
            <p className="text-lg text-foreground/60 font-light">
              Loading real data from Kepler dataset...
            </p>
          </div>
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
          </div>
        </div>
      </section>
    )
  }

  // Error state
  if (error || !analyticsData) {
    return (
      <section id="analytics" className="py-20 px-6 relative z-10 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 space-y-2">
            <h2 className="text-4xl md:text-5xl font-light text-foreground">
              Visual Analytics
            </h2>
          </div>
          <div className="p-6 bg-destructive/10 border border-destructive/20 rounded-xl">
            <p className="text-destructive">{error}</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="analytics" className="py-20 px-6 relative z-10 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12 space-y-2">
          <h2 className="text-4xl md:text-5xl font-light text-foreground">
            Visual Analytics
          </h2>
          <p className="text-lg text-foreground/60 font-light">
            Real insights from NASA Kepler dataset ({analyticsData.statistics.confirmed_exoplanets} confirmed exoplanets)
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Discovery Timeline - Real Data */}
          <div className="bg-card rounded-2xl border border-border p-8 backdrop-blur-md">
            <h3 className="text-xl font-light text-foreground mb-6">
              Discovery Timeline
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.discovery_timeline}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.1)"
                />
                <XAxis
                  dataKey="year"
                  stroke="rgba(255,255,255,0.5)"
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.5)"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(200, 100%, 70%)"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(200, 100%, 70%)', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Radius Distribution - Real Data */}
          <div className="bg-card rounded-2xl border border-border p-8 backdrop-blur-md">
            <h3 className="text-xl font-light text-foreground mb-6">
              Radius Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.radius_distribution}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.1)"
                />
                <XAxis
                  dataKey="range"
                  stroke="rgba(255,255,255,0.5)"
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.5)"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="count"
                  fill="hsl(270, 100%, 50%)"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Temperature vs Radius Scatter - Real Data */}
          <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-8 backdrop-blur-md">
            <h3 className="text-xl font-light text-foreground mb-6">
              Stellar Temperature vs Planet Radius
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.1)"
                />
                <XAxis
                  dataKey="temperature"
                  name="Stellar Temperature (K)"
                  stroke="rgba(255,255,255,0.5)"
                  style={{ fontSize: '12px' }}
                  label={{ value: 'Stellar Temperature (K)', position: 'insideBottom', offset: -10, fill: 'rgba(255,255,255,0.5)' }}
                />
                <YAxis
                  dataKey="radius"
                  name="Planet Radius (R⊕)"
                  stroke="rgba(255,255,255,0.5)"
                  style={{ fontSize: '12px' }}
                  label={{ value: 'Planet Radius (R⊕)', angle: -90, position: 'insideLeft', fill: 'rgba(255,255,255,0.5)' }}
                />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-input border border-border rounded-lg p-3 text-foreground text-sm">
                          <p className="font-medium mb-1">{payload[0].payload.name}</p>
                          <p className="text-accent text-xs">
                            Temperature: {payload[0].payload.temperature.toFixed(0)}K
                          </p>
                          <p className="text-accent text-xs">
                            Radius: {payload[0].payload.radius.toFixed(2)} R⊕
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Scatter
                  name="Confirmed Exoplanets"
                  data={analyticsData.temperature_radius_scatter}
                  fill="hsl(200, 100%, 70%)"
                  fillOpacity={0.6}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Statistics Cards - Real Data */}
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <div className="bg-card rounded-2xl border border-border p-6 backdrop-blur-md">
            <p className="text-foreground/60 text-sm font-light mb-2">
              Average Discovery Rate
            </p>
            <p className="text-3xl font-light text-accent">
              {analyticsData.statistics.avg_discovery_rate} / year
            </p>
          </div>
          <div className="bg-card rounded-2xl border border-border p-6 backdrop-blur-md">
            <p className="text-foreground/60 text-sm font-light mb-2">
              Habitable Zone Candidates
            </p>
            <p className="text-3xl font-light text-accent">
              {analyticsData.statistics.habitable_zone_count}
            </p>
          </div>
          <div className="bg-card rounded-2xl border border-border p-6 backdrop-blur-md">
            <p className="text-foreground/60 text-sm font-light mb-2">
              Confirmation Rate
            </p>
            <p className="text-3xl font-light text-accent">
              {analyticsData.statistics.detection_efficiency}%
            </p>
          </div>
        </div>

        {/* Data Source Attribution */}
        <div className="mt-8 p-4 bg-input/30 border border-border rounded-xl text-center">
          <p className="text-xs text-foreground/50">
            All analytics computed from real NASA Kepler mission data • 
            {analyticsData.statistics.total_candidates} total candidates analyzed
          </p>
        </div>
      </div>
    </section>
  )
}

export default AnalyticsView
