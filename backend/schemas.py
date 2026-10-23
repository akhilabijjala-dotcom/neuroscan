from pydantic import BaseModel, EmailStr, Field
from typing import Literal

class SignupRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    medical_license_id: str = Field(min_length=1, max_length=100)
    role: Literal["Radiologist", "Neurosurgeon"]
class LoginRequest(BaseModel):
    email: EmailStr
    password: str
class PatientCreate(BaseModel):
    patient_code: str = Field(min_length=1, max_length=50)
    name: str = Field(min_length=1, max_length=100)
    age: int | None = Field(default=None, ge=0, le=120)
class PatientResponse(BaseModel):
    id: int
    patient_code: str
    name: str
    age: int | None

    class Config:
        from_attributes = True
