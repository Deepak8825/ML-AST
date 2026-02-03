# ================================
# 1. IMPORT LIBRARIES
# ================================
import pandas as pd
import numpy as np
import joblib
import matplotlib.pyplot as plt
import json

from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, confusion_matrix, ConfusionMatrixDisplay, precision_score, recall_score, f1_score


# ================================
# 2. LOAD DATASET
# ================================
data = pd.read_csv("cumulative.csv")


# ================================
# 3. CREATE TARGET COLUMN
# ================================
data["target"] = data["koi_disposition"].apply(
    lambda x: 0 if x == "FALSE POSITIVE" else 1
)


# ================================
# 4. DROP USELESS COLUMNS
# ================================
data = data.drop(
    columns=["rowid", "kepid", "kepoi_name", "kepler_name"],
    errors="ignore"
)


# ================================
# 5. FEATURE SELECTION
# ================================
X = data.select_dtypes(include="number")
y = data["target"]

X = X.drop(columns=["target"], errors="ignore")
FEATURE_COLUMNS = X.columns.tolist()

FEATURE_MEDIANS = X.median().to_dict()




# ================================
# 6. HANDLE MISSING VALUES
# ================================
X = X.dropna(axis=1)
assert X.isnull().sum().sum() == 0


# ================================
# 7. TRAIN / TEST SPLIT
# ================================
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)


# ================================
# 8. LOGISTIC REGRESSION MODEL
# ================================
lr_model = LogisticRegression(max_iter=1000)
lr_model.fit(X_train, y_train)

lr_pred = lr_model.predict(X_test)
lr_accuracy = accuracy_score(y_test, lr_pred)
lr_cm = confusion_matrix(y_test, lr_pred)


# ================================
# 9. RANDOM FOREST MODEL
# ================================
rf_model = RandomForestClassifier(
    n_estimators=200,
    random_state=42
)
rf_model.fit(X_train, y_train)

rf_pred = rf_model.predict(X_test)
rf_accuracy = accuracy_score(y_test, rf_pred)
rf_cm = confusion_matrix(y_test, rf_pred)


# ================================
# 10. PRINT ACCURACY
# ================================
print("Logistic Regression Accuracy :", lr_accuracy)
print("Random Forest Accuracy       :", rf_accuracy)


# ================================
# 11. VISUALIZATION SECTION
# ================================

# ---- Class Distribution ----
plt.figure()
data["target"].value_counts().plot(kind="bar")
plt.title("Class Distribution (0 = False Positive, 1 = Exoplanet)")
plt.xlabel("Class")
plt.ylabel("Count")
plt.show()


# ---- Confusion Matrix: Logistic Regression ----
disp_lr = ConfusionMatrixDisplay(lr_cm)
disp_lr.plot()
plt.title("Logistic Regression - Confusion Matrix")
plt.show()


# ---- Confusion Matrix: Random Forest ----
disp_rf = ConfusionMatrixDisplay(rf_cm)
disp_rf.plot()
plt.title("Random Forest - Confusion Matrix")
plt.show()


# ---- Feature Importance (Random Forest) ----
importances = pd.Series(
    rf_model.feature_importances_,
    index=X.columns
).sort_values(ascending=False)

plt.figure()
importances.head(10).plot(kind="bar")
plt.title("Top 10 Important Features (Random Forest)")
plt.xlabel("Feature")
plt.ylabel("Importance")
plt.show()


# ================================
# 12. SAVE MODELS
# ================================
joblib.dump(lr_model, "model_lr.pkl")
joblib.dump(rf_model, "model_rf.pkl")

print("\nModels saved successfully:")
print(" - model_lr.pkl")
print(" - model_rf.pkl")  


joblib.dump(FEATURE_COLUMNS, "feature_columns.pkl")
print("Feature order saved.")


joblib.dump(FEATURE_MEDIANS, "feature_medians.pkl")
print("Feature medians saved.")


# ================================
# 13. SAVE REAL METRICS TO JSON
# ================================

# Compute precision, recall, f1 for Logistic Regression
lr_precision = precision_score(y_test, lr_pred)
lr_recall = recall_score(y_test, lr_pred)
lr_f1 = f1_score(y_test, lr_pred)

# Compute precision, recall, f1 for Random Forest
rf_precision = precision_score(y_test, rf_pred)
rf_recall = recall_score(y_test, rf_pred)
rf_f1 = f1_score(y_test, rf_pred)

# Get top 10 feature importances from Random Forest
rf_feature_importance_df = pd.DataFrame({
    'feature': X.columns,
    'importance': rf_model.feature_importances_
}).sort_values('importance', ascending=False).head(10)

rf_top_features = rf_feature_importance_df.to_dict('records')

# Get feature coefficients from Logistic Regression (absolute values)
lr_feature_importance_df = pd.DataFrame({
    'feature': X.columns,
    'importance': np.abs(lr_model.coef_[0])
}).sort_values('importance', ascending=False).head(10)

# Normalize LR coefficients to [0, 1] for comparison
max_coef = lr_feature_importance_df['importance'].max()
lr_feature_importance_df['importance'] = lr_feature_importance_df['importance'] / max_coef

lr_top_features = lr_feature_importance_df.to_dict('records')

# Prepare metrics dictionary for BOTH models
metrics = {
    "logistic_regression": {
        "model_name": "Logistic Regression",
        "accuracy": float(lr_accuracy),
        "precision": float(lr_precision),
        "recall": float(lr_recall),
        "f1_score": float(lr_f1),
        "confusion_matrix": {
            "true_negative": int(lr_cm[0][0]),
            "false_positive": int(lr_cm[0][1]),
            "false_negative": int(lr_cm[1][0]),
            "true_positive": int(lr_cm[1][1])
        },
        "top_features": lr_top_features
    },
    "random_forest": {
        "model_name": "Random Forest",
        "accuracy": float(rf_accuracy),
        "precision": float(rf_precision),
        "recall": float(rf_recall),
        "f1_score": float(rf_f1),
        "confusion_matrix": {
            "true_negative": int(rf_cm[0][0]),
            "false_positive": int(rf_cm[0][1]),
            "false_negative": int(rf_cm[1][0]),
            "true_positive": int(rf_cm[1][1])
        },
        "top_features": rf_top_features
    }
}

# Save to JSON
with open("training_metrics.json", "w") as f:
    json.dump(metrics, f, indent=2)

print("\nTraining metrics saved to training_metrics.json")
print(f"\nLogistic Regression Metrics:")
print(f"  Accuracy:  {lr_accuracy:.4f}")
print(f"  Precision: {lr_precision:.4f}")
print(f"  Recall:    {lr_recall:.4f}")
print(f"  F1 Score:  {lr_f1:.4f}")
print(f"\nRandom Forest Metrics:")
print(f"  Accuracy:  {rf_accuracy:.4f}")
print(f"  Precision: {rf_precision:.4f}")
print(f"  Recall:    {rf_recall:.4f}")
print(f"  F1 Score:  {rf_f1:.4f}")

