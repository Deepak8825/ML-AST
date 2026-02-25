# Exoplanet Detection & Analysis Platform

## PSG Tech Observatory

> A machine learning-powered web platform for exoplanet candidate classification and visual analytics, built on NASA Kepler mission data.

---

## 1. Executive Summary

The Exoplanet Detection & Analysis Platform is a full-stack web application that leverages machine learning to classify Kepler Objects of Interest (KOIs) as confirmed exoplanets or false positives. The system implements a **two-stage Random Forest classification pipeline**, serves real-time predictions via a FastAPI backend, and presents interactive analytics through a Next.js 15 frontend featuring Three.js-rendered visual effects.

The platform operates on the **NASA Kepler Cumulative dataset** (9,564 observations) and achieves a **Random Forest accuracy of 98.22%** on held-out test data with an 80/20 stratified split. All analytics, charts, and prediction results are derived from real observational data — no mock or synthetic data is used in production.

Key capabilities include:
- **Two-stage ML classification** with signal quality screening and physical plausibility analysis
- **Paginated data exploration** of the full Kepler candidate catalog
- **Real-time visual analytics** computed from actual NASA observations
- **Light curve fetching** from the NASA MAST archive via the `lightkurve` library
- **Interactive 3D galaxy background** using Three.js and `@react-three/fiber`
- **AI-narrated explanations** of prediction results with text-to-speech

---

## 2. Problem Statement

NASA's Kepler space telescope observed over 150,000 stars during its primary mission (2009–2018), identifying thousands of transit events that could indicate orbiting exoplanets. However, many of these signals are **false positives** caused by:

- Eclipsing binary star systems
- Instrumental noise and artifacts
- Centroid offset contamination from nearby stars

Manually reviewing each candidate is time-consuming and requires domain expertise. This project addresses that challenge by building an automated classification system that:

1. Screens transit signals for false positive characteristics
2. Evaluates physical plausibility of planetary parameters
3. Provides interactive tools for data exploration and visualization

---

## 3. Objectives

1. Develop a two-stage machine learning pipeline to classify KOIs using the Kepler cumulative dataset
2. Build a RESTful API to serve predictions, analytics, and light curve data
3. Create a responsive, visually engaging frontend for data exploration and model interaction
4. Integrate with NASA's MAST archive for real light curve retrieval
5. Implement input validation, error handling, and caching for production readiness

---

## 4. System Architecture

The platform follows a three-tier architecture:

```
┌──────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js 15)                  │
│  Navigation │ Hero │ Data Explorer │ Analytics │ ML Models│
│  Live Prediction │ Galaxy Background │ Light Curve Modal  │
├──────────────────────────────────────────────────────────┤
│                    BACKEND (FastAPI)                       │
│  /predict │ /analytics │ /kepler-candidates │ /metrics    │
│  /lightcurve │ /explain │ /feature-info                   │
├──────────────────────────────────────────────────────────┤
│                    ML LAYER (scikit-learn)                 │
│  Random Forest (200 trees) │ Logistic Regression          │
│  Feature Medians │ Two-Stage Pipeline                     │
├──────────────────────────────────────────────────────────┤
│                    EXTERNAL SERVICES                      │
│  NASA MAST Archive (lightkurve) │ Kepler cumulative.csv   │
└──────────────────────────────────────────────────────────┘
```

### 4.1 Frontend
- **Framework**: Next.js 15 with Turbopack
- **Rendering**: Client-side components for interactive elements, server components for layout
- **State**: React `useState` and `useEffect` hooks; no external state library
- **Visualization**: Recharts for charts, Three.js for 3D background

### 4.2 Backend
- **Framework**: FastAPI with Uvicorn (ASGI)
- **CORS**: Restricted to `localhost:3000` and `127.0.0.1:3000`
- **Model Serving**: Pre-loaded `joblib` models with in-memory feature medians
- **Caching**: Analytics precomputed on startup; light curves cached to disk

### 4.3 ML Layer
- **Primary Model**: Random Forest Classifier (200 estimators, `random_state=42`)
- **Baseline Model**: Logistic Regression (`max_iter=1000`)
- **Serialization**: `joblib` for model persistence (`model_rf.pkl`, `model_lr.pkl`)

