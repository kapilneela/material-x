"""
MATERIAL X - Pydantic Schemas for Materials
"""

from typing import Dict, List, Optional, Any
from datetime import datetime
from pydantic import BaseModel, Field

class CompositionInput(BaseModel):
    weight_percent: Optional[Dict[str, float]] = None
    atomic_percent: Optional[Dict[str, float]] = None

class MaterialCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=128)
    category: str = Field(default="Metallic Alloy", max_length=64)
    description: Optional[str] = None
    composition_wt: Dict[str, float]

class MaterialUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    composition_wt: Optional[Dict[str, float]] = None

class MaterialOut(BaseModel):
    id: str
    name: str
    category: str
    description: Optional[str]
    base_element: str
    dominant_structure: str
    density_g_cm3: float
    average_atomic_mass: float
    composition_wt: Dict[str, float]
    composition_at: Dict[str, float]
    created_at: datetime
    updated_at: datetime
    simulations_count: Optional[int] = 0

    class Config:
        from_attributes = True
