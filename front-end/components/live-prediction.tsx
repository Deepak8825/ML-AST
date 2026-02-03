'use client'

import React, { useState } from 'react'
// @ts-ignore - lucide-react TypeScript module resolution issue
import { Zap, AlertTriangle, CheckCircle2, HelpCircle, Loader2, Info, Telescope } from 'lucide-react'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/** Stage 1 result from the ML pipeline - Signal Quality Screening */
interface Stage1Result {
  result: 'PASS' | 'FAIL'
  signal_quality: string
  confidence: number
  explanation: string
}

/** Stage 2 result from the ML pipeline - Physical Classification */
interface Stage2Result {
  result: 'EXOPLANET' | 'UNCERTAIN' | 'FALSE_POSITIVE'
  label: string
  confidence: number
  explanation: string
}

/** Complete prediction response from the backend */
interface PredictionResponse {
  stage_1: Stage1Result
  stage_2: Stage2Result | null
  prediction: string
  label: string
  confidence: number
}

/** Feature input configuration for the form */
interface FeatureConfig {
  key: string
  label: string
  description: string
  min: number
  max: number
  step: number
  defaultValue: number
  unit?: string
}

// ============================================================================
// FEATURE CONFIGURATION
// ============================================================================
// These are the key features from the NASA Kepler dataset that our
// Random Forest model uses for classification.

const PHYSICAL_FEATURES: FeatureConfig[] = [
  {
    key: 'koi_period',
    label: 'Orbital Period',
    description: 'Time for one complete orbit around the star',
    min: 0.5,
    max: 500,
    step: 0.5,
    defaultValue: 10,
    unit: 'days'
  },
  {
    key: 'koi_prad',
    label: 'Planet Radius',
    description: 'Size of the planet relative to Earth',
    min: 0.1,
    max: 25,
    step: 0.1,
    defaultValue: 2.0,
    unit: 'Earth radii'
  },
  {
    key: 'koi_depth',
    label: 'Transit Depth',
    description: 'Brightness drop when planet crosses star',
    min: 1,
    max: 10000,
    step: 10,
    defaultValue: 100,
    unit: 'ppm'
  },
  {
    key: 'koi_duration',
    label: 'Transit Duration',
    description: 'How long the transit event lasts',
    min: 0.5,
    max: 20,
    step: 0.1,
    defaultValue: 3.0,
    unit: 'hours'
  },
  {
    key: 'koi_model_snr',
    label: 'Signal-to-Noise Ratio',
    description: 'Quality of the detection signal',
    min: 5,
    max: 500,
    step: 5,
    defaultValue: 15,
    unit: ''
  },
  {
    key: 'koi_impact',
    label: 'Impact Parameter',
    description: 'How centrally the planet crosses the star (0=center, 1=edge)',
    min: 0,
    max: 1.5,
    step: 0.01,
    defaultValue: 0.5,
    unit: ''
  },
  {
    key: 'koi_steff',
    label: 'Stellar Temperature',
    description: 'Surface temperature of the host star',
    min: 3000,
    max: 10000,
    step: 100,
    defaultValue: 5500,
    unit: 'K'
  },
  {
    key: 'koi_srad',
    label: 'Stellar Radius',
    description: 'Size of the host star relative to Sun',
    min: 0.1,
    max: 10,
    step: 0.1,
    defaultValue: 1.0,
    unit: 'Solar radii'
  }
]

