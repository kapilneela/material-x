"""
MATERIAL X - Backend Application Server
FastAPI scientific engine & REST API.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database.database import engine, Base, SessionLocal
from app.api.api import api_router
from app.services.material_service import seed_authoritative_materials

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    Base.metadata.create_all(bind=engine)
    # Seed standard authoritative reference alloys
    db = SessionLocal()
    try:
        seed_authoritative_materials(db)
    finally:
        db.close()
    yield

app = FastAPI(
    title="MATERIAL X Scientific API",
    description="Computational materials design, physics-based simulation, and discovery platform.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include unified API router
app.include_router(api_router)

@app.get("/")
def root():
    return {
        "platform": "MATERIAL X",
        "tagline": "Design. Simulate. Discover.",
        "status": "operational",
        "docs_url": "/docs"
    }

@app.get("/api/health")
def health():
    return {"status": "healthy", "service": "material-x-engine"}
