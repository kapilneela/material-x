"""
MATERIAL X - Material Comparison API Endpoint
Compares up to 4 materials side-by-side with genuine multi-property matrices
and availability flags.
"""

from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.schemas.discovery import CompareRequest
from app.services.material_service import get_material_by_id
from app.simulations.mechanical import run_mechanical_simulation
from app.simulations.thermal import run_thermal_simulation
from app.simulations.electrical import run_electrical_simulation
from app.simulations.corrosion import run_corrosion_simulation

router = APIRouter(prefix="/materials", tags=["Comparison"])

@router.post("/compare")
def route_compare_materials(payload: CompareRequest, db: Session = Depends(get_db)):
    if len(payload.material_ids) < 2:
        raise HTTPException(status_code=400, detail="Must select at least 2 materials to compare.")
    if len(payload.material_ids) > 4:
        raise HTTPException(status_code=400, detail="Comparison is limited to a maximum of 4 materials.")
        
    compared_materials = []
    
    for mat_id in payload.material_ids:
        mat = get_material_by_id(db, mat_id)
        if not mat:
            raise HTTPException(status_code=404, detail=f"Material ID '{mat_id}' not found.")
            
        comp = mat["composition_wt"]
        
        # Calculate full multi-physical properties
        mech = run_mechanical_simulation(comp, applied_stress_mpa=200.0, temperature_k=293.15)
        therm = run_thermal_simulation(comp)
        elec = run_electrical_simulation(comp)
        corr = run_corrosion_simulation(comp)
        
        compared_materials.append({
            "id": mat["id"],
            "name": mat["name"],
            "category": mat["category"],
            "base_element": mat["base_element"],
            "dominant_structure": mat["dominant_structure"],
            "composition_wt": comp,
            "composition_at": mat["composition_at"],
            "properties": {
                "density": {
                    "value": mat["density_g_cm3"],
                    "unit": "g/cm³",
                    "provenance": "Physics-based (Reciprocal rule)",
                    "available": True
                },
                "yield_strength": {
                    "value": mech["results"]["yield_strength_mpa"],
                    "unit": "MPa",
                    "provenance": "Physics-based / Solid solution model",
                    "available": True
                },
                "ultimate_tensile_strength": {
                    "value": mech["results"]["ultimate_tensile_strength_mpa"],
                    "unit": "MPa",
                    "provenance": "Physics-based / Constitutive model",
                    "available": True
                },
                "elastic_modulus": {
                    "value": mech["results"]["elastic_modulus_gpa"],
                    "unit": "GPa",
                    "provenance": "Physics-based / Voigt-Reuss-Hill",
                    "available": True
                },
                "vickers_hardness": {
                    "value": mech["results"]["vickers_hardness_hv"],
                    "unit": "HV",
                    "provenance": "Educational approximation",
                    "available": True
                },
                "thermal_conductivity": {
                    "value": therm["results"]["thermal_conductivity_w_mk"],
                    "unit": "W/m·K",
                    "provenance": "Physics-based / Phonon scattering corrected",
                    "available": True
                },
                "specific_heat": {
                    "value": therm["results"]["specific_heat_capacity_j_kgk"],
                    "unit": "J/kg·K",
                    "provenance": "Physics-based / Neumann-Kopp",
                    "available": True
                },
                "electrical_resistivity": {
                    "value": elec["results"]["resistivity_nano_ohm_m"],
                    "unit": "nΩ·m",
                    "provenance": "Physics-based / Nordheim-Matthiessen",
                    "available": True
                },
                "electrical_conductivity_iacs": {
                    "value": elec["results"]["iacs_conductivity_percent"],
                    "unit": "% IACS",
                    "provenance": "Reciprocal relation (1 / rho)",
                    "available": True
                },
                "pitting_resistance_pren": {
                    "value": corr["results"]["pitting_resistance_equivalent_number_pren"],
                    "unit": "PREN Index",
                    "provenance": "Literature empirical formula",
                    "available": corr["results"]["pitting_resistance_equivalent_number_pren"] > 0
                },
                "corrosion_rate_saline": {
                    "value": corr["results"]["estimated_corrosion_rate_mm_year"],
                    "unit": "mm/year",
                    "provenance": "Educational approximation (Stern-Geary)",
                    "available": True
                }
            }
        })
        
    return {
        "count": len(compared_materials),
        "materials": compared_materials
    }
