from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class PrescriptionItemCreate(BaseModel):
    medicine_id: Optional[str] = None
    extracted_name: str
    validated_name: Optional[str] = None
    quantity: int
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    duration: Optional[str] = None
    confidence: float = 1.0

class PrescriptionCreate(BaseModel):
    patient_name: str
    patient_abha_id: Optional[str] = None
    doctor_name: str
    doctor_reg_no: Optional[str] = None
    items: List[PrescriptionItemCreate]

class PrescriptionItemOut(BaseModel):
    id: str
    medicine_id: Optional[str]
    extracted_name: str
    validated_name: Optional[str]
    quantity: int
    dosage: Optional[str]
    frequency: Optional[str]
    duration: Optional[str]
    is_dispensed: bool
    confidence: float

    class Config:
        from_attributes = True

class PrescriptionOut(BaseModel):
    id: str
    patient_name: str
    patient_abha_id: Optional[str]
    doctor_name: str
    doctor_reg_no: Optional[str]
    status: str
    created_at: datetime
    items: List[PrescriptionItemOut]

    class Config:
        from_attributes = True
