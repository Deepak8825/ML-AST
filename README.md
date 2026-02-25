# Exo-Pulse — Exoplanet Detection & Analysis Platform 🪐

A full-stack machine learning application for detecting and analyzing exoplanet candidates using NASA Kepler telescope data. Features a two-pipeline ML classification system, interactive visual analytics, light curve visualization, and AI-powered voice explanations.

![GitHub repo size](https://img.shields.io/github/repo-size/Deepak8825/ML-AST)
![GitHub stars](https://img.shields.io/github/stars/Deepak8825/ML-AST?style=social)
![GitHub forks](https://img.shields.io/github/forks/Deepak8825/ML-AST?style=social)

---

## ✨ Features

### 🤖 Machine Learning — Two-Pipeline Classification
- **Pipeline 1: Physical Feature Analysis**
  - Analyzes planetary and stellar properties (radius, orbital period, temperature, etc.)
  - Random Forest classifier with 200 decision trees
  - Classification: Exoplanet Candidate (≥70%), Uncertain (40–70%), False Positive (<40%)
- **Pipeline 2: Signal Reliability Screening**
  - Evaluates false positive flags (fpflags) to detect signal quality issues
  - Identifies stellar eclipses, centroid offsets, and instrumental artifacts
  - Only runs if Pipeline 1 does not reject the candidate
- **99.22% Accuracy** on 9,564 Kepler observations
- **Real-time Inference** with sub-10ms latency

### 🎙️ AI Voice Explanation
- **Natural Language Explanations** of ML predictions
- **Voice Personality Selection**:
  - **Einstein**: Deep, thoughtful male voice
  - **Kalpana Chawla**: Clear, inspiring female voice
- **Browser-Native TTS** using Web Speech API (no external APIs, zero cost)

### 📊 Visual Analytics
- **Discovery Timeline**: Growth of confirmed exoplanets over time
- **Radius Distribution**: Planet size categories (Earth-sized, Super-Earths, Gas Giants)
- **Temperature–Radius Scatter**: Correlation between stellar temperature and planet size
- **Real-time Statistics**: All computed from actual NASA data

### 🔍 Data Explorer
- Browse **9,564 Kepler candidates** with pagination
- **Custom dark-themed dropdown** for sorting (Feature Name, Temperature, Radius)
- **Dual-control filters**: Min/Max input boxes + range slider for Radius (R⊕) and Temperature (K)
- Habitable zone indicators
- Real Kepler names and properties

### 🌊 Light Curve Viewer
- **Transit signal visualization** for any Kepler target
- Fetches real photometric data from **NASA MAST Archive**
- Modal viewer with loading states and retry capability
- Automatic caching of generated light curve images

---

## 🚀 Quick Start

### Prerequisites
- Python 3.12+
- Node.js 18+
- npm or pnpm

### Backend Setup
```bash
cd back-end
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Backend runs on: `http://127.0.0.1:8000`

### Frontend Setup
```bash
cd front-end
npm install
npm run dev
```

Frontend runs on: `http://localhost:3000`

---

## 🛠️ Technology Stack

### Backend
| Technology | Purpose |
|---|---|
| **FastAPI** | Modern Python web framework with auto-generated docs |
| **scikit-learn** | Random Forest & Logistic Regression classifiers |
| **Pandas / NumPy** | Data manipulation and numerical computing |
| **Uvicorn** | High-performance ASGI server |
| **Lightkurve** | NASA Kepler light curve data retrieval |

### Frontend
| Technology | Purpose |
|---|---|
| **Next.js 16** | React framework with server-side rendering |
| **TypeScript** | Type-safe development |
| **Tailwind CSS v4** | Utility-first styling with dark theme |
| **Framer Motion** | Smooth animations and transitions |
| **Recharts** | Data visualization charts |
| **Three.js** | 3D galaxy background animation |
| **Web Speech API** | Browser-native text-to-speech |

### Machine Learning
- **Random Forest Classifier**: 200 estimators, 99.22% accuracy
- **Logistic Regression**: Baseline comparison model
- **Features**: 30+ parameters (orbital period, planet radius, stellar properties, false positive flags)
- **Dataset**: NASA Kepler Cumulative KOI table (9,564 observations, 2,293 confirmed exoplanets)

---

## 📁 Project Structure

```
ML-AST/
├── back-end/
│   ├── main.py                    # FastAPI server + ML inference endpoints
│   ├── lightcurve_service.py      # MAST light curve fetching & caching
│   ├── model_rf.pkl               # Trained Random Forest model
│   ├── feature_columns.pkl        # Feature column ordering
│   ├── feature_medians.pkl        # Median values for imputation
│   ├── requirements.txt           # Python dependencies
│   └── lightcurves/               # Cached light curve images
├── front-end/
│   ├── app/
│   │   ├── globals.css            # Global styles + dark theme + slider CSS
│   │   ├── layout.tsx             # Root layout with galaxy background
│   │   └── page.tsx               # Main page composition
│   ├── components/
│   │   ├── hero-section.tsx       # Landing hero with stats & carousel
│   │   ├── live-prediction.tsx    # ML prediction UI + voice explanation
│   │   ├── analytics-view.tsx     # Interactive charts & analytics
│   │   ├── data-explorer.tsx      # Candidate browser + light curve modal
│   │   ├── ml-models.tsx          # Model metrics + feature importance
│   │   ├── image-carousel.tsx     # Hero image slider
│   │   └── universe-background.tsx # 3D galaxy canvas (Three.js)
│   └── public/                    # Static assets (exoplanet images)
├── training/
│   ├── train_model.py             # Model training script
│   ├── cumulative.csv             # NASA Kepler dataset (9,564 rows)
│   └── training_metrics.json      # Saved performance metrics
├── PROJECT_DOCUMENTATION.md       # Comprehensive technical documentation
└── README.md                      # This file
```

---

## 🎯 How It Works

### Two-Pipeline ML Classification

```
User Input → Pipeline 1: Physical Feature Analysis
                  ↓
            [ EXOPLANET | UNCERTAIN | FALSE_POSITIVE ]
                  ↓
         If not rejected → Pipeline 2: Signal Reliability Screening
                              ↓
                        [ PASS | FAIL ]
                              ↓
                      Final Classification
```

**Pipeline 1 — Physical Feature Analysis**
- Uses physical parameters (radius, orbital period, stellar temperature, etc.)
- Sets all false positive flags to 0 to isolate physical feature effects
- Random Forest predicts exoplanet probability

**Pipeline 2 — Signal Reliability Screening**
- Only runs if Pipeline 1 does not classify as FALSE_POSITIVE
- Uses false positive flags with physical features set to median (neutralized)
- Checks if the transit signal has instrumental or astrophysical artifacts
- Threshold: ≥60% false positive probability → signal rejected

### AI Voice Explanation
1. User runs prediction and sees classification results
2. Selects voice personality (Einstein or Kalpana Chawla)
3. Clicks "Explain with AI Voice"
4. Backend generates a natural language explanation based on both pipelines
5. Frontend speaks it using Web Speech API with personality-specific pitch/rate

---

## 📊 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check |
| `POST` | `/predict` | Two-pipeline ML classification |
| `POST` | `/explain` | Natural language explanation of prediction |
| `GET` | `/kepler-candidates` | Paginated dataset browser |
| `GET` | `/analytics` | Pre-computed analytics data |
| `GET` | `/metrics` | Model performance metrics |
| `GET` | `/feature-info` | Feature names and details |
| `GET` | `/lightcurve?target=<name>` | Generate/serve light curve PNG |

---

## 📈 Model Performance

| Metric    | Random Forest | Logistic Regression |
|-----------|---------------|---------------------|
| Accuracy  | 99.22%        | 88%                 |
| Precision | 0.91          | 0.85                |
| Recall    | 0.89          | 0.80                |
| F1 Score  | 0.90          | 0.82                |

---

## 🌟 Key Highlights

- ✅ **100% Real Data** — All analytics computed from NASA Kepler dataset, no mock data
- ✅ **Two-Pipeline Classification** — Physical analysis first, signal screening second
- ✅ **Light Curve Visualization** — Real transit signals from MAST Archive
- ✅ **Browser-Native Voice** — No external APIs, zero cost, privacy-preserving
- ✅ **Dark Futuristic UI** — Glassmorphism, 3D galaxy background, cyan glow theme
- ✅ **Scientific Dashboard** — Human-readable feature labels, dual-control filters
- ✅ **Production-Ready** — TypeScript, error handling, CORS, caching, responsive design

---

## 🎓 Educational Use

This project demonstrates:
- **Full-stack ML engineering** — From data preprocessing to production deployment
- **Two-pipeline classification** — Novel approach mirroring astronomical vetting procedures
- **Explainable AI** — Voice-based explanations make ML predictions accessible
- **Academic rigor** — Using peer-reviewed NASA Kepler data
- **Modern web dev** — Next.js, TypeScript, Tailwind CSS v4, Framer Motion, Three.js

---

## 🤝 Contributing

This is an academic project, but suggestions and improvements are welcome!

## 📄 License

MIT License — See LICENSE file for details.

## 👨‍💻 Author

**Deepak**
GitHub: [@Deepak8825](https://github.com/Deepak8825)

## 🙏 Acknowledgments

- **NASA Kepler Mission** — Exoplanet dataset
- **MAST Archive** — Light curve photometric data
- **scikit-learn** — ML framework
- **Next.js & React** — Frontend framework
- **FastAPI** — Backend framework
- Honoring **Albert Einstein** and **Kalpana Chawla** through voice personalities

## 📚 Documentation

For detailed technical documentation, architecture, and viva preparation:
- [PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md) — Complete technical guide

---

**Dataset Source**: [NASA Exoplanet Archive](https://exoplanetarchive.ipac.caltech.edu/)
**Repository**: [github.com/Deepak8825/ML-AST](https://github.com/Deepak8825/ML-AST)
