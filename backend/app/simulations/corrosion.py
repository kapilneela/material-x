"""
MATERIAL X - Corrosion Simulation Engine
Educational approximation model of thermodynamic stability, pitting resistance,
and environmental degradation kinetics.
Explicitly disclaims that real corrosion requires electrochemical testing
and phase analysis.
"""

import numpy as np
from typing import Dict, Any, List
from app.simulations.elements_data import ELEMENTS_DATA

def run_corrosion_simulation(
    composition_wt: Dict[str, float],
    environment_type: str = "Marine / Saline (3.5% NaCl)",
    solution_ph: float = 6.5,
    temperature_k: float = 298.15,
    dissolved_o2_ppm: float = 6.0,
    exposure_time_hours: float = 8760.0 # 1 year default
) -> Dict[str, Any]:
    """
    Executes educational corrosion simulation.
    - Calculates PREN (Pitting Resistance Equivalent Number) where Cr, Mo, W are present.
    - Evaluates passive film forming elemental fraction (Cr, Ti, Al, Si, Mo).
    - Thermodynamic nobility index from standard reduction potentials.
    - Educational corrosion rate approximation in mm/year as a function of pH, temperature, and chloride.
    """
    # 1. Pitting Resistance Equivalent Number (PREN)
    # Industry standard: PREN = %Cr + 3.3*%Mo + 1.65*%W
    cr_wt = composition_wt.get("Cr", 0.0)
    mo_wt = composition_wt.get("Mo", 0.0)
    w_wt = composition_wt.get("W", 0.0)
    pren = cr_wt + (3.3 * mo_wt) + (1.65 * w_wt)
    
    # 2. Passivation forming elements
    # Cr, Ti, Al, Si, Mo form dense, coherent oxide barriers
    passivating_wt = cr_wt + composition_wt.get("Ti", 0.0) + composition_wt.get("Al", 0.0) + composition_wt.get("Si", 0.0) + mo_wt
    is_passive_likely = passivating_wt >= 12.0 # classical 12% Cr threshold for stainless passivation
    
    # 3. Thermodynamic Nobility
    # Weighted standard reduction potential vs SHE (Standard Hydrogen Electrode)
    e_std_eff = sum((wt / 100.0) * ELEMENTS_DATA[el]["standard_reduction_potential_v"] for el, wt in composition_wt.items())
    
    # 4. Environmental factor evaluation
    temp_c = temperature_k - 273.15
    # Arrhenius temperature acceleration factor (activation energy approx 35 kJ/mol)
    arrhenius_factor = np.exp((35000.0 / 8.314) * (1.0 / 298.15 - 1.0 / max(273.15, temperature_k)))
    
    # pH effect: acidic (< 5) dramatically increases active dissolution of non-noble metals; alkaline passivates Fe/Ni
    if solution_ph < 4.0:
        ph_factor = 1.0 + 3.0 * (4.0 - solution_ph)
    elif solution_ph > 10.0:
        ph_factor = 0.4
    else:
        ph_factor = 1.0
        
    # Chloride / Environment factor
    env_lower = environment_type.lower()
    if "marine" in env_lower or "saline" in env_lower or "chloride" in env_lower:
        env_severity = 3.5
    elif "acid" in env_lower:
        env_severity = 5.0
    elif "alkaline" in env_lower:
        env_severity = 0.6
    elif "oxidation" in env_lower or "air" in env_lower:
        env_severity = 1.2
    else: # freshwater
        env_severity = 1.0
        
    # Baseline base metal corrosion rate in neutral freshwater (mm/year)
    base_el = max(composition_wt.items(), key=lambda x: x[1])[0]
    base_rates = {
        "Fe": 0.12, "Al": 0.02, "Cu": 0.015, "Ti": 0.001, "Ni": 0.012,
        "Mg": 0.65, "Zn": 0.08, "Cr": 0.005, "Mo": 0.008, "W": 0.004,
        "Co": 0.018, "V": 0.025, "Mn": 0.35, "Si": 0.002, "C": 0.001
    }
    nominal_base_rate = base_rates.get(base_el, 0.10)
    
    # Oxide barrier mitigation factor
    if passivating_wt >= 18.0:
        passivation_damping = 0.02
    elif passivating_wt >= 12.0:
        passivation_damping = 0.08
    elif passivating_wt >= 5.0:
        passivation_damping = 0.35
    else:
        passivation_damping = 1.0
        
    # Oxygen depolarization factor
    o2_factor = (dissolved_o2_ppm / 6.0) ** 0.5
    
    # Calculate estimated corrosion rate (mm/year)
    est_rate_mm_year = nominal_base_rate * env_severity * ph_factor * arrhenius_factor * passivation_damping * o2_factor
    est_rate_mm_year = max(0.0001, float(est_rate_mm_year))
    
    # Material loss over exposure time
    exposure_years = exposure_time_hours / 8760.0
    penetration_loss_um = est_rate_mm_year * exposure_years * 1000.0
    
    # Corrosion classification
    if est_rate_mm_year < 0.01:
        corrosion_resistance_tier = "Outstanding (Resistant to uninhibited exposure)"
        status_color = "#2ECC71"
    elif est_rate_mm_year < 0.10:
        corrosion_resistance_tier = "Good (Suitable for moderate service life)"
        status_color = "#35C6D9"
    elif est_rate_mm_year < 0.50:
        corrosion_resistance_tier = "Moderate (Requires protective coating or cathodic protection)"
        status_color = "#F39C12"
    else:
        corrosion_resistance_tier = "Poor (Severe degradation expected in selected medium)"
        status_color = "#E74C3C"
        
    # Pitting risk evaluation
    if pren >= 32.0:
        pitting_risk = "Low (Highly resistant to seawater pitting and crevice corrosion)"
    elif pren >= 22.0:
        pitting_risk = "Moderate (Resistant in mild chloride, vulnerable at high temp)"
    elif pren >= 10.0:
        pitting_risk = "Elevated (Pitting initiation likely under stagnant chloride conditions)"
    else:
        pitting_risk = "Severe / Not Applicable (Pitting resistance negligible without Cr-Mo passivation)"
        
    # Environmental pH sweep curve
    ph_sweep = np.linspace(2.0, 12.0, 21)
    ph_curve: List[Dict[str, Any]] = []
    for p in ph_sweep:
        if p < 4.0:
            p_factor = 1.0 + 3.0 * (4.0 - p)
        elif p > 10.0:
            p_factor = 0.4
        else:
            p_factor = 1.0
        rate_p = nominal_base_rate * env_severity * p_factor * arrhenius_factor * passivation_damping * o2_factor
        ph_curve.append({
            "ph": round(float(p), 1),
            "rate_mm_year": round(float(rate_p), 4),
            "log_rate": round(float(np.log10(max(1e-5, rate_p))), 3)
        })

    return {
        "model_name": "Stern-Geary & PREN Passivation Kinetic Approximation",
        "data_category": "Educational approximation",
        "scientific_disclaimer": "CRITICAL: Corrosion resistance depends heavily on alloy phases, grain boundary sensitization (e.g. Cr-carbide precipitation), surface finish, passivation kinetics, fluid turbulence, and aeration. This model provides educational heuristic comparisons only.",
        "input_parameters": {
            "environment_type": environment_type,
            "solution_ph": solution_ph,
            "temperature_k": temperature_k,
            "temperature_c": round(temp_c, 1),
            "dissolved_o2_ppm": dissolved_o2_ppm,
            "exposure_time_hours": exposure_time_hours
        },
        "results": {
            "pitting_resistance_equivalent_number_pren": round(float(pren), 2),
            "passivating_element_content_pct": round(float(passivating_wt), 2),
            "is_spontaneous_passivation_likely": is_passive_likely,
            "thermodynamic_nobility_v_she": round(float(e_std_eff), 3),
            "estimated_corrosion_rate_mm_year": round(float(est_rate_mm_year), 4),
            "penetration_loss_microns": round(float(penetration_loss_um), 2),
            "corrosion_resistance_tier": corrosion_resistance_tier,
            "pitting_susceptibility": pitting_risk,
            "status_color": status_color
        },
        "ph_sensitivity_curve": ph_curve
    }
