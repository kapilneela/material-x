import React, { useState, useEffect } from 'react';
import { Material, ComparisonMaterial } from '../types';
import { api } from '../services/api';
import { ProvenanceBadge } from '../components/common/Badge';
import { SplitSquareVertical, AlertCircle, Check, X } from 'lucide-react';

interface MaterialComparisonProps {
  materials: Material[];
}

export const MaterialComparison: React.FC<MaterialComparisonProps> = ({ materials }) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(
    materials.slice(0, 3).map((m) => m.id)
  );
  const [comparisonData, setComparisonData] = useState<ComparisonMaterial[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedIds.length >= 2) {
      setLoading(true);
      setError(null);
      api
        .compareMaterials(selectedIds)
        .then((res) => setComparisonData(res.materials))
        .catch((err) => setError(err.message || 'Failed to compare materials'))
        .finally(() => setLoading(false));
    } else {
      setComparisonData([]);
    }
  }, [selectedIds]);

  const toggleMaterial = (id: string) => {
    if (selectedIds.includes(id)) {
      if (selectedIds.length <= 2) {
        setError('Comparison requires at least 2 materials.');
        return;
      }
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      if (selectedIds.length >= 4) {
        setError('Maximum 4 materials can be compared simultaneously.');
        return;
      }
      setSelectedIds([...selectedIds, id]);
    }
  };

  const propertyKeys = [
    { key: 'density', label: 'Theoretical Density' },
    { key: 'yield_strength', label: 'Yield Strength (0.2%)' },
    { key: 'ultimate_tensile_strength', label: 'Ultimate Tensile (UTS)' },
    { key: 'elastic_modulus', label: 'Elastic Modulus (Young\'s E)' },
    { key: 'vickers_hardness', label: 'Vickers Hardness' },
    { key: 'thermal_conductivity', label: 'Thermal Conductivity' },
    { key: 'specific_heat', label: 'Specific Heat Capacity' },
    { key: 'electrical_resistivity', label: 'Electrical Resistivity' },
    { key: 'electrical_conductivity_iacs', label: 'Electrical Conductivity' },
    { key: 'pitting_resistance_pren', label: 'Pitting Resistance (PREN)' },
    { key: 'corrosion_rate_saline', label: 'Saline Corrosion Rate' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-[#303030] pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-[11px] font-mono-sci uppercase tracking-widest text-[#35C6D9]">
            MATERIAL COMPARISON // CROSS-ANALYSIS
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[#F4F4F4] mt-0.5">
            Side-by-Side Multi-Physical Comparison
          </h1>
          <p className="text-xs text-[#929292] mt-1 font-mono-sci">
            Evaluate up to 4 saved materials with strict property availability indicators and data provenance tracking.
          </p>
        </div>
      </div>

      {/* Material Selection Chips */}
      <div className="p-4 bg-[#191919] border border-[#303030] space-y-3">
        <div className="flex items-center justify-between text-xs font-mono-sci">
          <span className="text-[#929292] uppercase font-bold">
            SELECT MATERIALS TO COMPARE (CHOOSE 2 TO 4):
          </span>
          <span className="text-[#35C6D9]">{selectedIds.length} OF 4 SELECTED</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {materials.map((m) => {
            const isSelected = selectedIds.includes(m.id);
            return (
              <button
                key={m.id}
                onClick={() => toggleMaterial(m.id)}
                className={`px-3 py-1.5 text-xs font-mono-sci border transition-all cursor-pointer flex items-center gap-2 ${
                  isSelected
                    ? 'border-[#35C6D9] bg-[#1a2b2e] text-[#F4F4F4]'
                    : 'border-[#303030] bg-[#141414] text-[#888] hover:border-[#444]'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isSelected ? 'bg-[#35C6D9]' : 'bg-[#444]'
                  }`}
                />
                <span className="font-bold">{m.name}</span>
                <span className="text-[10px] text-[#666]">[{m.id}]</span>
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-[#2c1d1d] border border-[#E74C3C] text-[#E74C3C] text-xs font-mono-sci flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && (
        <div className="p-12 text-center text-xs font-mono-sci text-[#35C6D9]">
          RUNNING MULTI-MATERIAL SIMULATIONS FOR COMPARISON MATRIX...
        </div>
      )}

      {/* Comparison Table */}
      {!loading && comparisonData.length >= 2 && (
        <div className="space-y-6">
          <div className="p-4 bg-[#191919] border border-[#303030] overflow-x-auto">
            <table className="w-full text-left text-xs font-mono-sci">
              <thead>
                <tr className="border-b border-[#262626]">
                  <th className="py-3 px-3 text-[#666] uppercase text-[10px] w-1/4">
                    PROPERTY / ATTRIBUTE
                  </th>
                  {comparisonData.map((mat) => (
                    <th key={mat.id} className="py-3 px-3">
                      <div className="font-bold text-[#F4F4F4] text-sm">{mat.name}</div>
                      <div className="text-[10px] text-[#35C6D9] mt-0.5">{mat.id}</div>
                      <div className="text-[10px] text-[#777]">{mat.category}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#242424]">
                {/* Composition row */}
                <tr className="bg-[#141414]">
                  <td className="py-3 px-3 font-bold text-[#F4F4F4]">
                    CHEMICAL COMPOSITION (wt%)
                  </td>
                  {comparisonData.map((mat) => (
                    <td key={mat.id} className="py-3 px-3">
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(mat.composition_wt).map(([el, wt]) => (
                          <span
                            key={el}
                            className="text-[10px] px-1.5 py-0.5 bg-[#191919] border border-[#2b2b2b] text-[#c9d1d9]"
                          >
                            <strong>{el}</strong> {wt.toFixed(1)}%
                          </span>
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Dominant structure */}
                <tr>
                  <td className="py-2.5 px-3 text-[#888]">Crystal Structure</td>
                  {comparisonData.map((mat) => (
                    <td key={mat.id} className="py-2.5 px-3 font-bold text-[#F4F4F4]">
                      {mat.dominant_structure} LATTICE
                    </td>
                  ))}
                </tr>

                {/* Detailed properties */}
                {propertyKeys.map((prop) => (
                  <tr key={prop.key} className="hover:bg-[#1f1f1f]">
                    <td className="py-3 px-3 font-medium text-[#c9d1d9]">
                      {prop.label}
                    </td>
                    {comparisonData.map((mat) => {
                      const item = mat.properties[prop.key];
                      if (!item || !item.available) {
                        return (
                          <td key={mat.id} className="py-3 px-3 text-[#666] italic">
                            [Insufficient data]
                          </td>
                        );
                      }
                      return (
                        <td key={mat.id} className="py-3 px-3 space-y-1">
                          <div className="text-sm font-bold text-[#F4F4F4]">
                            {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}{' '}
                            <span className="text-xs font-normal text-[#888]">{item.unit}</span>
                          </div>
                          <div className="text-[9px] text-[#666]">
                            &bull; {item.provenance}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Comparative Metrics Bar Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-[#191919] border border-[#303030] space-y-3">
              <span className="text-xs font-mono-sci font-bold uppercase tracking-wider text-[#F4F4F4] block border-b border-[#262626] pb-2">
                YIELD STRENGTH COMPARISON (MPa)
              </span>
              <div className="space-y-2">
                {comparisonData.map((mat) => {
                  const val = mat.properties.yield_strength?.value || 0;
                  const maxVal = Math.max(...comparisonData.map((m) => m.properties.yield_strength?.value || 1));
                  const pct = (val / maxVal) * 100;
                  return (
                    <div key={mat.id} className="text-xs font-mono-sci space-y-1">
                      <div className="flex justify-between">
                        <span className="truncate w-36 text-[#F4F4F4]">{mat.name}</span>
                        <span className="text-[#35C6D9] font-bold">{val} MPa</span>
                      </div>
                      <div className="w-full bg-[#141414] h-1.5 border border-[#2b2b2b]">
                        <div
                          className="bg-[#35C6D9] h-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 bg-[#191919] border border-[#303030] space-y-3">
              <span className="text-xs font-mono-sci font-bold uppercase tracking-wider text-[#F4F4F4] block border-b border-[#262626] pb-2">
                DENSITY COMPARISON (g/cm³)
              </span>
              <div className="space-y-2">
                {comparisonData.map((mat) => {
                  const val = mat.properties.density?.value || 0;
                  const maxVal = Math.max(...comparisonData.map((m) => m.properties.density?.value || 1));
                  const pct = (val / maxVal) * 100;
                  return (
                    <div key={mat.id} className="text-xs font-mono-sci space-y-1">
                      <div className="flex justify-between">
                        <span className="truncate w-36 text-[#F4F4F4]">{mat.name}</span>
                        <span className="text-[#e07a5f] font-bold">{val} g/cm³</span>
                      </div>
                      <div className="w-full bg-[#141414] h-1.5 border border-[#2b2b2b]">
                        <div
                          className="bg-[#e07a5f] h-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 bg-[#191919] border border-[#303030] space-y-3">
              <span className="text-xs font-mono-sci font-bold uppercase tracking-wider text-[#F4F4F4] block border-b border-[#262626] pb-2">
                THERMAL CONDUCTIVITY (W/m·K)
              </span>
              <div className="space-y-2">
                {comparisonData.map((mat) => {
                  const val = mat.properties.thermal_conductivity?.value || 0;
                  const maxVal = Math.max(...comparisonData.map((m) => m.properties.thermal_conductivity?.value || 1));
                  const pct = (val / maxVal) * 100;
                  return (
                    <div key={mat.id} className="text-xs font-mono-sci space-y-1">
                      <div className="flex justify-between">
                        <span className="truncate w-36 text-[#F4F4F4]">{mat.name}</span>
                        <span className="text-[#2ECC71] font-bold">{val} W/m·K</span>
                      </div>
                      <div className="w-full bg-[#141414] h-1.5 border border-[#2b2b2b]">
                        <div
                          className="bg-[#2ECC71] h-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
