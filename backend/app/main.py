from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import engine
from app.models.models import Base
from app.api import medicines, stock, bins, search, prescriptions, billing

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Medical Store API",
    description="Phase 3 - Manual Entry, Dispense & Billing",
    version="3.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(medicines.router)
app.include_router(stock.router)
app.include_router(bins.router)
app.include_router(search.router)
app.include_router(prescriptions.router)
app.include_router(billing.router)

@app.get("/")
def root():
    return {"message": "AI Medical Store API", "phase": "3", "status": "online"}

@app.get("/health")
def health():
    return {"status": "healthy"}
