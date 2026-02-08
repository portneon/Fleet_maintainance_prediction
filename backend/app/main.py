from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.schema import MachineInput
from app.predictor import predict_machine_failure
from app.vehiclereport import generate_maintenance_report

# Load environment variables from .env file
load_dotenv()

app = FastAPI()

# Add CORS middleware to allow requests from frontend

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def health_check():
    return {"status": "running Welcome to Machine Failure Prediction API"}    

@app.post("/predict")
async def predict(data: MachineInput):
    try:
        # Step 1: Get prediction from ML model
        prediction_result = predict_machine_failure(data.dict())
        
        # Step 2: Determine vehicle type from Type_L and Type_M
        vehicle_type = 'L' if data.Type_L else 'M'
        
        # Step 3: Generate detailed maintenance report using Groq AI
        detailed_report = await generate_maintenance_report(
            prediction_result=prediction_result,
            vehicle_type=vehicle_type,
            vehicle_age=data.machine_age,
            total_kilometers=data.total_kilometers,
            vehicle_name=data.vehicle_name,
            model=data.model
        )
        
        return detailed_report
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
