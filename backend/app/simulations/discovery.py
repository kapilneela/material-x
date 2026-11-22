"""
MATERIAL X - Material Discovery and Optimization Engine
Performs multi-objective Pareto-frontier candidate exploration and ranking.
Explicitly documents optimization constraints, trade-offs, and methodology.
"""

from typing import Dict, Any, List
import numpy as np
from app.simulations.elements_data import ELEMENTS_DATA
from app.simulations.composition_utils import calculate_base_properties
from app.simulations.mechanical import run_mechanical_simulation
from app.simulations.thermal import run_thermal_simulation
from app.simulations.electrical import run_electrical_simulation
from app.simulations.corrosion import run_corrosion_simulation

OBJECTIVES = {
    "maximize_thermal_conductivity": {
        "name": "Maximize Thermal Conductivity",
        "unit": "W/m·K",
        "goal": "max"
    },
    "minimize_density": {
        "name": "Minimize Density (Lightweighting)",
        "unit": "g/cm³",
        "goal": "min"
    },
    "maximize_yield_strength": {
        "name": "Maximize Yield Strength",
        "unit": "MPa",
        "goal": "max"
    },
    "improve_corrosion_resistance": {
        "name": "Maximize Corrosion / Pitting Resistance (PREN & Passivation)",
        "unit": "Score / PREN",
        "goal": "max"
    },
    "balance_strength_and_conductivity": {
        "name": "Balance Strength & Electrical Conductivity (Specific IACS)",
        "unit": "MPa · %IACS",
        "goal": "max"
    }
}

