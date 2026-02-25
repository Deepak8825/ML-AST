'use client'

import React, { useState, useRef } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
// @ts-ignore - lucide-react TypeScript module resolution issue
import { Zap, AlertTriangle, CheckCircle2, HelpCircle, Loader2, Info, Telescope } from 'lucide-react'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface Stage1Result {
  result: 'EXOPLANET' | 'UNCERTAIN' | 'FALSE_POSITIVE'
  label: string
  confidence: number
  explanation: string
}

interface Stage2Result {
  result: 'PASS' | 'FAIL'
  signal_quality: string
  confidence: number
  explanation: string
}

interface PredictionResponse {
  stage_1: Stage1Result
  stage_2: Stage2Result | null
  prediction: string
  label: string
  confidence: number
}

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

const PHYSICAL_FEATURES: FeatureConfig[] = [
  { key: 'koi_period', label: 'Orbital Period', description: 'Time for one complete orbit around the star', min: 0.5, max: 500, step: 0.5, defaultValue: 10, unit: 'days' },
  { key: 'koi_prad', label: 'Planet Radius', description: 'Size of the planet relative to Earth', min: 0.1, max: 25, step: 0.1, defaultValue: 2.0, unit: 'Earth radii' },
  { key: 'koi_depth', label: 'Transit Depth', description: 'Brightness drop when planet crosses star', min: 1, max: 10000, step: 10, defaultValue: 100, unit: 'ppm' },
  { key: 'koi_duration', label: 'Transit Duration', description: 'How long the transit event lasts', min: 0.5, max: 20, step: 0.1, defaultValue: 3.0, unit: 'hours' },
  { key: 'koi_model_snr', label: 'Signal-to-Noise Ratio', description: 'Quality of the detection signal', min: 5, max: 500, step: 5, defaultValue: 15, unit: '' },
  { key: 'koi_impact', label: 'Impact Parameter', description: 'How centrally the planet crosses the star (0=center, 1=edge)', min: 0, max: 1.5, step: 0.01, defaultValue: 0.5, unit: '' },
  { key: 'koi_steff', label: 'Stellar Temperature', description: 'Surface temperature of the host star', min: 3000, max: 10000, step: 100, defaultValue: 5500, unit: 'K' },
  { key: 'koi_srad', label: 'Stellar Radius', description: 'Size of the host star relative to Sun', min: 0.1, max: 10, step: 0.1, defaultValue: 1.0, unit: 'Solar radii' },
]

