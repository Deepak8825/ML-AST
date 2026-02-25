'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, useInView } from 'framer-motion'

interface ConfusionMatrixCell {
  value: number
  label: string
}

interface ModelMetrics {
  accuracy: number
  precision: number
  recall: number
  f1Score: number
}

interface FeatureImportance {
  feature: string
  importance: number
}

interface MetricsData {
  logistic_regression: {
    model_name: string
    accuracy: number
    precision: number
    recall: number
    f1_score: number
    confusion_matrix: {
      true_negative: number
      false_positive: number
      false_negative: number
      true_positive: number
    }
    top_features: FeatureImportance[]
  }
  random_forest: {
    model_name: string
    accuracy: number
    precision: number
    recall: number
    f1_score: number
    confusion_matrix: {
      true_negative: number
      false_positive: number
      false_negative: number
      true_positive: number
    }
    top_features: FeatureImportance[]
  }
}

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
}

const FEATURE_LABELS: Record<string, string> = {
  koi_fpflag_ss: 'Significance',
  koi_fpflag_nt: 'Noise',
  koi_fpflag_co: 'Centroid',
  koi_fpflag_ec: 'Eclipse',
  koi_period: 'Orbital Period',
  koi_duration: 'Transit Duration',
  koi_time0bk: 'Transit Epoch',
  koi_prad: 'Planet Radius',
  koi_depth: 'Transit Depth',
  koi_impact: 'Impact Parameter',
  koi_model_snr: 'Signal-to-Noise Ratio',
  koi_steff: 'Stellar Temperature',
  koi_srad: 'Stellar Radius',
  koi_insol: 'Insolation Flux',
  koi_teq: 'Equilibrium Temperature',
  ra: 'Right Ascension / Longitude',
  dec: 'Declination / Latitude',
}

