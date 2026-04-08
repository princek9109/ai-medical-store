from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import Prescription, PrescriptionItem, Stock, AuditLog
from app.schemas.prescription import PrescriptionCreate, PrescriptionOut
from typing import List
from datetime import datetime

router = APIRouter(prefix="/prescriptions", tags=["Prescriptions"])

@router.post("/", response_model=PrescriptionOut)
def create_prescription(data: PrescriptionCreate, db: Session = Depends(get_db)):
    rx = Prescription(
        patient_name=data.patient_name,
        patient_abha_id=data.patient_abha_id,
        doctor_name=data.doctor_name,
        doctor_reg_no=data.doctor_reg_no,
        status="pending"
    )
    db.add(rx)
    db.flush()

    for item in data.items:
        db_item = PrescriptionItem(
            prescription_id=rx.id,
            medicine_id=item.medicine_id,
            extracted_name=item.extracted_name,
            validated_name=item.validated_name or item.extracted_name,
            quantity=item.quantity,
            dosage=item.dosage,
            frequency=item.frequency,
            duration=item.duration,
            confidence=item.confidence,
            is_dispensed=False
        )
        db.add(db_item)

    db.add(AuditLog(table_name="prescriptions", record_id=rx.id,
                    action="INSERT", new_value={"patient": data.patient_name,
                    "items": len(data.items)}))
    db.commit()
    db.refresh(rx)
    return rx

@router.get("/", response_model=List[PrescriptionOut])
def list_prescriptions(
    status: str = None, skip: int = 0, limit: int = 50,
    db: Session = Depends(get_db)
):
    q = db.query(Prescription)
    if status:
        q = q.filter(Prescription.status == status)
    return q.order_by(Prescription.created_at.desc()).offset(skip).limit(limit).all()

@router.get("/{rx_id}", response_model=PrescriptionOut)
def get_prescription(rx_id: str, db: Session = Depends(get_db)):
    rx = db.query(Prescription).filter(Prescription.id == rx_id).first()
    if not rx:
        raise HTTPException(status_code=404, detail="Prescription not found")
    return rx

@router.patch("/{rx_id}/items/{item_id}/confirm")
def confirm_dispense_item(rx_id: str, item_id: str,
                          stock_id: str, db: Session = Depends(get_db)):
    item = db.query(PrescriptionItem).filter(
        PrescriptionItem.id == item_id,
        PrescriptionItem.prescription_id == rx_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    stock = db.query(Stock).filter(Stock.id == stock_id).first()
    if not stock:
        raise HTTPException(status_code=404, detail="Stock not found")
    if stock.quantity < item.quantity:
        raise HTTPException(status_code=400,
            detail=f"Insufficient stock. Available: {stock.quantity}")

    stock.quantity -= item.quantity
    item.is_dispensed = True

    db.add(AuditLog(table_name="prescription_items", record_id=item_id,
                    action="DISPENSE", new_value={"stock_id": stock_id,
                    "qty_dispensed": item.quantity}))
    db.commit()

    rx = db.query(Prescription).filter(Prescription.id == rx_id).first()
    all_done = all(i.is_dispensed for i in rx.items)
    if all_done:
        rx.status = "ready_to_bill"
        db.commit()

    return {"confirmed": True, "all_items_dispensed": all_done,
            "remaining_stock": stock.quantity}

@router.patch("/{rx_id}/status")
def update_status(rx_id: str, status: str, db: Session = Depends(get_db)):
    rx = db.query(Prescription).filter(Prescription.id == rx_id).first()
    if not rx:
        raise HTTPException(status_code=404, detail="Not found")
    rx.status = status
    db.commit()
    return {"status": status}