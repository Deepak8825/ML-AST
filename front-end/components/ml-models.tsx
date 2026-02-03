'use client'

import React, { useState, useEffect } from 'react'

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

const MLModels: React.FC = () => {
  const [selectedModel, setSelectedModel] = useState<'logistic' | 'forest'>(
    'forest'
  )
  const [metricsData, setMetricsData] = useState<MetricsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch real metrics from backend
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
  } : {
    accuracy: 0,
    precision: 0,
    recall: 0,
    f1Score: 0,
  }

  // Use real metrics from backend for Random Forest
  const forestMetrics: ModelMetrics = metricsData ? {
    accuracy: metricsData.random_forest.accuracy * 100,
    precision: metricsData.random_forest.precision * 100,
    recall: metricsData.random_forest.recall * 100,
    f1Score: metricsData.random_forest.f1_score * 100,
  } : {
    accuracy: 0,
    precision: 0,
    recall: 0,
    f1Score: 0,
  }

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
    [
      { value: 0, label: 'True Negative' },
      { value: 0, label: 'False Positive' },
    ],
    [
      { value: 0, label: 'False Negative' },
      { value: 0, label: 'True Positive' },
    ],
  ]

  // Use real confusion matrix from backend for Random Forest
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
    [
      { value: 0, label: 'True Negative' },
      { value: 0, label: 'False Positive' },
    ],
    [
      { value: 0, label: 'False Negative' },
      { value: 0, label: 'True Positive' },
    ],
  ]

  const currentMetrics =
    selectedModel === 'logistic' ? logisticMetrics : forestMetrics
  const currentMatrix =
    selectedModel === 'logistic'
      ? logisticConfusionMatrix
      : forestConfusionMatrix

  const ConfusionMatrix = () => (
    <div className="bg-input/30 rounded-xl p-8 inline-block">
      <div className="grid grid-cols-2 gap-6">
        {currentMatrix.map((row, rowIdx) =>
          row.map((cell, colIdx) => (
            <div
              key={`${rowIdx}-${colIdx}`}
              className={`w-24 h-24 rounded-lg flex flex-col items-center justify-center text-center border transition-all ${
                cell.label.includes('True')
                  ? 'border-accent/50 bg-accent/10'
                  : 'border-destructive/50 bg-destructive/10'
              }`}
            >
              <p className="text-2xl font-light text-foreground">
                {cell.value}
              </p>
              <p className="text-xs text-foreground/60 font-light mt-1">
                {cell.label.split(' ')[0]}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )

  return (
    <section
      id="models"
      className="py-20 px-6 relative z-10 min-h-screen"
    >
      <div className="max-w-7xl mx-auto">
        <div className="mb-12 space-y-2">
          <h2 className="text-4xl md:text-5xl font-light text-foreground">
            ML Models
          </h2>
          <p className="text-lg text-foreground/60 font-light">
            Advanced machine learning for exoplanet classification
          </p>
        </div>

        {/* Model Selection */}
        <div className="flex gap-4 mb-12">
          <button
            onClick={() => setSelectedModel('logistic')}
            className={`px-6 py-3 rounded-lg transition-all duration-300 font-light ${
              selectedModel === 'logistic'
                ? 'bg-accent text-background'
                : 'bg-card border border-border text-foreground hover:border-accent/50'
            }`}
          >
            Logistic Regression
          </button>
          <button
            onClick={() => setSelectedModel('forest')}
            className={`px-6 py-3 rounded-lg transition-all duration-300 font-light ${
              selectedModel === 'forest'
                ? 'bg-accent text-background'
                : 'bg-card border border-border text-foreground hover:border-accent/50'
            }`}
          >
            Random Forest
          </button>
        </div>

        {/* Model Details Grid */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Metrics */}
          <div className="bg-card rounded-2xl border border-border p-8 backdrop-blur-md">
            <h3 className="text-xl font-light text-foreground mb-8">
              Performance Metrics
            </h3>

            <div className="space-y-6">
              {/* Accuracy */}
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-foreground font-light">Accuracy</span>
                  <span className="text-accent font-light">
                    {currentMetrics.accuracy.toFixed(2)}%
                  </span>
                </div>
                <div className="w-full bg-input rounded-full h-2">
                  <div
                    className="bg-linear-to-r from-accent to-primary h-2 rounded-full transition-all duration-500"
                    style={{ width: `${currentMetrics.accuracy}%` }}
                  />
                </div>
              </div>

              {/* Precision */}
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-foreground font-light">Precision</span>
                  <span className="text-accent font-light">
                    {currentMetrics.precision.toFixed(2)}%
                  </span>
                </div>
                <div className="w-full bg-input rounded-full h-2">
                  <div
                    className="bg-linear-to-r from-accent to-primary h-2 rounded-full transition-all duration-500"
                    style={{ width: `${currentMetrics.precision}%` }}
                  />
                </div>
              </div>

              {/* Recall */}
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-foreground font-light">Recall</span>
                  <span className="text-accent font-light">
                    {currentMetrics.recall.toFixed(2)}%
                  </span>
                </div>
                <div className="w-full bg-input rounded-full h-2">
                  <div
                    className="bg-linear-to-r from-accent to-primary h-2 rounded-full transition-all duration-500"
                    style={{ width: `${currentMetrics.recall}%` }}
                  />
                </div>
              </div>

              {/* F1 Score */}
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-foreground font-light">F1 Score</span>
                  <span className="text-accent font-light">
                    {currentMetrics.f1Score.toFixed(2)}%
                  </span>
                </div>
                <div className="w-full bg-input rounded-full h-2">
                  <div
                    className="bg-linear-to-r from-accent to-primary h-2 rounded-full transition-all duration-500"
                    style={{ width: `${currentMetrics.f1Score}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Model Description */}
            <div className="mt-8 pt-8 border-t border-border">
              <h4 className="text-sm font-light text-foreground/80 mb-2">
                Model Type
              </h4>
              <p className="text-foreground/60 font-light text-sm leading-relaxed">
                {selectedModel === 'logistic'
                  ? 'Binary classification model using logistic function. Excellent for linearly separable data with fast inference and interpretable coefficients.'
                  : 'Ensemble learning method combining multiple decision trees. Superior performance on complex, non-linear patterns in exoplanet data.'}
              </p>
            </div>
          </div>

          {/* Confusion Matrix */}
          <div className="bg-card rounded-2xl border border-border p-8 backdrop-blur-md flex flex-col">
            <h3 className="text-xl font-light text-foreground mb-8">
              Confusion Matrix
            </h3>

            <div className="flex-1 flex items-center justify-center">
              <ConfusionMatrix />
            </div>

            <div className="mt-8 pt-8 border-t border-border grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-foreground/60 font-light">True Positive</p>
                <p className="text-accent font-light text-lg">
                  {currentMatrix[1][1].value}
                </p>
              </div>
              <div>
                <p className="text-foreground/60 font-light">True Negative</p>
                <p className="text-accent font-light text-lg">
                  {currentMatrix[0][0].value}
                </p>
              </div>
              <div>
                <p className="text-foreground/60 font-light">False Positive</p>
                <p className="text-destructive font-light text-lg">
                  {currentMatrix[0][1].value}
                </p>
              </div>
              <div>
                <p className="text-foreground/60 font-light">False Negative</p>
                <p className="text-destructive font-light text-lg">
                  {currentMatrix[1][0].value}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Importance */}
        <div className="bg-card rounded-2xl border border-border p-8 backdrop-blur-md mt-8">
          <h3 className="text-xl font-light text-foreground mb-8">
            Top Features (Real Data from Training)
          </h3>

          {loading ? (
            <div className="text-center text-foreground/60">Loading metrics...</div>
          ) : (
            <div className="space-y-4">
              {selectedModel === 'forest' && metricsData ? (
                metricsData.random_forest.top_features.map((feature) => (
                  <div key={feature.feature}>
                    <div className="flex justify-between mb-2">
                      <span className="text-foreground font-light text-sm">
                        {feature.feature}
                      </span>
                      <span className="text-accent font-light text-sm">
                        {(feature.importance * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-input rounded-full h-2">
                      <div
                        className="bg-secondary h-2 rounded-full"
                        style={{ width: `${feature.importance * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : metricsData ? (
                metricsData.logistic_regression.top_features.map((feature) => (
                  <div key={feature.feature}>
                    <div className="flex justify-between mb-2">
                      <span className="text-foreground font-light text-sm">
                        {feature.feature}
                      </span>
                      <span className="text-accent font-light text-sm">
                        {(feature.importance * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-input rounded-full h-2">
                      <div
                        className="bg-secondary h-2 rounded-full"
                        style={{ width: `${feature.importance * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-foreground/60">No data available</div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default MLModels
