from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import Medicine, Stock
from thefuzz import fuzz
from typing import Optional
from datetime import datetime

router = APIRouter(prefix="/search", tags=["Drug Search"])

@router.get("/drugs")
def search_drugs(
    q: str = Query(..., min_length=2),
    limit: int = 5,
    db: Session = Depends(get_db)
):
    query = q.strip().lower()
    medicines = db.query(Medicine).filter(Medicine.is_active == True).all()

    scored = []
    for m in medicines:
        name_score  = fuzz.partial_ratio(query, (m.canonical_name or "").lower())
        brand_score = fuzz.partial_ratio(query, (m.brand_name or "").lower())
        salt_score  = fuzz.partial_ratio(query, (m.salt_composition or "").lower())
        best = max(name_score, brand_score, salt_score)

        if best >= 40:
            stock = db.query(Stock).filter(
                Stock.medicine_id == m.id,
                Stock.quantity > 0,
                Stock.expiry_date > datetime.utcnow()
            ).order_by(Stock.expiry_date.asc()).first()

            scored.append({
                "medicine_id":      m.id,
                "canonical_name":   m.canonical_name,
                "brand_name":       m.brand_name,
                "strength":         m.strength,
                "dosage_form":      m.dosage_form,
                "salt_composition": m.salt_composition,
                "hsn_code":         m.hsn_code,
                "gst_rate":         m.gst_rate,
                "schedule_type":    m.schedule_type,
                "score":            best,
                "in_stock":         stock is not None,
                "available_qty":    stock.quantity if stock else 0,
                "bin_location":     "-".join(filter(None,[stock.zone,stock.aisle,
                                    stock.rack,stock.shelf,stock.bin])) if stock else None,
                "mrp":              stock.mrp if stock else None,
                "stock_id":         stock.id if stock else None,
            })

    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored[:limit]

@router.get("/drugs/instant")
def instant_search(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db)
):
    term = f"%{q}%"
    from sqlalchemy import or_
    results = db.query(Medicine).filter(
        Medicine.is_active == True,
        or_(
            Medicine.canonical_name.ilike(term),
            Medicine.brand_name.ilike(term),
        )
    ).limit(8).all()

    out = []
    for m in results:
        stock = db.query(Stock).filter(
            Stock.medicine_id == m.id,
            Stock.quantity > 0,
            Stock.expiry_date > datetime.utcnow()
        ).order_by(Stock.expiry_date.asc()).first()
        out.append({
            "medicine_id":    m.id,
            "canonical_name": m.canonical_name,
            "brand_name":     m.brand_name,
            "strength":       m.strength,
            "dosage_form":    m.dosage_form,
            "hsn_code":       m.hsn_code,
            "gst_rate":       m.gst_rate,
            "in_stock":       stock is not None,
            "available_qty":  stock.quantity if stock else 0,
            "mrp":            stock.mrp if stock else None,
            "stock_id":       stock.id if stock else None,
            "bin_location":   "-".join(filter(None,[stock.zone,stock.aisle,
                              stock.rack,stock.shelf,stock.bin])) if stock else None,
        })
    return out
