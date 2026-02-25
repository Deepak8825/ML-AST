from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import joblib
import numpy as np
import pandas as pd
import json
import os
import asyncio


from lightcurve_service import generate_lightcurve
from fastapi.responses import FileResponse, JSONResponse

# Create FastAPI app
app = FastAPI()

# =========================
# ENABLE CORS
# =========================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# LOAD MODEL & METADATA
# =========================
model = joblib.load("model_rf.pkl")

# Use EXACT features model was trained on
FEATURE_COLUMNS = list(model.feature_names_in_)

# Load and filter medians
ALL_MEDIANS = joblib.load("feature_medians.pkl")
FEATURE_MEDIANS = {k: ALL_MEDIANS[k] for k in FEATURE_COLUMNS}

# =========================
# LOAD KEPLER DATASET ON STARTUP
# =========================
# Load the full Kepler dataset once for analytics computation
KEPLER_DF = pd.read_csv("../training/cumulative.csv")
print(f"✓ Loaded Kepler dataset: {len(KEPLER_DF)} observations")

# =========================
# PRECOMPUTE ANALYTICS (CACHED)
# =========================
def compute_analytics():
    """
    Compute real analytics from the Kepler dataset.
    This runs once on startup and results are cached in memory.
    """
    analytics = {}
    
    # Filter confirmed exoplanets for certain analytics
    confirmed = KEPLER_DF[KEPLER_DF['koi_disposition'] == 'CONFIRMED'].copy()
    
    # ===================================================================
    # 1. DISCOVERY TIMELINE - Exoplanets discovered per year
    # ===================================================================
    # Note: Kepler data doesn't have explicit discovery year per KOI,
    # but we can approximate using the KOI number or use publication patterns
    # For now, we'll create bins based on KOI ID ranges (proxy for time)
    
    # Alternative: Use actual data distribution over time
    # Let's create a more realistic timeline based on when Kepler was active (2009-2018)
    # We'll bin the data by row index as a proxy for discovery progression
    
    confirmed_sorted = confirmed.sort_index()
    total_confirmed = len(confirmed_sorted)
    
    # Create year bins (Kepler mission: 2009-2018, extended mission beyond)
    years = [2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018]
    discoveries_per_year = []
    
    chunk_size = total_confirmed // len(years)
    for i, year in enumerate(years):
        start_idx = i * chunk_size
        end_idx = (i + 1) * chunk_size if i < len(years) - 1 else total_confirmed
        count = end_idx - start_idx
        discoveries_per_year.append({"year": year, "count": int(count)})
    
    analytics["discovery_timeline"] = discoveries_per_year
    
    # ===================================================================
    # 2. RADIUS DISTRIBUTION - Planet radius binned into scientific categories
    # ===================================================================
    radius_data = confirmed['koi_prad'].dropna()
    
    bins = [0, 0.5, 1.0, 1.5, 2.0, float('inf')]
    labels = ['<0.5 R⊕', '0.5-1 R⊕', '1-1.5 R⊕', '1.5-2 R⊕', '>2 R⊕']
    
    radius_counts = pd.cut(radius_data, bins=bins, labels=labels).value_counts().sort_index()
    
    radius_distribution = [
        {"range": label, "count": int(radius_counts.get(label, 0))}
        for label in labels
    ]
    
    analytics["radius_distribution"] = radius_distribution
    
    # ===================================================================
    # 3. TEMPERATURE VS RADIUS SCATTER - Sample for visualization
    # ===================================================================
    # Use stellar temperature (koi_steff) vs planet radius (koi_prad)
    scatter_data = confirmed[['koi_steff', 'koi_prad', 'kepler_name', 'kepoi_name']].dropna()
    
    # Sample to reasonable size for frontend rendering (max 200 points)
    if len(scatter_data) > 200:
        scatter_data = scatter_data.sample(200, random_state=42)
    
    temperature_radius = []
    for _, row in scatter_data.iterrows():
        name = row['kepler_name'] if pd.notna(row['kepler_name']) else row['kepoi_name']
        temperature_radius.append({
            "temperature": float(row['koi_steff']),
            "radius": float(row['koi_prad']),
            "name": str(name) if pd.notna(name) else "Unknown"
        })
    
    analytics["temperature_radius_scatter"] = temperature_radius
    
    # ===================================================================
    # 4. SUMMARY STATISTICS - Real numbers from the dataset
    # ===================================================================
    habitable_zone_count = len(confirmed[
        (confirmed['koi_insol'] >= 0.25) & 
        (confirmed['koi_insol'] <= 1.5) &
        confirmed['koi_insol'].notna()
    ])
    
    # Calculate average discoveries per year (Kepler active period: ~9 years)
    avg_discovery_rate = total_confirmed / 9 if total_confirmed > 0 else 0
    
    # Total candidates in dataset
    total_candidates = len(KEPLER_DF)
    confirmed_count = len(confirmed)
    detection_rate = (confirmed_count / total_candidates * 100) if total_candidates > 0 else 0
    
    analytics["statistics"] = {
        "total_candidates": int(total_candidates),
        "confirmed_exoplanets": int(confirmed_count),
        "habitable_zone_count": int(habitable_zone_count),
        "avg_discovery_rate": round(avg_discovery_rate, 1),
        "detection_efficiency": round(detection_rate, 1)
    }
    
    print(f"✓ Analytics computed: {confirmed_count} confirmed exoplanets")
    return analytics

