# Deployment Guide

Complete guide for deploying the Fleet Maintenance Prediction API to production.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Local Deployment](#local-deployment)
- [Docker Deployment](#docker-deployment)
- [Cloud Deployment](#cloud-deployment)
- [Environment Variables](#environment-variables)
- [Performance Optimization](#performance-optimization)
- [Monitoring](#monitoring)
- [Security](#security)

## Prerequisites

- Python 3.8+
- pip or conda
- Virtual environment tool
- (Optional) Docker
- (Optional) Cloud account (AWS/GCP/Azure)

## Local Deployment

### Development Mode

```bash
# 1. Clone repository
git clone https://github.com/portneon/Fleet_maintainance_prediction.git
cd Fleet_maintainance_prediction

# 2. Create virtual environment
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Production Mode (Local)

```bash
# Run with optimized settings
uvicorn app.main:app \
  --host 0.0.0.0 \
  --port 8000 \
  --workers 4 \
  --log-level info \
  --access-log
```

**Worker Calculation**: `(2 × num_cores) + 1`

## Docker Deployment

### Create Dockerfile

Create `Dockerfile` in project root:

```dockerfile
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy requirements first (for caching)
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app/ ./app/
COPY models/ ./models/

# Expose port
EXPOSE 8000

# Run application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

### Create .dockerignore

```
venv/
__pycache__/
*.pyc
*.pyo
*.pyd
.git/
.gitignore
*.md
.DS_Store
.env
```

### Build and Run

```bash
# Build image
docker build -t fleet-prediction-api .

# Run container
docker run -d \
  --name fleet-api \
  -p 8000:8000 \
  fleet-prediction-api

# Check logs
docker logs fleet-api

# Stop container
docker stop fleet-api
```

### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - ENVIRONMENT=production
      - LOG_LEVEL=info
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/"]
      interval: 30s
      timeout: 10s
      retries: 3
```

Run with:
```bash
docker-compose up -d
```

## Cloud Deployment

### AWS Elastic Beanstalk

1. **Install EB CLI**:
```bash
pip install awsebcli
```

2. **Initialize**:
```bash
eb init -p python-3.11 fleet-prediction-api
```

3. **Create environment**:
```bash
eb create fleet-api-prod
```

4. **Deploy**:
```bash
eb deploy
```

### Google Cloud Run

1. **Build with Cloud Build**:
```bash
gcloud builds submit --tag gcr.io/PROJECT_ID/fleet-api
```

2. **Deploy**:
```bash
gcloud run deploy fleet-api \
  --image gcr.io/PROJECT_ID/fleet-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Azure Container Instances

1. **Build and push**:
```bash
az acr build --registry myregistry --image fleet-api:v1 .
```

2. **Deploy**:
```bash
az container create \
  --resource-group myresourcegroup \
  --name fleet-api \
  --image myregistry.azurecr.io/fleet-api:v1 \
  --cpu 2 \
  --memory 4 \
  --port 8000
```

### Heroku

1. **Create Procfile**:
```
web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

2. **Deploy**:
```bash
heroku create fleet-prediction-api
git push heroku main
```

## Environment Variables

Create `.env` file:

```bash
# Application
ENVIRONMENT=production
LOG_LEVEL=info
DEBUG=false

# Server
HOST=0.0.0.0
PORT=8000
WORKERS=4

# Model settings
MODEL_PATH=./models
STAGE1_THRESHOLD=0.5

# Security (if implementing)
API_KEY=your-secret-key
ALLOWED_ORIGINS=https://yourdomain.com
```

Load in application:

```python
from dotenv import load_dotenv
import os

load_dotenv()

ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
LOG_LEVEL = os.getenv("LOG_LEVEL", "info")
```

## Performance Optimization

### 1. Caching

Add model caching:

```python
from functools import lru_cache

@lru_cache(maxsize=1)
def load_models():
    stage1 = joblib.load(MODEL_DIR / "stage1_failure_detector.pkl")
    stage2 = joblib.load(MODEL_DIR / "stage2_failure_classifier.pkl")
    config = joblib.load(MODEL_DIR / "config.pkl")
    return stage1, stage2, config
```

### 2. Connection Pooling

For database connections (if added):

```python
from sqlalchemy import create_engine
from sqlalchemy.pool import QueuePool

engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=10,
    max_overflow=20
)
```

### 3. Async Processing

Use async endpoints:

```python
from fastapi import FastAPI
import asyncio

@app.post("/predict")
async def predict(data: MachineInput):
    # Run CPU-intensive work in thread pool
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(
        None, 
        predict_machine_failure, 
        data.dict()
    )
    return result
```

### 4. Load Balancing

Use Nginx as reverse proxy:

```nginx
upstream fleet_api {
    server 127.0.0.1:8000;
    server 127.0.0.1:8001;
    server 127.0.0.1:8002;
    server 127.0.0.1:8003;
}

server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://fleet_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Monitoring

### 1. Health Checks

Add health endpoint:

```python
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    }
```

### 2. Logging

Configure structured logging:

```python
import logging
import json

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

@app.post("/predict")
async def predict(data: MachineInput):
    logger.info(f"Prediction request: {data.dict()}")
    result = predict_machine_failure(data.dict())
    logger.info(f"Prediction result: {result}")
    return result
```

### 3. Metrics

Use Prometheus:

```python
from prometheus_fastapi_instrumentator import Instrumentator

Instrumentator().instrument(app).expose(app)
```

### 4. Application Monitoring

- **Sentry**: Error tracking
- **New Relic**: APM
- **Datadog**: Infrastructure monitoring

```python
import sentry_sdk

sentry_sdk.init(
    dsn="your-sentry-dsn",
    environment=ENVIRONMENT
)
```

## Security

### 1. API Keys

Add authentication:

```python
from fastapi import Header, HTTPException

async def verify_api_key(x_api_key: str = Header(...)):
    if x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API Key")
    return x_api_key

@app.post("/predict", dependencies=[Depends(verify_api_key)])
async def predict(data: MachineInput):
    ...
```

### 2. CORS

Configure CORS properly:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com"],
    allow_credentials=True,
    allow_methods=["POST"],
    allow_headers=["*"],
)
```

### 3. Rate Limiting

Use slowapi:

```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.post("/predict")
@limiter.limit("10/minute")
async def predict(request: Request, data: MachineInput):
    ...
```

### 4. HTTPS

Always use HTTPS in production. For local testing:

```bash
uvicorn app.main:app \
  --ssl-keyfile=./key.pem \
  --ssl-certfile=./cert.pem
```

### 5. Input Validation

Already implemented with Pydantic, but add extra checks:

```python
from pydantic import validator

class MachineInput(BaseModel):
    Air_temperature: float
    
    @validator('Air_temperature')
    def validate_temp(cls, v):
        if not -50 <= v <= 100:
            raise ValueError('Temperature out of range')
        return v
```

## Scaling Strategies

### Horizontal Scaling

- Use Kubernetes for container orchestration
- Auto-scaling based on CPU/memory
- Load balancers for traffic distribution

### Vertical Scaling

- Increase server resources
- Optimize model size
- Use model quantization

### Database Scaling

If adding database:
- Read replicas
- Sharding
- Caching layer (Redis)

## Backup and Recovery

### Model Versioning

```bash
# Tag models with versions
models/
├── v1/
│   ├── stage1_failure_detector.pkl
│   └── stage2_failure_classifier.pkl
└── v2/
    ├── stage1_failure_detector.pkl
    └── stage2_failure_classifier.pkl
```

### Automated Backups

```bash
# Backup script
#!/bin/bash
BACKUP_DIR="/backups/$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR
cp -r models/ $BACKUP_DIR/
aws s3 sync $BACKUP_DIR s3://your-backup-bucket/
```

## CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Set up Python
      uses: actions/setup-python@v2
      with:
        python-version: '3.11'
    
    - name: Install dependencies
      run: pip install -r requirements.txt
    
    - name: Run tests
      run: pytest
    
    - name: Deploy to production
      run: |
        # Your deployment command
        eb deploy
```

## Troubleshooting

### Common Issues

1. **Port already in use**:
```bash
lsof -ti:8000 | xargs kill -9
```

2. **Models not loading**:
- Check file paths
- Verify model files exist
- Check permissions

3. **Out of memory**:
- Reduce worker count
- Optimize model size
- Add memory limits

---

**Last Updated**: February 2026
