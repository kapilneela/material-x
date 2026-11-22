"""
MATERIAL X - Thermal Simulation Engine
Calculates thermal properties and solves 1D transient heat conduction equation.
"""

import numpy as np
from typing import Dict, Any, List
from app.simulations.elements_data import ELEMENTS_DATA
from app.simulations.composition_utils import calculate_base_properties

def run_thermal_simulation(
    composition_wt: Dict[str, float],
    initial_temp_k: float = 293.15,
    target_temp_k: float = 473.15,
    length_m: float = 0.10,
    width_m: float = 0.02,
    height_m: float = 0.02,
    heat_input_watts: float = 50.0,
    simulation_duration_s: float = 30.0
) -> Dict[str, Any]:
    """
    Simulates thermal characteristics and 1D heat diffusion.
    - Effective thermal conductivity (k) with solute phonon-scattering degradation.
    - Specific heat capacity (c_p) via Neumann-Kopp rule.
    - Thermal expansion (alpha).
    - Transient 1D Finite Difference conduction profile.
    """
    base_props = calculate_base_properties(composition_wt)
    density_kg_m3 = base_props["density_g_cm3"] * 1000.0
    
    # 1. Specific heat capacity (Neumann-Kopp rule is very accurate for solid alloys)
    cp = sum((wt / 100.0) * ELEMENTS_DATA[el]["specific_heat_j_kgk"] for el, wt in composition_wt.items())
    
    # 2. Thermal conductivity
    # Pure element weighted baseline
    k_ideal = sum((wt / 100.0) * ELEMENTS_DATA[el]["thermal_conductivity_w_mk"] for el, wt in composition_wt.items())
    # Alloying / solute scattering factor reduces conductivity due to electron/phonon scattering at lattice distortions
    solute_wt = 100.0 - max(composition_wt.values())
    scattering_penalty = 1.0 / (1.0 + 0.035 * solute_wt)
    k_effective = max(5.0, k_ideal * scattering_penalty)
    
    # 3. Coefficient of Thermal Expansion (CTE) via Turner composite approximation
    cte_10e6 = sum((wt / 100.0) * ELEMENTS_DATA[el]["thermal_expansion_10e6_k"] for el, wt in composition_wt.items())
    cte_si = cte_10e6 * 1e-6 # 1/K
    
    # 4. Thermal Diffusivity alpha_d = k / (rho * cp) [m^2/s]
    thermal_diffusivity = k_effective / (density_kg_m3 * cp)
    
    # 5. Geometry and steady-state metrics
    cross_section_m2 = width_m * height_m
    volume_m3 = length_m * cross_section_m2
    mass_kg = density_kg_m3 * volume_m3
    
    thermal_resistance_k_w = length_m / (k_effective * cross_section_m2)
    delta_t_steady = heat_input_watts * thermal_resistance_k_w
    
    # Elongation over temperature change
    delta_T_total = target_temp_k - initial_temp_k
    elongation_mm = length_m * cte_si * delta_T_total * 1000.0
    volumetric_expansion_pct = 3.0 * cte_si * delta_T_total * 100.0
    
    # 6. 1D Transient Heat Transfer: d^2T/dx^2 = (1/alpha_d) * dT/dt
    # Spatial discretization
    num_nodes = 21
    dx = length_m / (num_nodes - 1)
    
    # Stability criterion for explicit FTCS: dt <= dx^2 / (2 * alpha_d)
    dt_max = 0.45 * (dx ** 2) / thermal_diffusivity
    dt = min(0.05, float(dt_max))
    num_steps = int(simulation_duration_s / dt)
    
    # Initialize temperature array
    T = np.full(num_nodes, initial_temp_k, dtype=float)
    x_positions = np.linspace(0.0, length_m * 1000.0, num_nodes) # in mm
    
    # Sample time steps for output profiles
    profile_checkpoints = [0.0, 0.1, 0.25, 0.5, 1.0] # fraction of duration
    profiles: List[Dict[str, Any]] = []
    
    # Save t=0
    profiles.append({
        "time_s": 0.0,
        "nodes": [{"x_mm": round(float(x), 2), "temp_k": round(float(t_val), 2), "temp_c": round(float(t_val - 273.15), 2)} for x, t_val in zip(x_positions, T)]
    })
    
    # Heat flux at x=0: q'' = Q_in / A [W/m^2]
    q_flux = heat_input_watts / cross_section_m2
    
    current_time = 0.0
    checkpoint_idx = 1
    
    for step in range(1, num_steps + 1):
        current_time += dt
        T_new = T.copy()
        
        # Interior nodes
        r = thermal_diffusivity * dt / (dx ** 2)
        T_new[1:-1] = T[1:-1] + r * (T[2:] - 2 * T[1:-1] + T[:-2])
        
        # Left boundary (constant heat flux: -k * dT/dx = q'' => T[0] = T[1] + q_flux * dx / k)
        T_new[0] = T_new[1] + (q_flux * dx / k_effective)
        
        # Right boundary (ambient convective cooling: -k * dT/dx = h * (T - T_amb))
        h_conv = 15.0 # W/m^2.K natural air convection
        T_new[-1] = (k_effective * T_new[-2] + h_conv * dx * initial_temp_k) / (k_effective + h_conv * dx)
        
        T = T_new
        
        if checkpoint_idx < len(profile_checkpoints):
            target_time = profile_checkpoints[checkpoint_idx] * simulation_duration_s
            if current_time >= target_time:
                profiles.append({
                    "time_s": round(current_time, 2),
                    "nodes": [{"x_mm": round(float(x), 2), "temp_k": round(float(t_val), 2), "temp_c": round(float(t_val - 273.15), 2)} for x, t_val in zip(x_positions, T)]
                })
                checkpoint_idx += 1
                
    # Thermal penetration depth delta_th = sqrt(4 * alpha_d * t)
    penetration_depth_mm = min(length_m * 1000.0, float(2.0 * np.sqrt(thermal_diffusivity * simulation_duration_s) * 1000.0))
    
    return {
        "model_name": "1D Transient Fourier Heat Conduction (FTCS) & Neumann-Kopp Composite",
        "data_category": "Physics-based calculation",
        "scientific_disclaimer": "Thermal conductivity is modeled with empirical phonon-electron impurity scattering corrections. Ideal bulk boundary conditions assumed without thermal contact resistance.",
        "input_parameters": {
            "initial_temp_k": initial_temp_k,
            "target_temp_k": target_temp_k,
            "length_m": length_m,
            "width_m": width_m,
            "height_m": height_m,
            "heat_input_watts": heat_input_watts,
            "simulation_duration_s": simulation_duration_s
        },
        "results": {
            "thermal_conductivity_w_mk": round(float(k_effective), 2),
            "specific_heat_capacity_j_kgk": round(float(cp), 1),
            "thermal_expansion_coeff_10e6_k": round(float(cte_10e6), 2),
            "thermal_diffusivity_mm2_s": round(float(thermal_diffusivity * 1e6), 3),
            "thermal_resistance_k_w": round(float(thermal_resistance_k_w), 3),
            "linear_elongation_mm": round(float(elongation_mm), 3),
            "volumetric_expansion_pct": round(float(volumetric_expansion_pct), 3),
            "thermal_penetration_depth_mm": round(float(penetration_depth_mm), 2),
            "sample_mass_kg": round(float(mass_kg), 4),
            "heated_surface_temp_k": round(float(T[0]), 2),
            "heated_surface_temp_c": round(float(T[0] - 273.15), 2),
            "cold_surface_temp_k": round(float(T[-1]), 2),
            "cold_surface_temp_c": round(float(T[-1] - 273.15), 2)
        },
        "spatial_temperature_profiles": profiles
    }