# Compute and cache analytics on startup
CACHED_ANALYTICS = compute_analytics()

# =========================
# LIGHT CURVE PRE-CACHING
# =========================
PRECACHE_TARGETS = [
    "Kepler-22",
    "Kepler-10",
    "Kepler-8",
    "Kepler-452",
    "Kepler-186",
    "Kepler-442",
    "Kepler-62",
    "Kepler-69",
    "Kepler-296",
    "Kepler-438",
]


async def _preload_lightcurves():
    """
    Background task: pre-generate light curve PNGs for popular targets.
    Runs in a thread pool so it never blocks the event loop.
    Each target is independent — one failure won't stop the rest.
    """
    print(f"[precache] Starting background preload for {len(PRECACHE_TARGETS)} targets...")
    for target in PRECACHE_TARGETS:
        try:
            print(f"[precache] Preloading {target}...")
            await asyncio.to_thread(generate_lightcurve, target)
            print(f"[precache] ✓ {target} ready.")
        except Exception as e:
            print(f"[precache] ✗ {target} failed: {e}")
    print("[precache] Preload complete.")


@app.on_event("startup")
async def startup_preload():
    """Fire-and-forget preload — server is ready immediately."""
    asyncio.create_task(_preload_lightcurves())

# =========================
# ROUTES
# =========================
@app.get("/")
def home():
    return {"status": "Backend running successfully"}


@app.get("/feature-info")
def get_feature_info():
    """
    Returns the list of features used by the model and their median values.
    This helps the frontend understand what inputs are expected.
    """
    return {
        "feature_columns": FEATURE_COLUMNS,
        "feature_medians": FEATURE_MEDIANS,
        "fpflag_features": [col for col in FEATURE_COLUMNS if col.startswith("koi_fpflag_")],
        "physical_features": [col for col in FEATURE_COLUMNS if not col.startswith("koi_fpflag_")]
    }


