"""
MATERIAL X - Mechanical Simulation Engine
Calculates mechanical parameters and stress-strain constitutive behavior.
Explicitly identifies models as Educational Approximations and distinguishes
from experimental literature anchors.
"""

import numpy as np
from typing import Dict, Any, List
from app.simulations.elements_data import ELEMENTS_DATA
from app.simulations.composition_utils import wt_to_at_percent

def run_mechanical_simulation(
    composition_wt: Dict[str, float],
    applied_stress_mpa: float = 250.0,
    temperature_k: float = 293.15,
    max_strain: float = 0.20,
    grain_size_um: float = 25.0
) -> Dict[str, Any]:
    """
    Executes mechanical simulation.
    Models:
    - Rule-of-mixtures baseline for Elastic Modulus: E_base = sum(w_i * E_i)
    - Solid solution strengthening approximation: delta_sigma = sum(G_base * epsilon_lattice^(3/2) * c_i^(1/2))
    - Temperature softening according to homologous temperature T / Tm
    - Hollomon-Ludwik constitutive stress-strain curve generation
    """
    # Base element
    base_el = max(composition_wt.items(), key=lambda x: x[1])[0]
    base_data = ELEMENTS_DATA[base_el]
    
    # 1. Elastic Modulus (Rule of Mixtures with Reuss/Voigt balance)
    E_voigt = sum((wt / 100.0) * ELEMENTS_DATA[el]["elastic_modulus_gpa"] for el, wt in composition_wt.items())
    inv_E_reuss = sum((wt / 100.0) / ELEMENTS_DATA[el]["elastic_modulus_gpa"] for el, wt in composition_wt.items())
    E_reuss = 1.0 / inv_E_reuss
    E_composite = 0.5 * (E_voigt + E_reuss) # Hill average
    
    # Poisson's ratio
    nu_composite = sum((wt / 100.0) * ELEMENTS_DATA[el]["poissons_ratio"] for el, wt in composition_wt.items())
    G_composite = E_composite / (2.0 * (1.0 + nu_composite))
    
    # 2. Yield Strength Calculation
    # Baseline yield from elements
    sigma_y_base = sum((wt / 100.0) * ELEMENTS_DATA[el]["yield_strength_mpa"] for el, wt in composition_wt.items())
    
    # Solid solution strengthening contribution (Labusch-Fleischer scaling approximation)
    at_perc = wt_to_at_percent(composition_wt)
    base_radius = base_data["atomic_radius_pm"]
    delta_sigma_ss = 0.0
    for el, at_frac in at_perc.items():
        if el == base_el or at_frac <= 0:
            continue
        c = at_frac / 100.0
        r_solute = ELEMENTS_DATA[el]["atomic_radius_pm"]
        size_misfit = abs(r_solute - base_radius) / base_radius
        # Labusch model: Delta sigma proportional to G * epsilon^(4/3) * c^(2/3)
        delta_sigma_ss += 0.8 * (G_composite * 1000.0) * (size_misfit ** 1.33) * (c ** 0.67)
        
    # Carbon interstitial multiplier in steels/alloys
    if "C" in composition_wt and composition_wt["C"] > 0:
        c_wt = composition_wt["C"]
        delta_sigma_ss += c_wt * 220.0 # strong interstitial hardening in metallic matrices
        
    # Hall-Petch grain boundary strengthening approximation: k_hp / sqrt(d)
    k_hp = 18.0 # MPa * mm^0.5 typical for transition metals
    d_mm = max(grain_size_um, 1.0) / 1000.0
    sigma_hp = k_hp / np.sqrt(d_mm)
    
    yield_strength_293 = sigma_y_base + delta_sigma_ss + sigma_hp
    
    # Ultimate Tensile Strength
    strain_hardening_n = 0.18 # average metallic alloy work hardening exponent
    uts_293 = yield_strength_293 * ((np.e / strain_hardening_n) ** strain_hardening_n) * 1.15
    
    # 3. Temperature Dependency (Thermal softening)
    # Average melting point
    t_melt = sum((wt / 100.0) * ELEMENTS_DATA[el]["melting_point_k"] for el, wt in composition_wt.items())
    
    # Homologous temperature
    t_ratio = max(0.0, (temperature_k - 293.15) / max(100.0, t_melt - 293.15))
    t_ratio = min(t_ratio, 0.95)
    
    # Elastic modulus drops with temperature
    temp_E_factor = max(0.1, 1.0 - 0.35 * t_ratio)
    E_at_temp = E_composite * temp_E_factor
    
    # Yield and UTS drop exponentially with high temperature
    temp_strength_factor = max(0.05, (1.0 - t_ratio) ** 1.4)
    yield_strength = yield_strength_293 * temp_strength_factor
    uts = uts_293 * temp_strength_factor
    
    # Vickers Hardness (Empirical relationship HV ~ UTS / 3.2 for metallic alloys)
    vickers_hv = max(20.0, uts / 3.1)
    # Approximate Rockwell C if HV > 200
    hrc = round(1.0 * (100.0 - 0.002 * ((800.0 - vickers_hv)**2)), 1) if vickers_hv >= 220 else None
    
    # 4. Stress-Strain Curve Generation (Ramberg-Osgood / Hollomon relation)
    # sigma_true = K * (epsilon_p)^n
    # Total strain epsilon = sigma / E + epsilon_p
    K_coeff = uts * (np.e ** strain_hardening_n)
    
    strain_samples = np.linspace(0.0, max_strain, 60)
    curve_data: List[Dict[str, Any]] = []
    
    fracture_strain = min(0.35, max(0.06, 0.45 - (yield_strength / 3000.0)))
    
    for eps in strain_samples:
        if eps <= 0:
            curve_data.append({"strain": 0.0, "stress_mpa": 0.0, "regime": "elastic"})
            continue
            
        # Check if in elastic regime: sigma = E * eps
        elastic_stress = (E_at_temp * 1000.0) * eps
        if elastic_stress < yield_strength:
            curve_data.append({
                "strain": round(float(eps), 5),
                "stress_mpa": round(float(elastic_stress), 2),
                "regime": "elastic"
            })
        elif eps <= fracture_strain:
            # Plastic hardening
            plastic_strain = eps - (yield_strength / (E_at_temp * 1000.0))
            if plastic_strain > 0:
                stress_plastic = yield_strength + (uts - yield_strength) * ((plastic_strain / (fracture_strain * 0.7)) ** strain_hardening_n)
                stress_plastic = min(stress_plastic, uts * 1.05)
            else:
                stress_plastic = yield_strength
                
            curve_data.append({
                "strain": round(float(eps), 5),
                "stress_mpa": round(float(stress_plastic), 2),
                "regime": "plastic"
            })
        else:
            # Necking and post-fracture drop
            necking_factor = max(0.0, 1.0 - 3.0 * (eps - fracture_strain))
            stress_necking = uts * necking_factor
            curve_data.append({
                "strain": round(float(eps), 5),
                "stress_mpa": round(float(stress_necking), 2),
                "regime": "necking/failure"
            })
            
    # Evaluation at user-applied stress
    safety_factor = round(yield_strength / applied_stress_mpa, 2) if applied_stress_mpa > 0 else 999.0
    will_yield = applied_stress_mpa >= yield_strength
    will_fracture = applied_stress_mpa >= uts
    
    return {
        "model_name": "Voigt-Reuss-Hill Composite with Labusch Solid-Solution Strengthening",
        "data_category": "Physics-based calculation & Educational approximation",
        "scientific_disclaimer": "Calculated values represent idealized polycrystalline solid solution estimates. Real tensile strength is strongly dependent on thermal-mechanical processing (annealing, cold-rolling, precipitation hardening) and internal defects.",
        "input_parameters": {
            "applied_stress_mpa": applied_stress_mpa,
            "temperature_k": temperature_k,
            "temperature_c": round(temperature_k - 273.15, 2),
            "grain_size_um": grain_size_um,
            "max_strain": max_strain
        },
        "results": {
            "yield_strength_mpa": round(float(yield_strength), 1),
            "ultimate_tensile_strength_mpa": round(float(uts), 1),
            "elastic_modulus_gpa": round(float(E_at_temp), 1),
            "shear_modulus_gpa": round(float(G_composite * temp_E_factor), 1),
            "poissons_ratio": round(float(nu_composite), 3),
            "vickers_hardness_hv": round(float(vickers_hv), 1),
            "rockwell_c_hrc": hrc,
            "estimated_fracture_strain_pct": round(float(fracture_strain * 100), 1),
            "applied_stress_evaluation": {
                "applied_stress_mpa": applied_stress_mpa,
                "safety_factor": safety_factor,
                "status": "Fracture / Failure" if will_fracture else ("Plastic Deformation" if will_yield else "Safe / Elastic")
            }
        },
        "stress_strain_curve": curve_data
    }
