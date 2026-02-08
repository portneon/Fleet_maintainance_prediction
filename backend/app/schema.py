from pydantic import BaseModel, Field

class MachineInput(BaseModel):
    Air_temperature: float
    Process_temperature: float
    Rotational_speed: float
    Torque: float
    Tool_wear: float
    Type_L: bool = Field(default=False, description="Low quality machine type")
    Type_M: bool = Field(default=True, description="Medium quality machine type")
    
    # Optional vehicle metadata for report generation
    vehicle_name: str = Field(default="Unknown", description="Vehicle name or ID")
    model: str = Field(default="Unknown", description="Vehicle model")
    machine_age: float = Field(default=0, description="Vehicle age in years")
    total_kilometers: float = Field(default=0, description="Total kilometers traveled")