const FPFLAG_FEATURES: FeatureConfig[] = [
  {
    key: 'koi_fpflag_ss',
    label: 'Stellar Eclipse Flag',
    description: 'Signal resembles stellar eclipse rather than planet transit',
    min: 0,
    max: 1,
    step: 1,
    defaultValue: 0
  },
  {
    key: 'koi_fpflag_nt',
    label: 'Not Transit-Like Flag',
    description: 'Signal shape does not match expected transit profile',
    min: 0,
    max: 1,
    step: 1,
    defaultValue: 0
  },
  {
    key: 'koi_fpflag_co',
    label: 'Centroid Offset Flag',
    description: 'Light source location shifts during transit (possible background star)',
    min: 0,
    max: 1,
    step: 1,
    defaultValue: 0
  },
  {
    key: 'koi_fpflag_ec',
    label: 'Ephemeris Match Flag',
    description: 'Signal timing matches known eclipsing binary',
    min: 0,
    max: 1,
    step: 1,
    defaultValue: 0
  }
]

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const LivePrediction: React.FC = () => {
  // Form state - stores user input values
  const [features, setFeatures] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {}
    PHYSICAL_FEATURES.forEach(f => { initial[f.key] = f.defaultValue })
    FPFLAG_FEATURES.forEach(f => { initial[f.key] = f.defaultValue })
    return initial
  })

  // UI state
  const [isLoading, setIsLoading] = useState(false)
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [explanationText, setExplanationText] = useState<string | null>(null)
  const [selectedVoice, setSelectedVoice] = useState<'einstein' | 'chawla'>('einstein')

  // Update a single feature value with validation
  const updateFeature = (key: string, value: number) => {
    setFeatures(prev => ({ ...prev, [key]: value }))
  }

  // Handle text input changes with validation and clamping
  const handleInputChange = (key: string, inputValue: string, min: number, max: number) => {
    // Allow empty string for editing
    if (inputValue === '') {
      return
    }
    
    // Parse and validate numeric input
    const numValue = parseFloat(inputValue)
    if (isNaN(numValue)) {
      return // Ignore non-numeric input
    }
    
    // Clamp value to valid range
    const clampedValue = Math.min(Math.max(numValue, min), max)
    updateFeature(key, clampedValue)
  }

  // ============================================================================
  // PREDICTION HANDLER - Calls the real ML backend
  // ============================================================================
  const handlePredict = async () => {
    setIsLoading(true)
    setError(null)
    setPrediction(null)

    try {
      // Send features to FastAPI backend for real ML inference
      const response = await fetch('http://127.0.0.1:8000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features })
      })

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`)
      }

      // Parse and store the real ML prediction
      const result: PredictionResponse = await response.json()
      setPrediction(result)

    } catch (err) {
      console.error('Prediction error:', err)
      setError(
        'Failed to connect to ML backend. Ensure the FastAPI server is running on port 8000.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  // Reset form and results
  const handleReset = () => {
    const initial: Record<string, number> = {}
    PHYSICAL_FEATURES.forEach(f => { initial[f.key] = f.defaultValue })
    FPFLAG_FEATURES.forEach(f => { initial[f.key] = f.defaultValue })
    setFeatures(initial)
    setPrediction(null)
    setError(null)
    setExplanationText(null)
    
    // Stop any ongoing speech
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }

  // ============================================================================
  // VOICE EXPLANATION HANDLER - Uses Web Speech API
  // ============================================================================
  const handleExplainWithVoice = async () => {
    if (!prediction) return

    try {
      setIsSpeaking(true)

      // Fetch explanation from backend
      const response = await fetch('http://127.0.0.1:8000/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          features,
          prediction_result: prediction
        })
      })

      if (!response.ok) {
        throw new Error('Failed to fetch explanation')
      }

      const data = await response.json()
      const explanationText = data.explanation
      setExplanationText(explanationText)

      // Use Web Speech API to speak the explanation
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel()

        // Create speech utterance
        const utterance = new SpeechSynthesisUtterance(explanationText)
        
        // Configure voice settings based on selected personality
        if (selectedVoice === 'einstein') {
          // Einstein - Male voice, deeper pitch, thoughtful pace
          utterance.rate = 0.85 // Slower, more contemplative
          utterance.pitch = 0.8 // Deeper tone
          utterance.volume = 1.0
        } else {
          // Kalpana Chawla - Female voice, clear and inspiring
          utterance.rate = 0.9 // Clear, confident pace
          utterance.pitch = 1.2 // Higher pitch for female voice
          utterance.volume = 1.0
        }

        // Try to select appropriate system voice
        const voices = window.speechSynthesis.getVoices()
        if (voices.length > 0) {
          if (selectedVoice === 'einstein') {
            // Prefer male English voices
            const maleVoice = voices.find(v => 
              v.lang.startsWith('en') && (v.name.includes('Male') || v.name.includes('David') || v.name.includes('George'))
            ) || voices.find(v => v.lang.startsWith('en'))
            if (maleVoice) utterance.voice = maleVoice
          } else {
            // Prefer female English voices
            const femaleVoice = voices.find(v => 
              v.lang.startsWith('en') && (v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Victoria') || v.name.includes('Zira'))
            ) || voices.find(v => v.lang.startsWith('en') && !v.name.includes('Male'))
            if (femaleVoice) utterance.voice = femaleVoice
          }
        }

        // Set up event listeners
        utterance.onend = () => {
          setIsSpeaking(false)
        }

        utterance.onerror = (event) => {
          // Suppress common browser speech synthesis warnings
          // These are typically non-critical (e.g., speech interrupted, cancelled)
          if (event.error !== 'canceled' && event.error !== 'interrupted') {
            console.warn('Speech synthesis encountered an issue:', event.error)
          }
          setIsSpeaking(false)
        }

        // Speak the explanation
        window.speechSynthesis.speak(utterance)
      } else {
        // Fallback if Web Speech API not supported
        alert('Voice synthesis not supported in this browser. Explanation text:\n\n' + explanationText)
        setIsSpeaking(false)
      }

    } catch (err) {
      console.error('Explanation error:', err)
      setIsSpeaking(false)
      setError('Failed to generate explanation')
    }
  }

  // Stop speech if component unmounts
  React.useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <section id="prediction" className="py-20 px-6 relative z-10 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-full mb-4">
            <Telescope className="w-4 h-4 text-accent" />
            <span className="text-sm text-accent font-medium">Real-Time ML Inference</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-light text-foreground mb-4">
            Live Exoplanet Prediction
          </h2>
          <p className="text-lg text-foreground/60 font-light max-w-2xl mx-auto">
            Input Kepler observation parameters and classify potential exoplanets 
            using our trained Random Forest model. All predictions are performed 
            in real-time by the ML backend.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* ================================================================ */}
          {/* INPUT PANEL - Left side (3 columns) */}
          {/* ================================================================ */}
          <div className="lg:col-span-3 space-y-6">
            {/* Physical Features Card */}
            <div className="bg-card rounded-2xl border border-border p-6 backdrop-blur-md">
              <h3 className="text-lg font-medium text-foreground mb-6 flex items-center gap-2">
                <span className="w-6 h-6 bg-accent/20 rounded-full flex items-center justify-center text-xs text-accent">1</span>
                Physical Parameters
              </h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                {PHYSICAL_FEATURES.map((feature) => (
                  <div key={feature.key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-foreground/80">
                        {feature.label}
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={feature.min}
                          max={feature.max}
                          step={feature.step}
                          value={features[feature.key]}
                          onChange={(e) => handleInputChange(feature.key, e.target.value, feature.min, feature.max)}
                          onBlur={(e) => {
                            // Ensure value is within bounds on blur
                            const val = parseFloat(e.target.value)
                            if (!isNaN(val)) {
                              const clamped = Math.min(Math.max(val, feature.min), feature.max)
                              updateFeature(feature.key, clamped)
                            }
                          }}
                          className="w-20 px-2 py-1 text-sm font-mono text-accent bg-input border border-border 
                                     rounded-md focus:outline-none focus:ring-2 focus:ring-accent/50 text-right"
                        />
                        {feature.unit && (
                          <span className="text-xs text-foreground/50 min-w-15">{feature.unit}</span>
                        )}
                      </div>
                    </div>
                    {/* Slider - synchronized with text input via shared state */}
                    <input
                      type="range"
                      min={feature.min}
                      max={feature.max}
                      step={feature.step}
                      value={features[feature.key]}
                      onChange={(e) => updateFeature(feature.key, parseFloat(e.target.value))}
                      className="w-full h-2 bg-input rounded-full appearance-none 
                                 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 
                                 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full 
                                 [&::-webkit-slider-thumb]:bg-accent
                                 [&::-webkit-slider-thumb]:shadow-md hover:[&::-webkit-slider-thumb]:bg-accent/90"
                    />
                    <p className="text-xs text-foreground/50">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Signal Quality Flags Card */}
            <div className="bg-card rounded-2xl border border-border p-6 backdrop-blur-md">
              <h3 className="text-lg font-medium text-foreground mb-6 flex items-center gap-2">
                <span className="w-6 h-6 bg-accent/20 rounded-full flex items-center justify-center text-xs text-accent">2</span>
                Signal Quality Flags
                <span className="text-xs text-foreground/50 font-normal ml-2">
                  (Used in Stage 1 screening)
                </span>
              </h3>

              <div className="grid md:grid-cols-2 gap-4">
                {FPFLAG_FEATURES.map((feature) => (
                  <div 
                    key={feature.key} 
                    className={`p-4 rounded-xl border transition-all ${
                      features[feature.key] === 1 
                        ? 'bg-destructive/10 border-destructive/30' 
                        : 'bg-input/30 border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">
                        {feature.label}
                      </span>
                      <button
                        onClick={() => updateFeature(feature.key, features[feature.key] === 0 ? 1 : 0)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                          features[feature.key] === 1
                            ? 'bg-destructive text-destructive-foreground'
                            : 'bg-accent/20 text-accent'
                        }`}
                      >
                        {features[feature.key] === 0 ? 'Clean' : 'Flagged'}
                      </button>
                    </div>
                    <p className="text-xs text-foreground/50">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handlePredict}
                disabled={isLoading}
                className="flex-1 py-4 rounded-xl font-medium transition-all duration-300 
                           flex items-center justify-center gap-2 bg-accent text-accent-foreground
                           hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Running ML Inference...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Run Prediction
                  </>
                )}
              </button>
              <button
                onClick={handleReset}
                disabled={isLoading}
                className="px-6 py-4 rounded-xl font-medium transition-all duration-300 
                           border border-border hover:bg-input disabled:opacity-50"
              >
                Reset
              </button>
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive">Connection Error</p>
                  <p className="text-sm text-destructive/80 mt-1">{error}</p>
                </div>
              </div>
            )}
          </div>

          {/* ================================================================ */}
          {/* RESULTS PANEL - Right side (2 columns) */}
          {/* ================================================================ */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-2xl border border-border p-6 backdrop-blur-md sticky top-24">
              <h3 className="text-lg font-medium text-foreground mb-6 flex items-center gap-2">
                <Zap className="w-5 h-5 text-accent" />
                ML Classification Result
              </h3>

              {prediction ? (
                <div className="space-y-6">
                  {/* Stage 1 Result */}
                  <div className={`p-4 rounded-xl border ${
                    prediction.stage_1.result === 'PASS' 
                      ? 'bg-accent/5 border-accent/20' 
                      : 'bg-destructive/5 border-destructive/20'
                  }`}>
                    <div className="flex items-center gap-2 mb-3">
                      {prediction.stage_1.result === 'PASS' ? (
                        <CheckCircle2 className="w-5 h-5 text-accent" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-destructive" />
                      )}
                      <span className="font-medium text-foreground">
                        Stage 1: Signal Screening
                      </span>
                      <span className={`ml-auto text-xs px-2 py-1 rounded-full ${
                        prediction.stage_1.result === 'PASS'
                          ? 'bg-accent/20 text-accent'
                          : 'bg-destructive/20 text-destructive'
                      }`}>
                        {prediction.stage_1.result}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-foreground/60">Signal Quality:</span>
                        <span className="text-foreground">{prediction.stage_1.signal_quality}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-foreground/60">Confidence:</span>
                        <span className="font-mono text-foreground">
                          {(prediction.stage_1.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                      {/* Confidence Bar */}
                      <div className="w-full bg-input rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            prediction.stage_1.result === 'PASS' ? 'bg-accent' : 'bg-destructive'
                          }`}
                          style={{ width: `${prediction.stage_1.confidence * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Stage 2 Result (only if Stage 1 passed) */}
                  {prediction.stage_2 ? (
                    <div className={`p-4 rounded-xl border ${
                      prediction.stage_2.result === 'EXOPLANET'
                        ? 'bg-accent/5 border-accent/20'
                        : prediction.stage_2.result === 'UNCERTAIN'
                        ? 'bg-yellow-500/5 border-yellow-500/20'
                        : 'bg-destructive/5 border-destructive/20'
                    }`}>
                      <div className="flex items-center gap-2 mb-3">
                        {prediction.stage_2.result === 'EXOPLANET' ? (
                          <CheckCircle2 className="w-5 h-5 text-accent" />
                        ) : prediction.stage_2.result === 'UNCERTAIN' ? (
                          <HelpCircle className="w-5 h-5 text-yellow-500" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-destructive" />
                        )}
                        <span className="font-medium text-foreground">
                          Stage 2: Physical Analysis
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-foreground/60">Classification:</span>
                          <span className={`font-medium ${
                            prediction.stage_2.result === 'EXOPLANET'
                              ? 'text-accent'
                              : prediction.stage_2.result === 'UNCERTAIN'
                              ? 'text-yellow-500'
                              : 'text-destructive'
                          }`}>
                            {prediction.stage_2.label}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-foreground/60">Exoplanet Probability:</span>
                          <span className="font-mono text-foreground">
                            {(prediction.stage_2.confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                        {/* Confidence Bar */}
                        <div className="w-full bg-input rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${
                              prediction.stage_2.result === 'EXOPLANET'
                                ? 'bg-accent'
                                : prediction.stage_2.result === 'UNCERTAIN'
                                ? 'bg-yellow-500'
                                : 'bg-destructive'
                            }`}
                            style={{ width: `${prediction.stage_2.confidence * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-input/30 border border-border">
                      <div className="flex items-center gap-2 text-foreground/60">
                        <Info className="w-4 h-4" />
                        <span className="text-sm">
                          Stage 2 skipped - poor signal quality detected
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Final Prediction Box */}
                  <div className={`p-6 rounded-xl text-center ${
                    prediction.prediction === 'EXOPLANET'
                      ? 'bg-accent/10 border-2 border-accent/30'
                      : prediction.prediction === 'UNCERTAIN'
                      ? 'bg-yellow-500/10 border-2 border-yellow-500/30'
                      : 'bg-destructive/10 border-2 border-destructive/30'
                  }`}>
                    <p className="text-xs uppercase tracking-wider text-foreground/60 mb-2">
                      Final Classification
                    </p>
                    <p className={`text-2xl font-semibold ${
                      prediction.prediction === 'EXOPLANET'
                        ? 'text-accent'
                        : prediction.prediction === 'UNCERTAIN'
                        ? 'text-yellow-500'
                        : 'text-destructive'
                    }`}>
                      {prediction.label}
                    </p>
                    <p className="text-sm text-foreground/60 mt-2">
                      Confidence: <span className="font-mono">{(prediction.confidence * 100).toFixed(1)}%</span>
                    </p>
                  </div>

                  {/* Voice Selection */}
                  <div className="space-y-3">
                    <p className="text-xs uppercase tracking-wider text-foreground/60 text-center">
                      Choose AI Voice
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setSelectedVoice('einstein')}
                        className={`p-3 rounded-xl border transition-all duration-300 ${
                          selectedVoice === 'einstein'
                            ? 'bg-accent/20 border-accent text-accent'
                            : 'bg-input/30 border-border text-foreground/70 hover:border-accent/50'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <div className="text-center">
                            <p className="text-sm font-medium">Einstein</p>
                            <p className="text-xs opacity-70">Male · Deep</p>
                          </div>
                        </div>
                      </button>
                      <button
                        onClick={() => setSelectedVoice('chawla')}
                        className={`p-3 rounded-xl border transition-all duration-300 ${
                          selectedVoice === 'chawla'
                            ? 'bg-accent/20 border-accent text-accent'
                            : 'bg-input/30 border-border text-foreground/70 hover:border-accent/50'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <div className="text-center">
                            <p className="text-sm font-medium">Kalpana Chawla</p>
                            <p className="text-xs opacity-70">Female · Clear</p>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* AI Voice Explanation Button */}
                  <button
                    onClick={handleExplainWithVoice}
                    disabled={isSpeaking}
                    className={`w-full px-6 py-4 rounded-xl font-medium transition-all duration-300 
                               flex items-center justify-center gap-2 ${
                      isSpeaking
                        ? 'bg-accent/50 text-white cursor-wait'
                        : 'bg-accent hover:bg-accent/90 text-white'
                    }`}
                  >
                    {isSpeaking ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Speaking as {selectedVoice === 'einstein' ? 'Einstein' : 'Kalpana Chawla'}...
                      </>
                    ) : (
                      <>
                        <svg 
                          className="w-5 h-5" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" 
                          />
                        </svg>
                        Explain with AI Voice
                      </>
                    )}
                  </button>

                  {/* Explanation Text Display (if available) */}
                  {explanationText && (
                    <div className="p-4 rounded-xl bg-input/30 border border-border">
                      <p className="text-xs uppercase tracking-wider text-foreground/60 mb-2">
                        AI Explanation
                      </p>
                      <p className="text-sm text-foreground/80 leading-relaxed">
                        {explanationText}
                      </p>
                    </div>
                  )}

                  {/* Model Info */}
                  <div className="p-3 rounded-lg bg-input/30 border border-border">
                    <p className="text-xs text-foreground/50 text-center">
                      Prediction by Random Forest Classifier trained on NASA Kepler data
                    </p>
                  </div>
                </div>
              ) : (
                /* Empty State - Before any prediction */
                <div className="py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-input/50 flex items-center justify-center mx-auto mb-4">
                    <Telescope className="w-8 h-8 text-foreground/30" />
                  </div>
                  <p className="text-foreground/60 font-light mb-2">
                    No prediction yet
                  </p>
                  <p className="text-sm text-foreground/40">
                    Adjust the parameters and click &quot;Run Prediction&quot; to 
                    classify the observation using our trained ML model.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Explanation Section */}
        <div className="mt-12 p-6 bg-card/50 rounded-2xl border border-border backdrop-blur-md">
          <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
            <Info className="w-4 h-4 text-accent" />
            How This Works
          </h4>
          <div className="grid md:grid-cols-2 gap-6 text-sm text-foreground/70">
            <div>
              <p className="font-medium text-foreground mb-1">Stage 1: Signal Screening</p>
              <p>
                Evaluates the false positive flags (fpflags) to determine if the transit 
                signal is likely caused by instrumental artifacts, stellar eclipses, or 
                background stars rather than an actual planet.
              </p>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">Stage 2: Physical Classification</p>
              <p>
                If the signal passes screening, the model analyzes physical parameters 
                (radius, orbital period, stellar properties) to classify whether the 
                candidate is likely a genuine exoplanet.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default LivePrediction
