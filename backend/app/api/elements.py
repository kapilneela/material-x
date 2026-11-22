"""
MATERIAL X - Elements API Endpoint
Serves the authoritative reference data for supported chemical elements.
"""

from fastapi import APIRouter
from app.simulations.elements_data import ELEMENTS_DATA

router = APIRouter(prefix="/elements", tags=["Elements"])

@router.get("")
def get_all_elements():
    """
    Returns dictionary of supported metallic and alloying elements.
    Includes atomic constants, physical properties, and data provenance.
    """
    return {
        "count": len(ELEMENTS_DATA),
        "elements": ELEMENTS_DATA
    }