const FPFLAG_FEATURES: FeatureConfig[] = [
  { key: 'koi_fpflag_ss', label: 'Stellar Eclipse Flag', description: 'Signal resembles stellar eclipse rather than planet transit', min: 0, max: 1, step: 1, defaultValue: 0 },
  { key: 'koi_fpflag_nt', label: 'Not Transit-Like Flag', description: 'Signal shape does not match expected transit profile', min: 0, max: 1, step: 1, defaultValue: 0 },
  { key: 'koi_fpflag_co', label: 'Centroid Offset Flag', description: 'Light source location shifts during transit (possible background star)', min: 0, max: 1, step: 1, defaultValue: 0 },
  { key: 'koi_fpflag_ec', label: 'Ephemeris Match Flag', description: 'Signal timing matches known eclipsing binary', min: 0, max: 1, step: 1, defaultValue: 0 },
]

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const LivePrediction: React.FC = () => {
  const [features, setFeatures] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {}
    PHYSICAL_FEATURES.forEach(f => { initial[f.key] = f.defaultValue })
    FPFLAG_FEATURES.forEach(f => { initial[f.key] = f.defaultValue })
    return initial
  })

  const [isLoading, setIsLoading] = useState(false)
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [explanationText, setExplanationText] = useState<string | null>(null)
  const [selectedVoice, setSelectedVoice] = useState<'einstein' | 'chawla'>('einstein')

  const sectionRef = useRef(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' })

  const updateFeature = (key: string, value: number) => {
    setFeatures(prev => ({ ...prev, [key]: value }))
  }

  const handleInputChange = (key: string, inputValue: string, min: number, max: number) => {
    if (inputValue === '') return
    const numValue = parseFloat(inputValue)
    if (isNaN(numValue)) return
    const clampedValue = Math.min(Math.max(numValue, min), max)
    updateFeature(key, clampedValue)
  }

  // ============================================================================
  // PREDICTION HANDLER
  // ============================================================================
  const handlePredict = async () => {
    setIsLoading(true)
    setError(null)
    setPrediction(null)

    try {
      const response = await fetch('http://127.0.0.1:8000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features })
      })

      if (!response.ok) throw new Error(`Server error: ${response.status}`)
      const result: PredictionResponse = await response.json()
      setPrediction(result)
    } catch (err) {
      console.error('Prediction error:', err)
      setError('Failed to connect to ML backend. Ensure the FastAPI server is running on port 8000.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    const initial: Record<string, number> = {}
    PHYSICAL_FEATURES.forEach(f => { initial[f.key] = f.defaultValue })
    FPFLAG_FEATURES.forEach(f => { initial[f.key] = f.defaultValue })
    setFeatures(initial)
    setPrediction(null)
    setError(null)
    setExplanationText(null)
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }

  // ============================================================================
  // VOICE EXPLANATION
  // ============================================================================
  const handleExplainWithVoice = async () => {
    if (!prediction) return

    try {
      setIsSpeaking(true)
      const response = await fetch('http://127.0.0.1:8000/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features, prediction_result: prediction })
      })

      if (!response.ok) throw new Error('Failed to fetch explanation')
      const data = await response.json()
      const text = data.explanation
      setExplanationText(text)

      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
        const utterance = new SpeechSynthesisUtterance(text)

        if (selectedVoice === 'einstein') {
          utterance.rate = 0.85; utterance.pitch = 0.8; utterance.volume = 1.0
        } else {
          utterance.rate = 0.9; utterance.pitch = 1.2; utterance.volume = 1.0
        }

        const voices = window.speechSynthesis.getVoices()
        if (voices.length > 0) {
          if (selectedVoice === 'einstein') {
            const maleVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Male') || v.name.includes('David') || v.name.includes('George'))) || voices.find(v => v.lang.startsWith('en'))
            if (maleVoice) utterance.voice = maleVoice
          } else {
            const femaleVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Victoria') || v.name.includes('Zira'))) || voices.find(v => v.lang.startsWith('en') && !v.name.includes('Male'))
            if (femaleVoice) utterance.voice = femaleVoice
          }
        }

        utterance.onend = () => setIsSpeaking(false)
        utterance.onerror = (event) => {
          if (event.error !== 'canceled' && event.error !== 'interrupted') console.warn('Speech issue:', event.error)
          setIsSpeaking(false)
        }
        window.speechSynthesis.speak(utterance)
      } else {
        alert('Voice synthesis not supported.\n\n' + text)
        setIsSpeaking(false)
      }
    } catch (err) {
      console.error('Explanation error:', err)
      setIsSpeaking(false)
      setError('Failed to generate explanation')
    }
  }

  React.useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel()
    }
  }, [])

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <section id="prediction" className="py-24 px-6 relative z-10 min-h-screen section-glow" ref={sectionRef}>
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={fadeIn}
          className="mb-14 text-center"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-400/20 bg-purple-400/5 text-purple-400 text-xs font-medium tracking-wider uppercase mb-4">
            <Telescope className="w-3.5 h-3.5" />
            Real-Time ML Inference
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">
            Live Exoplanet Prediction
          </h2>
          <p className="text-lg text-foreground/50 font-light max-w-2xl mx-auto">
            Input Kepler observation parameters and classify potential exoplanets
            using our trained Random Forest model.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          className="grid lg:grid-cols-5 gap-8"
        >
          {/* ================================================================ */}
          {/* INPUT PANEL */}
          {/* ================================================================ */}
          <motion.div variants={fadeIn} className="lg:col-span-3 space-y-6">
            {/* Physical Features Card */}
            <div className="glass-panel p-6">
              <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2 tracking-tight">
                <span className="w-7 h-7 bg-linear-to-br from-cyan-400/20 to-cyan-400/10 rounded-lg flex items-center justify-center text-xs text-cyan-400 font-bold border border-cyan-400/20">1</span>
                Physical Parameters
              </h3>

              <div className="grid md:grid-cols-2 gap-6">
                {PHYSICAL_FEATURES.map((feature) => (
                  <div key={feature.key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-foreground/70">{feature.label}</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={feature.min}
                          max={feature.max}
                          step={feature.step}
                          value={features[feature.key]}
                          onChange={(e) => handleInputChange(feature.key, e.target.value, feature.min, feature.max)}
                          onBlur={(e) => {
                            const val = parseFloat(e.target.value)
                            if (!isNaN(val)) updateFeature(feature.key, Math.min(Math.max(val, feature.min), feature.max))
                          }}
                          className="w-20 px-2 py-1.5 text-sm font-mono text-cyan-400 bg-white/3 border border-white/8 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400/30 text-right"
                        />
                        {feature.unit && (
                          <span className="text-xs text-foreground/40 min-w-15">{feature.unit}</span>
                        )}
                      </div>
                    </div>
                    <input
                      type="range"
                      min={feature.min}
                      max={feature.max}
                      step={feature.step}
                      value={features[feature.key]}
                      onChange={(e) => updateFeature(feature.key, parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <p className="text-xs text-foreground/40">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Signal Quality Flags Card */}
            <div className="glass-panel p-6">
              <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2 tracking-tight">
                <span className="w-7 h-7 bg-linear-to-br from-purple-400/20 to-purple-400/10 rounded-lg flex items-center justify-center text-xs text-purple-400 font-bold border border-purple-400/20">2</span>
                Signal Quality Flags
                <span className="text-xs text-foreground/40 font-normal ml-2">(Used in Pipeline 2 screening)</span>
              </h3>

              <div className="grid md:grid-cols-2 gap-4">
                {FPFLAG_FEATURES.map((feature) => (
                  <motion.div
                    key={feature.key}
                    whileHover={{ scale: 1.01 }}
                    className={`p-4 rounded-xl border transition-all duration-300 ${features[feature.key] === 1
                      ? 'bg-red-500/5 border-red-400/30 shadow-lg shadow-red-400/5'
                      : 'bg-white/2 border-white/6 hover:border-white/10'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">{feature.label}</span>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => updateFeature(feature.key, features[feature.key] === 0 ? 1 : 0)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${features[feature.key] === 1
                          ? 'bg-red-500/20 text-red-400 border border-red-400/30'
                          : 'bg-cyan-400/10 text-cyan-400 border border-cyan-400/20'
                          }`}
                      >
                        {features[feature.key] === 0 ? 'Clean' : 'Flagged'}
                      </motion.button>
                    </div>
                    <p className="text-xs text-foreground/40">{feature.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(103, 232, 249, 0.2)' }}
                whileTap={{ scale: 0.97 }}
                onClick={handlePredict}
                disabled={isLoading}
                className="flex-1 py-4 rounded-xl font-semibold transition-all duration-300
                           flex items-center justify-center gap-2 bg-linear-to-r from-cyan-500 to-cyan-600
                           text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30
                           disabled:opacity-50 disabled:cursor-not-allowed"
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
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleReset}
                disabled={isLoading}
                className="px-8 py-4 rounded-xl font-medium transition-all duration-300
                           border border-white/10 text-foreground/60 hover:bg-white/3 hover:border-white/20
                           disabled:opacity-50"
              >
                Reset
              </motion.button>
            </div>

            {/* Error Display */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 glass-panel border-red-500/20 flex items-start gap-3"
                >
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-400">Connection Error</p>
                    <p className="text-sm text-red-400/70 mt-1">{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* ================================================================ */}
          {/* RESULTS PANEL */}
          {/* ================================================================ */}
          <motion.div variants={fadeIn} className="lg:col-span-2">
            <div className="glass-panel-strong p-6 sticky top-24">
              <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2 tracking-tight">
                <Zap className="w-5 h-5 text-cyan-400" />
                ML Classification Result
              </h3>

              <AnimatePresence mode="wait">
                {prediction ? (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-5"
                  >
                    {/* Pipeline 1 Result — Physical Feature Analysis */}
                    <div className={`p-4 rounded-xl border ${prediction.stage_1.result === 'EXOPLANET'
                      ? 'bg-cyan-400/5 border-cyan-400/15'
                      : prediction.stage_1.result === 'UNCERTAIN'
                        ? 'bg-yellow-400/5 border-yellow-400/15'
                        : 'bg-red-400/5 border-red-400/15'
                      }`}>
                      <div className="flex items-center gap-2 mb-3">
                        {prediction.stage_1.result === 'EXOPLANET' ? (
                          <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                        ) : prediction.stage_1.result === 'UNCERTAIN' ? (
                          <HelpCircle className="w-5 h-5 text-yellow-400" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-red-400" />
                        )}
                        <span className="font-semibold text-sm text-foreground">Pipeline 1: Physical Feature Analysis</span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-foreground/50">Classification:</span>
                          <span className={`font-semibold ${prediction.stage_1.result === 'EXOPLANET' ? 'text-cyan-400'
                            : prediction.stage_1.result === 'UNCERTAIN' ? 'text-yellow-400'
                              : 'text-red-400'
                            }`}>
                            {prediction.stage_1.label}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-foreground/50">Exoplanet Probability:</span>
                          <span className="font-mono text-foreground tabular-nums">{(prediction.stage_1.confidence * 100).toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-white/4 rounded-full h-2 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${prediction.stage_1.confidence * 100}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className={`h-full rounded-full ${prediction.stage_1.result === 'EXOPLANET' ? 'bg-linear-to-r from-cyan-500 to-cyan-400'
                              : prediction.stage_1.result === 'UNCERTAIN' ? 'bg-linear-to-r from-yellow-500 to-yellow-400'
                                : 'bg-linear-to-r from-red-500 to-red-400'
                              }`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Pipeline 2 Result — Signal Reliability Screening */}
                    {prediction.stage_2 ? (
                      <div className={`p-4 rounded-xl border ${prediction.stage_2.result === 'PASS'
                        ? 'bg-cyan-400/5 border-cyan-400/15'
                        : 'bg-red-400/5 border-red-400/15'
                        }`}>
                        <div className="flex items-center gap-2 mb-3">
                          {prediction.stage_2.result === 'PASS' ? (
                            <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                          ) : (
                            <AlertTriangle className="w-5 h-5 text-red-400" />
                          )}
                          <span className="font-semibold text-sm text-foreground">Pipeline 2: Signal Reliability Screening</span>
                          <span className={`ml-auto text-xs px-2.5 py-1 rounded-lg font-medium ${prediction.stage_2.result === 'PASS'
                            ? 'bg-cyan-400/15 text-cyan-400 border border-cyan-400/20'
                            : 'bg-red-400/15 text-red-400 border border-red-400/20'
                            }`}>
                            {prediction.stage_2.result}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-foreground/50">Signal Quality:</span>
                            <span className="text-foreground">{prediction.stage_2.signal_quality}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-foreground/50">Confidence:</span>
                            <span className="font-mono text-foreground tabular-nums">{(prediction.stage_2.confidence * 100).toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-white/4 rounded-full h-2 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${prediction.stage_2.confidence * 100}%` }}
                              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                              className={`h-full rounded-full ${prediction.stage_2.result === 'PASS' ? 'bg-linear-to-r from-cyan-500 to-cyan-400' : 'bg-linear-to-r from-red-500 to-red-400'}`}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-white/2 border border-white/6">
                        <div className="flex items-center gap-2 text-foreground/50">
                          <Info className="w-4 h-4" />
                          <span className="text-sm">Pipeline 2 skipped — physical parameters classified as false positive</span>
                        </div>
                      </div>
                    )}

                    {/* Final Prediction Box */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 }}
                      className={`p-6 rounded-xl text-center ${prediction.prediction === 'EXOPLANET'
                        ? 'bg-cyan-400/5 border-2 border-cyan-400/20 shadow-lg shadow-cyan-400/5'
                        : prediction.prediction === 'UNCERTAIN'
                          ? 'bg-yellow-400/5 border-2 border-yellow-400/20 shadow-lg shadow-yellow-400/5'
                          : 'bg-red-400/5 border-2 border-red-400/20 shadow-lg shadow-red-400/5'
                        }`}
                    >
                      <p className="text-xs uppercase tracking-widest text-foreground/40 mb-2">Final Classification</p>
                      <p className={`text-2xl font-bold ${prediction.prediction === 'EXOPLANET' ? 'text-gradient-cyan'
                        : prediction.prediction === 'UNCERTAIN' ? 'text-yellow-400'
                          : 'text-red-400'
                        }`}>
                        {prediction.label}
                      </p>
                      <p className="text-sm text-foreground/50 mt-2">
                        Confidence: <span className="font-mono tabular-nums">{(prediction.confidence * 100).toFixed(1)}%</span>
                      </p>
                    </motion.div>

                    {/* Voice Selection */}
                    <div className="space-y-3">
                      <p className="text-xs uppercase tracking-widest text-foreground/40 text-center">Choose AI Voice</p>
                      <div className="grid grid-cols-2 gap-3">
                        {(['einstein', 'chawla'] as const).map((voice) => (
                          <motion.button
                            key={voice}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => setSelectedVoice(voice)}
                            className={`p-3 rounded-xl border transition-all duration-300 ${selectedVoice === voice
                              ? 'bg-cyan-400/10 border-cyan-400/30 text-cyan-400'
                              : 'bg-white/2 border-white/6 text-foreground/60 hover:border-white/15'
                              }`}
                          >
                            <div className="flex flex-col items-center gap-2">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              <div className="text-center">
                                <p className="text-sm font-medium">{voice === 'einstein' ? 'Einstein' : 'Kalpana Chawla'}</p>
                                <p className="text-xs opacity-60">{voice === 'einstein' ? 'Male · Deep' : 'Female · Clear'}</p>
                              </div>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* AI Voice Explanation Button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleExplainWithVoice}
                      disabled={isSpeaking}
                      className={`w-full px-6 py-4 rounded-xl font-semibold transition-all duration-300
                                flex items-center justify-center gap-2 ${isSpeaking
                          ? 'bg-purple-500/30 text-white/60 cursor-wait'
                          : 'bg-linear-to-r from-purple-500/20 to-cyan-500/20 border border-purple-400/30 text-purple-300 hover:border-purple-400/50 hover:shadow-lg hover:shadow-purple-500/10'
                        }`}
                    >
                      {isSpeaking ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Speaking as {selectedVoice === 'einstein' ? 'Einstein' : 'Kalpana Chawla'}...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                          </svg>
                          Explain with AI Voice
                        </>
                      )}
                    </motion.button>

                    {/* Explanation Text */}
                    <AnimatePresence>
                      {explanationText && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="p-4 rounded-xl bg-white/2 border border-white/6 overflow-hidden"
                        >
                          <p className="text-xs uppercase tracking-widest text-foreground/40 mb-2">AI Explanation</p>
                          <p className="text-sm text-foreground/70 leading-relaxed">{explanationText}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Model Info */}
                    <div className="p-3 rounded-xl bg-white/2 border border-white/6">
                      <p className="text-xs text-foreground/30 text-center">
                        Prediction by Random Forest Classifier trained on NASA Kepler data
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="py-12 text-center"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-white/3 border border-white/6 flex items-center justify-center mx-auto mb-4">
                      <Telescope className="w-8 h-8 text-foreground/20" />
                    </div>
                    <p className="text-foreground/50 mb-2">No prediction yet</p>
                    <p className="text-sm text-foreground/30">
                      Adjust the parameters and click &quot;Run Prediction&quot; to
                      classify the observation using our trained ML model.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>

        {/* Explanation Section */}
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={fadeIn}
          className="mt-12 glass-panel p-6"
        >
          <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2 tracking-tight">
            <Info className="w-4 h-4 text-cyan-400" />
            How This Works
          </h4>
          <div className="grid md:grid-cols-2 gap-6 text-sm text-foreground/60">
            <div>
              <p className="font-semibold text-foreground/80 mb-1">Pipeline 1: Physical Feature Analysis</p>
              <p>
                Analyzes the physical parameters (radius, orbital period, stellar
                properties) using the trained Random Forest model to classify whether
                the candidate is likely a genuine exoplanet.
              </p>
            </div>
            <div>
              <p className="font-semibold text-foreground/80 mb-1">Pipeline 2: Signal Reliability Screening</p>
              <p>
                If the physical analysis is promising, evaluates the false positive flags
                (fpflags) to determine if the transit signal is caused by instrumental
                artifacts, stellar eclipses, or background stars.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default LivePrediction
