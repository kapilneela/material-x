"""
Composition conversion and validation utilities for MATERIAL X.
Strictly adheres to scientific thermodynamics and mass conservation.
No silent normalization of invalid inputs.
"""

from typing import Dict, Tuple, List
from app.simulations.elements_data import ELEMENTS_DATA

def validate_composition(composition: Dict[str, float], tolerance: float = 0.05) -> Tuple[bool, float, str]:
    """
    Validates that composition percentages sum to exactly 100.0% within floating tolerance.
    Does NOT modify or normalize input.
    """
    if not composition:
        return False, 0.0, "Composition is empty. Select at least one element."
    
    total = sum(composition.values())
    
    # Check for invalid elements
    for el in composition.keys():
        if el not in ELEMENTS_DATA:
            return False, total, f"Element '{el}' is not in the supported database."
        if composition[el] < 0:
            return False, total, f"Element '{el}' has negative percentage {composition[el]}%."
            
    if abs(total - 100.0) > tolerance:
        diff = total - 100.0
        sign = "+" if diff > 0 else ""
        return False, round(total, 4), f"Composition totals {total:.2f}% ({sign}{diff:.2f}%). Must total exactly 100.00%."
        
    return True, round(total, 4), "Valid 100.00% composition."


def wt_to_at_percent(wt_percent: Dict[str, float]) -> Dict[str, float]:
    """
    Converts weight percentage to atomic percentage using authoritative atomic masses:
    at%_i = (wt%_i / M_i) / sum(wt%_j / M_j) * 100
    """
    moles: Dict[str, float] = {}
    for el, wt in wt_percent.items():
        if wt <= 0:
            continue
        m_i = ELEMENTS_DATA[el]["atomic_mass"]
        moles[el] = wt / m_i
        
    total_moles = sum(moles.values())
    if total_moles <= 0:
        return {}
        
    return {el: round((n / total_moles) * 100.0, 4) for el, n in moles.items()}


def at_to_wt_percent(at_percent: Dict[str, float]) -> Dict[str, float]:
    """
    Converts atomic percentage to weight percentage:
    wt%_i = (at%_i * M_i) / sum(at%_j * M_j) * 100
    """
    masses: Dict[str, float] = {}
    for el, at in at_percent.items():
        if at <= 0:
            continue
        m_i = ELEMENTS_DATA[el]["atomic_mass"]
        masses[el] = at * m_i
        
    total_mass = sum(masses.values())
    if total_mass <= 0:
        return {}
        
    return {el: round((m / total_mass) * 100.0, 4) for el, m in masses.items()}


def calculate_base_properties(wt_percent: Dict[str, float]) -> Dict[str, any]:
    """
    Calculates fundamental physical composite properties:
    - Theoretical density (reciprocal mass fraction model: 1/rho = sum(w_i / rho_i))
    - Weighted average atomic mass
    - Major/base element
    """
    inv_density = 0.0
    avg_mass = 0.0
    at_perc = wt_to_at_percent(wt_percent)
    
    for el, wt in wt_percent.items():
        fraction = wt / 100.0
        rho = ELEMENTS_DATA[el]["density_g_cm3"]
        inv_density += fraction / rho
        
    for el, at in at_perc.items():
        avg_mass += (at / 100.0) * ELEMENTS_DATA[el]["atomic_mass"]
        
    density = round(1.0 / inv_density, 3) if inv_density > 0 else 0.0
    
    # Identify base element
    base_element = max(wt_percent.items(), key=lambda x: x[1])[0]
    
    # Dominant crystal structure based on base element
    dominant_structure = ELEMENTS_DATA[base_element]["crystal_structure"]
    
    return {
        "density_g_cm3": density,
        "average_atomic_mass": round(avg_mass, 3),
        "base_element": base_element,
        "dominant_structure": dominant_structure,
        "atomic_percentages": at_perc
    }
