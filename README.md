# Exoplanet Detection & Analysis Platform 🪐

A full-stack machine learning application for detecting and analyzing exoplanet candidates using NASA Kepler telescope data. Features real-time ML predictions, interactive analytics, and AI-powered voice explanations.

![GitHub repo size](https://img.shields.io/github/repo-size/Deepak8825/ML-AST)
![GitHub stars](https://img.shields.io/github/stars/Deepak8825/ML-AST?style=social)
![GitHub forks](https://img.shields.io/github/forks/Deepak8825/ML-AST?style=social)

## ✨ Features

### 🤖 Machine Learning
- **Two-Stage Classification Pipeline**
  - Stage 1: Signal quality screening using false positive flags
  - Stage 2: Physical parameter analysis using Random Forest
- **93% Accuracy** on 9,564 Kepler observations
- **Real-time Inference** with <10ms latency
- **Explainable AI** with confidence scores

### 🎙️ AI Voice Explanation (NEW!)
- **Natural Language Explanations** of ML predictions
- **Voice Personality Selection**:
  - **Einstein**: Deep, thoughtful male voice (honoring the theoretical physicist)
  - **Kalpana Chawla**: Clear, inspiring female voice (honoring the astronaut)
- **Browser-Native TTS** using Web Speech API (no external APIs, zero cost)
- **Smart Voice Matching** with graceful fallbacks across different systems

### 📊 Visual Analytics
- **Discovery Timeline**: Growth of confirmed exoplanets over time
- **Radius Distribution**: Planet size categories (Earth-sized, Super-Earths, Gas Giants)
- **Temperature-Radius Scatter**: Correlation between stellar temperature and planet size
- **Real-time Statistics**: All computed from actual NASA data

### 🔍 Data Explorer
- Browse **9,564 Kepler candidates**
- Pagination and filtering
- Habitable zone indicators
- Real Kepler names and properties

## 🚀 Quick Start

### Prerequisites
- Python 3.12+
- Node.js 18+
- pnpm (or npm)

### Backend Setup
```bash
cd back-end
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux
pip install fastapi uvicorn pandas scikit-learn joblib
uvicorn main:app --reload
```

Backend runs on: `http://127.0.0.1:8000`

### Frontend Setup
```bash
cd front-end
pnpm install
pnpm dev
```

Frontend runs on: `http://localhost:3000`

## 🛠️ Technology Stack

### Backend
- **FastAPI**: Modern Python web framework
- **scikit-learn**: Random Forest classifier
- **Pandas**: Data manipulation
- **Uvicorn**: ASGI server

### Frontend
- **Next.js 16**: React framework with SSR
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Recharts**: Data visualization
- **Radix UI**: Accessible components
- **Web Speech API**: Native browser TTS

### Machine Learning
- **Random Forest Classifier**: 200 estimators, 93% accuracy
- **Logistic Regression**: Baseline model
- **Features**: 30+ parameters (orbital period, planet radius, stellar properties, false positive flags)
- **Dataset**: NASA Kepler Cumulative KOI table (9,564 observations, 2,293 confirmed exoplanets)

## 📁 Project Structure

```
ML-AST/
├── back-end/
│   ├── main.py                 # FastAPI server
│   ├── model_rf.pkl            # Trained Random Forest
│   ├── feature_columns.pkl     # Feature ordering
│   └── feature_medians.pkl     # Missing value imputation
├── front-end/
│   ├── app/                    # Next.js app directory
│   ├── components/             # React components
│   │   ├── live-prediction.tsx # ML prediction UI + Voice
│   │   ├── analytics-view.tsx  # Charts and statistics
│   │   └── data-explorer.tsx   # Candidate browser
│   └── lib/                    # Utilities
├── training/
│   ├── train_model.py          # Model training script
│   ├── cumulative.csv          # Kepler dataset
│   └── training_metrics.json   # Performance metrics
└── PROJECT_DOCUMENTATION.md    # Comprehensive documentation
```

## 🎯 How It Works

### Two-Stage ML Pipeline

**Stage 1: Signal Quality Screening**
- Uses false positive flags (fpflags) to detect data quality issues
- Identifies stellar eclipses, centroid offsets, instrumental artifacts
- Early rejection if signal quality is poor (≥60% false positive probability)

**Stage 2: Physical Classification**
- Uses planetary and stellar features (radius, period, temperature, etc.)
- Random Forest classifier with 200 decision trees
- Classification thresholds:
  - ≥70%: Exoplanet Candidate
  - 40-70%: Uncertain
  - <40%: False Positive

### AI Voice Explanation
1. User runs prediction and sees results
2. Selects voice personality (Einstein or Kalpana Chawla)
3. Clicks "Explain with AI Voice"
4. Backend generates natural language explanation based on prediction stages
5. Frontend uses Web Speech API to speak explanation with personality-specific voice settings

## 📊 API Endpoints

- `POST /predict` - Two-stage ML classification
- `POST /explain` - Generate natural language explanation
- `GET /kepler-candidates` - Paginated dataset explorer
- `GET /analytics` - Visual analytics data
- `GET /metrics` - Model performance metrics

## 🎓 Educational Use

This project demonstrates:
- **Full-stack ML engineering**: From data preprocessing to production deployment
- **Two-stage classification**: Novel approach mirroring astronomical vetting
- **Explainable AI**: Voice-based explanations make ML accessible
- **Academic rigor**: Using peer-reviewed NASA data
- **Production best practices**: Type safety, error handling, CORS, caching

## 📈 Model Performance

| Metric       | Random Forest | Logistic Regression |
|--------------|---------------|---------------------|
| Accuracy     | 93%           | 88%                 |
| Precision    | 0.91          | 0.85                |
| Recall       | 0.89          | 0.80                |
| F1 Score     | 0.90          | 0.82                |

## 🌟 Key Highlights

✅ **100% Real Data** - No mock data, all analytics computed from NASA Kepler dataset  
✅ **Browser-Native Voice** - No external APIs, zero cost, privacy-preserving  
✅ **Scientific Accuracy** - Two-stage pipeline mirrors real astronomical vetting  
✅ **Production-Ready** - Type-safe, error-handled, documented  
✅ **Educational** - Comprehensive documentation for learning and demos  

## 🤝 Contributing

This is an academic project, but suggestions and improvements are welcome!

## 📄 License

MIT License - See LICENSE file for details

## 👨‍💻 Author

**Deepak**  
GitHub: [@Deepak8825](https://github.com/Deepak8825)

## 🙏 Acknowledgments

- **NASA Kepler Mission** for the exoplanet dataset
- **scikit-learn** for ML framework
- **Next.js & React** for frontend framework
- **FastAPI** for backend framework
- **Radix UI** for accessible components
- Honoring **Albert Einstein** and **Kalpana Chawla** through voice personalities

## 📚 Documentation

For detailed technical documentation, architecture, and viva preparation, see:
- [PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md) - Complete technical guide (1178 lines)

---

**Live Demo**: Run locally following Quick Start guide  
**Dataset Source**: [NASA Exoplanet Archive](https://exoplanetarchive.ipac.caltech.edu/)  
**Repository**: https://github.com/Deepak8825/ML-AST
