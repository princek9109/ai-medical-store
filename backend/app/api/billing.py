from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import Bill, Prescription, Stock, Medicine, AuditLog
from app.schemas.billing import BillCreate, BillOut, BillItemOut
from datetime import datetime
import uuid

router = APIRouter(prefix="/billing", tags=["Billing"])

def calc_gst(amount: float, rate: float):
    half = rate / 2
    cgst = round(amount * half / 100, 2)
    sgst = round(amount * half / 100, 2)
    return cgst, sgst

def next_invoice_number(db: Session) -> str:
    today = datetime.utcnow().strftime("%Y%m%d")
    count = db.query(Bill).filter(
        Bill.invoice_number.like(f"INV-{today}-%")
    ).count()
    return f"INV-{today}-{count+1:04d}"

@router.post("/", response_model=BillOut)
def create_bill(data: BillCreate, db: Session = Depends(get_db)):
    rx = db.query(Prescription).filter(
        Prescription.id == data.prescription_id
    ).first()
    if not rx:
        raise HTTPException(status_code=404, detail="Prescription not found")
    if rx.status not in ("ready_to_bill", "pending"):
        raise HTTPException(status_code=400,
            detail=f"Prescription status is '{rx.status}'. Must be ready_to_bill.")

    line_items = []
    subtotal = 0.0
    total_cgst = 0.0
    total_sgst = 0.0

    for item in data.items:
        stock = db.query(Stock).filter(Stock.id == item.stock_id).first()
        if not stock:
            raise HTTPException(status_code=404,
                detail=f"Stock {item.stock_id} not found")
        if stock.quantity < item.quantity:
            raise HTTPException(status_code=400,
                detail=f"Insufficient stock for {item.medicine_name}. Available: {stock.quantity}")

        taxable = round(item.mrp * item.quantity, 2)
        cgst, sgst = calc_gst(taxable, item.gst_rate)
        line_total = round(taxable + cgst + sgst, 2)
        subtotal   += taxable
        total_cgst += cgst
        total_sgst += sgst

        stock.quantity -= item.quantity

        line_items.append(BillItemOut(
            medicine_name=item.medicine_name,
            hsn_code=item.hsn_code,
            quantity=item.quantity,
            mrp=item.mrp,
            taxable_amount=taxable,
            gst_rate=item.gst_rate,
            cgst=cgst,
            sgst=sgst,
            line_total=line_total
        ))

    subtotal    = round(subtotal, 2)
    total_cgst  = round(total_cgst, 2)
    total_sgst  = round(total_sgst, 2)
    discount_amt= round(subtotal * data.discount / 100, 2)
    total       = round(subtotal - discount_amt + total_cgst + total_sgst, 2)

    bill = Bill(
        prescription_id=data.prescription_id,
        subtotal=subtotal,
        discount=discount_amt,
        cgst=total_cgst,
        sgst=total_sgst,
        total=total,
        payment_mode=data.payment_mode,
        payment_status="paid",
        invoice_number=next_invoice_number(db)
    )
    db.add(bill)

    rx.status = "billed"
    db.add(AuditLog(table_name="billing", record_id=bill.id or "new",
                    action="INSERT",
                    new_value={"invoice": bill.invoice_number, "total": total}))
    db.commit()
    db.refresh(bill)

    out = BillOut.model_validate(bill)
    out.line_items = line_items
    return out

@router.get("/")
def list_bills(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    bills = db.query(Bill).order_by(Bill.created_at.desc()).offset(skip).limit(limit).all()
    return bills

@router.get("/{bill_id}", response_model=BillOut)
def get_bill(bill_id: str, db: Session = Depends(get_db)):
    bill = db.query(Bill).filter(Bill.id == bill_id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    out = BillOut.model_validate(bill)
    return out