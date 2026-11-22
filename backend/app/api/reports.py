"""
MATERIAL X - PDF Report Generation API
Generates and downloads formal technical material datasheets.
"""

from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import io

from app.database.database import get_db
from app.services.material_service import get_material_by_id
from app.services.report_generator import generate_material_pdf
from app.simulations.mechanical import run_mechanical_simulation
from app.simulations.thermal import run_thermal_simulation
from app.simulations.electrical import run_electrical_simulation
from app.simulations.corrosion import run_corrosion_simulation

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/{id}")
def route_download_material_report(id: str, db: Session = Depends(get_db)):
    mat = get_material_by_id(db, id)
    if not mat:
        raise HTTPException(status_code=404, detail=f"Material ID '{id}' not found.")
        
    comp = mat["composition_wt"]
    
    # Run full simulations to embed authoritative results into report
    mech = run_mechanical_simulation(comp, applied_stress_mpa=200.0, temperature_k=293.15)
    therm = run_thermal_simulation(comp)
    elec = run_electrical_simulation(comp)
    corr = run_corrosion_simulation(comp)
    
    pdf_bytes = generate_material_pdf(
        material_data=mat,
        mechanical_results=mech,
        thermal_results=therm,
        electrical_results=elec,
        corrosion_results=corr
    )
    
    filename = f"MaterialX_Report_{mat['name'].replace(' ', '_')}_{mat['id']}.pdf"
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=\"{filename}\""
        }
    )

@router.get("/{id}/preview")
def route_preview_material_report(id: str, db: Session = Depends(get_db)):
    mat = get_material_by_id(db, id)
    if not mat:
        raise HTTPException(status_code=404, detail=f"Material ID '{id}' not found.")
        
    comp = mat["composition_wt"]
    mech = run_mechanical_simulation(comp, applied_stress_mpa=200.0, temperature_k=293.15)
    therm = run_thermal_simulation(comp)
    elec = run_electrical_simulation(comp)
    corr = run_corrosion_simulation(comp)
    
    return {
        "material": mat,
        "simulations": {
            "mechanical": mech,
            "thermal": therm,
            "electrical": elec,
            "corrosion": corr
        }
    }
