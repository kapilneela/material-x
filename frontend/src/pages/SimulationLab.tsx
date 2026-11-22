import React, { useState, useEffect } from 'react';
import {
  Material,
  MechanicalSimulationResult,
  ThermalSimulationResult,
  ElectricalSimulationResult,
  CorrosionSimulationResult,
} from '../types';
import { api } from '../services/api';
import { ScientificChart } from '../components/common/ScientificChart';
import { ProvenanceBadge } from '../components/common/Badge';
import { Activity, Flame, Zap, ShieldAlert, Play, AlertCircle, Info } from 'lucide-react';

interface SimulationLabProps {
  materials: Material[];
  selectedMaterial: Material | null;
  onSelectMaterial: (mat: Material) => void;
}

type SimModule = 'mechanical' | 'thermal' | 'electrical' | 'corrosion';

export const SimulationLab: React.FC<SimulationLabProps> = ({
  materials,
  selectedMaterial,
  onSelectMaterial,
}) => {
  const [activeTab, setActiveTab] = useState<SimModule>('mechanical');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active material choice
  const [currentMatId, setCurrentMatId] = useState<string>(
    selectedMaterial?.id || (materials.length > 0 ? materials[0].id : '')
  );

  useEffect(() => {
    if (selectedMaterial) {
      setCurrentMatId(selectedMaterial.id);
    }
  }, [selectedMaterial]);

  const currentMaterial = materials.find((m) => m.id === currentMatId) || selectedMaterial || materials[0];

  // 1. Mechanical State
  const [appliedStress, setAppliedStress] = useState<number>(250.0);
  const [mechTempK, setMechTempK] = useState<number>(293.15);
  const [grainSize, setGrainSize] = useState<number>(25.0);
  const [maxStrain, setMaxStrain] = useState<number>(0.20);
  const [mechResult, setMechResult] = useState<MechanicalSimulationResult | null>(null);

  // 2. Thermal State
  const [thermalInitK, setThermalInitK] = useState<number>(293.15);
  const [thermalTargetK, setThermalTargetK] = useState<number>(473.15);
  const [lengthM, setLengthM] = useState<number>(0.10);
  const [widthM, setWidthM] = useState<number>(0.02);
  const [heightM, setHeightM] = useState<number>(0.02);
  const [heatInputWatts, setHeatInputWatts] = useState<number>(50.0);
  const [durationS, setDurationS] = useState<number>(30.0);
  const [thermalResult, setThermalResult] = useState<ThermalSimulationResult | null>(null);

  // 3. Electrical State
  const [elecTempK, setElecTempK] = useState<number>(293.15);
  const [wireLengthM, setWireLengthM] = useState<number>(1.0);
  const [wireAreaMm2, setWireAreaMm2] = useState<number>(2.5);
  const [appliedCurrentA, setAppliedCurrentA] = useState<number>(5.0);
  const [elecResult, setElecResult] = useState<ElectricalSimulationResult | null>(null);

  // 4. Corrosion State
  const [envType, setEnvType] = useState<string>('Marine / Saline (3.5% NaCl)');
  const [phVal, setPhVal] = useState<number>(6.5);
  const [corrTempK, setCorrTempK] = useState<number>(298.15);
  const [dissolvedO2, setDissolvedO2] = useState<number>(6.0);
  const [exposureHours, setExposureHours] = useState<number>(8760.0);
  const [corrResult, setCorrResult] = useState<CorrosionSimulationResult | null>(null);

  // Auto-run active simulation when switching tab or material
  useEffect(() => {
    if (currentMaterial) {
      handleRunActiveSimulation();
    }
  }, [activeTab, currentMatId]);

  const handleRunActiveSimulation = async () => {
    if (!currentMaterial) return;
    setLoading(true);
    setError(null);

    try {
      if (activeTab === 'mechanical') {
        const res = await api.runMechanicalSim({
          material_id: currentMaterial.id,
          composition_wt: currentMaterial.composition_wt,
          applied_stress_mpa: appliedStress,
          temperature_k: mechTempK,
          grain_size_um: grainSize,
          max_strain: maxStrain,
        });
        setMechResult(res);
      } else if (activeTab === 'thermal') {
        const res = await api.runThermalSim({
          material_id: currentMaterial.id,
          composition_wt: currentMaterial.composition_wt,
          initial_temp_k: thermalInitK,
          target_temp_k: thermalTargetK,
          length_m: lengthM,
          width_m: widthM,
          height_m: heightM,
          heat_input_watts: heatInputWatts,
          simulation_duration_s: durationS,
        });
        setThermalResult(res);
      } else if (activeTab === 'electrical') {
        const res = await api.runElectricalSim({
          material_id: currentMaterial.id,
          composition_wt: currentMaterial.composition_wt,
          operating_temp_k: elecTempK,
          wire_length_m: wireLengthM,
          wire_area_mm2: wireAreaMm2,
          applied_current_amps: appliedCurrentA,
        });
        setElecResult(res);
      } else if (activeTab === 'corrosion') {
        const res = await api.runCorrosionSim({
          material_id: currentMaterial.id,
          composition_wt: currentMaterial.composition_wt,
          environment_type: envType,
          solution_ph: phVal,
          temperature_k: corrTempK,
          dissolved_o2_ppm: dissolvedO2,
          exposure_time_hours: exposureHours,
        });
        setCorrResult(res);
      }
    } catch (err: any) {
      setError(err.message || 'Simulation execution failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Material Target Selector */}
      <div className="border-b border-[#303030] pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="text-[11px] font-mono-sci uppercase tracking-widest text-[#35C6D9]">
            SIMULATION LAB // SCIENTIFIC SOLVERS
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[#F4F4F4] mt-0.5">
            Multi-Physical Numerical Simulation Engine
          </h1>
          <p className="text-xs text-[#929292] mt-1 font-mono-sci">
            Coupled mechanical, thermal, electrical, and degradation solvers with physical boundary conditions.
          </p>
        </div>

        {/* Target Material Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono-sci text-[#929292]">TARGET ALLOY:</span>
          <select
            value={currentMatId}
            onChange={(e) => {
              setCurrentMatId(e.target.value);
              const m = materials.find((item) => item.id === e.target.value);
              if (m) onSelectMaterial(m);
            }}
            className="bg-[#191919] border border-[#303030] text-[#35C6D9] font-mono-sci text-xs px-3 py-1.5 outline-none font-bold"
          >
            {materials.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} [{m.id}]
              </option>
            ))}
          </select>

          <button
            onClick={handleRunActiveSimulation}
            disabled={loading}
            className="px-3.5 py-1.5 bg-[#191919] hover:bg-[#222] border border-[#35C6D9] text-[#35C6D9] text-xs font-mono-sci font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" />
            {loading ? 'SOLVING...' : 'EXECUTE'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#303030] bg-[#141414]">
        <button
          onClick={() => setActiveTab('mechanical')}
          className={`px-4 py-2.5 text-xs font-mono-sci font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'mechanical'
              ? 'border-[#35C6D9] text-[#F4F4F4] bg-[#191919]'
              : 'border-transparent text-[#929292] hover:text-[#F4F4F4]'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-[#35C6D9]" />
          1. MECHANICAL SIMULATION
        </button>

        <button
          onClick={() => setActiveTab('thermal')}
          className={`px-4 py-2.5 text-xs font-mono-sci font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'thermal'
              ? 'border-[#35C6D9] text-[#F4F4F4] bg-[#191919]'
              : 'border-transparent text-[#929292] hover:text-[#F4F4F4]'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-[#e07a5f]" />
          2. THERMAL SIMULATION
        </button>

        <button
          onClick={() => setActiveTab('electrical')}
          className={`px-4 py-2.5 text-xs font-mono-sci font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'electrical'
              ? 'border-[#35C6D9] text-[#F4F4F4] bg-[#191919]'
              : 'border-transparent text-[#929292] hover:text-[#F4F4F4]'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-[#d4b94e]" />
          3. ELECTRICAL SIMULATION
        </button>

        <button
          onClick={() => setActiveTab('corrosion')}
          className={`px-4 py-2.5 text-xs font-mono-sci font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'corrosion'
              ? 'border-[#35C6D9] text-[#F4F4F4] bg-[#191919]'
              : 'border-transparent text-[#929292] hover:text-[#F4F4F4]'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-[#2ECC71]" />
          4. CORROSION SIMULATION
        </button>
      </div>

      {error && (
        <div className="p-3 bg-[#2c1d1d] border border-[#E74C3C] text-[#E74C3C] text-xs font-mono-sci flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* MODULE 1: MECHANICAL */}
      {activeTab === 'mechanical' && mechResult && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Parameters Control Panel (4 cols) */}
            <div className="lg:col-span-4 p-4 bg-[#191919] border border-[#303030] space-y-4">
              <div className="border-b border-[#262626] pb-2">
                <span className="text-xs font-mono-sci font-bold uppercase tracking-wider text-[#F4F4F4]">
                  MECHANICAL PARAMETERS
                </span>
              </div>

              <div className="space-y-3 text-xs font-mono-sci">
                <div>
                  <div className="flex justify-between text-[#929292] mb-1">
                    <span>APPLIED TENSILE STRESS:</span>
                    <span className="text-[#F4F4F4] font-bold">{appliedStress} MPa</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="1500"
                    step="10"
                    value={appliedStress}
                    onChange={(e) => setAppliedStress(parseFloat(e.target.value))}
                    className="w-full accent-[#35C6D9] bg-[#141414] h-1.5 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[#929292] mb-1">
                    <span>OPERATING TEMPERATURE:</span>
                    <span className="text-[#F4F4F4] font-bold">
                      {mechTempK} K ({(mechTempK - 273.15).toFixed(1)} °C)
                    </span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="1600"
                    step="20"
                    value={mechTempK}
                    onChange={(e) => setMechTempK(parseFloat(e.target.value))}
                    className="w-full accent-[#35C6D9] bg-[#141414] h-1.5 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[#929292] mb-1">
                    <span>GRAIN SIZE (d):</span>
                    <span className="text-[#F4F4F4] font-bold">{grainSize} μm</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="150"
                    step="5"
                    value={grainSize}
                    onChange={(e) => setGrainSize(parseFloat(e.target.value))}
                    className="w-full accent-[#35C6D9] bg-[#141414] h-1.5 cursor-pointer"
                  />
                  <span className="text-[10px] text-[#666]">Hall-Petch grain boundary parameter</span>
                </div>

                <div>
                  <div className="flex justify-between text-[#929292] mb-1">
                    <span>MAX STRAIN DOMAIN:</span>
                    <span className="text-[#F4F4F4] font-bold">{(maxStrain * 100).toFixed(0)} %</span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="0.40"
                    step="0.02"
                    value={maxStrain}
                    onChange={(e) => setMaxStrain(parseFloat(e.target.value))}
                    className="w-full accent-[#35C6D9] bg-[#141414] h-1.5 cursor-pointer"
                  />
                </div>

                <button
                  onClick={handleRunActiveSimulation}
                  disabled={loading}
                  className="w-full py-2 bg-[#141414] hover:bg-[#222] border border-[#35C6D9] text-[#35C6D9] text-xs font-mono-sci font-bold cursor-pointer"
                >
                  RECOMPUTE MECHANICAL MODEL
                </button>
              </div>
            </div>

            {/* Results & Plot (8 cols) */}
            <div className="lg:col-span-8 space-y-4">
              {/* Output cards grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono-sci">
                <div className="p-3 bg-[#191919] border border-[#303030]">
                  <span className="text-[10px] text-[#888] uppercase block">YIELD STRENGTH (0.2%)</span>
                  <span className="text-lg font-bold text-[#F4F4F4] mt-0.5 block">
                    {mechResult.results.yield_strength_mpa}{' '}
                    <span className="text-xs font-normal text-[#888]">MPa</span>
                  </span>
                  <span className="text-[10px] text-[#666]">Solid solution corrected</span>
                </div>

                <div className="p-3 bg-[#191919] border border-[#303030]">
                  <span className="text-[10px] text-[#888] uppercase block">ULTIMATE TENSILE (UTS)</span>
                  <span className="text-lg font-bold text-[#F4F4F4] mt-0.5 block">
                    {mechResult.results.ultimate_tensile_strength_mpa}{' '}
                    <span className="text-xs font-normal text-[#888]">MPa</span>
                  </span>
                  <span className="text-[10px] text-[#666]">Peak nominal stress</span>
                </div>

                <div className="p-3 bg-[#191919] border border-[#303030]">
                  <span className="text-[10px] text-[#888] uppercase block">YOUNG'S MODULUS (E)</span>
                  <span className="text-lg font-bold text-[#35C6D9] mt-0.5 block">
                    {mechResult.results.elastic_modulus_gpa}{' '}
                    <span className="text-xs font-normal text-[#888]">GPa</span>
                  </span>
                  <span className="text-[10px] text-[#666]">Voigt-Reuss-Hill Hill avg</span>
                </div>

                <div className="p-3 bg-[#191919] border border-[#303030]">
                  <span className="text-[10px] text-[#888] uppercase block">VICKERS HARDNESS</span>
                  <span className="text-lg font-bold text-[#F4F4F4] mt-0.5 block">
                    {mechResult.results.vickers_hardness_hv}{' '}
                    <span className="text-xs font-normal text-[#888]">HV</span>
                  </span>
                  <span className="text-[10px] text-[#666]">
                    {mechResult.results.rockwell_c_hrc
                      ? `${mechResult.results.rockwell_c_hrc} HRC`
                      : 'Non-ferritic/ductile'}
                  </span>
                </div>
              </div>

              {/* Stress Evaluation Status */}
              <div
                className={`p-3 border text-xs font-mono-sci flex items-center justify-between ${
                  mechResult.results.applied_stress_evaluation.status.includes('Safe')
                    ? 'bg-[#12281c] border-[#2ECC71] text-[#2ECC71]'
                    : mechResult.results.applied_stress_evaluation.status.includes('Plastic')
                    ? 'bg-[#2b2415] border-[#F39C12] text-[#F39C12]'
                    : 'bg-[#2c1d1d] border-[#E74C3C] text-[#E74C3C]'
                }`}
              >
                <div>
                  <span className="font-bold mr-2">EVALUATION AT {appliedStress} MPa:</span>
                  <span>{mechResult.results.applied_stress_evaluation.status}</span>
                </div>
                <div>
                  <span>SAFETY FACTOR (SF): </span>
                  <strong className="text-sm font-bold ml-1">
                    {mechResult.results.applied_stress_evaluation.safety_factor}
                  </strong>
                </div>
              </div>

              {/* Stress-Strain Chart */}
              <ScientificChart
                title="ENGINEERING STRESS-STRAIN CONSTITUTIVE CURVE (σ vs ε)"
                xLabel="Engineering Strain (ε)"
                yLabel="Engineering Stress (σ)"
                xUnit="mm/mm"
                yUnit="MPa"
                series={[
                  {
                    name: currentMaterial.name,
                    points: mechResult.stress_strain_curve.map((pt) => ({
                      x: pt.strain,
                      y: pt.stress_mpa,
                    })),
                    color: '#35C6D9',
                  },
                ]}
                annotations={[
                  `Yield offset: ${mechResult.results.yield_strength_mpa} MPa at 0.2% plastic strain`,
                  `Tensile peak: ${mechResult.results.ultimate_tensile_strength_mpa} MPa at uniform elongation`,
                  `Simulated homologous temperature: ${(mechTempK / 1800).toFixed(2)} T/Tm`,
                ]}
              />
            </div>
          </div>

          {/* Model Transparency & Disclaimer Notice */}
          <div className="p-3.5 bg-[#141414] border border-[#262626] text-xs font-mono-sci space-y-1 text-[#888]">
            <div className="flex items-center gap-2">
              <ProvenanceBadge category={mechResult.data_category} />
              <span className="text-[#c9d1d9] font-bold">{mechResult.model_name}</span>
            </div>
            <p className="pt-1">{mechResult.scientific_disclaimer}</p>
          </div>
        </div>
      )}

      {/* MODULE 2: THERMAL */}
      {activeTab === 'thermal' && thermalResult && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 p-4 bg-[#191919] border border-[#303030] space-y-4">
              <div className="border-b border-[#262626] pb-2">
                <span className="text-xs font-mono-sci font-bold uppercase tracking-wider text-[#F4F4F4]">
                  HEAT TRANSFER BOUNDARIES
                </span>
              </div>

              <div className="space-y-3 text-xs font-mono-sci">
                <div>
                  <div className="flex justify-between text-[#929292] mb-1">
                    <span>HEAT INPUT (Q):</span>
                    <span className="text-[#F4F4F4] font-bold">{heatInputWatts} Watts</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="500"
                    step="5"
                    value={heatInputWatts}
                    onChange={(e) => setHeatInputWatts(parseFloat(e.target.value))}
                    className="w-full accent-[#35C6D9] bg-[#141414] h-1.5 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[#929292] mb-1">
                    <span>INITIAL TEMPERATURE:</span>
                    <span className="text-[#F4F4F4] font-bold">
                      {thermalInitK} K ({(thermalInitK - 273.15).toFixed(1)} °C)
                    </span>
                  </div>
                  <input
                    type="range"
                    min="150"
                    max="1000"
                    step="25"
                    value={thermalInitK}
                    onChange={(e) => setThermalInitK(parseFloat(e.target.value))}
                    className="w-full accent-[#35C6D9] bg-[#141414] h-1.5 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[#929292] mb-1">
                    <span>CONDUCTOR LENGTH (L):</span>
                    <span className="text-[#F4F4F4] font-bold">{(lengthM * 1000).toFixed(0)} mm</span>
                  </div>
                  <input
                    type="range"
                    min="0.02"
                    max="0.50"
                    step="0.02"
                    value={lengthM}
                    onChange={(e) => setLengthM(parseFloat(e.target.value))}
                    className="w-full accent-[#35C6D9] bg-[#141414] h-1.5 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[#929292] mb-1">
                    <span>DURATION (t):</span>
                    <span className="text-[#F4F4F4] font-bold">{durationS} seconds</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="120"
                    step="5"
                    value={durationS}
                    onChange={(e) => setDurationS(parseFloat(e.target.value))}
                    className="w-full accent-[#35C6D9] bg-[#141414] h-1.5 cursor-pointer"
                  />
                </div>

                <button
                  onClick={handleRunActiveSimulation}
                  disabled={loading}
                  className="w-full py-2 bg-[#141414] hover:bg-[#222] border border-[#35C6D9] text-[#35C6D9] text-xs font-mono-sci font-bold cursor-pointer"
                >
                  SOLVE 1D TRANSIENT CONDUCTION
                </button>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono-sci">
                <div className="p-3 bg-[#191919] border border-[#303030]">
                  <span className="text-[10px] text-[#888] uppercase block">CONDUCTIVITY (k)</span>
                  <span className="text-lg font-bold text-[#F4F4F4] mt-0.5 block">
                    {thermalResult.results.thermal_conductivity_w_mk}{' '}
                    <span className="text-xs font-normal text-[#888]">W/m·K</span>
                  </span>
                  <span className="text-[10px] text-[#666]">Solute scattering corrected</span>
                </div>

                <div className="p-3 bg-[#191919] border border-[#303030]">
                  <span className="text-[10px] text-[#888] uppercase block">SPECIFIC HEAT (cp)</span>
                  <span className="text-lg font-bold text-[#F4F4F4] mt-0.5 block">
                    {thermalResult.results.specific_heat_capacity_j_kgk}{' '}
                    <span className="text-xs font-normal text-[#888]">J/kg·K</span>
                  </span>
                  <span className="text-[10px] text-[#666]">Neumann-Kopp mixture</span>
                </div>

                <div className="p-3 bg-[#191919] border border-[#303030]">
                  <span className="text-[10px] text-[#888] uppercase block">THERMAL EXPANSION</span>
                  <span className="text-lg font-bold text-[#35C6D9] mt-0.5 block">
                    {thermalResult.results.thermal_expansion_coeff_10e6_k}{' '}
                    <span className="text-xs font-normal text-[#888]">10⁻⁶/K</span>
                  </span>
                  <span className="text-[10px] text-[#666]">ΔL = {thermalResult.results.linear_elongation_mm} mm</span>
                </div>

                <div className="p-3 bg-[#191919] border border-[#303030]">
                  <span className="text-[10px] text-[#888] uppercase block">DIFFUSIVITY (α)</span>
                  <span className="text-lg font-bold text-[#F4F4F4] mt-0.5 block">
                    {thermalResult.results.thermal_diffusivity_mm2_s}{' '}
                    <span className="text-xs font-normal text-[#888]">mm²/s</span>
                  </span>
                  <span className="text-[10px] text-[#666]">k / (ρ · cp)</span>
                </div>
              </div>

              {/* Spatial Temperature Profile Plot */}
              <ScientificChart
                title="1D TRANSIENT TEMPERATURE PROFILE T(x, t) ALONG ROD"
                xLabel="Axial Position (x)"
                yLabel="Temperature"
                xUnit="mm"
                yUnit="°C"
                series={thermalResult.spatial_temperature_profiles.map((p, idx) => ({
                  name: `t = ${p.time_s}s`,
                  color: idx === 0 ? '#666666' : idx === 1 ? '#d4b94e' : idx === 2 ? '#e07a5f' : '#35C6D9',
                  points: p.nodes.map((node) => ({
                    x: node.x_mm,
                    y: node.temp_c,
                  })),
                }))}
                annotations={[
                  `Heated boundary (x=0): ${thermalResult.results.heated_surface_temp_c} °C`,
                  `Cold boundary (x=L): ${thermalResult.results.cold_surface_temp_c} °C`,
                  `Penetration depth: ${thermalResult.results.thermal_penetration_depth_mm} mm`,
                ]}
              />
            </div>
          </div>

          <div className="p-3.5 bg-[#141414] border border-[#262626] text-xs font-mono-sci space-y-1 text-[#888]">
            <div className="flex items-center gap-2">
              <ProvenanceBadge category={thermalResult.data_category} />
              <span className="text-[#c9d1d9] font-bold">{thermalResult.model_name}</span>
            </div>
            <p className="pt-1">{thermalResult.scientific_disclaimer}</p>
          </div>
        </div>
      )}

      {/* MODULE 3: ELECTRICAL */}
      {activeTab === 'electrical' && elecResult && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 p-4 bg-[#191919] border border-[#303030] space-y-4">
              <div className="border-b border-[#262626] pb-2">
                <span className="text-xs font-mono-sci font-bold uppercase tracking-wider text-[#F4F4F4]">
                  ELECTRICAL CONDUCTION GEOMETRY
                </span>
              </div>

              <div className="space-y-3 text-xs font-mono-sci">
                <div>
                  <div className="flex justify-between text-[#929292] mb-1">
                    <span>OPERATING TEMPERATURE:</span>
                    <span className="text-[#F4F4F4] font-bold">
                      {elecTempK} K ({(elecTempK - 273.15).toFixed(1)} °C)
                    </span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="1000"
                    step="25"
                    value={elecTempK}
                    onChange={(e) => setElecTempK(parseFloat(e.target.value))}
                    className="w-full accent-[#35C6D9] bg-[#141414] h-1.5 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[#929292] mb-1">
                    <span>WIRE LENGTH (L):</span>
                    <span className="text-[#F4F4F4] font-bold">{wireLengthM} meters</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="50"
                    step="0.5"
                    value={wireLengthM}
                    onChange={(e) => setWireLengthM(parseFloat(e.target.value))}
                    className="w-full accent-[#35C6D9] bg-[#141414] h-1.5 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[#929292] mb-1">
                    <span>CROSS-SECTION AREA (A):</span>
                    <span className="text-[#F4F4F4] font-bold">{wireAreaMm2} mm²</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="25.0"
                    step="0.5"
                    value={wireAreaMm2}
                    onChange={(e) => setWireAreaMm2(parseFloat(e.target.value))}
                    className="w-full accent-[#35C6D9] bg-[#141414] h-1.5 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[#929292] mb-1">
                    <span>APPLIED CURRENT (I):</span>
                    <span className="text-[#F4F4F4] font-bold">{appliedCurrentA} Amperes</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="50.0"
                    step="0.5"
                    value={appliedCurrentA}
                    onChange={(e) => setAppliedCurrentA(parseFloat(e.target.value))}
                    className="w-full accent-[#35C6D9] bg-[#141414] h-1.5 cursor-pointer"
                  />
                </div>

                <button
                  onClick={handleRunActiveSimulation}
                  disabled={loading}
                  className="w-full py-2 bg-[#141414] hover:bg-[#222] border border-[#35C6D9] text-[#35C6D9] text-xs font-mono-sci font-bold cursor-pointer"
                >
                  RECALCULATE OHM'S LAW RELATIONS
                </button>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-4">
              {/* Reciprocal identity callout banner */}
              <div className="p-3 bg-[#191919] border border-[#303030] flex items-center justify-between text-xs font-mono-sci">
                <div className="flex items-center gap-2">
                  <span className="text-[#35C6D9] font-bold">RECIPROCAL RELATION:</span>
                  <span className="text-[#F4F4F4]">Resistivity (ρ) = 1 / Conductivity (σ)</span>
                </div>
                <span className="text-[11px] text-[#2ECC71] border border-[#1d462f] px-2 py-0.5 bg-[#12281c]">
                  ENFORCED
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono-sci">
                <div className="p-3 bg-[#191919] border border-[#303030]">
                  <span className="text-[10px] text-[#888] uppercase block">RESISTIVITY (ρ)</span>
                  <span className="text-lg font-bold text-[#F4F4F4] mt-0.5 block">
                    {elecResult.results.resistivity_nano_ohm_m}{' '}
                    <span className="text-xs font-normal text-[#888]">nΩ·m</span>
                  </span>
                  <span className="text-[10px] text-[#666]">
                    {elecResult.results.resistivity_micro_ohm_cm} μΩ·cm
                  </span>
                </div>

                <div className="p-3 bg-[#191919] border border-[#303030]">
                  <span className="text-[10px] text-[#888] uppercase block">CONDUCTIVITY (σ)</span>
                  <span className="text-lg font-bold text-[#35C6D9] mt-0.5 block">
                    {elecResult.results.conductivity_mega_siemens_per_m}{' '}
                    <span className="text-xs font-normal text-[#888]">MS/m</span>
                  </span>
                  <span className="text-[10px] text-[#666]">
                    {elecResult.results.iacs_conductivity_percent} % IACS
                  </span>
                </div>

                <div className="p-3 bg-[#191919] border border-[#303030]">
                  <span className="text-[10px] text-[#888] uppercase block">TOTAL RESISTANCE (R)</span>
                  <span className="text-lg font-bold text-[#F4F4F4] mt-0.5 block">
                    {elecResult.results.component_resistance_milli_ohms}{' '}
                    <span className="text-xs font-normal text-[#888]">mΩ</span>
                  </span>
                  <span className="text-[10px] text-[#666]">R = ρ · L / A</span>
                </div>

                <div className="p-3 bg-[#191919] border border-[#303030]">
                  <span className="text-[10px] text-[#888] uppercase block">JOULE HEAT DISSIPATION</span>
                  <span className="text-lg font-bold text-[#e07a5f] mt-0.5 block">
                    {elecResult.results.joule_power_dissipation_watts}{' '}
                    <span className="text-xs font-normal text-[#888]">W</span>
                  </span>
                  <span className="text-[10px] text-[#666]">P = I² · R</span>
                </div>
              </div>

              {/* Temperature Dependency Plot */}
              <ScientificChart
                title="ELECTRICAL CONDUCTIVITY VS TEMPERATURE σ(T) [% IACS]"
                xLabel="Temperature (T)"
                yLabel="Conductivity"
                xUnit="K"
                yUnit="% IACS"
                series={[
                  {
                    name: currentMaterial.name,
                    points: elecResult.temperature_dependency_curve.map((pt) => ({
                      x: pt.temp_k,
                      y: pt.iacs_pct,
                    })),
                    color: '#d4b94e',
                  },
                ]}
                annotations={[
                  `Temperature coefficient of resistance (α): ${elecResult.results.temp_coefficient_k} / K`,
                  `Voltage drop across ${wireLengthM}m wire: ${elecResult.results.voltage_drop_volts} V`,
                ]}
              />
            </div>
          </div>

          <div className="p-3.5 bg-[#141414] border border-[#262626] text-xs font-mono-sci space-y-1 text-[#888]">
            <div className="flex items-center gap-2">
              <ProvenanceBadge category={elecResult.data_category} />
              <span className="text-[#c9d1d9] font-bold">{elecResult.model_name}</span>
            </div>
            <p className="pt-1">{elecResult.scientific_disclaimer}</p>
          </div>
        </div>
      )}

      {/* MODULE 4: CORROSION */}
      {activeTab === 'corrosion' && corrResult && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 p-4 bg-[#191919] border border-[#303030] space-y-4">
              <div className="border-b border-[#262626] pb-2">
                <span className="text-xs font-mono-sci font-bold uppercase tracking-wider text-[#F4F4F4]">
                  ELECTROCHEMICAL ENVIRONMENT
                </span>
              </div>

              <div className="space-y-3 text-xs font-mono-sci">
                <div>
                  <label className="block text-[#929292] mb-1">ELECTROLYTE MEDIUM:</label>
                  <select
                    value={envType}
                    onChange={(e) => setEnvType(e.target.value)}
                    className="w-full bg-[#141414] border border-[#303030] text-[#F4F4F4] text-xs p-1.5 outline-none"
                  >
                    <option value="Marine / Saline (3.5% NaCl)">Marine / Saline (3.5% NaCl)</option>
                    <option value="Industrial Acidic (pH 2-4)">Industrial Acidic (pH 2-4)</option>
                    <option value="Neutral Freshwater (pH 7)">Neutral Freshwater (pH 7)</option>
                    <option value="Alkaline Solution (pH 11)">Alkaline Solution (pH 11)</option>
                    <option value="High-Temperature Air Oxidation">High-Temperature Air Oxidation</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between text-[#929292] mb-1">
                    <span>SOLUTION pH:</span>
                    <span className="text-[#F4F4F4] font-bold">{phVal}</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="14.0"
                    step="0.5"
                    value={phVal}
                    onChange={(e) => setPhVal(parseFloat(e.target.value))}
                    className="w-full accent-[#35C6D9] bg-[#141414] h-1.5 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[#929292] mb-1">
                    <span>TEMPERATURE:</span>
                    <span className="text-[#F4F4F4] font-bold">
                      {corrTempK} K ({(corrTempK - 273.15).toFixed(1)} °C)
                    </span>
                  </div>
                  <input
                    type="range"
                    min="273.15"
                    max="373.15"
                    step="5"
                    value={corrTempK}
                    onChange={(e) => setCorrTempK(parseFloat(e.target.value))}
                    className="w-full accent-[#35C6D9] bg-[#141414] h-1.5 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[#929292] mb-1">
                    <span>DISSOLVED OXYGEN:</span>
                    <span className="text-[#F4F4F4] font-bold">{dissolvedO2} ppm</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="15.0"
                    step="0.5"
                    value={dissolvedO2}
                    onChange={(e) => setDissolvedO2(parseFloat(e.target.value))}
                    className="w-full accent-[#35C6D9] bg-[#141414] h-1.5 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[#929292] mb-1">
                    <span>EXPOSURE DURATION:</span>
                    <span className="text-[#F4F4F4] font-bold">
                      {(exposureHours / 8760).toFixed(1)} Year(s) ({exposureHours} hrs)
                    </span>
                  </div>
                  <input
                    type="range"
                    min="720"
                    max="43800"
                    step="720"
                    value={exposureHours}
                    onChange={(e) => setExposureHours(parseFloat(e.target.value))}
                    className="w-full accent-[#35C6D9] bg-[#141414] h-1.5 cursor-pointer"
                  />
                </div>

                <button
                  onClick={handleRunActiveSimulation}
                  disabled={loading}
                  className="w-full py-2 bg-[#141414] hover:bg-[#222] border border-[#35C6D9] text-[#35C6D9] text-xs font-mono-sci font-bold cursor-pointer"
                >
                  SIMULATE DEGRADATION KINETICS
                </button>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono-sci">
                <div className="p-3 bg-[#191919] border border-[#303030]">
                  <span className="text-[10px] text-[#888] uppercase block">PREN INDEX</span>
                  <span className="text-lg font-bold text-[#F4F4F4] mt-0.5 block">
                    {corrResult.results.pitting_resistance_equivalent_number_pren}
                  </span>
                  <span className="text-[10px] text-[#666]">Cr + 3.3Mo + 1.65W</span>
                </div>

                <div className="p-3 bg-[#191919] border border-[#303030]">
                  <span className="text-[10px] text-[#888] uppercase block">PASSIVATING ELEMENTS</span>
                  <span className="text-lg font-bold text-[#35C6D9] mt-0.5 block">
                    {corrResult.results.passivating_element_content_pct} %
                  </span>
                  <span className="text-[10px] text-[#666]">
                    {corrResult.results.is_spontaneous_passivation_likely
                      ? 'Coherent film formed'
                      : 'Active dissolution'}
                  </span>
                </div>

                <div className="p-3 bg-[#191919] border border-[#303030]">
                  <span className="text-[10px] text-[#888] uppercase block">CORROSION RATE</span>
                  <span className="text-lg font-bold text-[#F4F4F4] mt-0.5 block">
                    {corrResult.results.estimated_corrosion_rate_mm_year}{' '}
                    <span className="text-xs font-normal text-[#888]">mm/yr</span>
                  </span>
                  <span className="text-[10px] text-[#666]">
                    {corrResult.results.penetration_loss_microns} μm total loss
                  </span>
                </div>

                <div className="p-3 bg-[#191919] border border-[#303030]">
                  <span className="text-[10px] text-[#888] uppercase block">GALVANIC NOBILITY</span>
                  <span className="text-lg font-bold text-[#F4F4F4] mt-0.5 block">
                    {corrResult.results.thermodynamic_nobility_v_she}{' '}
                    <span className="text-xs font-normal text-[#888]">V</span>
                  </span>
                  <span className="text-[10px] text-[#666]">vs SHE reference</span>
                </div>
              </div>

              {/* Status Classification banner */}
              <div
                className="p-3 border text-xs font-mono-sci flex items-center justify-between"
                style={{
                  backgroundColor: '#191919',
                  borderColor: corrResult.results.status_color,
                  color: corrResult.results.status_color,
                }}
              >
                <div>
                  <span className="font-bold mr-2">TIER:</span>
                  <span>{corrResult.results.corrosion_resistance_tier}</span>
                </div>
                <div>
                  <span>PITTING SUSCEPTIBILITY: </span>
                  <strong className="ml-1">{corrResult.results.pitting_susceptibility}</strong>
                </div>
              </div>

              {/* pH Sensitivity Plot */}
              <ScientificChart
                title="ESTIMATED CORROSION PENETRATION RATE VS pH [mm/year]"
                xLabel="Solution pH"
                yLabel="Corrosion Rate"
                xUnit="pH"
                yUnit="mm/year"
                series={[
                  {
                    name: currentMaterial.name,
                    points: corrResult.ph_sensitivity_curve.map((pt) => ({
                      x: pt.ph,
                      y: pt.rate_mm_year,
                    })),
                    color: '#2ECC71',
                  },
                ]}
                annotations={[
                  `Active-passive transition visible around neutral / alkaline pH ranges.`,
                  `Chloride presence accelerates local pit initiation regardless of macroscopic rate.`,
                ]}
              />
            </div>
          </div>

          <div className="p-3.5 bg-[#2c1d1d] border border-[#522b2b] text-xs font-mono-sci space-y-1 text-[#e07a5f]">
            <div className="flex items-center gap-2">
              <ProvenanceBadge category={corrResult.data_category} />
              <span className="font-bold">METALLURGICAL CORROSION NOTICE:</span>
            </div>
            <p className="pt-1">{corrResult.scientific_disclaimer}</p>
          </div>
        </div>
      )}
    </div>
  );
};
