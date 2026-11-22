import React, { useState, useEffect } from 'react';
import { Material, ElementInfo } from '../types';
import { api } from '../services/api';
import { Plus, Trash2, CheckCircle2, AlertCircle, Save, RotateCcw, Sparkles } from 'lucide-react';

interface MaterialStudioProps {
  elements: Record<string, ElementInfo>;
  activeMaterial: Material | null;
  onMaterialSaved: (mat: Material) => void;
  onNavigateToSim: (mat: Material) => void;
}

export const MaterialStudio: React.FC<MaterialStudioProps> = ({
  elements,
  activeMaterial,
  onMaterialSaved,
  onNavigateToSim,
}) => {
  const [materialName, setMaterialName] = useState('Hypothetical Alloy X-1');
  const [category, setCategory] = useState('Metallic Alloy');
  const [description, setDescription] = useState('');
  const [compositionMode, setCompositionMode] = useState<'wt' | 'at'>('wt');
  
  // Composition in weight percent
  const [composition, setComposition] = useState<Record<string, number>>({
    Fe: 70.0,
    Cr: 18.0,
    Ni: 10.0,
    Mn: 2.0,
  });

  const [saving, setSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [elementSearch, setElementSearch] = useState('');

  // When active material changes from outside (e.g. user clicked on material in dashboard or profile)
  useEffect(() => {
    if (activeMaterial) {
      setMaterialName(activeMaterial.name);
      setCategory(activeMaterial.category);
      setDescription(activeMaterial.description || '');
      setComposition(activeMaterial.composition_wt);
    }
  }, [activeMaterial]);

  // Conversions
  const getAtPercent = (wtComp: Record<string, number>): Record<string, number> => {
    const moles: Record<string, number> = {};
    for (const [el, wt] of Object.entries(wtComp)) {
      if (wt > 0 && elements[el]) {
        moles[el] = wt / elements[el].atomic_mass;
      }
    }
    const totalMoles = Object.values(moles).reduce((a, b) => a + b, 0);
    if (totalMoles <= 0) return {};
    const res: Record<string, number> = {};
    for (const [el, n] of Object.entries(moles)) {
      res[el] = (n / totalMoles) * 100.0;
    }
    return res;
  };

  const getWtPercentFromAt = (atComp: Record<string, number>): Record<string, number> => {
    const masses: Record<string, number> = {};
    for (const [el, at] of Object.entries(atComp)) {
      if (at > 0 && elements[el]) {
        masses[el] = at * elements[el].atomic_mass;
      }
    }
    const totalMass = Object.values(masses).reduce((a, b) => a + b, 0);
    if (totalMass <= 0) return {};
    const res: Record<string, number> = {};
    for (const [el, m] of Object.entries(masses)) {
      res[el] = (m / totalMass) * 100.0;
    }
    return res;
  };

  // Active displayed composition based on mode
  const displayedComposition =
    compositionMode === 'wt' ? composition : getAtPercent(composition);

  // Total percentage sum
  const totalPercentage = Object.values(displayedComposition).reduce((a, b) => a + b, 0);
  const diffFrom100 = totalPercentage - 100.0;
  const isValid100 = Math.abs(diffFrom100) <= 0.05;

  // Base properties estimation in real time
  const calculateLiveMetrics = () => {
    if (Object.keys(composition).length === 0) return null;
    let invDensity = 0;
    let avgMass = 0;
    const atMap = getAtPercent(composition);

    for (const [el, wt] of Object.entries(composition)) {
      if (elements[el]) {
        invDensity += (wt / 100.0) / elements[el].density_g_cm3;
      }
    }
    for (const [el, at] of Object.entries(atMap)) {
      if (elements[el]) {
        avgMass += (at / 100.0) * elements[el].atomic_mass;
      }
    }

    const density = invDensity > 0 ? 1.0 / invDensity : 0;
    const sortedEls = Object.entries(composition).sort((a, b) => b[1] - a[1]);
    const baseEl = sortedEls.length > 0 ? sortedEls[0][0] : 'Fe';
    const dominantStruct = elements[baseEl]?.crystal_structure || 'BCC';

    return {
      density: density.toFixed(3),
      avgMass: avgMass.toFixed(2),
      baseElement: baseEl,
      dominantStructure: dominantStruct,
    };
  };

  const liveMetrics = calculateLiveMetrics();

  // Handlers
  const handleUpdatePercentage = (el: string, value: number) => {
    const cleanVal = Math.max(0, Math.min(100, Math.round(value * 100) / 100));
    if (compositionMode === 'wt') {
      setComposition((prev) => ({ ...prev, [el]: cleanVal }));
    } else {
      // In atomic mode: update atomic percent then convert back to wt%
      const currAt = getAtPercent(composition);
      const newAt = { ...currAt, [el]: cleanVal };
      const convertedWt = getWtPercentFromAt(newAt);
      setComposition(convertedWt);
    }
  };

  const handleAddElement = (el: string) => {
    if (!composition[el]) {
      setComposition((prev) => ({ ...prev, [el]: 0 }));
    }
  };

  const handleRemoveElement = (el: string) => {
    setComposition((prev) => {
      const next = { ...prev };
      delete next[el];
      return next;
    });
  };

  const handleBalanceRemainder = () => {
    if (Object.keys(composition).length === 0) return;
    const sorted = Object.entries(composition).sort((a, b) => b[1] - a[1]);
    const baseEl = sorted[0][0];
    const otherSum = Object.entries(composition)
      .filter(([k]) => k !== baseEl)
      .reduce((acc, [, v]) => acc + v, 0);

    const remainder = Math.max(0, Math.round((100.0 - otherSum) * 100) / 100);
    setComposition((prev) => ({
      ...prev,
      [baseEl]: remainder,
    }));
  };

  const handleSaveMaterial = async () => {
    setErrorMessage(null);
    setSaveSuccessMsg(null);

    if (!isValid100) {
      setErrorMessage(
        `Validation Error: Composition totals ${totalPercentage.toFixed(2)}% (${
          diffFrom100 > 0 ? '+' : ''
        }${diffFrom100.toFixed(2)}%). It must equal exactly 100.00% before saving. Never silently normalized.`
      );
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: materialName.trim() || 'Untitled Alloy',
        category,
        description: description.trim() || undefined,
        composition_wt: composition,
      };

      let saved: Material;
      if (activeMaterial && activeMaterial.name === materialName) {
        // Update existing
        saved = await api.updateMaterial(activeMaterial.id, payload);
      } else {
        // Create new
        saved = await api.createMaterial(payload);
      }

      onMaterialSaved(saved);
      setSaveSuccessMsg(`Material "${saved.name}" [${saved.id}] saved successfully to database.`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save material.');
    } finally {
      setSaving(false);
    }
  };

  const supportedElements = Object.values(elements);
  const filteredElements = supportedElements.filter(
    (el) =>
      el.symbol.toLowerCase().includes(elementSearch.toLowerCase()) ||
      el.name.toLowerCase().includes(elementSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-[#303030] pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-[11px] font-mono-sci uppercase tracking-widest text-[#35C6D9]">
            MATERIAL STUDIO // COMPOSITION ENGINE
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[#F4F4F4] mt-0.5">
            Chemical Composition & Stoichiometry Editor
          </h1>
          <p className="text-xs text-[#929292] mt-1 font-mono-sci">
            Formulate metallurgical alloys, adjust mass and atomic fractions, and enforce strict mass conservation before simulation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveMaterial}
            disabled={saving || !isValid100}
            className={`px-4 py-1.5 text-xs font-mono-sci font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              isValid100
                ? 'bg-[#191919] hover:bg-[#222222] border border-[#35C6D9] text-[#35C6D9]'
                : 'bg-[#141414] border border-[#303030] text-[#555555] cursor-not-allowed'
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'SAVING...' : 'SAVE MATERIAL'}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccessMsg && (
        <div className="p-3 bg-[#12281c] border border-[#2ECC71] text-[#2ECC71] text-xs font-mono-sci flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
          {activeMaterial && (
            <button
              onClick={() => onNavigateToSim(activeMaterial)}
              className="underline text-xs hover:text-[#fff] cursor-pointer"
            >
              Run Simulations &rarr;
            </button>
          )}
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-[#2c1d1d] border border-[#E74C3C] text-[#E74C3C] text-xs font-mono-sci flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Material Metadata Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-[#191919] border border-[#303030]">
        <div>
          <label className="block text-[11px] font-mono-sci text-[#929292] uppercase tracking-wider mb-1">
            MATERIAL DESIGNATION NAME
          </label>
          <input
            type="text"
            value={materialName}
            onChange={(e) => setMaterialName(e.target.value)}
            className="w-full bg-[#141414] border border-[#303030] focus:border-[#35C6D9] px-3 py-1.5 text-xs font-mono-sci text-[#F4F4F4] outline-none"
            placeholder="e.g. Austenitic 316L Matrix"
          />
        </div>

        <div>
          <label className="block text-[11px] font-mono-sci text-[#929292] uppercase tracking-wider mb-1">
            MATERIAL CATEGORY
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-[#141414] border border-[#303030] focus:border-[#35C6D9] px-3 py-1.5 text-xs font-mono-sci text-[#F4F4F4] outline-none"
          >
            <option value="Stainless Steel (Austenitic)">Stainless Steel (Austenitic)</option>
            <option value="Stainless Steel (Martensitic/Ferritic)">Stainless Steel (Martensitic/Ferritic)</option>
            <option value="Titanium Alloy (Alpha-Beta)">Titanium Alloy (Alpha-Beta)</option>
            <option value="Aluminium Alloy (Structural)">Aluminium Alloy (Structural)</option>
            <option value="Nickel-base Superalloy">Nickel-base Superalloy</option>
            <option value="Refractory Alloy">Refractory Alloy</option>
            <option value="Copper / Brass / Bronze">Copper / Brass / Bronze</option>
            <option value="High-Entropy Alloy (HEA)">High-Entropy Alloy (HEA)</option>
            <option value="Metallic Alloy (Custom)">Metallic Alloy (Custom)</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-mono-sci text-[#929292] uppercase tracking-wider mb-1">
            TECHNICAL DESCRIPTION
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-[#141414] border border-[#303030] focus:border-[#35C6D9] px-3 py-1.5 text-xs font-mono-sci text-[#F4F4F4] outline-none"
            placeholder="e.g. Grain-refined corrosion resistant alloy"
          />
        </div>
      </div>

      {/* Main Composition Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Active Sliders & Inputs (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between border-b border-[#303030] pb-2">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono-sci font-bold uppercase tracking-wider text-[#F4F4F4]">
                CONSTITUENT ELEMENTS ({Object.keys(composition).length})
              </span>
            </div>

            {/* wt% vs at% toggle */}
            <div className="flex items-center border border-[#303030] bg-[#141414] p-0.5">
              <button
                type="button"
                onClick={() => setCompositionMode('wt')}
                className={`px-2.5 py-1 text-[11px] font-mono-sci font-bold transition-all ${
                  compositionMode === 'wt'
                    ? 'bg-[#35C6D9] text-[#0B0B0B]'
                    : 'text-[#929292] hover:text-[#F4F4F4]'
                }`}
              >
                WEIGHT (wt%)
              </button>
              <button
                type="button"
                onClick={() => setCompositionMode('at')}
                className={`px-2.5 py-1 text-[11px] font-mono-sci font-bold transition-all ${
                  compositionMode === 'at'
                    ? 'bg-[#35C6D9] text-[#0B0B0B]'
                    : 'text-[#929292] hover:text-[#F4F4F4]'
                }`}
              >
                ATOMIC (at%)
              </button>
            </div>
          </div>

          {/* Elemental percentage sliders list */}
          <div className="space-y-2">
            {Object.entries(displayedComposition).map(([el, val]) => {
              const elData = elements[el];
              const isBase = liveMetrics?.baseElement === el;
              return (
                <div
                  key={el}
                  className="p-3 bg-[#191919] border border-[#303030] hover:border-[#404040] transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-7 h-7 flex items-center justify-center font-bold text-xs font-mono-sci border"
                        style={{
                          borderColor: elData?.color_hex || '#35C6D9',
                          color: elData?.color_hex || '#35C6D9',
                          backgroundColor: '#141414',
                        }}
                      >
                        {el}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-[#F4F4F4] flex items-center gap-1.5">
                          {elData?.name || el}
                          {isBase && (
                            <span className="text-[9px] font-mono-sci px-1 py-0.2 bg-[#222415] text-[#d4b94e] border border-[#44401c]">
                              BASE MATRIX
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] font-mono-sci text-[#666666]">
                          Z={elData?.z} &bull; M={elData?.atomic_mass} g/mol &bull; {elData?.crystal_structure}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={val.toFixed(2)}
                          onChange={(e) =>
                            handleUpdatePercentage(el, parseFloat(e.target.value) || 0)
                          }
                          className="w-20 bg-[#141414] border border-[#303030] focus:border-[#35C6D9] px-2 py-1 text-right text-xs font-mono-sci text-[#F4F4F4] outline-none"
                        />
                        <span className="text-xs font-mono-sci text-[#929292]">
                          {compositionMode === 'wt' ? 'wt%' : 'at%'}
                        </span>
                      </div>

                      <button
                        onClick={() => handleRemoveElement(el)}
                        className="p-1 hover:text-[#E74C3C] text-[#666666] transition-colors cursor-pointer"
                        title="Remove Element"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Slider */}
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="0.1"
                    value={val}
                    onChange={(e) => handleUpdatePercentage(el, parseFloat(e.target.value))}
                    className="w-full accent-[#35C6D9] bg-[#222222] h-1.5 cursor-pointer"
                  />
                </div>
              );
            })}

            {Object.keys(composition).length === 0 && (
              <div className="p-8 border border-dashed border-[#303030] text-center text-xs font-mono-sci text-[#666666]">
                NO ELEMENTS SELECTED. CLICK ELEMENTS ON THE RIGHT TO ADD TO COMPOSITION.
              </div>
            )}
          </div>

          {/* Validation Meter Bar */}
          <div className="p-3.5 bg-[#191919] border border-[#303030] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono-sci font-bold uppercase tracking-wider text-[#929292]">
                TOTAL COMPOSITION METER
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm font-bold font-mono-sci ${
                    isValid100 ? 'text-[#2ECC71]' : 'text-[#E74C3C]'
                  }`}
                >
                  {totalPercentage.toFixed(2)} %
                </span>
                <span
                  className={`text-xs font-mono-sci ${
                    isValid100 ? 'text-[#2ECC71]' : 'text-[#E74C3C]'
                  }`}
                >
                  [{diffFrom100 >= 0 ? `+${diffFrom100.toFixed(2)}` : diffFrom100.toFixed(2)}%]
                </span>
              </div>
            </div>

            {/* Graphical Progress Bar */}
            <div className="w-full bg-[#141414] h-2.5 overflow-hidden border border-[#2b2b2b] flex">
              <div
                className={`h-full transition-all duration-150 ${
                  isValid100 ? 'bg-[#2ECC71]' : totalPercentage > 100 ? 'bg-[#E74C3C]' : 'bg-[#F39C12]'
                }`}
                style={{ width: `${Math.min(100, totalPercentage)}%` }}
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] font-mono-sci text-[#777777]">
                {isValid100
                  ? 'STRICT MASS BALANCE VERIFIED (100.00%)'
                  : 'INVALID: COMPOSITION MUST TOTAL EXACTLY 100.00%'}
              </span>

              {!isValid100 && (
                <button
                  type="button"
                  onClick={handleBalanceRemainder}
                  className="text-[11px] font-mono-sci text-[#35C6D9] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  BALANCE REMAINDER TO BASE
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right: Periodic Selector & Live Calculated Properties (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Periodic Element Selector */}
          <div className="p-4 bg-[#191919] border border-[#303030] space-y-3">
            <div className="flex items-center justify-between border-b border-[#262626] pb-2">
              <span className="text-xs font-mono-sci font-bold uppercase tracking-wider text-[#F4F4F4]">
                PERIODIC ELEMENT SELECTOR
              </span>
              <input
                type="text"
                placeholder="Filter (Fe, Cr...)"
                value={elementSearch}
                onChange={(e) => setElementSearch(e.target.value)}
                className="w-28 bg-[#141414] border border-[#303030] px-2 py-0.5 text-[11px] font-mono-sci text-[#F4F4F4] outline-none"
              />
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {filteredElements.map((el) => {
                const isSelected = !!composition[el.symbol];
                return (
                  <button
                    key={el.symbol}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        handleRemoveElement(el.symbol);
                      } else {
                        handleAddElement(el.symbol);
                      }
                    }}
                    className={`p-1.5 border text-center transition-all cursor-pointer flex flex-col justify-between h-16 ${
                      isSelected
                        ? 'border-[#35C6D9] bg-[#1a2b2e]'
                        : 'border-[#262626] bg-[#141414] hover:border-[#383838]'
                    }`}
                  >
                    <div className="flex justify-between items-center text-[9px] font-mono-sci text-[#666666]">
                      <span>{el.z}</span>
                      <span>{el.crystal_structure}</span>
                    </div>
                    <div
                      className="text-sm font-bold font-mono-sci"
                      style={{ color: isSelected ? '#35C6D9' : '#F4F4F4' }}
                    >
                      {el.symbol}
                    </div>
                    <div className="text-[9px] font-mono-sci text-[#888888] truncate">
                      {el.atomic_mass.toFixed(1)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Instant Live Composite Properties */}
          {liveMetrics && (
            <div className="p-4 bg-[#191919] border border-[#303030] space-y-3">
              <div className="border-b border-[#262626] pb-2">
                <span className="text-xs font-mono-sci font-bold uppercase tracking-wider text-[#F4F4F4]">
                  LIVE ESTIMATED BASE PROPERTIES
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono-sci">
                <div className="p-2.5 bg-[#141414] border border-[#262626]">
                  <span className="text-[10px] text-[#888] uppercase block">THEORETICAL DENSITY</span>
                  <span className="text-sm font-bold text-[#F4F4F4] mt-0.5 block">
                    {liveMetrics.density} <span className="text-xs font-normal text-[#929292]">g/cm³</span>
                  </span>
                  <span className="text-[9px] text-[#555] block">Reciprocal additivity</span>
                </div>

                <div className="p-2.5 bg-[#141414] border border-[#262626]">
                  <span className="text-[10px] text-[#888] uppercase block">AVG ATOMIC MASS</span>
                  <span className="text-sm font-bold text-[#F4F4F4] mt-0.5 block">
                    {liveMetrics.avgMass} <span className="text-xs font-normal text-[#929292]">g/mol</span>
                  </span>
                  <span className="text-[9px] text-[#555] block">Molar average</span>
                </div>

                <div className="p-2.5 bg-[#141414] border border-[#262626]">
                  <span className="text-[10px] text-[#888] uppercase block">BASE SOLVENT ELEMENT</span>
                  <span className="text-sm font-bold text-[#35C6D9] mt-0.5 block">
                    {liveMetrics.baseElement}
                  </span>
                  <span className="text-[9px] text-[#555] block">Primary matrix phase</span>
                </div>

                <div className="p-2.5 bg-[#141414] border border-[#262626]">
                  <span className="text-[10px] text-[#888] uppercase block">DOMINANT LATTICE</span>
                  <span className="text-sm font-bold text-[#F4F4F4] mt-0.5 block">
                    {liveMetrics.dominantStructure}
                  </span>
                  <span className="text-[9px] text-[#555] block">Room temp equilibrium</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
