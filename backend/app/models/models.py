from sqlalchemy import Column, String, Integer, Float, Boolean
from sqlalchemy import DateTime, Text, JSON, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import uuid, enum

Base = declarative_base()

def new_uuid():
    return str(uuid.uuid4())

class UserRole(str, enum.Enum):
    pharmacist = "pharmacist"
    billing    = "billing"
    inventory  = "inventory"
    admin      = "admin"

class User(Base):
    __tablename__ = "users"
    id           = Column(String, primary_key=True, default=new_uuid)
    name         = Column(String(100), nullable=False)
    email        = Column(String(150), unique=True, nullable=False)
    password_hash= Column(String(200), nullable=False)
    role         = Column(Enum(UserRole), nullable=False)
    store_id     = Column(String(50))
    is_active    = Column(Boolean, default=True)
    created_at   = Column(DateTime, default=datetime.utcnow)

class Medicine(Base):
    __tablename__ = "medicines_master"
    id               = Column(String, primary_key=True, default=new_uuid)
    canonical_name   = Column(String(200), nullable=False)
    brand_name       = Column(String(200))
    salt_composition = Column(String(300))
    strength         = Column(String(50))
    dosage_form      = Column(String(50))
    manufacturer     = Column(String(150))
    hsn_code         = Column(String(20))
    gst_rate         = Column(Float, default=12.0)
    schedule_type    = Column(String(10))
    is_active        = Column(Boolean, default=True)
    created_at       = Column(DateTime, default=datetime.utcnow)

class Stock(Base):
    __tablename__ = "stock"
    id              = Column(String, primary_key=True, default=new_uuid)
    medicine_id     = Column(String, ForeignKey("medicines_master.id"))
    batch_number    = Column(String(50), nullable=False)
    expiry_date     = Column(DateTime, nullable=False)
    quantity        = Column(Integer, default=0)
    mrp             = Column(Float)
    purchase_price  = Column(Float)
    zone            = Column(String(5))
    aisle           = Column(String(5))
    rack            = Column(String(5))
    shelf           = Column(String(5))
    bin             = Column(String(5))
    supplier_id     = Column(String(100))
    reorder_level   = Column(Integer, default=10)
    created_at      = Column(DateTime, default=datetime.utcnow)
    medicine        = relationship("Medicine")

class Prescription(Base):
    __tablename__ = "prescriptions"
    id               = Column(String, primary_key=True, default=new_uuid)
    patient_name     = Column(String(100))
    patient_abha_id  = Column(String(20))
    doctor_name      = Column(String(100))
    doctor_reg_no    = Column(String(50))
    date             = Column(DateTime, default=datetime.utcnow)
    ocr_raw_text     = Column(Text)
    image_path       = Column(String(300))
    status           = Column(String(30), default="pending")
    confidence_score = Column(Float)
    pharmacist_id    = Column(String, ForeignKey("users.id"))
    created_at       = Column(DateTime, default=datetime.utcnow)
    items            = relationship("PrescriptionItem", back_populates="prescription")

class PrescriptionItem(Base):
    __tablename__ = "prescription_items"
    id              = Column(String, primary_key=True, default=new_uuid)
    prescription_id = Column(String, ForeignKey("prescriptions.id"))
    medicine_id     = Column(String, ForeignKey("medicines_master.id"))
    extracted_name  = Column(String(200))
    validated_name  = Column(String(200))
    quantity        = Column(Integer)
    dosage          = Column(String(50))
    frequency       = Column(String(50))
    duration        = Column(String(50))
    is_dispensed    = Column(Boolean, default=False)
    confidence      = Column(Float)
    prescription    = relationship("Prescription", back_populates="items")
    medicine        = relationship("Medicine")

class Bill(Base):
    __tablename__ = "billing"
    id              = Column(String, primary_key=True, default=new_uuid)
    prescription_id = Column(String, ForeignKey("prescriptions.id"))
    subtotal        = Column(Float)
    discount        = Column(Float, default=0)
    cgst            = Column(Float)
    sgst            = Column(Float)
    total           = Column(Float)
    payment_mode    = Column(String(20))
    payment_status  = Column(String(20), default="pending")
    invoice_number  = Column(String(50), unique=True)
    created_at      = Column(DateTime, default=datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_log"
    id          = Column(String, primary_key=True, default=new_uuid)
    table_name  = Column(String(50), nullable=False)
    record_id   = Column(String, nullable=False)
    action      = Column(String(20), nullable=False)
    user_id     = Column(String, ForeignKey("users.id"))
    old_value   = Column(JSON)
    new_value   = Column(JSON)
    timestamp   = Column(DateTime, default=datetime.utcnow)