### 4.4 External APIs
- **NASA MAST Archive**: Queried via `lightkurve.search_lightcurve()` for Kepler mission light curves
- **No other external APIs are used** — all data processing is local

---

## 5. Technology Stack

| Layer | Technology | Version / Detail |
|-------|-----------|-----------------|
| **Frontend Framework** | Next.js | 15 (Turbopack) |
| **UI Library** | React | 18+ |
| **Styling** | Tailwind CSS | v4 (CSS-based config) |
| **Charts** | Recharts | Line, Bar, Scatter |
| **3D Graphics** | Three.js + @react-three/fiber | WebGL spiral galaxy |
| **Animations** | Framer Motion | Scroll-triggered, hover effects |
| **Backend Framework** | FastAPI | Python ASGI |
| **ML Library** | scikit-learn | RandomForestClassifier, LogisticRegression |
| **Data Processing** | pandas, NumPy | Feature engineering, analytics |
| **Model Serialization** | joblib | .pkl format |
| **Light Curves** | lightkurve | NASA MAST integration |
| **Plotting** | matplotlib | Light curve PNG generation |
| **Server** | Uvicorn | ASGI with hot reload |

---

## 6. Machine Learning Pipeline

### 6.1 Dataset

The project uses the **NASA Kepler Cumulative KOI Table** (`cumulative.csv`), containing 9,564 observations. Each row represents a Kepler Object of Interest with:

- **Target variable**: `koi_disposition` — mapped to binary: `CONFIRMED` → 1, `FALSE POSITIVE` → 0
- **Feature columns**: All numeric columns after dropping identifiers (`rowid`, `kepid`, `kepoi_name`, `kepler_name`)
- **Missing value handling**: Columns with any NaN values are dropped entirely (`dropna(axis=1)`)

### 6.2 Feature Selection

Features are selected automatically:
1. All numeric columns from the dataset are included
2. The `target` column is excluded from predictors
3. Columns with missing values are removed
4. Feature medians are computed and saved (`feature_medians.pkl`) for use during inference

Key features used by the model include:

| Feature | Description | Type |
|---------|------------|------|
| `koi_fpflag_ss` | Stellar eclipse flag | Signal quality |
| `koi_fpflag_nt` | Not transit-like flag | Signal quality |
| `koi_fpflag_co` | Centroid offset flag | Signal quality |
| `koi_fpflag_ec` | Ephemeris match flag | Signal quality |
| `koi_period` | Orbital period (days) | Physical |
| `koi_duration` | Transit duration (hours) | Physical |
| `koi_prad` | Planet radius (Earth radii) | Physical |
| `koi_steff` | Stellar effective temperature (K) | Physical |
| `koi_insol` | Insolation flux (Earth flux) | Physical |

### 6.3 Two-Stage Classification Logic

The prediction endpoint implements a **novel two-stage approach** using a single Random Forest model:

**Stage 1 — Signal Quality Screening**
- Uses only `koi_fpflag_*` features from user input
- Sets all physical features to their **median values** (neutral baseline)
- If the model predicts >60% false positive probability → **FAIL** (reject signal)
- Purpose: Isolate signal quality from physical plausibility

**Stage 2 — Physical Plausibility Classification** (only runs if Stage 1 passes)
- Uses physical features from user input
- Sets all `koi_fpflag_*` features to **0** (assume clean signal, already verified)
- Classification thresholds:
  - ≥70% exoplanet probability → **EXOPLANET**
  - 40–70% → **UNCERTAIN** (needs review)
  - <40% → **FALSE_POSITIVE**

This two-stage approach improves interpretability by separating *why* a signal was rejected.

### 6.4 Model Training Results

| Metric | Logistic Regression | Random Forest |
|--------|-------------------|---------------|
| **Accuracy** | 98.17% | 98.22% |
| **Precision** | 97.91% | 97.92% |
| **Recall** | 98.24% | 98.35% |
| **F1 Score** | 98.08% | 98.13% |

