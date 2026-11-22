export interface ElementInfo {
  z: number;
  symbol: string;
  name: string;
  atomic_mass: number;
  density_g_cm3: number;
  melting_point_k: number;
  crystal_structure: string;
  lattice_a_angstrom: number;
  lattice_c_angstrom?: number | null;
  atomic_radius_pm: number;
  elastic_modulus_gpa: number;
  shear_modulus_gpa: number;
  poissons_ratio: number;
  yield_strength_mpa: number;
  ultimate_strength_mpa: number;
  vickers_hardness: number;
  thermal_conductivity_w_mk: number;
  specific_heat_j_kgk: number;
  thermal_expansion_10e6_k: number;
  electrical_resistivity_ohm_m: number;
  temp_coeff_resistance_k: number;
  standard_reduction_potential_v: number;
  group: string;
  color_hex: string;
  provenance: {
    source: string;
    category: string;
    uncertainty_pct: number;
  };
}

export interface Material {
  id: string;
  name: string;
  category: string;
  description?: string;
  base_element: string;
  dominant_structure: string;
  density_g_cm3: number;
  average_atomic_mass: number;
  composition_wt: Record<string, number>;
  composition_at: Record<string, number>;
  created_at: string;
  updated_at: string;
  simulations_count?: number;
}

export interface MechanicalSimulationResult {
  simulation_id?: string;
  model_name: string;
  data_category: string;
  scientific_disclaimer: string;
  input_parameters: {
    applied_stress_mpa: number;
    temperature_k: number;
    temperature_c: number;
    grain_size_um: number;
    max_strain: number;
  };
  results: {
    yield_strength_mpa: number;
    ultimate_tensile_strength_mpa: number;
    elastic_modulus_gpa: number;
    shear_modulus_gpa: number;
    poissons_ratio: number;
    vickers_hardness_hv: number;
    rockwell_c_hrc?: number | null;
    estimated_fracture_strain_pct: number;
    applied_stress_evaluation: {
      applied_stress_mpa: number;
      safety_factor: number;
      status: string;
    };
  };
  stress_strain_curve: Array<{
    strain: number;
    stress_mpa: number;
    regime: string;
  }>;
}

export interface ThermalSimulationResult {
  simulation_id?: string;
  model_name: string;
  data_category: string;
  scientific_disclaimer: string;
  input_parameters: {
    initial_temp_k: number;
    target_temp_k: number;
    length_m: number;
    width_m: number;
    height_m: number;
    heat_input_watts: number;
    simulation_duration_s: number;
  };
  results: {
    thermal_conductivity_w_mk: number;
    specific_heat_capacity_j_kgk: number;
    thermal_expansion_coeff_10e6_k: number;
    thermal_diffusivity_mm2_s: number;
    thermal_resistance_k_w: number;
    linear_elongation_mm: number;
    volumetric_expansion_pct: number;
    thermal_penetration_depth_mm: number;
    sample_mass_kg: number;
    heated_surface_temp_k: number;
    heated_surface_temp_c: number;
    cold_surface_temp_k: number;
    cold_surface_temp_c: number;
  };
  spatial_temperature_profiles: Array<{
    time_s: number;
    nodes: Array<{
      x_mm: number;
      temp_k: number;
      temp_c: number;
    }>;
  }>;
}

export interface ElectricalSimulationResult {
  simulation_id?: string;
  model_name: string;
  data_category: string;
  scientific_disclaimer: string;
  input_parameters: {
    operating_temp_k: number;
    operating_temp_c: number;
    wire_length_m: number;
    wire_area_mm2: number;
    applied_current_amps: number;
  };
  results: {
    resistivity_ohm_m: number;
    resistivity_nano_ohm_m: number;
    resistivity_micro_ohm_cm: number;
    conductivity_siemens_per_m: number;
    conductivity_mega_siemens_per_m: number;
    iacs_conductivity_percent: number;
    temp_coefficient_k: number;
    component_resistance_ohms: number;
    component_resistance_milli_ohms: number;
    voltage_drop_volts: number;
    joule_power_dissipation_watts: number;
  };
  temperature_dependency_curve: Array<{
    temp_k: number;
    temp_c: number;
    resistivity_ohm_m: number;
    resistivity_micro_ohm_cm: number;
    conductivity_ms_m: number;
    iacs_pct: number;
  }>;
}

export interface CorrosionSimulationResult {
  simulation_id?: string;
  model_name: string;
  data_category: string;
  scientific_disclaimer: string;
  input_parameters: {
    environment_type: string;
    solution_ph: number;
    temperature_k: number;
    temperature_c: number;
    dissolved_o2_ppm: number;
    exposure_time_hours: number;
  };
  results: {
    pitting_resistance_equivalent_number_pren: number;
    passivating_element_content_pct: number;
    is_spontaneous_passivation_likely: boolean;
    thermodynamic_nobility_v_she: number;
    estimated_corrosion_rate_mm_year: number;
    penetration_loss_microns: number;
    corrosion_resistance_tier: string;
    pitting_susceptibility: string;
    status_color: string;
  };
  ph_sensitivity_curve: Array<{
    ph: number;
    rate_mm_year: number;
    log_rate: number;
  }>;
}

export interface LatticeAtom {
  id: string;
  element: string;
  site_type: string;
  x: number;
  y: number;
  z: number;
  color: string;
  radius_pm: number;
}

export interface LatticeData {
  lattice_type: string;
  classification: string;
  scientific_disclaimer: string;
  parameters: {
    lattice_constant_a_angstrom: number;
    lattice_constant_c_angstrom?: number | null;
    c_over_a_ratio?: number | null;
    coordination_number: number;
    atomic_packing_factor: number;
    nearest_neighbor_distance_angstrom: number;
    supercell_dimensions: number[];
    total_atoms_rendered: number;
  };
  unit_bounds: {
    min: [number, number, number];
    max: [number, number, number];
  };
  atoms: LatticeAtom[];
}

export interface ComparisonMaterial {
  id: string;
  name: string;
  category: string;
  base_element: string;
  dominant_structure: string;
  composition_wt: Record<string, number>;
  composition_at: Record<string, number>;
  properties: Record<
    string,
    {
      value: any;
      unit: string;
      provenance: string;
      available: boolean;
    }
  >;
}

export interface DiscoveryCandidate {
  composition: Record<string, number>;
  composite_score: number;
  dominant_structure: string;
  trade_off_notes: string;
  metrics: {
    density_g_cm3: number;
    yield_strength_mpa: number;
    thermal_conductivity_w_mk: number;
    electrical_conductivity_iacs: number;
    pitting_resistance_pren: number;
    passivating_content_pct: number;
    specific_yield_strength: number;
    strength_conductivity_product: number;
  };
}

export interface DiscoveryResponse {
  engine: string;
  methodology: string;
  scientific_disclaimer: string;
  configuration: {
    base_element: string;
    candidate_elements: string[];
    primary_objective: string;
    secondary_objective: string;
    max_solute_wt_pct: number;
  };
  ranked_candidates: DiscoveryCandidate[];
  missing_information_disclosure: string[];
}
