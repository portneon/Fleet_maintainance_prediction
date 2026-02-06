# Model Documentation

Technical documentation for the machine learning models used in the Fleet Maintenance Prediction system.

## Overview

The prediction system uses a two-stage hierarchical approach:

1. **Stage 1**: Binary classification to detect if failure will occur
2. **Stage 2**: Multi-label classification to identify specific failure types

## Stage 1: Failure Detection Model

### Model Details

- **File**: `models/stage1_failure_detector.pkl`
- **Type**: XGBoost Binary Classifier
- **Task**: Binary classification (Failure / No Failure)
- **Output**: Probability score between 0.0 and 1.0

### Architecture

```python
{
    "model": XGBoostClassifier object,
    "threshold": float,  # Detection threshold
    "features": list     # Feature names in order
}
```

### Features Used

The model uses 7 input features:

1. `Air_temperature` - Ambient air temperature (Kelvin)
2. `Process_temperature` - Process operating temperature (Kelvin)
3. `Rotational_speed` - Rotational speed (RPM)
4. `Torque` - Torque measurement (Nm)
5. `Tool_wear` - Tool wear duration (minutes)
6. `Type_L` - Low quality machine type (boolean)
7. `Type_M` - Medium quality machine type (boolean)

### Decision Logic

```
IF failure_probability >= threshold:
    → Proceed to Stage 2
ELSE:
    → Return "No Failure" (failure=0)
```

### Threshold Configuration

The threshold value is stored in the model dictionary and determines the sensitivity:

- **Lower threshold**: More sensitive, catches more potential failures (higher false positives)
- **Higher threshold**: Less sensitive, only flags high-confidence failures (lower false positives)

Default threshold is typically set between 0.4 and 0.6 based on validation data.

## Stage 2: Failure Classification Model

### Model Details

- **File**: `models/stage2_failure_classifier.pkl`
- **Type**: Multi-Label Classifier Chain
- **Task**: Multi-label classification for failure types
- **Output**: Probability scores for each failure type

### Failure Categories

| Code | Name | Description | Common Causes |
|------|------|-------------|---------------|
| **HDF** | Heat Dissipation Failure | Cooling system malfunction | High process temp, low air temp |
| **PWF** | Power Failure | Electrical/power issues | Torque spikes, speed irregularities |
| **OSF** | Overstrain Failure | Excessive mechanical stress | High torque, high speed combination |
| **TWF** | Tool Wear Failure | Tool degradation | Extended tool wear time |
| **RNF** | Random Failure | Unclassified/sporadic failures | Various factors |

### Classification Logic

```python
for each failure_type in [HDF, PWF, OSF, TWF]:
    probability = model.predict_proba(input)[failure_type]
    
    if probability >= failure_threshold[failure_type]:
        → Include in failure_types output
    
if no failure types detected:
    → Return RNF (Random Failure)
```

### Thresholds by Type

Each failure type has its own threshold (configurable in `config.pkl`):

```python
failure_thresholds = {
    "HDF": 0.6,  # Heat Dissipation
    "PWF": 0.65, # Power Failure
    "OSF": 0.7,  # Overstrain
    "TWF": 0.55  # Tool Wear
}
```

## Configuration File

### File: `models/config.pkl`

The configuration file contains model parameters and thresholds.

**Structure**:
```python
{
    "stage1_threshold": 0.5,
    "failure_thresholds": {
        "HDF": 0.6,
        "PWF": 0.65,
        "OSF": 0.7,
        "TWF": 0.55
    },
    "failure_cols": ["HDF", "PWF", "OSF", "TWF"]
}
```

### Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `stage1_threshold` | float | Minimum probability for Stage 1 | 0.5 |
| `failure_thresholds` | dict | Individual thresholds per failure type | See above |
| `failure_cols` | list | Ordered list of failure type names | ["HDF", "PWF", "OSF", "TWF"] |

## Prediction Pipeline

### Complete Flow

```python
# 1. Load input data
input_data = {
    "Air_temperature": -5.0,
    "Process_temperature": 150.0,
    "Rotational_speed": 5000,
    "Torque": 80.0,
    "Tool_wear": 300.0,
    "Type_L": True,
    "Type_M": False
}

# 2. Convert to DataFrame
X = pd.DataFrame([input_data])
X = X.reindex(columns=STAGE1_FEATURES)

# 3. Stage 1: Failure Detection
p_fail = stage1_model.predict_proba(X)[0, 1]

if p_fail < STAGE1_THRESHOLD:
    # Early exit - no failure
    return {
        "failure": 0,
        "failure_probability": p_fail,
        "failure_types": None
    }

# 4. Stage 2: Failure Classification
X_array = X.values
probs = stage2_model.predict_proba(X_array)

# 5. Identify specific failures
failure_types = {}
for i, col in enumerate(FAILURE_COLS):
    prob = probs[i][0, 1]
    if prob >= FAILURE_THRESHOLDS[col]:
        failure_types[col] = round(prob, 3)

# 6. Handle edge case
if not failure_types:
    failure_types["RNF"] = p_fail

# 7. Return result
return {
    "failure": 1,
    "failure_probability": p_fail,
    "failure_types": failure_types
}
```

