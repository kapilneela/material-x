"""
MATERIAL X - Electrical Simulation Engine
Models electrical resistivity and conductivity based on Matthiessen's and Nordheim's rules.
Enforces the fundamental reciprocal relationship: Resistivity = 1 / Conductivity.
"""

import numpy as np
from typing import Dict, Any, List
from app.simulations.elements_data import ELEMENTS_DATA
from app.simulations.composition_utils import wt_to_at_percent

def run_electrical_simulation(
    composition_wt: Dict[str, float],
    operating_temp_k: float = 293.15,
    wire_length_m: float = 1.0,
    wire_area_mm2: float = 2.5,
    applied_current_amps: float = 5.0,
    temp_sweep_start_k: float = 200.0,
    temp_sweep_end_k: float = 800.0
) -> Dict[str, Any]:
    """
    Executes electrical simulation.
    - Base resistivity rho_0 using Nordheim's solute scattering rule.
    - Temperature-dependent resistivity rho(T) = rho_0 * [1 + alpha * (T - T0)].
    - Geometry effects: R = rho * L / A.
    - Joule dissipation: P = I^2 * R.
    """
    base_el = max(composition_wt.items(), key=lambda x: x[1])[0]
    base_data = ELEMENTS_DATA[base_el]
    at_perc = wt_to_at_percent(composition_wt)
    
    # 1. Base pure matrix resistivity
    rho_matrix = base_data["electrical_resistivity_ohm_m"]
    alpha_matrix = base_data["temp_coeff_resistance_k"]
    
    # 2. Solute electron scattering (Nordheim's rule: delta_rho = sum C_i * X_i * (1 - X_i))
    delta_rho_solute = 0.0
    for el, at_val in at_perc.items():
        if el == base_el or at_val <= 0:
            continue
        X_i = at_val / 100.0
        # Characteristic scattering factor depending on valence difference
        val_diff = abs(ELEMENTS_DATA[el]["z"] - base_data["z"])
        scattering_coeff = 2.5e-8 * (1.0 + 0.15 * val_diff)
        delta_rho_solute += scattering_coeff * X_i * (1.0 - X_i)
        
    rho_293 = rho_matrix + delta_rho_solute
    
    # 3. Temperature Dependency
    # Solute scattering is largely temperature independent, phonon scattering is linear above Debye temp
    # Effective temperature coefficient of resistance
    alpha_effective = alpha_matrix * (rho_matrix / rho_293)
    
    delta_T = operating_temp_k - 293.15
    rho_at_temp = max(1e-10, rho_293 * (1.0 + alpha_effective * delta_T))
    
    # Reciprocal conductivity: sigma = 1 / rho
    conductivity_s_m = 1.0 / rho_at_temp
    conductivity_ms_m = conductivity_s_m / 1e6
    
    # % IACS (International Annealed Copper Standard: 100% IACS = 58.0 MS/m = 1.7241e-8 ohm-m)
    iacs_pct = (1.7241e-8 / rho_at_temp) * 100.0
    
    # 4. Geometry & Ohm's Law
    area_m2 = wire_area_mm2 * 1e-6
    resistance_ohms = rho_at_temp * wire_length_m / area_m2
    voltage_drop_v = applied_current_amps * resistance_ohms
    joule_heat_watts = (applied_current_amps ** 2) * resistance_ohms
    
    # 5. Temperature Sweep Curve
    temp_points = np.linspace(temp_sweep_start_k, temp_sweep_end_k, 25)
    temp_curve: List[Dict[str, Any]] = []
    
    for t_val in temp_points:
        dt_val = t_val - 293.15
        r_val = max(1e-10, rho_293 * (1.0 + alpha_effective * dt_val))
        s_val = 1.0 / r_val
        temp_curve.append({
            "temp_k": round(float(t_val), 1),
            "temp_c": round(float(t_val - 273.15), 1),
            "resistivity_ohm_m": float(f"{r_val:.4e}"),
            "resistivity_micro_ohm_cm": round(float(r_val * 1e8), 3),
            "conductivity_ms_m": round(float(s_val / 1e6), 3),
            "iacs_pct": round(float((1.7241e-8 / r_val) * 100.0), 2)
        })
        
    return {
        "model_name": "Nordheim-Matthiessen Solute Scattering & Linearized Phonon Model",
        "data_category": "Physics-based calculation",
        "scientific_disclaimer": "Resistivity is strictly calculated as the reciprocal of conductivity (rho = 1 / sigma). Real conductivity is reduced by cold working, grain boundaries, and precipitate morphologies.",
        "input_parameters": {
            "operating_temp_k": operating_temp_k,
            "operating_temp_c": round(operating_temp_k - 273.15, 2),
            "wire_length_m": wire_length_m,
            "wire_area_mm2": wire_area_mm2,
            "applied_current_amps": applied_current_amps
        },
        "results": {
            "resistivity_ohm_m": float(f"{rho_at_temp:.4e}"),
            "resistivity_nano_ohm_m": round(float(rho_at_temp * 1e9), 2),
            "resistivity_micro_ohm_cm": round(float(rho_at_temp * 1e8), 3),
            "conductivity_siemens_per_m": float(f"{conductivity_s_m:.4e}"),
            "conductivity_mega_siemens_per_m": round(float(conductivity_ms_m), 3),
            "iacs_conductivity_percent": round(float(iacs_pct), 2),
            "temp_coefficient_k": round(float(alpha_effective), 6),
            "component_resistance_ohms": round(float(resistance_ohms), 5),
            "component_resistance_milli_ohms": round(float(resistance_ohms * 1000.0), 3),
            "voltage_drop_volts": round(float(voltage_drop_v), 4),
            "joule_power_dissipation_watts": round(float(joule_heat_watts), 4)
        },
        "temperature_dependency_curve": temp_curve
    }