const MLModels: React.FC = () => {
  const [selectedModel, setSelectedModel] = useState<'logistic' | 'forest'>('forest')
  const [metricsData, setMetricsData] = useState<MetricsData | null>(null)
  const [loading, setLoading] = useState(true)

  const sectionRef = useRef(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' })

  useEffect(() => {
    fetch('http://127.0.0.1:8000/metrics')
      .then((res) => res.json())
      .then((data) => {
        setMetricsData(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to fetch metrics:', err)
        setLoading(false)
      })
  }, [])

  const logisticMetrics: ModelMetrics = metricsData ? {
    accuracy: metricsData.logistic_regression.accuracy * 100,
    precision: metricsData.logistic_regression.precision * 100,
    recall: metricsData.logistic_regression.recall * 100,
    f1Score: metricsData.logistic_regression.f1_score * 100,
  } : { accuracy: 0, precision: 0, recall: 0, f1Score: 0 }

  const forestMetrics: ModelMetrics = metricsData ? {
    accuracy: metricsData.random_forest.accuracy * 100,
    precision: metricsData.random_forest.precision * 100,
    recall: metricsData.random_forest.recall * 100,
    f1Score: metricsData.random_forest.f1_score * 100,
  } : { accuracy: 0, precision: 0, recall: 0, f1Score: 0 }

  const logisticConfusionMatrix: ConfusionMatrixCell[][] = metricsData ? [
    [
      { value: metricsData.logistic_regression.confusion_matrix.true_negative, label: 'True Negative' },
      { value: metricsData.logistic_regression.confusion_matrix.false_positive, label: 'False Positive' },
    ],
    [
      { value: metricsData.logistic_regression.confusion_matrix.false_negative, label: 'False Negative' },
      { value: metricsData.logistic_regression.confusion_matrix.true_positive, label: 'True Positive' },
    ],
  ] : [
    [{ value: 0, label: 'True Negative' }, { value: 0, label: 'False Positive' }],
    [{ value: 0, label: 'False Negative' }, { value: 0, label: 'True Positive' }],
  ]

  const forestConfusionMatrix: ConfusionMatrixCell[][] = metricsData ? [
    [
      { value: metricsData.random_forest.confusion_matrix.true_negative, label: 'True Negative' },
      { value: metricsData.random_forest.confusion_matrix.false_positive, label: 'False Positive' },
    ],
    [
      { value: metricsData.random_forest.confusion_matrix.false_negative, label: 'False Negative' },
      { value: metricsData.random_forest.confusion_matrix.true_positive, label: 'True Positive' },
    ],
  ] : [
    [{ value: 0, label: 'True Negative' }, { value: 0, label: 'False Positive' }],
    [{ value: 0, label: 'False Negative' }, { value: 0, label: 'True Positive' }],
  ]

  const currentMetrics = selectedModel === 'logistic' ? logisticMetrics : forestMetrics
  const currentMatrix = selectedModel === 'logistic' ? logisticConfusionMatrix : forestConfusionMatrix

  const metricItems = [
    { label: 'Accuracy', value: currentMetrics.accuracy, color: 'from-cyan-400 to-cyan-500' },
    { label: 'Precision', value: currentMetrics.precision, color: 'from-purple-400 to-purple-500' },
    { label: 'Recall', value: currentMetrics.recall, color: 'from-cyan-400 to-purple-400' },
    { label: 'F1 Score', value: currentMetrics.f1Score, color: 'from-purple-400 to-cyan-400' },
  ]

  return (
    <section id="models" className="py-24 px-6 relative z-10 min-h-screen section-glow" ref={sectionRef}>
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={fadeIn}
          className="mb-14 space-y-3"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-400/20 bg-cyan-400/5 text-cyan-400 text-xs font-medium tracking-wider uppercase">
            Machine Learning
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
            ML Models
          </h2>
          <p className="text-lg text-foreground/50 font-light">
            Advanced machine learning for exoplanet classification
          </p>
        </motion.div>

        {/* Model Selection */}
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={fadeIn}
          className="flex gap-3 mb-12"
        >
          {(['logistic', 'forest'] as const).map((model) => (
            <motion.button
              key={model}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setSelectedModel(model)}
              className={`relative px-6 py-3 rounded-xl font-medium transition-all duration-300 ${selectedModel === model
                ? 'bg-linear-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-400/30 text-cyan-400 shadow-lg shadow-cyan-500/10'
                : 'glass-panel text-foreground/60 hover:text-foreground/80'
                }`}
            >
              {model === 'logistic' ? 'Logistic Regression' : 'Random Forest'}
            </motion.button>
          ))}
        </motion.div>

        {/* Model Details Grid */}
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          className="grid lg:grid-cols-2 gap-6"
        >
          {/* Metrics */}
          <motion.div variants={fadeIn} className="glass-panel p-8">
            <h3 className="text-lg font-semibold text-foreground mb-8 tracking-tight">
              Performance Metrics
            </h3>

            <div className="space-y-6">
              {metricItems.map((m) => (
                <div key={m.label}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-foreground/70 font-medium">{m.label}</span>
                    <span className="text-sm text-cyan-400 font-semibold tabular-nums">
                      {m.value.toFixed(2)}%
                    </span>
                  </div>
                  <div className="w-full bg-white/4 rounded-full h-2.5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${m.value}%` }}
                      transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                      className={`bg-linear-to-r ${m.color} h-2.5 rounded-full shadow-sm`}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Model Description */}
            <div className="mt-8 pt-8 border-t border-white/6">
              <h4 className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2">
                Model Type
              </h4>
              <p className="text-foreground/50 text-sm leading-relaxed">
                {selectedModel === 'logistic'
                  ? 'Binary classification model using logistic function. Excellent for linearly separable data with fast inference and interpretable coefficients.'
                  : 'Ensemble learning method combining multiple decision trees. Superior performance on complex, non-linear patterns in exoplanet data.'}
              </p>
            </div>
          </motion.div>

          {/* Confusion Matrix */}
          <motion.div variants={fadeIn} className="glass-panel p-8 flex flex-col">
            <h3 className="text-lg font-semibold text-foreground mb-8 tracking-tight">
              Confusion Matrix
            </h3>

            <div className="flex-1 flex items-center justify-center">
              <div className="grid grid-cols-2 gap-4">
                {currentMatrix.map((row, rowIdx) =>
                  row.map((cell, colIdx) => (
                    <motion.div
                      key={`${rowIdx}-${colIdx}`}
                      whileHover={{ scale: 1.05 }}
                      className={`w-28 h-28 rounded-xl flex flex-col items-center justify-center text-center border transition-all ${cell.label.includes('True')
                        ? 'border-cyan-400/30 bg-cyan-400/5 shadow-lg shadow-cyan-400/5'
                        : 'border-red-400/30 bg-red-400/5 shadow-lg shadow-red-400/5'
                        }`}
                    >
                      <p className="text-3xl font-bold text-foreground tabular-nums">{cell.value}</p>
                      <p className="text-xs text-foreground/50 mt-1.5">{cell.label.split(' ')[0]}</p>
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/6 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-foreground/40 text-xs">True Positive</p>
                <p className="text-cyan-400 font-semibold text-lg tabular-nums">{currentMatrix[1][1].value}</p>
              </div>
              <div>
                <p className="text-foreground/40 text-xs">True Negative</p>
                <p className="text-cyan-400 font-semibold text-lg tabular-nums">{currentMatrix[0][0].value}</p>
              </div>
              <div>
                <p className="text-foreground/40 text-xs">False Positive</p>
                <p className="text-red-400 font-semibold text-lg tabular-nums">{currentMatrix[0][1].value}</p>
              </div>
              <div>
                <p className="text-foreground/40 text-xs">False Negative</p>
                <p className="text-red-400 font-semibold text-lg tabular-nums">{currentMatrix[1][0].value}</p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Feature Importance */}
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={fadeIn}
          className="glass-panel p-8 mt-6"
        >
          <h3 className="text-lg font-semibold text-foreground mb-8 tracking-tight">
            Top Features (Real Data from Training)
          </h3>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-10 h-10 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {(selectedModel === 'forest' && metricsData
                ? metricsData.random_forest.top_features
                : metricsData?.logistic_regression.top_features || []
              ).map((feature, i) => (
                <div key={feature.feature}>
                  <div className="flex justify-between mb-2">
                    <div className="flex flex-col">
                      <span className="text-sm text-foreground/70 font-medium font-mono">{feature.feature}</span>
                      {FEATURE_LABELS[feature.feature] && (
                        <span className="text-xs text-foreground/35 mt-0.5">{FEATURE_LABELS[feature.feature]}</span>
                      )}
                    </div>
                    <span className="text-sm text-purple-400 font-semibold tabular-nums">
                      {(feature.importance * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-white/4 rounded-full h-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={isInView ? { width: `${feature.importance * 100}%` } : {}}
                      transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 * i }}
                      className="h-2 rounded-full bg-linear-to-r from-purple-500 to-cyan-400"
                    />
                  </div>
                </div>
              ))}
              {!metricsData && (
                <div className="text-center text-foreground/40">No data available</div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </section>
  )
}

export default MLModels