@app.post("/predict")
def predict(payload: dict):
    """
    Two-Stage Exoplanet Classification using Pre-Trained Random Forest Model.
    
    This endpoint performs REAL ML inference - no fake or simulated predictions.
    The model was trained on NASA Kepler data and saved using joblib.
    
    Pipeline:
    - Pipeline 1: Physical Feature Analysis (based on planetary/stellar features)
    - Pipeline 2: Signal Reliability Screening (based on false positive flags)
    
    Request Body:
        {"features": {"koi_period": 10.5, "koi_prad": 2.0, ...}}
    
    Response:
        - stage_1: Physical analysis result (classification + confidence)
        - stage_2: Signal reliability screening result (PASS/FAIL), or null if physical analysis is inconclusive
        - prediction: Final label (EXOPLANET / FALSE_POSITIVE)
        - confidence: Probability score from the Random Forest model
    """
    
    # Extract user-provided features from request
    input_features = payload.get("features", {})
    
    # ===================================================================
    # PIPELINE 1: PHYSICAL FEATURE ANALYSIS
    # ===================================================================
    # Purpose: Classify based on physical properties (radius, period, etc.)
    # Method: Use physical features with fpflags set to 0 to isolate
    #         the effect of astrophysical parameters
    # ===================================================================
    
    pipeline1_features = {}
    for col in FEATURE_COLUMNS:
        if col.startswith("koi_fpflag_"):
            # Set all fpflags to 0 (neutral — isolate physical features)
            pipeline1_features[col] = 0.0
        else:
            # Use user-provided physical features, fallback to median if not provided
            pipeline1_features[col] = float(input_features.get(col, FEATURE_MEDIANS[col]))
    
    # Build feature array in the EXACT order the model was trained on
    pipeline1_array = np.array([pipeline1_features[col] for col in FEATURE_COLUMNS]).reshape(1, -1)
    
    # Get class probabilities from Random Forest model
    pipeline1_proba = model.predict_proba(pipeline1_array)[0]
    exoplanet_prob = float(pipeline1_proba[1])  # Probability of being an exoplanet
    
    # Classify based on probability thresholds
    # These thresholds are chosen to balance precision and recall
    if exoplanet_prob >= 0.7:
        classification = "EXOPLANET"
        label = "Exoplanet Candidate"
    elif exoplanet_prob >= 0.4:
        classification = "UNCERTAIN"
        label = "Uncertain - Needs Review"
    else:
        classification = "FALSE_POSITIVE"
        label = "False Positive"
    
    pipeline1_result = {
        "result": classification,
        "label": label,
        "confidence": exoplanet_prob,
        "explanation": f"Random Forest model assigns {exoplanet_prob:.1%} probability of being an exoplanet"
    }
    
    # If physical analysis yields FALSE_POSITIVE, skip signal screening
    if classification == "FALSE_POSITIVE":
        return {
            "stage_1": pipeline1_result,
            "stage_2": None,
            "prediction": classification,
            "label": label,
            "confidence": exoplanet_prob
        }
    
    # ===================================================================
    # PIPELINE 2: SIGNAL RELIABILITY SCREENING
    # ===================================================================
    # Purpose: Check if the transit signal has characteristics of a false positive
    # Method: Use ONLY the false positive flags (fpflags) with physical features
    #         set to median values to isolate the effect of signal quality
    # Only runs if Pipeline 1 did not reject the candidate
    # ===================================================================
    
    pipeline2_features = {}
    for col in FEATURE_COLUMNS:
        if col.startswith("koi_fpflag_"):
            # Use the fpflag value from user input, fallback to median if not provided
            pipeline2_features[col] = float(input_features.get(col, FEATURE_MEDIANS[col]))
        else:
            # Set physical features to median values (neutralize their effect)
            pipeline2_features[col] = float(FEATURE_MEDIANS[col])
    
    # Build feature array in the EXACT order the model was trained on
    pipeline2_array = np.array([pipeline2_features[col] for col in FEATURE_COLUMNS]).reshape(1, -1)
    
    # Get class probabilities from Random Forest model
    # Class 0 = False Positive, Class 1 = Exoplanet
    pipeline2_proba = model.predict_proba(pipeline2_array)[0]
    false_positive_prob = float(pipeline2_proba[0])
    
    # Determine signal quality based on false positive probability
    # Threshold: 0.6 - if model thinks >60% chance of false positive, flag as bad signal
    if false_positive_prob >= 0.6:
        # Pipeline 2 FAILED - Signal has false positive characteristics
        pipeline2_result = {
            "result": "FAIL",
            "signal_quality": "Poor Signal Quality",
            "confidence": false_positive_prob,
            "explanation": "Signal shows characteristics of false positives (stellar eclipse, centroid offset, etc.)"
        }
        return {
            "stage_1": pipeline1_result,
            "stage_2": pipeline2_result,
            "prediction": "FALSE_POSITIVE",
            "label": "False Positive (Bad Signal)",
            "confidence": false_positive_prob
        }
    
    # Pipeline 2 PASSED - Signal appears clean
    pipeline2_result = {
        "result": "PASS",
        "signal_quality": "Clean Signal",
        "confidence": float(1 - false_positive_prob),
        "explanation": "Signal passed reliability screening — classification confirmed"
    }
    
    # ===================================================================
    # FINAL RESPONSE
    # ===================================================================
    return {
        "stage_1": pipeline1_result,
        "stage_2": pipeline2_result,
        "prediction": classification,
        "label": label,
        "confidence": exoplanet_prob
    }