## Model Performance

### Metrics to Monitor

For production deployments, track these metrics:

**Stage 1 (Detection)**:
- Precision: True failures / Total predicted failures
- Recall: Detected failures / Total actual failures
- F1 Score: Harmonic mean of precision and recall
- ROC-AUC: Area under ROC curve

**Stage 2 (Classification)**:
- Per-class precision/recall
- Multi-label accuracy
- Hamming loss
- Subset accuracy

### Expected Performance

These are typical ranges (actual performance may vary):

| Metric | Stage 1 | Stage 2 |
|--------|---------|---------|
| Accuracy | 85-92% | 78-85% |
| Precision | 80-88% | 75-82% |
| Recall | 82-90% | 73-80% |
| F1 Score | 81-89% | 74-81% |

## Feature Importance

### Stage 1 Top Features

Based on typical model training:

1. **Tool_wear** (35%) - Most predictive of overall failure
2. **Torque** (25%) - Indicates mechanical stress
3. **Process_temperature** (20%) - Thermal stress indicator
4. **Rotational_speed** (12%) - Operational intensity
5. **Air_temperature** (5%) - Environmental factor
6. **Type indicators** (3%) - Machine quality baseline

### Stage 2 Feature Patterns

Different failure types correlate with different features:

- **HDF** (Heat): `Process_temperature`, `Air_temperature`
- **PWF** (Power): `Torque`, `Rotational_speed`
- **OSF** (Overstrain): `Torque`, `Rotational_speed`, `Type_L`
- **TWF** (Tool Wear): `Tool_wear`, `Process_temperature`

## Model Maintenance

### When to Retrain

Consider retraining when:

1. **Performance degradation**: Metrics drop below acceptable thresholds
2. **Data drift**: Input distribution changes significantly
3. **New failure patterns**: Emerging failure modes not in training data
4. **Threshold adjustments**: Business requirements change

### Retraining Process

1. Collect new labeled data
2. Validate data quality
3. Retrain both Stage 1 and Stage 2 models
4. Evaluate on hold-out test set
5. A/B test new models vs. current models
6. Update model files if performance improves
7. Update configuration thresholds as needed

### Version Control

When updating models:

```bash
# Backup current models
cp models/stage1_failure_detector.pkl models/stage1_failure_detector_v1.pkl
cp models/stage2_failure_classifier.pkl models/stage2_failure_classifier_v2.pkl

# Deploy new models
cp new_models/stage1.pkl models/stage1_failure_detector.pkl
cp new_models/stage2.pkl models/stage2_failure_classifier.pkl

# Update config if needed
cp new_models/config.pkl models/config.pkl
```

## Troubleshooting

### Common Issues

#### 1. Models Not Loading

**Error**: `FileNotFoundError: models/stage1_failure_detector.pkl`

**Solution**: Ensure model files exist and paths are correct
```python
MODEL_DIR = Path(__file__).parent.parent / "models"
```

#### 2. PredictionErrors

**Error**: `ValueError: feature names mismatch`

**Solution**: Ensure input features match training features exactly
```python
X = X.reindex(columns=STAGE1_FEATURES)
```

#### 3. Memory Issues

**Error**: `MemoryError` when loading models

**Solution**: 
- Use memory-efficient model formats
- Consider model quantization
- Load models on-demand instead of at startup

#### 4. Slow Predictions

**Issue**: Predictions take too long

**Solutions**:
- Use model caching
- Batch predictions when possible
- Consider model optimization or distillation
- Use faster inference libraries (ONNX Runtime)

## Future Improvements

Potential enhancements:

1. **Model Updates**:
   - Deep learning models for better accuracy
   - Online learning for continuous improvement
   - Ensemble methods

2. **Features**:
   - Time-series features (historical data)
   - Environmental sensors
   - Maintenance history

3. **Architecture**:
   - Real-time streaming predictions
   - Confidence intervals
   - Explainability (SHAP values)

4. **Deployment**:
   - Model versioning system
   - A/B testing framework
   - Automated retraining pipeline

## References

- **XGBoost**: https://xgboost.readthedocs.io/
- **Scikit-learn**: https://scikit-learn.org/
- **Multi-label Classification**: https://scikit-learn.org/stable/modules/multiclass.html

---

**Model Version**: 1.0  
**Last Updated**: February 2026  
**Maintained by**: Shashwat Sharma
