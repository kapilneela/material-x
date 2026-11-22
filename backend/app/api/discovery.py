"""
MATERIAL X - Discovery & Multi-Objective Optimization API
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.schemas.discovery import DiscoveryRequest
from app.simulations.discovery import run_discovery_optimization, OBJECTIVES

router = APIRouter(prefix="/discovery", tags=["Discovery"])

@router.get("/objectives")
def route_get_objectives():
    return OBJECTIVES

@router.post("/optimize")
def route_optimize_materials(payload: DiscoveryRequest):
    return run_discovery_optimization(
        base_element=payload.base_element,
        candidate_elements=payload.candidate_elements,
        primary_objective=payload.primary_objective,
        secondary_objective=payload.secondary_objective,
        max_solute_wt_pct=payload.max_solute_wt_pct,
        target_count=payload.target_count
    )
