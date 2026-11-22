"""
MATERIAL X - Pydantic Schemas for Discovery and Comparison
"""

from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field

class DiscoveryRequest(BaseModel):
    base_element: str = "Al"
    candidate_elements: List[str] = ["Cu", "Mg", "Si", "Zn"]
    primary_objective: str = "minimize_density"
    secondary_objective: str = "maximize_yield_strength"
    max_solute_wt_pct: float = Field(default=12.0, ge=1.0, le=40.0)
    target_count: int = Field(default=6, ge=1, le=20)

class CompareRequest(BaseModel):
    material_ids: List[str] = Field(..., min_length=2, max_length=4)