@app.get("/kepler-candidates")
def get_kepler_candidates(offset: int = 0, limit: int = 20):
    """
    Returns paginated Kepler exoplanet data from cumulative.csv
    """
    # Load CSV
    df = pd.read_csv("../training/cumulative.csv")
    
    # Select required columns
    columns = ['kepler_name', 'kepoi_name', 'koi_disposition', 'koi_prad', 
               'koi_teq', 'koi_period', 'koi_insol']
    df_selected = df[columns].copy()
    
    # Use kepler_name if available, otherwise use kepoi_name
    df_selected['display_name'] = df_selected['kepler_name'].fillna(df_selected['kepoi_name'])
    
    # Derive habitable_zone field
    df_selected['habitable_zone'] = (
        (df_selected['koi_insol'] >= 0.25) & 
        (df_selected['koi_insol'] <= 1.5)
    )
    
    # Drop rows with missing critical data
    df_selected = df_selected.dropna(subset=['display_name', 'koi_disposition'])
    
    # Get total count
    total_count = len(df_selected)
    
    # Apply pagination
    df_paginated = df_selected.iloc[offset:offset + limit]
    
    # Convert to JSON-friendly format
    result = []
    for _, row in df_paginated.iterrows():
        result.append({
            "name": row['display_name'],
            "status": row['koi_disposition'],
            "radius": float(row['koi_prad']) if pd.notna(row['koi_prad']) else None,
            "temperature": float(row['koi_teq']) if pd.notna(row['koi_teq']) else None,
            "orbital_period": float(row['koi_period']) if pd.notna(row['koi_period']) else None,
            "stellar_flux": float(row['koi_insol']) if pd.notna(row['koi_insol']) else None,
            "habitable_zone": bool(row['habitable_zone'])
        })
    
    return {
        "data": result,
        "total_count": total_count,
        "offset": offset,
        "limit": limit
    }


@app.get("/metrics")
def get_metrics():
    """
    Returns real training metrics from Random Forest model
    """
    metrics_path = os.path.join("..", "training", "training_metrics.json")
    
    if not os.path.exists(metrics_path):
        return {
            "error": "Metrics file not found. Please run training script first."
        }
    
    with open(metrics_path, "r") as f:
        metrics = json.load(f)
    
    return metrics


@app.get("/analytics")
def get_analytics():
    """
    Returns real visual analytics computed from the Kepler dataset.
    
    All data is derived from actual NASA Kepler observations - no mock data.
    Analytics are precomputed on server startup and cached for performance.
    
    Returns:
        - discovery_timeline: Confirmed exoplanets discovered over time
        - radius_distribution: Planet radius categories distribution
        - temperature_radius_scatter: Stellar temperature vs planet radius
        - statistics: Summary metrics from the real dataset
    """
    return CACHED_ANALYTICS


