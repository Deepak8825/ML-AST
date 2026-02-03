'use client'

import React, { useState, useEffect } from 'react'
import { ChevronDown, Search } from 'lucide-react'

interface KeplerCandidate {
  name: string
  status: string
  radius: number | null
  temperature: number | null
  orbital_period: number | null
  stellar_flux: number | null
  habitable_zone: boolean
}

const DataExplorer: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterHabitable, setFilterHabitable] = useState(false)
  const [sortBy, setSortBy] = useState('name')
  const [radiusRange, setRadiusRange] = useState([0, 50])
  const [temperatureRange, setTemperatureRange] = useState([0, 5000])
  
  const [exoplanets, setExoplanets] = useState<KeplerCandidate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [offset, setOffset] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const LIMIT = 20

  // Fetch real data from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(
          `http://127.0.0.1:8000/kepler-candidates?offset=0&limit=${LIMIT}`
        )
        if (!response.ok) {
          throw new Error('Failed to fetch data')
        }
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
      if (!response.ok) {
        throw new Error('Failed to fetch more data')
      }
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
      if (
        searchTerm &&
        !planet.name.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false
      }
      if (filterHabitable && !planet.habitable_zone) {
        return false
      }
      if (
        planet.radius !== null &&
        (planet.radius < radiusRange[0] || planet.radius > radiusRange[1])
      ) {
        return false
      }
      if (
        planet.temperature !== null &&
        (planet.temperature < temperatureRange[0] ||
          planet.temperature > temperatureRange[1])
      ) {
        return false
      }
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'temperature':
          return (a.temperature || 0) - (b.temperature || 0)
        case 'radius':
          return (a.radius || 0) - (b.radius || 0)
        default:
          return a.name.localeCompare(b.name)
      }
    })

  return (
    <section
      id="explore"
      className="py-20 px-6 relative z-10 min-h-screen"
    >
      <div className="max-w-7xl mx-auto">
        <div className="mb-12 space-y-2">
          <h2 className="text-4xl md:text-5xl font-light text-foreground">
            Data Explorer
          </h2>
          <p className="text-lg text-foreground/60 font-light">
            Explore and filter exoplanet data from the Kepler mission
          </p>
          <p className="text-sm text-foreground/50 font-light italic">
            Data sourced from Kepler cumulative exoplanet dataset.
          </p>
        </div>

        {/* Filters Section */}
        <div className="bg-card rounded-2xl border border-border p-6 mb-8 backdrop-blur-md">
          <div className="space-y-6">
            {/* Search */}
            <div>
              <label className="text-sm font-light text-foreground/80 block mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-foreground/40" />
                <input
                  type="text"
                  placeholder="Search by planet or star name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-lg text-foreground placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent transition-colors"
                />
              </div>
            </div>

            {/* Grid of filters */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Habitable Zone Toggle */}
              <div>
                <label className="text-sm font-light text-foreground/80 block mb-2">
                  Habitable Zone
                </label>
                <button
                  onClick={() => setFilterHabitable(!filterHabitable)}
                  className={`w-full py-2 rounded-lg border transition-all ${
                    filterHabitable
                      ? 'bg-accent/20 border-accent text-accent'
                      : 'border-border text-foreground/60 hover:border-accent/50'
                  }`}
                >
                  {filterHabitable ? 'Only Habitable' : 'All Zones'}
                </button>
              </div>

              {/* Sort By */}
              <div>
                <label className="text-sm font-light text-foreground/80 block mb-2">
                  Sort By
                </label>
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full py-2 px-3 bg-input border border-border rounded-lg text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="name">Name</option>
                    <option value="temperature">Temperature</option>
                    <option value="radius">Radius</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-foreground/40 pointer-events-none" />
                </div>
              </div>

              {/* Radius Range */}
              <div>
                <label className="text-sm font-light text-foreground/80 block mb-2">
                  Radius: {radiusRange[0].toFixed(1)} - {radiusRange[1].toFixed(1)} R⊕
                </label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={radiusRange[1]}
                  onChange={(e) =>
                    setRadiusRange([radiusRange[0], parseFloat(e.target.value)])
                  }
                  className="w-full"
                />
              </div>

              {/* Temperature Range */}
              <div>
                <label className="text-sm font-light text-foreground/80 block mb-2">
                  Temp: {temperatureRange[0]} - {temperatureRange[1]} K
                </label>
                <input
                  type="range"
                  min="0"
                  max="5000"
                  value={temperatureRange[1]}
                  onChange={(e) =>
                    setTemperatureRange([
                      temperatureRange[0],
                      parseFloat(e.target.value),
                    ])
                  }
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden backdrop-blur-md">
          {isLoading ? (
            <div className="p-12 text-center text-foreground/60">
              Loading Kepler data...
            </div>
          ) : error ? (
            <div className="p-12 text-center text-destructive">
              {error}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-input/50 border-b border-border">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-light text-foreground/80">
                      Planet / Candidate
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-light text-foreground/80">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-light text-foreground/80">
                      Radius (R⊕)
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-light text-foreground/80">
                      Temperature (K)
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-light text-foreground/80">
                      Orbital Period (days)
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-light text-foreground/80">
                      Stellar Flux
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-light text-foreground/80">
                      Habitable Zone
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((planet, index) => (
                    <tr
                      key={index}
                      className="border-b border-border hover:bg-input/30 transition-colors"
                    >
                      <td className="px-6 py-4 text-foreground font-light">
                        {planet.name}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-light ${
                            planet.status === 'CONFIRMED'
                              ? 'bg-accent/20 text-accent'
                              : planet.status === 'CANDIDATE'
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-foreground/10 text-foreground/60'
                          }`}
                        >
                          {planet.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-foreground/70 font-light">
                        {planet.radius !== null ? planet.radius.toFixed(2) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-foreground/70 font-light">
                        {planet.temperature !== null
                          ? planet.temperature.toLocaleString()
                          : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-foreground/70 font-light">
                        {planet.orbital_period !== null
                          ? planet.orbital_period.toFixed(2)
                          : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-foreground/70 font-light">
                        {planet.stellar_flux !== null
                          ? planet.stellar_flux.toFixed(2)
                          : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-light ${
                            planet.habitable_zone
                              ? 'bg-accent/20 text-accent'
                              : 'bg-foreground/10 text-foreground/60'
                          }`}
                        >
                          {planet.habitable_zone ? 'Yes' : 'No'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Results summary */}
        {!isLoading && !error && (
          <div className="mt-6 text-center space-y-4">
            <div className="text-foreground/60 font-light">
              Showing {exoplanets.length} of {totalCount.toLocaleString()} candidates
            </div>
            
            {hasMore && (
              <button
                onClick={loadMore}
                disabled={isLoadingMore}
                className={`px-6 py-3 rounded-lg font-light transition-all ${
                  isLoadingMore
                    ? 'bg-accent/50 text-background cursor-not-allowed'
                    : 'bg-accent text-background hover:bg-accent/90 hover:shadow-lg hover:shadow-accent/30'
                }`}
              >
                {isLoadingMore ? 'Loading...' : 'Show More'}
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

export default DataExplorer
