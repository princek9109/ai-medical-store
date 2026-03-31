from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import Stock, Medicine

router = APIRouter(prefix="/bins", tags=["Bin Locations"])

@router.get("/layout")
def get_store_layout(db: Session = Depends(get_db)):
    stocks = db.query(Stock).filter(Stock.zone != None).all()
    layout = {}
    for s in stocks:
        z = s.zone or "Unassigned"
        if z not in layout:
            layout[z] = {}
        a = s.aisle or "-"
        if a not in layout[z]:
            layout[z][a] = {}
        r = s.rack or "-"
        if r not in layout[z][a]:
            layout[z][a][r] = {}
        sh = s.shelf or "-"
        if sh not in layout[z][a][r]:
            layout[z][a][r][sh] = []
        med = db.query(Medicine).filter(Medicine.id == s.medicine_id).first()
        layout[z][a][r][sh].append({
            "bin": s.bin,
            "stock_id": s.id,
            "medicine": med.canonical_name if med else "Unknown",
            "quantity": s.quantity,
            "batch": s.batch_number
        })
    return layout

@router.get("/search")
def search_by_bin(
    zone: str = None, aisle: str = None,
    rack: str = None, shelf: str = None, bin: str = None,
    db: Session = Depends(get_db)
):
    q = db.query(Stock)
    if zone:  q = q.filter(Stock.zone == zone)
    if aisle: q = q.filter(Stock.aisle == aisle)
    if rack:  q = q.filter(Stock.rack == rack)
    if shelf: q = q.filter(Stock.shelf == shelf)
    if bin:   q = q.filter(Stock.bin == bin)
    stocks = q.all()
    result = []
    for s in stocks:
        med = db.query(Medicine).filter(Medicine.id == s.medicine_id).first()
        result.append({
            "bin_location": f"{s.zone}-{s.aisle}-{s.rack}-{s.shelf}-{s.bin}",
            "medicine": med.canonical_name if med else "Unknown",
            "quantity": s.quantity,
            "expiry": s.expiry_date.isoformat(),
            "batch": s.batch_number
        })
    return result

@router.get("/zones")
def list_zones(db: Session = Depends(get_db)):
    rows = db.query(Stock.zone).distinct().filter(Stock.zone != None).all()
    return [r[0] for r in rows]
