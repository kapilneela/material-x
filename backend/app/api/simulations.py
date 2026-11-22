"""
MATERIAL X - Simulation API Routes
Executes physics calculations, logs simulation history, and generates crystal coordinates.
"""

from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import Simulation, Material
from app.schemas.simulation import (
    MechanicalSimRequest,
    ThermalSimRequest,
    ElectricalSimRequest,
    CorrosionSimRequest,
    LatticeSimRequest,
    SimulationRecordOut
)
from app.services.material_service import get_material_by_id
from app.simulations.mechanical import run_mechanical_simulation
from app.simulations.thermal import run_thermal_simulation
from app.simulations.electrical import run_electrical_simulation
from app.simulations.corrosion import run_corrosion_simulation
from app.simulations.atomic_structure import generate_crystal_lattice
from app.simulations.composition_utils import validate_composition

router = APIRouter(prefix="/simulations", tags=["Simulations"])

def _resolve_composition(req, db: Session) -> Dict[str, float]:
    if req.composition_wt:
        is_valid, _, msg = validate_composition(req.composition_wt)
        if not is_valid:
            raise HTTPException(status_code=400, detail=f"Invalid composition: {msg}")
        return req.composition_wt
    elif req.material_id:
        mat = get_material_by_id(db, req.material_id)
        if not mat:
            raise HTTPException(status_code=404, detail=f"Material ID '{req.material_id}' not found.")
        return mat["composition_wt"]
    else:
        raise HTTPException(status_code=400, detail="Must provide either 'material_id' or valid 'composition_wt'.")

@router.post("/mechanical")
def route_mechanical_simulation(req: MechanicalSimRequest, db: Session = Depends(get_db)):
    comp = _resolve_composition(req, db)
    results = run_mechanical_simulation(
        composition_wt=comp,
        applied_stress_mpa=req.applied_stress_mpa,
        temperature_k=req.temperature_k,
        max_strain=req.max_strain,
        grain_size_um=req.grain_size_um
    )
    
    # Persist simulation history if associated with a saved material
    if req.material_id:
        sim_rec = Simulation(
            material_id=req.material_id,
            simulation_type="mechanical",
            model_name=results["model_name"],
            data_category=results["data_category"],
            input_parameters=results["input_parameters"],
            results=results["results"],
            scientific_assumptions=results["scientific_disclaimer"]
        )
        db.add(sim_rec)
        db.commit()
        results["simulation_id"] = sim_rec.id
        
    return results

@router.post("/thermal")
def route_thermal_simulation(req: ThermalSimRequest, db: Session = Depends(get_db)):
    comp = _resolve_composition(req, db)
    results = run_thermal_simulation(
        composition_wt=comp,
        initial_temp_k=req.initial_temp_k,
        target_temp_k=req.target_temp_k,
        length_m=req.length_m,
        width_m=req.width_m,
        height_m=req.height_m,
        heat_input_watts=req.heat_input_watts,
        simulation_duration_s=req.simulation_duration_s
    )
    
    if req.material_id:
        sim_rec = Simulation(
            material_id=req.material_id,
            simulation_type="thermal",
            model_name=results["model_name"],
            data_category=results["data_category"],
            input_parameters=results["input_parameters"],
            results=results["results"],
            scientific_assumptions=results["scientific_disclaimer"]
        )
        db.add(sim_rec)
        db.commit()
        results["simulation_id"] = sim_rec.id
        
    return results

@router.post("/electrical")
def route_electrical_simulation(req: ElectricalSimRequest, db: Session = Depends(get_db)):
    comp = _resolve_composition(req, db)
    results = run_electrical_simulation(
        composition_wt=comp,
        operating_temp_k=req.operating_temp_k,
        wire_length_m=req.wire_length_m,
        wire_area_mm2=req.wire_area_mm2,
        applied_current_amps=req.applied_current_amps
    )
    
    if req.material_id:
        sim_rec = Simulation(
            material_id=req.material_id,
            simulation_type="electrical",
            model_name=results["model_name"],
            data_category=results["data_category"],
            input_parameters=results["input_parameters"],
            results=results["results"],
            scientific_assumptions=results["scientific_disclaimer"]
        )
        db.add(sim_rec)
        db.commit()
        results["simulation_id"] = sim_rec.id
        
    return results

@router.post("/corrosion")
def route_corrosion_simulation(req: CorrosionSimRequest, db: Session = Depends(get_db)):
    comp = _resolve_composition(req, db)
    results = run_corrosion_simulation(
        composition_wt=comp,
        environment_type=req.environment_type,
        solution_ph=req.solution_ph,
        temperature_k=req.temperature_k,
        dissolved_o2_ppm=req.dissolved_o2_ppm,
        exposure_time_hours=req.exposure_time_hours
    )
    
    if req.material_id:
        sim_rec = Simulation(
            material_id=req.material_id,
            simulation_type="corrosion",
            model_name=results["model_name"],
            data_category=results["data_category"],
            input_parameters=results["input_parameters"],
            results=results["results"],
            scientific_assumptions=results["scientific_disclaimer"]
        )
        db.add(sim_rec)
        db.commit()
        results["simulation_id"] = sim_rec.id
        
    return results

@router.post("/lattice")
def route_atomic_lattice(
    req: LatticeSimRequest,
    db: Session = Depends(get_db)
):
    comp = None
    if req.composition_wt:
        comp = req.composition_wt
    elif req.material_id:
        mat = get_material_by_id(db, req.material_id)
        if mat:
            comp = mat["composition_wt"]
            
    if not comp:
        comp = {"Fe": 100.0}
        
    return generate_crystal_lattice(
        lattice_type=req.lattice_type,
        composition_wt=comp,
        supercell_dims=[2, 2, 2]
    )

@router.get("/history/{material_id}")
def route_simulation_history(material_id: str, db: Session = Depends(get_db)):
    records = db.query(Simulation).filter(Simulation.material_id == material_id).order_by(Simulation.created_at.desc()).all()
    return records
