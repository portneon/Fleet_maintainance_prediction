# API Guide - Fleet Maintenance Prediction

Complete guide for using the Fleet Maintenance Prediction API.

## Table of Contents

- [Getting Started](#getting-started)
- [Authentication](#authentication)
- [Endpoints](#endpoints)
- [Request Format](#request-format)
- [Response Format](#response-format)
- [Error Handling](#error-handling)
- [Code Examples](#code-examples)
- [Best Practices](#best-practices)

## Getting Started

### Base URL

Local development:
```
http://localhost:8000
```

### Starting the Server

```bash
uvicorn app.main:app --reload
```

### Interactive Documentation

FastAPI provides automatic interactive documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Authentication

Currently, the API does not require authentication. For production deployment, consider adding:
- API key authentication
- OAuth2
- JWT tokens

## Endpoints

### 1. Health Check

**Endpoint**: `GET /`

**Description**: Check if the API is running.

**Request**: No parameters required

**Response**:
```json
{
  "status": "running Welcome to Machine Failure Prediction API"
}
```

**Example**:
```bash
curl http://localhost:8000/
```

---

### 2. Predict Machine Failure

**Endpoint**: `POST /predict`

**Description**: Predict if a machine will fail and identify failure types.

**Headers**:
```
Content-Type: application/json
```

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

**Success Response (200 OK)**:
```json
{
  "failure": 0 | 1,
  "failure_probability": 0.0-1.0,
  "failure_types": {
    "failure_type": probability
  } | null
}
```

**Error Response (500)**:
```json
{
  "detail": "error message"
}
```

## Request Format

### Required Fields

All fields are required in the request:

| Field | Type | Range | Description |
|-------|------|-------|-------------|
| `Air_temperature` | float | Any | Ambient air temperature in Kelvin |
| `Process_temperature` | float | Any | Process temperature in Kelvin |
| `Rotational_speed` | float | ≥ 0 | Rotational speed in RPM |
| `Torque` | float | ≥ 0 | Torque in Newton-meters |
| `Tool_wear` | float | ≥ 0 | Tool wear time in minutes |
| `Type_L` | boolean | true/false | Low quality machine type indicator |
| `Type_M` | boolean | true/false | Medium quality machine type indicator |

### Validation Rules

1. **Numeric Fields**: Must be valid numbers
2. **Boolean Fields**: Must be `true` or `false`
3. **Mutual Exclusivity**: `Type_L` and `Type_M` should be mutually exclusive

### Example Valid Request

```json
{
  "Air_temperature": -5.0,
  "Process_temperature": 150.0,
  "Rotational_speed": 5000,
  "Torque": 80.0,
  "Tool_wear": 300.0,
  "Type_L": true,
  "Type_M": false
}
```

## Response Format

### No Failure Detected

When the Stage 1 model determines failure probability is below the threshold:

```json
{
  "failure": 0,
  "failure_probability": 0.045,
  "failure_types": null
}
```

**Fields**:
- `failure`: 0 (no failure)
- `failure_probability`: Low probability value
- `failure_types`: null (not applicable)

### Failure Detected

When Stage 1 detects potential failure and Stage 2 classifies the types:

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

**Fields**:
- `failure`: 1 (failure detected)
- `failure_probability`: High probability value
- `failure_types`: Dictionary of specific failures with their probabilities

### Possible Failure Types

| Code | Full Name | Description |
|------|-----------|-------------|
| `HDF` | Heat Dissipation Failure | Cooling system issues |
| `PWF` | Power Failure | Power supply problems |
| `OSF` | Overstrain Failure | Excessive load/stress |
| `TWF` | Tool Wear Failure | Tool degradation issues |
| `RNF` | Random Failure | Unclassified failures |

## Error Handling

### Common Errors

#### 1. Invalid Input Format (422)

**Cause**: Missing required fields or invalid data types

**Response**:
```json
{
  "detail": [
    {
      "loc": ["body", "Air_temperature"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

**Solution**: Ensure all required fields are present with correct types

#### 2. Internal Server Error (500)

**Cause**: Model prediction error or server issue

**Response**:
```json
{
  "detail": "Model prediction failed: [error details]"
}
```

**Solution**: Check input values are within reasonable ranges

## Code Examples

### Python with requests

```python
import requests
import json

# API endpoint
url = "http://localhost:8000/predict"

# Input data
data = {
    "Air_temperature": -5.0,
    "Process_temperature": 150.0,
    "Rotational_speed": 5000,
    "Torque": 80.0,
    "Tool_wear": 300.0,
    "Type_L": True,
    "Type_M": False
}

# Make request
response = requests.post(url, json=data)

# Check response
if response.status_code == 200:
    result = response.json()
    print(f"Failure: {result['failure']}")
    print(f"Probability: {result['failure_probability']}")
    
    if result['failure_types']:
        print("Failure Types:")
        for failure_type, prob in result['failure_types'].items():
            print(f"  {failure_type}: {prob:.1%}")
else:
    print(f"Error: {response.status_code}")
    print(response.json())
```

### Python with httpx (async)

```python
import httpx
import asyncio

async def predict_failure(data):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://localhost:8000/predict",
            json=data
        )
        return response.json()

# Usage
data = {
    "Air_temperature": 20.0,
    "Process_temperature": 110.0,
    "Rotational_speed": 2500,
    "Torque": 40.0,
    "Tool_wear": 50.0,
    "Type_L": False,
    "Type_M": True
}

result = asyncio.run(predict_failure(data))
print(result)
```

### JavaScript (Node.js)

```javascript
const axios = require('axios');

const data = {
  Air_temperature: -5.0,
  Process_temperature: 150.0,
  Rotational_speed: 5000,
  Torque: 80.0,
  Tool_wear: 300.0,
  Type_L: true,
  Type_M: false
};

axios.post('http://localhost:8000/predict', data)
  .then(response => {
    console.log('Prediction:', response.data);
    
    if (response.data.failure === 1) {
      console.log('⚠️ Failure detected!');
      console.log('Types:', response.data.failure_types);
    } else {
      console.log('✓ Machine operating normally');
    }
  })
  .catch(error => {
    console.error('Error:', error.response?.data || error.message);
  });
```

### cURL

```bash
# Basic request
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

# Pretty print with jq
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
  }' | jq
```

## Best Practices

### 1. Error Handling

Always handle potential errors:

```python
try:
    response = requests.post(url, json=data, timeout=5)
    response.raise_for_status()
    result = response.json()
except requests.exceptions.Timeout:
    print("Request timed out")
except requests.exceptions.HTTPError as e:
    print(f"HTTP error: {e}")
except requests.exceptions.RequestException as e:
    print(f"Error: {e}")
```

### 2. Input Validation

Validate data before sending:

```python
def validate_input(data):
    required = ['Air_temperature', 'Process_temperature', 
                'Rotational_speed', 'Torque', 'Tool_wear',
                'Type_L', 'Type_M']
    
    for field in required:
        if field not in data:
            raise ValueError(f"Missing field: {field}")
    
    if data['Rotational_speed'] < 0:
        raise ValueError("Rotational speed must be positive")
    
    return True
```

### 3. Batch Predictions

For multiple predictions, send requests sequentially or use async:

```python
import asyncio
import httpx

async def batch_predict(data_list):
    async with httpx.AsyncClient() as client:
        tasks = [
            client.post("http://localhost:8000/predict", json=data)
            for data in data_list
        ]
        responses = await asyncio.gather(*tasks)
        return [r.json() for r in responses]

# Usage
results = asyncio.run(batch_predict([data1, data2, data3]))
```

### 4. Interpreting Results

```python
def interpret_prediction(result):
    if result['failure'] == 0:
        return f"✓ Normal operation (risk: {result['failure_probability']:.1%})"
    
    msg = f"⚠️ Failure predicted (probability: {result['failure_probability']:.1%})\n"
    msg += "Critical failures:\n"
    
    for failure_type, prob in result['failure_types'].items():
        severity = "HIGH" if prob > 0.8 else "MEDIUM" if prob > 0.5 else "LOW"
        msg += f"  - {failure_type}: {prob:.1%} ({severity})\n"
    
    return msg
```

### 5. Monitoring

Log all predictions for monitoring:

```python
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def predict_with_logging(data):
    logger.info(f"Prediction request: {data}")
    response = requests.post(url, json=data)
    result = response.json()
    logger.info(f"Prediction result: {result}")
    return result
```

## Rate Limiting

Currently, there is no rate limiting. For production:
- Implement rate limiting middleware
- Use API keys to track usage
- Set reasonable timeout values

## Support

For issues or questions:
- GitHub Issues: https://github.com/portneon/Fleet_maintainance_prediction/issues
- Documentation: See README.md

---

**Last Updated**: February 2026
