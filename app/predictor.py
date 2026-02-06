import joblib
import pandas as pd
from pathlib import Path

MODEL_DIR = Path(__file__).parent.parent / "models"

stage1_dict = joblib.load(MODEL_DIR / "stage1_failure_detector.pkl")
stage2_model = joblib.load(MODEL_DIR / "stage2_failure_classifier.pkl")
config = joblib.load(MODEL_DIR / "config.pkl")


stage1_model = stage1_dict["model"]
STAGE1_THRESHOLD = stage1_dict.get("threshold", config.get("stage1_threshold"))
STAGE1_FEATURES = stage1_dict["features"]


FAILURE_THRESHOLDS = config["failure_thresholds"]
FAILURE_COLS = config["failure_cols"]


def predict_machine_failure(input_data: dict):

    X = pd.DataFrame([input_data])
    X = X.reindex(columns=STAGE1_FEATURES)

    X.columns = X.columns.astype(str)
  
    p_fail = stage1_model.predict_proba(X)[0, 1]
    

    if p_fail < STAGE1_THRESHOLD:
        return {
            "failure": 0,
            "failure_probability": round(float(p_fail), 3), 
            "failure_types": None
        }
    
    
    X_array = X.values

    probs = stage2_model.predict_proba(X_array)
    
    failure_types = {}
    detected = False

    for i, col in enumerate(FAILURE_COLS):
        prob = probs[i][0, 1]
        if prob >= FAILURE_THRESHOLDS[col]:
            failure_types[col] = round(float(prob), 3)  
            detected = True

    if not detected:
        failure_types["RNF"] = round(float(p_fail), 3)  
    
    return {
        "failure": 1,
        "failure_probability": round(float(p_fail), 3), 
        "failure_types": failure_types
    }
