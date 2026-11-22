"""
MATERIAL X - Unified API Router
"""

from fastapi import APIRouter
from app.api.elements import router as elements_router
from app.api.materials import router as materials_router
from app.api.simulations import router as simulations_router
from app.api.compare import router as compare_router
from app.api.discovery import router as discovery_router
from app.api.reports import router as reports_router

api_router = APIRouter(prefix="/api")

api_router.include_router(elements_router)
api_router.include_router(materials_router)
api_router.include_router(simulations_router)
api_router.include_router(compare_router)
api_router.include_router(discovery_router)
api_router.include_router(reports_router)
