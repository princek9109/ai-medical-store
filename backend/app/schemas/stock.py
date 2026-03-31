from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class StockCreate(BaseModel):
    medicine_id: str
    batch_number: str
    expiry_date: datetime
    quantity: int
    mrp: float
    purchase_price: Optional[float] = None
    zone: Optional[str] = None
    aisle: Optional[str] = None
    rack: Optional[str] = None
    shelf: Optional[str] = None
    bin: Optional[str] = None
    supplier_id: Optional[str] = None
    reorder_level: int = 10

class StockUpdate(BaseModel):
    quantity: Optional[int] = None
    mrp: Optional[float] = None
    zone: Optional[str] = None
    aisle: Optional[str] = None
    rack: Optional[str] = None
    shelf: Optional[str] = None
    bin: Optional[str] = None
    reorder_level: Optional[int] = None

class StockOut(BaseModel):
    id: str
    medicine_id: str
    batch_number: str
    expiry_date: datetime
    quantity: int
    mrp: float
    zone: Optional[str]
    aisle: Optional[str]
    rack: Optional[str]
    shelf: Optional[str]
    bin: Optional[str]
    reorder_level: int
    bin_location: Optional[str] = None

    class Config:
        from_attributes = True
