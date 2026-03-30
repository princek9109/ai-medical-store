from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import engine
from app.models.models import Base

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Medical Store API",
    description="Phase 1 - Inventory & Database Foundation",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "message": "AI Medical Store API is running",
        "phase": "Phase 1 - Foundation",
        "status": "online"
    }

@app.get("/health")
def health():
    return {"status": "healthy"}