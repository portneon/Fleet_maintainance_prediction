# Fleet Maintenance Prediction API

A machine learning-powered REST API for predicting equipment failures in fleet machinery using a two-stage prediction approach.

## 🎯 Overview

This API uses advanced machine learning models to predict potential machine failures before they occur, helping maintenance teams take proactive action. The system employs a two-stage prediction architecture:

1. **Stage 1 (Failure Detection)**: Determines whether a machine is likely to fail
2. **Stage 2 (Failure Classification)**: If failure is detected, classifies the specific type of failure

## 🚀 Features

- **Two-Stage Prediction System**: Hierarchical ML architecture for accurate failure prediction
- **Real-time API**: Fast predictions via RESTful endpoints
- **Multiple Failure Types**: Classifies different categories of failures
- **Probability Scores**: Returns confidence scores for predictions
- **Input Validation**: Pydantic schemas ensure data quality
- **FastAPI Framework**: High-performance async API with automatic documentation

## 📋 Table of Contents

- [Architecture](#-architecture)
- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [API Documentation](#-api-documentation)
- [Model Details](#-model-details)
- [Input Features](#-input-features)
- [Output Format](#-output-format)
- [Examples](#-examples)
- [Development](#-development)
- [Project Structure](#-project-structure)

## 🏗️ Architecture

```
┌─────────────────┐
│  Input Data     │
│  (7 features)   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  Stage 1: Failure       │
│  Detection Model        │
│(RandomForest Classifier)│
└────────┬────────────────┘
         │
         ├─── p_fail < threshold ───► No Failure (0)
         │
         └─── p_fail ≥ threshold
                    │
                    ▼
         ┌──────────────────────┐
         │  Stage 2: Failure    │
         │  Classification      │
         │  (Multi-Label)       │
         └──────────┬───────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │  Failure Types +     │
         │  Probabilities       │
         └──────────────────────┘
```

## 💻 Installation

### Prerequisites

- Python 3.8 or higher
- pip package manager

### Setup

1. **Clone the repository**:
```bash
git clone https://github.com/portneon/Fleet_maintainance_prediction.git
cd Fleet_maintainance_prediction
```

2. **Create and activate virtual environment**:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**:
```bash
pip install -r requirements.txt
```

## 🎬 Quick Start

### Start the API Server

```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

### Access Interactive Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Make a Prediction

```bash
curl -X POST "http://localhost:8000/predict" \
  -H "Content-Type: application/json" \
  -d '{
    "Air_temperature": -5.0,
    "Process_temperature": 150.0,
    "Rotational_speed": 5000,
    "Torque": 80.0,
    "Tool_wear": 300.0,
    "Type_L": true,
    "Type_M": false
  }'
```

## 📚 API Documentation

### Endpoints

#### `GET /`
Health check endpoint.

**Response**:
```json
{
  "status": "running Welcome to Machine Failure Prediction API"
}
```

#### `POST /predict`
Make a failure prediction for a machine.

**Request Body**:
```json
{
  "Air_temperature": float,
  "Process_temperature": float,
  "Rotational_speed": float,
  "Torque": float,
  "Tool_wear": float,
  "Type_L": boolean,
  "Type_M": boolean
}
```

**Response** (No Failure Detected):
```json
{
  "failure": 0,
  "failure_probability": 0.123,
  "failure_types": null
}
```

**Response** (Failure Detected):
```json
{
  "failure": 1,
  "failure_probability": 0.856,
  "failure_types": {
    "HDF": 0.892,
    "PWF": 0.734
  }
}
```

## 🤖 Model Details

### Stage 1: Failure Detector

- **Model Type**: XGBoost Binary Classifier
- **Purpose**: Detect whether a failure is likely to occur
- **Output**: Probability of failure (0.0 - 1.0)
- **Threshold**: Configurable (default from `config.pkl`)

### Stage 2: Failure Classifier

- **Model Type**: Multi-Label Classifier
- **Purpose**: Classify specific failure types when failure is detected
- **Output**: Probabilities for each failure category

### Failure Types

The system can identify the following failure categories:

- **HDF**: Heat Dissipation Failure
- **PWF**: Power Failure
- **OSF**: Overstrain Failure
- **TWF**: Tool Wear Failure
- **RNF**: Random Failure (when no specific type is identified)

## 📊 Input Features

| Feature | Type | Description | Example |
|---------|------|-------------|---------|
| `Air_temperature` | float | Ambient air temperature (K) | -5.0 |
| `Process_temperature` | float | Process temperature (K) | 150.0 |
| `Rotational_speed` | float | Rotational speed (RPM) | 5000 |
| `Torque` | float | Torque (Nm) | 80.0 |
| `Tool_wear` | float | Tool wear time (minutes) | 300.0 |
| `Type_L` | boolean | Low quality variant | true |
| `Type_M` | boolean | Medium quality variant | false |

**Note**: `Type_L` and `Type_M` are mutually exclusive machine type indicators.

## 📤 Output Format

### Fields

- **`failure`**: Integer (0 or 1) indicating no failure or failure detected
- **`failure_probability`**: Float (0.0-1.0) representing the probability of failure
- **`failure_types`**: Dictionary of detected failure types with their probabilities, or `null` if no failure

### Interpretation

- **failure = 0**: Machine is operating normally, no maintenance needed
- **failure = 1**: Machine failure likely, check `failure_types` for specific issues

## 💡 Examples

### Example 1: Normal Operation

**Request**:
```python
import requests

data = {
    "Air_temperature": 20.0,
    "Process_temperature": 110.0,
    "Rotational_speed": 2500,
    "Torque": 40.0,
    "Tool_wear": 50.0,
    "Type_L": False,
    "Type_M": True
}

response = requests.post("http://localhost:8000/predict", json=data)
print(response.json())
```

**Response**:
```json
{
  "failure": 0,
  "failure_probability": 0.045,
  "failure_types": null
}
```

### Example 2: Failure Detected

**Request**:
```python
data = {
    "Air_temperature": -5.0,
    "Process_temperature": 150.0,
    "Rotational_speed": 5000,
    "Torque": 80.0,
    "Tool_wear": 300.0,
    "Type_L": True,
    "Type_M": False
}

response = requests.post("http://localhost:8000/predict", json=data)
print(response.json())
```

**Response**:
```json
{
  "failure": 1,
  "failure_probability": 0.856,
  "failure_types": {
    "HDF": 0.892,
    "TWF": 0.678
  }
}
```

**Interpretation**: High risk of Heat Dissipation Failure (89.2%) and Tool Wear Failure (67.8%)

## 🛠️ Development

### Running in Development Mode

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Code Structure

```python
app/
├── __init__.py          # Package initialization
├── main.py              # FastAPI application and endpoints
├── predictor.py         # Prediction logic and model loading
└── schema.py            # Pydantic input validation schemas
```

### Adding New Features

1. Update schemas in `app/schema.py`
2. Modify prediction logic in `app/predictor.py`
3. Add/update endpoints in `app/main.py`
4. Update requirements in `requirements.txt`

## 📁 Project Structure

```
Fleet_maintainance_prediction/
├── app/
│   ├── __init__.py              # Package init
│   ├── main.py                  # FastAPI routes
│   ├── predictor.py             # ML prediction engine
│   └── schema.py                # Data validation schemas
├── models/
│   ├── config.pkl               # Model configuration
│   ├── stage1_failure_detector.pkl    # Failure detection model
│   └── stage2_failure_classifier.pkl  # Failure classification model
├── venv/                        # Virtual environment
├── .gitignore                   # Git ignore rules
├── requirements.txt             # Python dependencies
└── README.md                    # This file
```

## 🔧 Configuration

The `models/config.pkl` file contains:

- `stage1_threshold`: Probability threshold for Stage 1 detection
- `failure_thresholds`: Individual thresholds for each failure type
- `failure_cols`: List of failure type column names

## 📦 Dependencies

Key dependencies:
- **FastAPI**: Web framework
- **Uvicorn**: ASGI server
- **Pydantic**: Data validation
- **Pandas**: Data manipulation
- **Scikit-learn**: ML utilities
- **XGBoost**: Gradient boosting models
- **Joblib**: Model serialization

See `requirements.txt` for complete list.


## 👤 Author

**Shashwat Sharma**

GitHub: [@portneon](https://github.com/portneon)

## 🐛 Issues

If you encounter any issues or have suggestions, please [open an issue](https://github.com/portneon/Fleet_maintainance_prediction/issues) on GitHub.

---

**Built with ❤️ using FastAPI and Machine Learning**
