from pydantic import BaseModel, Field

class MachineInput(BaseModel):
    Air_temperature: float
    Process_temperature: float
    Rotational_speed: float
    Torque: float
    Tool_wear: float
    Type_L: bool = Field(default=False, description="Low quality machine type")
    Type_M: bool = Field(default=True, description="Medium quality machine type")