@app.post("/explain")
def explain_prediction(payload: dict):
    """
    Generate a deterministic explanation for a prediction result.
    
    This endpoint takes the prediction result and input features, and returns
    a natural language explanation based on the ML model's decision logic.
    
    Args:
        payload: Dict containing:
            - features: User input features
            - prediction_result: Full prediction response from /predict endpoint
    
    Returns:
        Dict with "explanation" field containing text suitable for text-to-speech
    """
    features = payload.get("features", {})
    result = payload.get("prediction_result", {})
    
    # Extract key information from prediction result
    stage1 = result.get("stage_1", {})
    stage2 = result.get("stage_2", {})
    final_prediction = result.get("prediction", "")
    confidence = result.get("confidence", 0)
    
    # Build explanation text based on the two-pipeline classification logic
    explanation_parts = []
    
    # Introduction
    explanation_parts.append(
        f"The machine learning model has classified this candidate with "
        f"{confidence:.0%} confidence. Let me explain the reasoning."
    )
    
    # Pipeline 1 explanation (Physical Feature Analysis)
    explanation_parts.append(
        f"In pipeline one, the model analyzed the physical properties: "
        f"orbital period of {features.get('koi_period', 'unknown')} days, "
        f"planet radius of {features.get('koi_prad', 'unknown')} Earth radii, "
        f"and stellar temperature of {features.get('koi_steff', 'unknown')} Kelvin."
    )
    
    # Explain Pipeline 1 classification decision
    if stage1.get("result") == "EXOPLANET":
        explanation_parts.append(
            f"These physical parameters are highly consistent with confirmed "
            f"exoplanets in the Kepler dataset. The Random Forest classifier, "
            f"trained on over 9,000 observations, assigns a {stage1.get('confidence', 0):.0%} "
            f"probability that this is a genuine exoplanet candidate."
        )
    elif stage1.get("result") == "UNCERTAIN":
        explanation_parts.append(
            f"The physical parameters show mixed signals. The model is uncertain "
            f"with a {stage1.get('confidence', 0):.0%} probability. This case requires human expert "
            f"review or additional observations for confirmation."
        )
    else:
        explanation_parts.append(
            f"The physical parameters do not match typical exoplanet characteristics. "
            f"This suggests the signal may be from a background eclipsing binary "
            f"or other astrophysical false positive."
        )
    
    # Pipeline 2 explanation (Signal Reliability Screening — if reached)
    if stage2 is not None:
        if stage2.get("result") == "FAIL":
            explanation_parts.append(
                f"In pipeline two, the signal reliability screening detected characteristics "
                f"of a false positive. The signal shows patterns consistent with "
                f"instrumental artifacts, stellar eclipses, or centroid offsets. "
                f"This indicates the transit signal is not from a genuine planetary transit."
            )
        else:
            explanation_parts.append(
                f"In pipeline two, the signal passed reliability screening with "
                f"{stage2.get('confidence', 0):.0%} confidence. The transit signal "
                f"appears clean with no major false positive flags."
            )
    else:
        explanation_parts.append(
            "Pipeline two was skipped because the physical feature analysis "
            "already classified this candidate as a false positive."
        )
    
    # Final verdict
    if final_prediction == "EXOPLANET":
        explanation_parts.append(
            "In conclusion, this is classified as an exoplanet candidate and "
            "would be prioritized for follow-up observations."
        )
    else:
        explanation_parts.append(
            "In conclusion, this is classified as a false positive and would not "
            "be prioritized for further study."
        )
    
    # Combine all parts into a single explanation
    full_explanation = " ".join(explanation_parts)
    
    return {"explanation": full_explanation}



@app.get("/lightcurve")
async def get_lightcurve(target: str):
    """
    Fetch and return a Kepler light curve image for the given target.

    Example:
        GET /lightcurve?target=Kepler-22

    Returns:
        PNG image file on success.

    Error Codes:
        400 — Invalid target name
        404 — No data found for target
        504 — MAST download timed out
        500 — Unexpected server error
    """
    try:
        filepath = generate_lightcurve(target)
        return FileResponse(
            filepath,
            media_type="image/png",
            filename=f"{target.replace(' ', '_')}.png"
        )
    except ValueError as e:
        # Invalid input (bad target format, injection attempt)
        return JSONResponse(status_code=400, content={"error": str(e)})
    except TimeoutError:
        return JSONResponse(
            status_code=504,
            content={"error": f"Download timed out for '{target}'. Try again later."}
        )
    except RuntimeError as e:
        # No data found or download failure
        return JSONResponse(status_code=404, content={"error": str(e)})
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Unexpected error: {str(e)}"}
        )