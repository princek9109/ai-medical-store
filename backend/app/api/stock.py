from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.db.database import get_db
from app.models.models import Stock, Medicine, AuditLog
from app.schemas.stock import StockCreate, StockUpdate, StockOut
from typing import List, Optional
from datetime import datetime, timedelta

router = APIRouter(prefix="/stock", tags=["Stock"])

def build_bin_location(s: Stock) -> str:
    parts = [s.zone, s.aisle, s.rack, s.shelf, s.bin]
    filled = [p for p in parts if p]
    return "-".join(filled) if filled else "Not assigned"

@router.post("/", response_model=StockOut)
def add_stock(data: StockCreate, db: Session = Depends(get_db)):
    med = db.query(Medicine).filter(Medicine.id == data.medicine_id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medicine not found")
    stock = Stock(**data.model_dump())
    db.add(stock)
    db.commit()
    db.refresh(stock)
    log = AuditLog(table_name="stock", record_id=stock.id,
                   action="INSERT", new_value=data.model_dump())
    db.add(log)
    db.commit()
    out = StockOut.model_validate(stock)
    out.bin_location = build_bin_location(stock)
    return out

@router.get("/", response_model=List[StockOut])
def list_stock(
    medicine_id: Optional[str] = None,
    zone: Optional[str] = None,
    low_stock_only: bool = False,
    expiring_days: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    q = db.query(Stock).filter(Stock.quantity > 0)
    if medicine_id:
        q = q.filter(Stock.medicine_id == medicine_id)
    if zone:
        q = q.filter(Stock.zone == zone)
    if low_stock_only:
        q = q.filter(Stock.quantity <= Stock.reorder_level)
    if expiring_days:
        cutoff = datetime.utcnow() + timedelta(days=expiring_days)
        q = q.filter(Stock.expiry_date <= cutoff)
    stocks = q.order_by(Stock.expiry_date.asc()).offset(skip).limit(limit).all()
    result = []
    for s in stocks:
        out = StockOut.model_validate(s)
        out.bin_location = build_bin_location(s)
        result.append(out)
    return result

@router.get("/alerts/expiry")
def expiry_alerts(db: Session = Depends(get_db)):
    now = datetime.utcnow()
    alerts = []
    for days, label in [(7,"CRITICAL"),(30,"WARNING"),(90,"NOTICE")]:
        cutoff = now + timedelta(days=days)
        items = db.query(Stock).filter(
            and_(Stock.expiry_date <= cutoff, Stock.expiry_date > now,
                 Stock.quantity > 0)
        ).all()
        for s in items:
            med = db.query(Medicine).filter(Medicine.id == s.medicine_id).first()
            days_left = (s.expiry_date - now).days
            alerts.append({
                "stock_id": s.id,
                "medicine_name": med.canonical_name if med else "Unknown",
                "batch": s.batch_number,
                "expiry_date": s.expiry_date.isoformat(),
                "days_remaining": days_left,
                "quantity": s.quantity,
                "bin_location": build_bin_location(s),
                "severity": label
            })
    seen = set()
    unique = []
    for a in alerts:
        if a["stock_id"] not in seen:
            seen.add(a["stock_id"])
            unique.append(a)
    unique.sort(key=lambda x: x["days_remaining"])
    return unique

@router.get("/alerts/low-stock")
def low_stock_alerts(db: Session = Depends(get_db)):
    items = db.query(Stock).filter(Stock.quantity <= Stock.reorder_level).all()
    result = []
    for s in items:
        med = db.query(Medicine).filter(Medicine.id == s.medicine_id).first()
        result.append({
            "stock_id": s.id,
            "medicine_name": med.canonical_name if med else "Unknown",
            "current_quantity": s.quantity,
            "reorder_level": s.reorder_level,
            "bin_location": build_bin_location(s),
            "shortage": s.reorder_level - s.quantity
        })
    result.sort(key=lambda x: x["shortage"], reverse=True)
    return result

@router.get("/fifo/{medicine_id}")
def fifo_batch(medicine_id: str, db: Session = Depends(get_db)):
    batch = db.query(Stock).filter(
        and_(Stock.medicine_id == medicine_id,
             Stock.quantity > 0,
             Stock.expiry_date > datetime.utcnow())
    ).order_by(Stock.expiry_date.asc()).first()
    if not batch:
        raise HTTPException(status_code=404, detail="No stock available")
    return {
        "stock_id": batch.id,
        "batch_number": batch.batch_number,
        "expiry_date": batch.expiry_date.isoformat(),
        "quantity": batch.quantity,
        "mrp": batch.mrp,
        "bin_location": build_bin_location(batch)
    }

@router.patch("/{stock_id}", response_model=StockOut)
def update_stock(stock_id: str, data: StockUpdate, db: Session = Depends(get_db)):
    stock = db.query(Stock).filter(Stock.id == stock_id).first()
    if not stock:
        raise HTTPException(status_code=404, detail="Stock not found")
    old = {c.name: getattr(stock, c.name) for c in stock.__table__.columns}
    for field, val in data.model_dump(exclude_none=True).items():
        setattr(stock, field, val)
    db.commit()
    db.refresh(stock)
    log = AuditLog(table_name="stock", record_id=stock_id,
                   action="UPDATE", old_value=old,
                   new_value=data.model_dump(exclude_none=True))
    db.add(log)
    db.commit()
    out = StockOut.model_validate(stock)
    out.bin_location = build_bin_location(stock)
    return out

@router.delete("/{stock_id}")
def remove_stock(stock_id: str, db: Session = Depends(get_db)):
    stock = db.query(Stock).filter(Stock.id == stock_id).first()
    if not stock:
        raise HTTPException(status_code=404, detail="Stock not found")
    log = AuditLog(table_name="stock", record_id=stock_id,
                   action="DELETE",
                   old_value={"quantity": stock.quantity})
    db.add(log)
    db.delete(stock)
    db.commit()
    return {"message": "Stock removed"}