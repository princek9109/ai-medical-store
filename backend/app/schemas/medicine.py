from pydantic import BaseModel
from typing import Optional

class MedicineCreate(BaseModel):
    canonical_name: str
    brand_name: Optional[str] = None
    salt_composition: Optional[str] = None
    strength: Optional[str] = None
    dosage_form: Optional[str] = None
    manufacturer: Optional[str] = None
    hsn_code: Optional[str] = None
    gst_rate: float = 12.0
    schedule_type: Optional[str] = None

class MedicineOut(BaseModel):
    id: str
    canonical_name: str
    brand_name: Optional[str]
    salt_composition: Optional[str]
    strength: Optional[str]
    dosage_form: Optional[str]
    manufacturer: Optional[str]
    hsn_code: Optional[str]
    gst_rate: float
    schedule_type: Optional[str]

    class Config:
        from_attributes = True