**Confusion Matrix (Random Forest)**:

|  | Predicted Negative | Predicted Positive |
|--|-------------------|--------------------|
| **Actual Negative** | 986 (TN) | 19 (FP) |
| **Actual Positive** | 15 (FN) | 893 (TP) |

Training configuration:
- **Train/test split**: 80/20 with stratified sampling
- **Random state**: 42 (reproducible)
- **Random Forest**: 200 estimators (default hyperparameters)
- **Logistic Regression**: max_iter=1000

### 6.5 Top Feature Importances (Random Forest)

| Rank | Feature | Importance |
|------|---------|-----------|
| 1 | `koi_fpflag_ss` | 0.2908 |
| 2 | `koi_fpflag_nt` | 0.2862 |
| 3 | `koi_fpflag_co` | 0.2020 |
| 4 | `koi_fpflag_ec` | 0.0682 |
| 5 | `koi_period` | 0.0588 |
| 6 | `koi_duration` | 0.0301 |
| 7 | `koi_time0bk` | 0.0289 |
| 8 | `ra` | 0.0182 |
| 9 | `dec` | 0.0168 |

The four false positive flags account for ~85% of the model's decision-making, validating the two-stage pipeline design.

---

## 7. Backend Design

### 7.1 API Endpoints

| Method | Endpoint | Description |
|--------|---------|-------------|
| `GET` | `/` | Health check — returns server status |
| `GET` | `/feature-info` | Returns expected feature names and median values |
| `POST` | `/predict` | Two-stage ML prediction with confidence scores |
| `GET` | `/kepler-candidates` | Paginated Kepler catalog (offset/limit) |
| `GET` | `/metrics` | Real training metrics from `training_metrics.json` |
| `GET` | `/analytics` | Precomputed visual analytics from dataset |
| `POST` | `/explain` | Natural language explanation of prediction results |
| `GET` | `/lightcurve?target=` | Light curve PNG from MAST archive |

### 7.2 Validation Strategy

- **Input validation**: The `/lightcurve` endpoint uses regex whitelisting (`^(Kepler-\d+|KOI-\d+|KIC \d+)$`) to accept only valid Kepler target formats
- **Path traversal protection**: Blocks `\`, `/`, `..`, and null bytes in target names
- **Target normalization**: Converts dataset formats (e.g., `K00744.01` → `KOI-744`, `Kepler-8 b` → `Kepler-8`) before validation
- **Filename sanitization**: Strips non-alphanumeric characters for safe disk storage

### 7.3 Error Handling

The `/lightcurve` endpoint returns proper HTTP status codes:

| Code | Condition |
|------|----------|
| 200 | Success — returns PNG image |
| 400 | Invalid target name or injection attempt |
| 404 | No data found in MAST archive |
| 504 | Download timed out (60-second limit) |
| 500 | Unexpected server error |

### 7.4 Caching Strategy

1. **Analytics caching**: Computed once on server startup from `cumulative.csv` and stored in memory (`CACHED_ANALYTICS`). Subsequent requests return the cached result instantly.
2. **Light curve disk caching**: Generated PNGs are saved to `back-end/lightcurves/`. If a file already exists, it is returned immediately without re-downloading from MAST.
3. **Pre-caching**: On server startup, a background task pre-generates light curves for 10 popular targets (Kepler-22, Kepler-10, Kepler-452, etc.) using `asyncio.create_task` so the server remains responsive during warm-up.

---

## 8. Frontend Architecture

### 8.1 UI Structure

The frontend is a single-page application with scroll-based navigation across 5 sections:

| Section | Component | Description |
|---------|----------|-------------|
| **Hero** | `hero-section.tsx` | Landing with animated counters and image carousel |
| **Data Explorer** | `data-explorer.tsx` | Paginated table with status badges and light curve modal |
| **Visual Analytics** | `analytics-view.tsx` | Line chart, bar chart, scatter plot with real data |
| **ML Models** | `ml-models.tsx` | Model comparison, confusion matrices, feature importance |
| **Live Prediction** | `live-prediction.tsx` | Interactive prediction form with AI voice narration |

Supporting components: `navigation.tsx` (sticky header with scroll detection), `scroll-observer.tsx` (section tracking), `image-carousel.tsx` (hero images), `footer.tsx`.

### 8.2 State Management

The application uses React's built-in hooks exclusively:
- `useState` for component-level state (form inputs, API responses, loading/error states)
- `useEffect` for data fetching on mount
- `useRef` for DOM references (scroll observers, Three.js refs)
- No Redux, Zustand, or external state libraries

### 8.3 Data Visualization

Three Recharts visualizations, all powered by real data from `/analytics`:

1. **Discovery Timeline** — `LineChart` showing confirmed exoplanets across Kepler mission years (2009–2018)
2. **Radius Distribution** — `BarChart` with planet radii binned into 5 scientific categories (<0.5 R⊕ to >2 R⊕)
3. **Stellar Temperature vs Planet Radius** — `ScatterChart` with 200 sampled data points from confirmed exoplanets

Each chart uses `ResponsiveContainer` with explicit height, custom tooltips with glassmorphism styling, and scroll-triggered Framer Motion animations.

### 8.4 Galaxy Background Implementation

The 3D background is implemented using:
- **`@react-three/fiber`** — React renderer for Three.js
- **`GalaxyBackground.tsx`** — 9,000 particles arranged in a 5-arm spiral galaxy
- **Color gradient**: Warm white core (`#fff5d1`) → blue mid-arms (`#8ec5ff`) → deep navy outer (`#1e3a8a`)
- **`GalaxyWrapper.tsx`** — Client-side wrapper using `next/dynamic` with `ssr: false` to avoid server-side Three.js loading
- **Performance**: Antialiasing disabled, DPR capped at 1.5, additive blending, no shadows
- **Layering**: Canvas fixed at `z-index: -1` with `pointer-events: none`; content sections wrapped in a solid `bg-[#020409]` container

