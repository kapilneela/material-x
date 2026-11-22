"""
MATERIAL X - Materials API Routes
Full CRUD persistence for material compositions.
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.schemas.material import MaterialCreate, MaterialUpdate, MaterialOut
from app.services.material_service import (
    create_material,
    get_all_materials,
    get_material_by_id,
    update_material,
    delete_material
)

router = APIRouter(prefix="/materials", tags=["Materials"])

@router.post("", response_model=MaterialOut, status_code=status.HTTP_201_CREATED)
def route_create_material(payload: MaterialCreate, db: Session = Depends(get_db)):
    return create_material(db, payload)

@router.get("", response_model=List[MaterialOut])
def route_get_materials(db: Session = Depends(get_db)):
    return get_all_materials(db)

@router.get("/{id}", response_model=MaterialOut)
def route_get_material(id: str, db: Session = Depends(get_db)):
    mat = get_material_by_id(db, id)
    if not mat:
        raise HTTPException(status_code=404, detail=f"Material with ID '{id}' not found.")
    return mat

@router.put("/{id}", response_model=MaterialOut)
def route_update_material(id: str, payload: MaterialUpdate, db: Session = Depends(get_db)):
    return update_material(db, id, payload)

@router.delete("/{id}", status_code=status.HTTP_200_OK)
def route_delete_material(id: str, db: Session = Depends(get_db)):
    success = delete_material(db, id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Material with ID '{id}' not found.")
    return {"status": "success", "message": f"Material '{id}' deleted successfully."}
