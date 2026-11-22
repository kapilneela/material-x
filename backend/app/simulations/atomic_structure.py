"""
MATERIAL X - Atomic Structure and Lattice Coordinate Engine
Generates unit cell and supercell coordinates for BCC, FCC, and HCP crystal lattices.
Performs Vegard's law lattice parameter estimation for solid solutions.
"""

import numpy as np
from typing import Dict, Any, List
from app.simulations.elements_data import ELEMENTS_DATA
from app.simulations.composition_utils import wt_to_at_percent

def generate_crystal_lattice(
    lattice_type: str = "BCC",
    composition_wt: Dict[str, float] = None,
    supercell_dims: List[int] = [2, 2, 2]
) -> Dict[str, Any]:
    """
    Generates 3D atomic coordinates for a crystal lattice.
    Supported types: BCC, FCC, HCP.
    Populates sites based on atomic percentages (stochastic solid solution distribution).
    """
    if composition_wt is None:
        composition_wt = {"Fe": 100.0}
        
    at_perc = wt_to_at_percent(composition_wt)
    elements = list(at_perc.keys())
    raw_probs = np.array([at_perc[el] for el in elements], dtype=float)
    prob_sum = raw_probs.sum()
    if prob_sum > 0:
        probs = (raw_probs / prob_sum).tolist()
    else:
        probs = [1.0 / len(elements)] * len(elements)
    
    # Base element
    base_el = max(composition_wt.items(), key=lambda x: x[1])[0]
    base_data = ELEMENTS_DATA[base_el]
    
    # Vegard's law for lattice parameter a
    a_param = sum((at_perc[el] / 100.0) * (ELEMENTS_DATA[el]["lattice_a_angstrom"] or 3.0) for el in elements)
    c_param = sum((at_perc[el] / 100.0) * (ELEMENTS_DATA[el].get("lattice_c_angstrom") or (a_param * 1.633)) for el in elements)
    
    atoms: List[Dict[str, Any]] = []
    nx, ny, nz = supercell_dims
    
    # Seed RNG for deterministic visualization of the same composition
    rng = np.random.RandomState(42)
    
    lattice_type_clean = lattice_type.upper()
    
    if lattice_type_clean == "BCC":
        coordination_number = 8
        packing_factor = 0.680
        nearest_neighbor_dist = round(float(a_param * np.sqrt(3) / 2.0), 3)
        
        # BCC basis: (0,0,0) and (0.5, 0.5, 0.5)
        basis = [
            (0.0, 0.0, 0.0),
            (0.5, 0.5, 0.5)
        ]
        
        for ix in range(nx + 1):
            for iy in range(ny + 1):
                for iz in range(nz + 1):
                    # Corner atoms
                    el_choice = rng.choice(elements, p=probs)
                    atoms.append({
                        "id": f"atom-{len(atoms)}",
                        "element": el_choice,
                        "site_type": "corner",
                        "x": round(float(ix * a_param), 3),
                        "y": round(float(iy * a_param), 3),
                        "z": round(float(iz * a_param), 3),
                        "color": ELEMENTS_DATA[el_choice]["color_hex"],
                        "radius_pm": ELEMENTS_DATA[el_choice]["atomic_radius_pm"]
                    })
                    
        for ix in range(nx):
            for iy in range(ny):
                for iz in range(nz):
                    # Center atom
                    el_choice = rng.choice(elements, p=probs)
                    atoms.append({
                        "id": f"atom-{len(atoms)}",
                        "element": el_choice,
                        "site_type": "body-center",
                        "x": round(float((ix + 0.5) * a_param), 3),
                        "y": round(float((iy + 0.5) * a_param), 3),
                        "z": round(float((iz + 0.5) * a_param), 3),
                        "color": ELEMENTS_DATA[el_choice]["color_hex"],
                        "radius_pm": ELEMENTS_DATA[el_choice]["atomic_radius_pm"]
                    })
                    
        unit_bounds = {
            "min": [0.0, 0.0, 0.0],
            "max": [nx * a_param, ny * a_param, nz * a_param]
        }
        
    elif lattice_type_clean == "FCC":
        coordination_number = 12
        packing_factor = 0.740
        nearest_neighbor_dist = round(float(a_param / np.sqrt(2)), 3)
        
        for ix in range(nx + 1):
            for iy in range(ny + 1):
                for iz in range(nz + 1):
                    el_choice = rng.choice(elements, p=probs)
                    atoms.append({
                        "id": f"atom-{len(atoms)}",
                        "element": el_choice,
                        "site_type": "corner",
                        "x": round(float(ix * a_param), 3),
                        "y": round(float(iy * a_param), 3),
                        "z": round(float(iz * a_param), 3),
                        "color": ELEMENTS_DATA[el_choice]["color_hex"],
                        "radius_pm": ELEMENTS_DATA[el_choice]["atomic_radius_pm"]
                    })
                    
        # Face centers: xy, xz, yz
        for ix in range(nx):
            for iy in range(ny):
                for iz in range(nz + 1):
                    el_choice = rng.choice(elements, p=probs)
                    atoms.append({
                        "id": f"atom-{len(atoms)}",
                        "element": el_choice,
                        "site_type": "face-center-xy",
                        "x": round(float((ix + 0.5) * a_param), 3),
                        "y": round(float((iy + 0.5) * a_param), 3),
                        "z": round(float(iz * a_param), 3),
                        "color": ELEMENTS_DATA[el_choice]["color_hex"],
                        "radius_pm": ELEMENTS_DATA[el_choice]["atomic_radius_pm"]
                    })
                    
        for ix in range(nx):
            for iy in range(ny + 1):
                for iz in range(nz):
                    el_choice = rng.choice(elements, p=probs)
                    atoms.append({
                        "id": f"atom-{len(atoms)}",
                        "element": el_choice,
                        "site_type": "face-center-xz",
                        "x": round(float((ix + 0.5) * a_param), 3),
                        "y": round(float(iy * a_param), 3),
                        "z": round(float((iz + 0.5) * a_param), 3),
                        "color": ELEMENTS_DATA[el_choice]["color_hex"],
                        "radius_pm": ELEMENTS_DATA[el_choice]["atomic_radius_pm"]
                    })
                    
        for ix in range(nx + 1):
            for iy in range(ny):
                for iz in range(nz):
                    el_choice = rng.choice(elements, p=probs)
                    atoms.append({
                        "id": f"atom-{len(atoms)}",
                        "element": el_choice,
                        "site_type": "face-center-yz",
                        "x": round(float(ix * a_param), 3),
                        "y": round(float((iy + 0.5) * a_param), 3),
                        "z": round(float((iz + 0.5) * a_param), 3),
                        "color": ELEMENTS_DATA[el_choice]["color_hex"],
                        "radius_pm": ELEMENTS_DATA[el_choice]["atomic_radius_pm"]
                    })
                    
        unit_bounds = {
            "min": [0.0, 0.0, 0.0],
            "max": [nx * a_param, ny * a_param, nz * a_param]
        }
        
    else: # HCP
        lattice_type_clean = "HCP"
        coordination_number = 12
        packing_factor = 0.740
        c_param = c_param or (a_param * 1.633)
        nearest_neighbor_dist = round(float(a_param), 3)
        
        # Hexagonal lattice vectors: a1 = (a, 0, 0), a2 = (a/2, a*sqrt(3)/2, 0), a3 = (0, 0, c)
        a1 = np.array([a_param, 0.0, 0.0])
        a2 = np.array([a_param * 0.5, a_param * np.sqrt(3) * 0.5, 0.0])
        a3 = np.array([0.0, 0.0, c_param])
        
        # HCP basis: (0,0,0) and (1/3, 2/3, 1/2)
        hcp_basis = [
            np.array([0.0, 0.0, 0.0]),
            (1.0 / 3.0) * a1 + (2.0 / 3.0) * a2 + 0.5 * a3
        ]
        
        for ix in range(nx):
            for iy in range(ny):
                for iz in range(nz):
                    origin = ix * a1 + iy * a2 + iz * a3
                    for b_idx, b in enumerate(hcp_basis):
                        pos = origin + b
                        el_choice = rng.choice(elements, p=probs)
                        atoms.append({
                            "id": f"atom-{len(atoms)}",
                            "element": el_choice,
                            "site_type": "hex-layer-A" if b_idx == 0 else "hex-layer-B",
                            "x": round(float(pos[0]), 3),
                            "y": round(float(pos[1]), 3),
                            "z": round(float(pos[2]), 3),
                            "color": ELEMENTS_DATA[el_choice]["color_hex"],
                            "radius_pm": ELEMENTS_DATA[el_choice]["atomic_radius_pm"]
                        })
                        
        unit_bounds = {
            "min": [0.0, 0.0, 0.0],
            "max": [nx * a_param * 1.5, ny * a_param * np.sqrt(3) * 0.5, nz * c_param]
        }
        
    return {
        "lattice_type": lattice_type_clean,
        "classification": "Educational Lattice Visualization",
        "scientific_disclaimer": "This is an idealized geometric Bravais lattice model generated via Vegard's law. Real multi-component alloys exhibit lattice distortion, local chemical ordering (SRO), dislocations, and precipitate phases.",
        "parameters": {
            "lattice_constant_a_angstrom": round(float(a_param), 4),
            "lattice_constant_c_angstrom": round(float(c_param), 4) if lattice_type_clean == "HCP" else None,
            "c_over_a_ratio": round(float(c_param / a_param), 4) if lattice_type_clean == "HCP" else None,
            "coordination_number": coordination_number,
            "atomic_packing_factor": packing_factor,
            "nearest_neighbor_distance_angstrom": nearest_neighbor_dist,
            "supercell_dimensions": supercell_dims,
            "total_atoms_rendered": len(atoms)
        },
        "unit_bounds": unit_bounds,
        "atoms": atoms
    }
