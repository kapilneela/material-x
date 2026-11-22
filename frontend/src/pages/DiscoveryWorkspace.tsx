import React, { useState } from 'react';
import { Material, ElementInfo, DiscoveryResponse, DiscoveryCandidate } from '../types';
import { api } from '../services/api';
import { PageId } from '../components/layout/Sidebar';
import { Compass, Sparkles, Layers, AlertCircle, ArrowRight, Check } from 'lucide-react';

interface DiscoveryWorkspaceProps {
  elements: Record<string, ElementInfo>;
  onImportToStudio: (composition: Record<string, number>, name: string) => void;
  onNavigate: (page: PageId) => void;
}

export const DiscoveryWorkspace: React.FC<DiscoveryWorkspaceProps> = ({
  elements,
  onImportToStudio,
  onNavigate,
}) => {
  const [baseElement, setBaseElement] = useState<string>('Al');
  const [candidateSolutes, setCandidateSolutes] = useState<string[]>(['Cu', 'Mg', 'Si', 'Zn']);
  const [primaryObj, setPrimaryObj] = useState<string>('minimize_density');
  const [secondaryObj, setSecondaryObj] = useState<string>('maximize_yield_strength');
  const [maxSolutePct, setMaxSolutePct] = useState<number>(12.0);
  const [targetCount, setTargetCount] = useState<number>(6);

  const [loading, setLoading] = useState(false);
  const [discoveryResult, setDiscoveryResult] = useState<DiscoveryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const objectivesList = [
    { id: 'minimize_density', name: 'Minimize Density (Lightweighting)' },
    { id: 'maximize_yield_strength', name: 'Maximize Yield Strength' },
    { id: 'maximize_thermal_conductivity', name: 'Maximize Thermal Conductivity' },
    { id: 'improve_corrosion_resistance', name: 'Improve Corrosion Resistance (PREN & Passivation)' },
    { id: 'balance_strength_and_conductivity', name: 'Balance Strength & Electrical Conductivity' },
  ];

  const handleRunDiscovery = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.runDiscovery({
        base_element: baseElement,
        candidate_elements: candidateSolutes,
        primary_objective: primaryObj,
        secondary_objective: secondaryObj,
        max_solute_wt_pct: maxSolutePct,
        target_count: targetCount,
      });
      setDiscoveryResult(res);
    } catch (err: any) {
      setError(err.message || 'Discovery optimization failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleCandidateSolute = (sym: string) => {
    if (candidateSolutes.includes(sym)) {
      if (candidateSolutes.length <= 1) return;
      setCandidateSolutes(candidateSolutes.filter((s) => s !== sym));
    } else {
      setCandidateSolutes([...candidateSolutes, sym]);
    }
  };

  const handleImportCandidate = (cand: DiscoveryCandidate, idx: number) => {
    const name = `Optimized ${baseElement}-Alloy Candidate #${idx + 1}`;
    onImportToStudio(cand.composition, name);
    onNavigate('studio');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-[#303030] pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-[11px] font-mono-sci uppercase tracking-widest text-[#35C6D9]">
            DISCOVERY WORKSPACE // PARETO OPTIMIZATION
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[#F4F4F4] mt-0.5">
            Target-Driven Alloy Optimization & Candidate Ranking
          </h1>
          <p className="text-xs text-[#929292] mt-1 font-mono-sci">
            Specify multi-objective engineering constraints to explore metallurgical solid solution candidates.
          </p>
        </div>

        <button
          onClick={handleRunDiscovery}
          disabled={loading}
          className="px-4 py-2 bg-[#191919] hover:bg-[#222] border border-[#35C6D9] text-[#35C6D9] text-xs font-mono-sci font-bold flex items-center gap-2 cursor-pointer transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          {loading ? 'EXPLORING GRID...' : 'RUN DISCOVERY ENGINE'}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-[#2c1d1d] border border-[#E74C3C] text-[#E74C3C] text-xs font-mono-sci flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Constraints & Objectives Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Configuration Form (5 cols) */}
        <div className="lg:col-span-5 p-4 bg-[#191919] border border-[#303030] space-y-4">
          <div className="border-b border-[#262626] pb-2">
            <span className="text-xs font-mono-sci font-bold uppercase tracking-wider text-[#F4F4F4]">
              OPTIMIZATION OBJECTIVES & CONSTRAINTS
            </span>
          </div>

          <div className="space-y-3.5 text-xs font-mono-sci">
            {/* Base Matrix Element */}
            <div>
              <label className="block text-[#929292] mb-1">BASE SOLVENT ELEMENT:</label>
              <select
                value={baseElement}
                onChange={(e) => {
                  setBaseElement(e.target.value);
                  setCandidateSolutes((prev) => prev.filter((s) => s !== e.target.value));
                }}
                className="w-full bg-[#141414] border border-[#303030] text-[#35C6D9] font-bold text-xs p-1.5 outline-none"
              >
                {Object.keys(elements).map((el) => (
                  <option key={el} value={el}>
                    {el} - {elements[el].name} (M={elements[el].atomic_mass} g/mol)
                  </option>
                ))}
              </select>
            </div>

            {/* Candidate Alloying Elements */}
            <div>
              <label className="block text-[#929292] mb-1">
                PERMITTED ALLOYING ELEMENTS:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {Object.keys(elements)
                  .filter((el) => el !== baseElement)
                  .map((el) => {
                    const isSelected = candidateSolutes.includes(el);
                    return (
                      <button
                        key={el}
                        type="button"
                        onClick={() => toggleCandidateSolute(el)}
                        className={`px-2 py-1 text-xs font-mono-sci border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#35C6D9] bg-[#1a2b2e] text-[#35C6D9] font-bold'
                            : 'border-[#262626] bg-[#141414] text-[#666]'
                        }`}
                      >
                        {el}
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Primary Objective */}
            <div>
              <label className="block text-[#929292] mb-1">PRIMARY GOAL (65% WEIGHT):</label>
              <select
                value={primaryObj}
                onChange={(e) => setPrimaryObj(e.target.value)}
                className="w-full bg-[#141414] border border-[#303030] text-[#F4F4F4] text-xs p-1.5 outline-none"
              >
                {objectivesList.map((obj) => (
                  <option key={obj.id} value={obj.id}>
                    {obj.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Secondary Objective */}
            <div>
              <label className="block text-[#929292] mb-1">SECONDARY GOAL (35% WEIGHT):</label>
              <select
                value={secondaryObj}
                onChange={(e) => setSecondaryObj(e.target.value)}
                className="w-full bg-[#141414] border border-[#303030] text-[#F4F4F4] text-xs p-1.5 outline-none"
              >
                {objectivesList.map((obj) => (
                  <option key={obj.id} value={obj.id}>
                    {obj.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Max Solute Limit */}
            <div>
              <div className="flex justify-between text-[#929292] mb-1">
                <span>MAX TOTAL SOLUTE CONTENT:</span>
                <span className="text-[#F4F4F4] font-bold">{maxSolutePct}% wt</span>
              </div>
              <input
                type="range"
                min="2.0"
                max="25.0"
                step="1.0"
                value={maxSolutePct}
                onChange={(e) => setMaxSolutePct(parseFloat(e.target.value))}
                className="w-full accent-[#35C6D9] bg-[#141414] h-1.5 cursor-pointer"
              />
              <span className="text-[10px] text-[#666]">
                Prevents unfeasible macro-segregation during solid solution modeling
              </span>
            </div>

            {/* Candidates Count */}
            <div>
              <div className="flex justify-between text-[#929292] mb-1">
                <span>CANDIDATES TO RETURN:</span>
                <span className="text-[#F4F4F4] font-bold">{targetCount}</span>
              </div>
              <input
                type="range"
                min="3"
                max="12"
                step="1"
                value={targetCount}
                onChange={(e) => setTargetCount(parseInt(e.target.value, 10))}
                className="w-full accent-[#35C6D9] bg-[#141414] h-1.5 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Right: Ranked Candidates Table & Details (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between border-b border-[#262626] pb-2">
            <span className="text-xs font-mono-sci font-bold uppercase tracking-wider text-[#F4F4F4]">
              PARETO-RANKED ALLOY CANDIDATES
            </span>
            {discoveryResult && (
              <span className="text-[11px] font-mono-sci text-[#35C6D9]">
                {discoveryResult.ranked_candidates.length} CANDIDATES FOUND
              </span>
            )}
          </div>

          {!discoveryResult && !loading && (
            <div className="p-12 border border-dashed border-[#303030] text-center space-y-2">
              <Compass className="w-8 h-8 text-[#666] mx-auto" />
              <div className="text-xs font-mono-sci text-[#888]">
                CLICK "RUN DISCOVERY ENGINE" TO COMPUTE OPTIMIZED ALLOY COMPOSITIONS.
              </div>
            </div>
          )}

          {discoveryResult && (
            <div className="space-y-3">
              {discoveryResult.ranked_candidates.map((cand, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-[#191919] border border-[#303030] hover:border-[#444] transition-all space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-none bg-[#141414] border border-[#35C6D9] text-[#35C6D9] font-mono-sci font-bold text-xs flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <span className="text-sm font-bold text-[#F4F4F4]">
                        {Object.entries(cand.composition)
                          .map(([el, wt]) => `${el}${wt}%`)
                          .join('-')}
                      </span>
                      <span className="text-[10px] font-mono-sci px-1.5 py-0.5 bg-[#141414] border border-[#2b2b2b] text-[#929292]">
                        {cand.dominant_structure} LATTICE
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[9px] text-[#888] block">PARETO SCORE</span>
                        <span className="text-sm font-bold text-[#2ECC71]">
                          {(cand.composite_score * 100).toFixed(1)}
                        </span>
                      </div>
                      <button
                        onClick={() => handleImportCandidate(cand, idx)}
                        className="px-2.5 py-1 bg-[#141414] hover:bg-[#222] border border-[#35C6D9] text-[11px] font-mono-sci text-[#35C6D9] flex items-center gap-1 cursor-pointer"
                        title="Import to Studio"
                      >
                        <Layers className="w-3 h-3" />
                        LOAD IN STUDIO
                      </button>
                    </div>
                  </div>

                  {/* Metrics preview */}
                  <div className="grid grid-cols-4 gap-2 text-[11px] font-mono-sci pt-1 bg-[#141414] p-2 border border-[#242424]">
                    <div>
                      <span className="text-[#666] block text-[9px]">DENSITY</span>
                      <span className="text-[#F4F4F4] font-bold">{cand.metrics.density_g_cm3} g/cm³</span>
                    </div>
                    <div>
                      <span className="text-[#666] block text-[9px]">YIELD STRENGTH</span>
                      <span className="text-[#F4F4F4] font-bold">{cand.metrics.yield_strength_mpa} MPa</span>
                    </div>
                    <div>
                      <span className="text-[#666] block text-[9px]">CONDUCTIVITY</span>
                      <span className="text-[#F4F4F4] font-bold">{cand.metrics.thermal_conductivity_w_mk} W/m·K</span>
                    </div>
                    <div>
                      <span className="text-[#666] block text-[9px]">IACS ELEC</span>
                      <span className="text-[#F4F4F4] font-bold">{cand.metrics.electrical_conductivity_iacs}% IACS</span>
                    </div>
                  </div>

                  <div className="text-[10px] font-mono-sci text-[#888] flex items-center gap-1">
                    <span className="text-[#35C6D9]">&bull; Trade-off:</span> {cand.trade_off_notes}
                  </div>
                </div>
              ))}

              {/* Methodology & Missing Information Disclosure */}
              <div className="p-3 bg-[#141414] border border-[#262626] text-[10px] font-mono-sci text-[#777] space-y-2 mt-4">
                <div>
                  <span className="text-[#F4F4F4] font-bold block">METHODOLOGY DISCLOSURE:</span>
                  <p>{discoveryResult.methodology}</p>
                </div>
                <div>
                  <span className="text-[#e07a5f] font-bold block">MISSING PHYSICAL INFORMATION DISCLOSURE:</span>
                  <ul className="list-disc list-inside space-y-0.5">
                    {discoveryResult.missing_information_disclosure.map((disc, dIdx) => (
                      <li key={dIdx}>{disc}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