---

## 9. Light Curve Integration

### 9.1 NASA MAST Archive

Light curves are fetched from the **Mikulski Archive for Space Telescopes (MAST)** using the `lightkurve` Python library. The system supports three target naming formats:

| Format | Example |
|--------|---------|
| Kepler name | `Kepler-22` |
| KOI identifier | `KOI-123` |
| KIC number | `KIC 12345678` |

### 9.2 FITS Processing

1. `lightkurve.search_lightcurve(target, mission="Kepler")` queries MAST for available observations
2. `.download()` retrieves the FITS file containing flux measurements over time
3. The library handles detrending and normalization internally

### 9.3 Image Rendering

1. Light curve data is plotted using `matplotlib` with a 10×4 inch figure at 150 DPI
2. The resulting PNG is saved to `back-end/lightcurves/` with a sanitized filename
3. All `matplotlib` figures are explicitly closed after saving to prevent memory leaks (`plt.close("all")`)
4. The frontend displays the PNG in a modal overlay with loading and error states

---

## 10. Security Measures

| Measure | Implementation |
|---------|---------------|
| **CORS restriction** | Only `localhost:3000` and `127.0.0.1:3000` allowed |
| **Input validation** | Regex whitelist for target names |
| **Path traversal prevention** | Blocks `\`, `/`, `..`, null bytes |
| **Filename sanitization** | Non-alphanumeric characters replaced with `_` |
| **Error disclosure** | Specific error codes instead of stack traces in responses |
| **Memory management** | Explicit cleanup of matplotlib figures |
| **Timeout protection** | 60-second download timeout for MAST queries |

---

## 11. Performance Optimization

| Optimization | Detail |
|-------------|--------|
| **Analytics precomputation** | Computed once on startup, served from memory |
| **Light curve pre-caching** | 10 popular targets pre-generated in background on startup |
| **Disk caching** | Light curve PNGs cached — no re-download on repeated requests |
| **Three.js optimization** | Antialiasing off, DPR capped at 1.5, `powerPreference: "low-power"` |
| **Paginated API** | `/kepler-candidates` uses offset/limit to avoid loading full dataset |
| **Stratified data sampling** | Scatter plot limited to 200 points for frontend rendering performance |

---

## 12. Deployment Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm 9+

### Backend Setup
```bash
cd back-end
python -m venv venv
venv\Scripts\activate        # Windows
pip install fastapi uvicorn joblib pandas numpy scikit-learn lightkurve matplotlib
uvicorn main:app --reload --port 8000
```

### Frontend Setup
```bash
cd front-end
npm install
npm run dev
```

### Training (if models need retraining)
```bash
cd training
python train_model.py
# Outputs: model_rf.pkl, model_lr.pkl, feature_columns.pkl, feature_medians.pkl, training_metrics.json
# Copy model_rf.pkl and feature_medians.pkl to back-end/
```

### Access
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs (Swagger UI)

---

## 13. Demo Walkthrough

1. **Landing page**: 3D galaxy background with animated counters showing 9,000+ exoplanets catalogued
2. **Scroll to Data Explorer**: Browse paginated Kepler candidates. Click "View Signal" on any row to see its actual light curve fetched from NASA MAST
3. **Visual Analytics**: Three interactive charts display real data from the Kepler dataset — discovery timeline, radius distribution, and temperature-radius correlation
4. **ML Models**: Toggle between Logistic Regression and Random Forest to compare accuracy, precision, recall, F1, confusion matrices, and feature importances
5. **Live Prediction**: Enter planetary parameters (orbital period, radius, temperature, etc.) and false positive flags. Click "Run Prediction" to get a two-stage classification result. Use the AI voice feature to hear an Einstein or Kalpana Chawla narration of the prediction explanation

---

## 14. Limitations

1. **Single model architecture**: The two-stage pipeline reuses one Random Forest model with different feature masking rather than training separate specialized models for each stage
2. **Discovery timeline approximation**: The Kepler dataset does not include a per-KOI discovery year column; the timeline chart uses row-index binning as a temporal proxy
3. **No real-time data**: The system operates on the static Kepler cumulative dataset; it does not ingest live telescope data
4. **Light curve availability**: Not all KOIs have downloadable light curves in MAST; some targets return 404 errors
5. **Local deployment only**: No production deployment configuration (Docker, cloud hosting) is currently included
6. **No authentication**: The API has no user authentication or rate limiting
7. **Feature completeness**: Columns with any NaN values are dropped during training, which may exclude informative features with partial coverage

---

## 15. Future Improvements

1. **Separate stage-specific models**: Train a dedicated signal quality classifier (Stage 1) and a physical plausibility classifier (Stage 2) for improved accuracy
2. **Deep learning**: Implement a convolutional neural network (CNN) for direct light curve image classification
3. **TESS integration**: Extend the platform to include data from NASA's Transiting Exoplanet Survey Satellite (TESS)
4. **Habitable zone analysis**: Add a dedicated section for habitable zone candidates with insolation flux filtering
5. **Docker containerization**: Package the full stack for reproducible single-command deployment
6. **User authentication**: Add API key-based access control and rate limiting
7. **Hyperparameter tuning**: Implement GridSearchCV or RandomizedSearchCV for optimized model performance
8. **Feature imputation**: Replace column-dropping with imputation strategies (median, KNN) to retain more features

---

## 16. Conclusion

The Exoplanet Detection & Analysis Platform demonstrates a practical application of machine learning to astronomical data analysis. By combining a two-stage Random Forest classification pipeline with an interactive web frontend, the system provides an accessible interface for exploring NASA Kepler data, understanding ML model decisions, and performing real-time exoplanet candidate evaluation.

The platform achieves 98.22% accuracy on the Kepler cumulative dataset while maintaining a clean separation between signal quality assessment and physical plausibility analysis. The integration with NASA's MAST archive for light curve retrieval, combined with real data-driven analytics and visualizations, positions this as a functional research-support tool rather than a demonstration prototype.

All prediction results, analytics, and visualizations are computed from real observational data. No mock data, simulated results, or hardcoded responses are used in the production system.

---

*PSG Tech Observatory — Exoplanet Detection & Analysis Platform*
*Built with Python, FastAPI, scikit-learn, Next.js 15, Three.js, and NASA Kepler data*
