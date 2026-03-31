from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.db.database import get_db
from app.models.models import Medicine, AuditLog
from app.schemas.medicine import MedicineCreate, MedicineOut
from typing import List, Optional

router = APIRouter(prefix="/medicines", tags=["Medicines"])

@router.post("/", response_model=MedicineOut)
def add_medicine(data: MedicineCreate, db: Session = Depends(get_db)):
    med = Medicine(**data.model_dump())
    db.add(med)
    db.commit()
    db.refresh(med)
    log = AuditLog(table_name="medicines_master", record_id=med.id,
                   action="INSERT", new_value=data.model_dump())
    db.add(log)
    db.commit()
    return med

@router.get("/", response_model=List[MedicineOut])
def list_medicines(
    search: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    q = db.query(Medicine).filter(Medicine.is_active == True)
    if search:
        term = f"%{search}%"
        q = q.filter(or_(
            Medicine.canonical_name.ilike(term),
            Medicine.brand_name.ilike(term),
            Medicine.salt_composition.ilike(term)
        ))
    return q.offset(skip).limit(limit).all()

@router.get("/{med_id}", response_model=MedicineOut)
def get_medicine(med_id: str, db: Session = Depends(get_db)):
    med = db.query(Medicine).filter(Medicine.id == med_id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medicine not found")
    return med

@router.delete("/{med_id}")
def delete_medicine(med_id: str, db: Session = Depends(get_db)):
    med = db.query(Medicine).filter(Medicine.id == med_id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medicine not found")
    med.is_active = False
    db.commit()
    return {"message": "Medicine deactivated"}