def run_discovery_optimization(
    base_element: str = "Al",
    candidate_elements: List[str] = ["Cu", "Mg", "Si", "Zn"],
    primary_objective: str = "minimize_density",
    secondary_objective: str = "maximize_yield_strength",
    max_solute_wt_pct: float = 12.0,
    target_count: int = 6
) -> Dict[str, Any]:
    """
    Explores candidate alloy compositions within metallurgical solubility limits.
    Computes Pareto-weighted ranks and surfaces trade-offs.
    """
    if base_element not in ELEMENTS_DATA:
        base_element = "Al"
        
    valid_candidates = [el for el in candidate_elements if el in ELEMENTS_DATA and el != base_element]
    if not valid_candidates:
        valid_candidates = ["Cu", "Mg"]
        
    candidates_list: List[Dict[str, Any]] = []
    
    # Generate discrete exploration grid within feasible metallurgical solute ranges
    # For instance: 0% to max_solute_wt_pct distributed across 1 or 2 solute elements
    compositions_to_eval = []
    
    # 1. Pure baseline
    compositions_to_eval.append({base_element: 100.0})
    
    # 2. Binary compositions
    for sol in valid_candidates:
        for wt in [1.5, 3.0, 5.0, min(8.0, max_solute_wt_pct)]:
            if wt <= max_solute_wt_pct:
                compositions_to_eval.append({
                    base_element: round(100.0 - wt, 2),
                    sol: round(wt, 2)
                })
                
    # 3. Ternary combinations
    if len(valid_candidates) >= 2:
        for i in range(len(valid_candidates)):
            for j in range(i + 1, len(valid_candidates)):
                sol1 = valid_candidates[i]
                sol2 = valid_candidates[j]
                for w1, w2 in [(2.0, 1.0), (3.0, 2.0), (4.0, 1.5), (min(5.0, max_solute_wt_pct/2), min(3.0, max_solute_wt_pct/2))]:
                    if (w1 + w2) <= max_solute_wt_pct:
                        compositions_to_eval.append({
                            base_element: round(100.0 - (w1 + w2), 2),
                            sol1: round(w1, 2),
                            sol2: round(w2, 2)
                        })
                        
    # Evaluate candidates
    for comp in compositions_to_eval:
        base_calc = calculate_base_properties(comp)
        mech = run_mechanical_simulation(comp, applied_stress_mpa=150.0, temperature_k=293.15)
        therm = run_thermal_simulation(comp, simulation_duration_s=5.0)
        elec = run_electrical_simulation(comp)
        corr = run_corrosion_simulation(comp)
        
        density = base_calc["density_g_cm3"]
        yield_str = mech["results"]["yield_strength_mpa"]
        therm_k = therm["results"]["thermal_conductivity_w_mk"]
        elec_iacs = elec["results"]["iacs_conductivity_percent"]
        pren = corr["results"]["pitting_resistance_equivalent_number_pren"]
        passiv_pct = corr["results"]["passivating_element_content_pct"]
        
        # Build score metrics
        metrics = {
            "density_g_cm3": density,
            "yield_strength_mpa": yield_str,
            "thermal_conductivity_w_mk": therm_k,
            "electrical_conductivity_iacs": elec_iacs,
            "pitting_resistance_pren": pren,
            "passivating_content_pct": passiv_pct,
            "specific_yield_strength": round(yield_str / density, 1),
            "strength_conductivity_product": round(yield_str * (elec_iacs / 100.0), 1)
        }
        
        candidates_list.append({
            "composition": comp,
            "metrics": metrics,
            "dominant_structure": base_calc["dominant_structure"]
        })
        
    # Multi-objective Pareto scoring
    # Calculate objective values and normalize between [0, 1]
    def get_obj_val(candidate, obj_key):
        m = candidate["metrics"]
        if obj_key == "maximize_thermal_conductivity":
            return m["thermal_conductivity_w_mk"]
        elif obj_key == "minimize_density":
            return -m["density_g_cm3"] # invert for minimization
        elif obj_key == "maximize_yield_strength":
            return m["yield_strength_mpa"]
        elif obj_key == "improve_corrosion_resistance":
            return m["pitting_resistance_pren"] + (0.5 * m["passivating_content_pct"])
        elif obj_key == "balance_strength_and_conductivity":
            return m["strength_conductivity_product"]
        return m["yield_strength_mpa"]

    obj1_vals = [get_obj_val(c, primary_objective) for c in candidates_list]
    obj2_vals = [get_obj_val(c, secondary_objective) for c in candidates_list]
    
    min1, max1 = min(obj1_vals), max(obj1_vals)
    min2, max2 = min(obj2_vals), max(obj2_vals)
    range1 = max(1e-6, max1 - min1)
    range2 = max(1e-6, max2 - min2)
    
    for idx, c in enumerate(candidates_list):
        norm1 = (obj1_vals[idx] - min1) / range1
        norm2 = (obj2_vals[idx] - min2) / range2
        composite_score = round(0.65 * norm1 + 0.35 * norm2, 3)
        c["composite_score"] = composite_score
        
        # Formulate technical trade-off description
        c_desc = []
        if primary_objective == "minimize_density":
            c_desc.append(f"Low density {c['metrics']['density_g_cm3']} g/cm³")
        elif primary_objective == "maximize_yield_strength":
            c_desc.append(f"Yield strength {c['metrics']['yield_strength_mpa']} MPa")
        elif primary_objective == "maximize_thermal_conductivity":
            c_desc.append(f"Conductivity {c['metrics']['thermal_conductivity_w_mk']} W/m·K")
            
        if secondary_objective == "maximize_yield_strength":
            c_desc.append(f"trades conductivity for +{round(c['metrics']['yield_strength_mpa'], 0)} MPa yield")
        elif secondary_objective == "balance_strength_and_conductivity":
            c_desc.append(f"{c['metrics']['electrical_conductivity_iacs']}% IACS")
            
        c["trade_off_notes"] = ", ".join(c_desc)
        
    # Rank candidates by composite score descending
    candidates_list.sort(key=lambda x: x["composite_score"], reverse=True)
    top_candidates = candidates_list[:target_count]
    
    return {
        "engine": "Pareto Weighted Grid Exploration Engine",
        "methodology": "Constrained metallurgical solute grid search with normalized scalarized Pareto weighting (65% primary, 35% secondary).",
        "scientific_disclaimer": "Optimization identifies composition targets based on analytical continuum approximations. Actual industrial alloy discovery requires phase diagram (CALPHAD) thermodynamic equilibrium validation, quenchability studies, and precipitation aging kinetics.",
        "configuration": {
            "base_element": base_element,
            "candidate_elements": valid_candidates,
            "primary_objective": primary_objective,
            "secondary_objective": secondary_objective,
            "max_solute_wt_pct": max_solute_wt_pct
        },
        "ranked_candidates": top_candidates,
        "missing_information_disclosure": [
            "Solubility limit at room temperature vs eutectic melting temperatures.",
            "Intermetallic phase precipitation kinetics (e.g. Al2Cu theta-phase or Mg2Si).",
            "Atmospheric oxidation during cast solidification and gas porosity."
        ]
    }
