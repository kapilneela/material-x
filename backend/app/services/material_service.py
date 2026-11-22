"""
MATERIAL X - Material Persistence Service
Handles database CRUD, validation, at%/wt% synchronization, and baseline alloys.
"""

from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.database.models import Material, CompositionItem, Simulation, ReportRecord
from app.schemas.material import MaterialCreate, MaterialUpdate
from app.simulations.composition_utils import (
    validate_composition,
    wt_to_at_percent,
    calculate_base_properties
)
from app.simulations.elements_data import ELEMENTS_DATA

def serialize_material(mat: Material) -> Dict[str, Any]:
    wt_dict = {item.element_symbol: item.weight_percent for item in mat.composition}
    at_dict = {item.element_symbol: item.atomic_percent for item in mat.composition}
    
    return {
        "id": mat.id,
        "name": mat.name,
        "category": mat.category,
        "description": mat.description,
        "base_element": mat.base_element,
        "dominant_structure": mat.dominant_structure,
        "density_g_cm3": mat.density_g_cm3,
        "average_atomic_mass": mat.average_atomic_mass,
        "composition_wt": wt_dict,
        "composition_at": at_dict,
        "created_at": mat.created_at,
        "updated_at": mat.updated_at,
        "simulations_count": len(mat.simulations)
    }

def create_material(db: Session, data: MaterialCreate) -> Dict[str, Any]:
    is_valid, total, err_msg = validate_composition(data.composition_wt)
    if not is_valid:
        raise HTTPException(status_code=400, detail=err_msg)
        
    base_props = calculate_base_properties(data.composition_wt)
    at_perc = base_props["atomic_percentages"]
    
    mat = Material(
        name=data.name,
        category=data.category,
        description=data.description,
        base_element=base_props["base_element"],
        dominant_structure=base_props["dominant_structure"],
        density_g_cm3=base_props["density_g_cm3"],
        average_atomic_mass=base_props["average_atomic_mass"]
    )
    db.add(mat)
    db.flush()
    
    for el, wt in data.composition_wt.items():
        if wt > 0:
            item = CompositionItem(
                material_id=mat.id,
                element_symbol=el,
                weight_percent=wt,
                atomic_percent=at_perc.get(el, 0.0)
            )
            db.add(item)
            
    db.commit()
    db.refresh(mat)
    return serialize_material(mat)

def get_material_by_id(db: Session, material_id: str) -> Optional[Dict[str, Any]]:
    mat = db.query(Material).filter(Material.id == material_id).first()
    if not mat:
        return None
    return serialize_material(mat)

def get_all_materials(db: Session) -> List[Dict[str, Any]]:
    materials = db.query(Material).order_by(Material.updated_at.desc()).all()
    return [serialize_material(m) for m in materials]

def update_material(db: Session, material_id: str, data: MaterialUpdate) -> Dict[str, Any]:
    mat = db.query(Material).filter(Material.id == material_id).first()
    if not mat:
        raise HTTPException(status_code=404, detail=f"Material with ID {material_id} not found.")
        
    if data.name is not None:
        mat.name = data.name
    if data.category is not None:
        mat.category = data.category
    if data.description is not None:
        mat.description = data.description
        
    if data.composition_wt is not None:
        is_valid, total, err_msg = validate_composition(data.composition_wt)
        if not is_valid:
            raise HTTPException(status_code=400, detail=err_msg)
            
        base_props = calculate_base_properties(data.composition_wt)
        at_perc = base_props["atomic_percentages"]
        
        mat.base_element = base_props["base_element"]
        mat.dominant_structure = base_props["dominant_structure"]
        mat.density_g_cm3 = base_props["density_g_cm3"]
        mat.average_atomic_mass = base_props["average_atomic_mass"]
        
        # Clear existing items and re-add
        db.query(CompositionItem).filter(CompositionItem.material_id == mat.id).delete()
        for el, wt in data.composition_wt.items():
            if wt > 0:
                item = CompositionItem(
                    material_id=mat.id,
                    element_symbol=el,
                    weight_percent=wt,
                    atomic_percent=at_perc.get(el, 0.0)
                )
                db.add(item)
                
    db.commit()
    db.refresh(mat)
    return serialize_material(mat)

def delete_material(db: Session, material_id: str) -> bool:
    mat = db.query(Material).filter(Material.id == material_id).first()
    if not mat:
        return False
    db.delete(mat)
    db.commit()
    return True

def seed_authoritative_materials(db: Session):
    """
    Populates database with standard reference alloys if empty.
    All compositions total exactly 100.0%.
    """
    if db.query(Material).count() > 0:
        return

    reference_alloys = [
        {
            "name": "Austenitic Stainless Steel 304",
            "category": "Stainless Steel (Austenitic)",
            "description": "Standard 18/8 corrosion resistant chromium-nickel austenitic stainless steel (UNS S30400).",
            "composition": {"Fe": 70.0, "Cr": 18.0, "Ni": 10.0, "Mn": 2.0}
        },
        {
            "name": "Titanium Grade 5 (Ti-6Al-4V)",
            "category": "Titanium Alloy (Alpha-Beta)",
            "description": "High specific-strength aerospace alloy with exceptional corrosion resistance and biocompatibility.",
            "composition": {"Ti": 90.0, "Al": 6.0, "V": 4.0}
        },
        {
            "name": "Duralumin (Al-Cu-Mg 2024)",
            "category": "Aluminium Alloy (Heat Treatable)",
            "description": "High-strength aircraft structural alloy featuring copper and magnesium solid-solution and precipitation hardening.",
            "composition": {"Al": 93.5, "Cu": 4.5, "Mg": 1.4, "Mn": 0.6}
        },
        {
            "name": "Superalloy Inconel 718 Matrix",
            "category": "Nickel-base Superalloy",
            "description": "High-temperature creep and oxidation resistant nickel-chromium-iron matrix for turbine blades.",
            "composition": {"Ni": 52.5, "Fe": 19.0, "Cr": 19.0, "Mo": 5.0, "Ti": 1.0, "Al": 0.5, "Co": 3.0}
        }
    ]

    for alloy in reference_alloys:
        props = calculate_base_properties(alloy["composition"])
        at_perc = props["atomic_percentages"]
        mat = Material(
            name=alloy["name"],
            category=alloy["category"],
            description=alloy["description"],
            base_element=props["base_element"],
            dominant_structure=props["dominant_structure"],
            density_g_cm3=props["density_g_cm3"],
            average_atomic_mass=props["average_atomic_mass"]
        )
        db.add(mat)
        db.flush()
        
        for el, wt in alloy["composition"].items():
            db.add(CompositionItem(
                material_id=mat.id,
                element_symbol=el,
                weight_percent=wt,
                atomic_percent=at_perc.get(el, 0.0)
            ))
            
    db.commit()
