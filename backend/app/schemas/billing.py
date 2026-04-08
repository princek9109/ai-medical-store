from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class BillItemIn(BaseModel):
    stock_id: str
    medicine_name: str
    quantity: int
    mrp: float
    gst_rate: float
    hsn_code: Optional[str] = None

class BillCreate(BaseModel):
    prescription_id: str
    items: List[BillItemIn]
    discount: float = 0.0
    payment_mode: str = "cash"

class BillItemOut(BaseModel):
    medicine_name: str
    hsn_code: Optional[str]
    quantity: int
    mrp: float
    taxable_amount: float
    gst_rate: float
    cgst: float
    sgst: float
    line_total: float

class BillOut(BaseModel):
    id: str
    invoice_number: str
    prescription_id: str
    subtotal: float
    discount: float
    cgst: float
    sgst: float
    total: float
    payment_mode: str
    payment_status: str
    created_at: datetime
    line_items: List[BillItemOut] = []

    class Config:
        from_attributes = True