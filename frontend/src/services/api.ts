import {
  ElementInfo,
  Material,
  MechanicalSimulationResult,
  ThermalSimulationResult,
  ElectricalSimulationResult,
  CorrosionSimulationResult,
  LatticeData,
  ComparisonMaterial,
  DiscoveryResponse,
} from '../types';

const API_BASE = '/api';

export const api = {
  // Elements
  async getElements(): Promise<Record<string, ElementInfo>> {
    const res = await fetch(`${API_BASE}/elements`);
    if (!res.ok) throw new Error('Failed to fetch element database');
    const data = await res.json();
    return data.elements;
  },

  // Materials
  async getMaterials(): Promise<Material[]> {
    const res = await fetch(`${API_BASE}/materials`);
    if (!res.ok) throw new Error('Failed to fetch materials list');
    return res.json();
  },

  async getMaterial(id: string): Promise<Material> {
    const res = await fetch(`${API_BASE}/materials/${id}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Failed to fetch material ${id}`);
    }
    return res.json();
  },

  async createMaterial(payload: {
    name: string;
    category: string;
    description?: string;
    composition_wt: Record<string, number>;
  }): Promise<Material> {
    const res = await fetch(`${API_BASE}/materials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to save material');
    }
    return res.json();
  },

  async updateMaterial(
    id: string,
    payload: {
      name?: string;
      category?: string;
      description?: string;
      composition_wt?: Record<string, number>;
    }
  ): Promise<Material> {
    const res = await fetch(`${API_BASE}/materials/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to update material');
    }
    return res.json();
  },

  async deleteMaterial(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/materials/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to delete material');
    }
  },

  // Simulations
  async runMechanicalSim(payload: {
    material_id?: string;
    composition_wt?: Record<string, number>;
    applied_stress_mpa?: number;
    temperature_k?: number;
    max_strain?: number;
    grain_size_um?: number;
  }): Promise<MechanicalSimulationResult> {
    const res = await fetch(`${API_BASE}/simulations/mechanical`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Mechanical simulation failed');
    }
    return res.json();
  },

  async runThermalSim(payload: {
    material_id?: string;
    composition_wt?: Record<string, number>;
    initial_temp_k?: number;
    target_temp_k?: number;
    length_m?: number;
    width_m?: number;
    height_m?: number;
    heat_input_watts?: number;
    simulation_duration_s?: number;
  }): Promise<ThermalSimulationResult> {
    const res = await fetch(`${API_BASE}/simulations/thermal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Thermal simulation failed');
    }
    return res.json();
  },

  async runElectricalSim(payload: {
    material_id?: string;
    composition_wt?: Record<string, number>;
    operating_temp_k?: number;
    wire_length_m?: number;
    wire_area_mm2?: number;
    applied_current_amps?: number;
  }): Promise<ElectricalSimulationResult> {
    const res = await fetch(`${API_BASE}/simulations/electrical`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Electrical simulation failed');
    }
    return res.json();
  },

  async runCorrosionSim(payload: {
    material_id?: string;
    composition_wt?: Record<string, number>;
    environment_type?: string;
    solution_ph?: number;
    temperature_k?: number;
    dissolved_o2_ppm?: number;
    exposure_time_hours?: number;
  }): Promise<CorrosionSimulationResult> {
    const res = await fetch(`${API_BASE}/simulations/corrosion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Corrosion simulation failed');
    }
    return res.json();
  },

  async getLatticeData(params: {
    lattice_type: string;
    material_id?: string;
    composition_wt?: Record<string, number>;
  }): Promise<LatticeData> {
    const res = await fetch(`${API_BASE}/simulations/lattice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('Failed to generate lattice coordinates');
    return res.json();
  },

  // Comparison
  async compareMaterials(material_ids: string[]): Promise<{ count: number; materials: ComparisonMaterial[] }> {
    const res = await fetch(`${API_BASE}/materials/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ material_ids }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to compare materials');
    }
    return res.json();
  },

  // Discovery
  async runDiscovery(payload: {
    base_element: string;
    candidate_elements: string[];
    primary_objective: string;
    secondary_objective: string;
    max_solute_wt_pct: number;
    target_count: number;
  }): Promise<DiscoveryResponse> {
    const res = await fetch(`${API_BASE}/discovery/optimize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Material discovery optimization failed');
    }
    return res.json();
  },

  // Reports
  async getReportPreview(materialId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/reports/${materialId}/preview`);
    if (!res.ok) throw new Error('Failed to preview report');
    return res.json();
  },

  getReportDownloadUrl(materialId: string): string {
    return `${API_BASE}/reports/${materialId}`;
  },
};
