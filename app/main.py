from fastapi import FastAPI, HTTPException
from app.schema import MachineInput
from app.predictor import predict_machine_failure

app = FastAPI()
@app.get("/")
def health_check():
    return {"status": "running Welcome to Machine Failure Prediction API"}    

@app.post("/predict")
async def predict(data: MachineInput):
    try:
        result = predict_machine_failure(data.dict())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
