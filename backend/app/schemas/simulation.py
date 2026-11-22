"""
MATERIAL X - Pydantic Schemas for Simulations
"""

from typing import Dict, List, Optional, Any
from datetime import datetime
from pydantic import BaseModel, Field

class MechanicalSimRequest(BaseModel):
    material_id: Optional[str] = None
    composition_wt: Optional[Dict[str, float]] = None
    applied_stress_mpa: float = Field(default=250.0, ge=0.0)
    temperature_k: float = Field(default=293.15, ge=50.0, le=3000.0)
    max_strain: float = Field(default=0.20, ge=0.01, le=1.0)
    grain_size_um: float = Field(default=25.0, ge=0.1, le=1000.0)

class ThermalSimRequest(BaseModel):
    material_id: Optional[str] = None
    composition_wt: Optional[Dict[str, float]] = None
    initial_temp_k: float = Field(default=293.15, ge=50.0)
    target_temp_k: float = Field(default=473.15, ge=50.0)
    length_m: float = Field(default=0.10, ge=0.001)
    width_m: float = Field(default=0.02, ge=0.001)
    height_m: float = Field(default=0.02, ge=0.001)
    heat_input_watts: float = Field(default=50.0, ge=0.0)
    simulation_duration_s: float = Field(default=30.0, ge=1.0, le=600.0)

class ElectricalSimRequest(BaseModel):
    material_id: Optional[str] = None
    composition_wt: Optional[Dict[str, float]] = None
    operating_temp_k: float = Field(default=293.15, ge=50.0, le=2000.0)
    wire_length_m: float = Field(default=1.0, ge=0.01)
    wire_area_mm2: float = Field(default=2.5, ge=0.01)
    applied_current_amps: float = Field(default=5.0, ge=0.0)

class CorrosionSimRequest(BaseModel):
    material_id: Optional[str] = None
    composition_wt: Optional[Dict[str, float]] = None
    environment_type: str = "Marine / Saline (3.5% NaCl)"
    solution_ph: float = Field(default=6.5, ge=0.0, le=14.0)
    temperature_k: float = Field(default=298.15, ge=273.15, le=373.15)
    dissolved_o2_ppm: float = Field(default=6.0, ge=0.0, le=20.0)
    exposure_time_hours: float = Field(default=8760.0, ge=1.0)

class LatticeSimRequest(BaseModel):
    lattice_type: str = "BCC"
    material_id: Optional[str] = None
    composition_wt: Optional[Dict[str, float]] = None

class SimulationRecordOut(BaseModel):
    id: str
    material_id: str
    simulation_type: str
    model_name: str
    data_category: str
    input_parameters: Dict[str, Any]
    results: Dict[str, Any]
    scientific_assumptions: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
