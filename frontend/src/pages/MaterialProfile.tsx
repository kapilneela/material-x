import React, { useState, useEffect } from 'react';
import { Material, ElementInfo } from '../types';
import { ProvenanceBadge } from '../components/common/Badge';
import { PageId } from '../components/layout/Sidebar';
import { api } from '../services/api';
import { Activity, Box, SplitSquareVertical, FileDown, Layers, Clock, AlertTriangle } from 'lucide-react';

interface MaterialProfileProps {
  material: Material | null;
  elements: Record<string, ElementInfo>;
  onNavigate: (page: PageId) => void;
  onEditInStudio: (mat: Material) => void;
}

export const MaterialProfile: React.FC<MaterialProfileProps> = ({
  material,
  elements,
  onNavigate,
  onEditInStudio,
}) => {
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (material) {
      setLoadingHistory(true);
      fetch(`/api/simulations/history/${material.id}`)
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => setHistory(data))
        .catch(() => setHistory([]))
        .finally(() => setLoadingHistory(false));
    }
  }, [material]);

  if (!material) {
    return (
      <div className="p-12 border border-dashed border-[#303030] text-center space-y-3">
        <div className="text-xs font-mono-sci text-[#666]">
          NO MATERIAL SELECTED FOR PROFILE VIEW.
        </div>
        <button
          onClick={() => onNavigate('studio')}
          className="px-4 py-1.5 bg-[#191919] border border-[#35C6D9] text-[#35C6D9] text-xs font-mono-sci cursor-pointer"
        >
          OPEN MATERIAL STUDIO &rarr;
        </button>
      </div>
    );
  }

  const sortedElements = Object.entries(material.composition_wt).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="border-b border-[#303030] pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono-sci uppercase tracking-widest text-[#35C6D9]">
              MATERIAL PROFILE // RECORD
            </span>
            <span className="text-[11px] font-mono-sci px-2 py-0.5 bg-[#191919] border border-[#303030] text-[#F4F4F4]">
              {material.id}
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[#F4F4F4] mt-0.5">
            {material.name}
          </h1>
          <p className="text-xs text-[#929292] mt-1 font-mono-sci">
            {material.category} &bull; Base: {material.base_element} &bull; Dominant Structure: {material.dominant_structure} &bull; Registered: {material.created_at.slice(0, 19).replace('T', ' ')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onEditInStudio(material)}
            className="px-3 py-1.5 bg-[#191919] hover:bg-[#222] border border-[#303030] text-xs font-mono-sci text-[#F4F4F4] flex items-center gap-1.5 cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-[#35C6D9]" />
            EDIT IN STUDIO
          </button>
          <button
            onClick={() => onNavigate('simulation')}
            className="px-3 py-1.5 bg-[#191919] hover:bg-[#222] border border-[#35C6D9] text-xs font-mono-sci text-[#35C6D9] flex items-center gap-1.5 cursor-pointer"
          >
            <Activity className="w-3.5 h-3.5" />
            SIMULATION LAB
          </button>
          <button
            onClick={() => onNavigate('atomic')}
            className="px-3 py-1.5 bg-[#191919] hover:bg-[#222] border border-[#303030] text-xs font-mono-sci text-[#F4F4F4] flex items-center gap-1.5 cursor-pointer"
          >
            <Box className="w-3.5 h-3.5 text-[#35C6D9]" />
            ATOMIC 3D
          </button>
          <a
            href={api.getReportDownloadUrl(material.id)}
            download
            className="px-3 py-1.5 bg-[#191919] hover:bg-[#222] border border-[#303030] text-xs font-mono-sci text-[#2ECC71] flex items-center gap-1.5 cursor-pointer"
          >
            <FileDown className="w-3.5 h-3.5" />
            EXPORT PDF
          </a>
        </div>
      </div>

      {/* Horizontal Technical Composition Distribution Chart */}
      <div className="p-4 bg-[#191919] border border-[#303030] space-y-3">
        <div className="flex items-center justify-between text-xs font-mono-sci">
          <span className="font-bold uppercase tracking-wider text-[#F4F4F4]">
            MASS FRACTION DISTRIBUTION (wt%)
          </span>
          <span className="text-[#929292]">TOTAL: 100.00%</span>
        </div>

        {/* Stacked bar */}
        <div className="w-full h-8 bg-[#141414] border border-[#2b2b2b] flex overflow-hidden">
          {sortedElements.map(([el, wt]) => {
            const color = elements[el]?.color_hex || '#35C6D9';
            return (
              <div
                key={el}
                style={{ width: `${wt}%`, backgroundColor: color }}
                className="h-full relative group transition-all"
                title={`${el}: ${wt.toFixed(2)} wt%`}
              >
                {wt >= 6 && (
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono-sci font-bold text-[#0B0B0B] truncate px-1">
                    {el} {wt.toFixed(1)}%
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Composition detail chips */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          {sortedElements.map(([el, wt]) => {
            const at = material.composition_at[el] || 0;
            const elData = elements[el];
            return (
              <div
                key={el}
                className="px-2.5 py-1.5 bg-[#141414] border border-[#262626] flex items-center gap-2 text-xs font-mono-sci"
              >
                <span
                  className="w-2.5 h-2.5 rounded-none inline-block"
                  style={{ backgroundColor: elData?.color_hex || '#35C6D9' }}
                />
                <span className="font-bold text-[#F4F4F4]">{el}</span>
                <span className="text-[#35C6D9]">{wt.toFixed(2)} wt%</span>
                <span className="text-[#666666]">({at.toFixed(2)} at%)</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Elemental Details Table */}
      <div className="p-4 bg-[#191919] border border-[#303030] space-y-3">
        <div className="border-b border-[#262626] pb-2">
          <span className="text-xs font-mono-sci font-bold uppercase tracking-wider text-[#F4F4F4]">
            STOICHIOMETRIC BREAKDOWN & ELEMENTAL PROVENANCE
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono-sci">
            <thead>
              <tr className="border-b border-[#262626] text-[#666666] text-[10px] uppercase">
                <th className="py-2 px-2">Element</th>
                <th className="py-2 px-2">Atomic Z</th>
                <th className="py-2 px-2">Atomic Mass</th>
                <th className="py-2 px-2">Weight Fraction</th>
                <th className="py-2 px-2">Atomic Fraction</th>
                <th className="py-2 px-2">Crystal Structure</th>
                <th className="py-2 px-2">Data Source</th>
                <th className="py-2 px-2">Provenance Category</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222222]">
              {sortedElements.map(([el, wt]) => {
                const at = material.composition_at[el] || 0;
                const elData = elements[el];
                return (
                  <tr key={el} className="hover:bg-[#1f1f1f] text-[#c9d1d9]">
                    <td className="py-2 px-2 font-bold text-[#F4F4F4] flex items-center gap-1.5">
                      <span
                        className="w-2 h-2"
                        style={{ backgroundColor: elData?.color_hex || '#35C6D9' }}
                      />
                      {elData?.name || el} ({el})
                    </td>
                    <td className="py-2 px-2">{elData?.z}</td>
                    <td className="py-2 px-2">{elData?.atomic_mass.toFixed(3)} g/mol</td>
                    <td className="py-2 px-2 text-[#35C6D9] font-bold">{wt.toFixed(2)} %</td>
                    <td className="py-2 px-2 text-[#F4F4F4]">{at.toFixed(2)} %</td>
                    <td className="py-2 px-2">{elData?.crystal_structure}</td>
                    <td className="py-2 px-2 text-[#888]">{elData?.provenance.source}</td>
                    <td className="py-2 px-2">
                      <ProvenanceBadge category={elData?.provenance.category || 'Experimental'} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Property Measurements & Provenance Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-[#191919] border border-[#303030] space-y-3">
          <div className="flex items-center justify-between border-b border-[#262626] pb-2">
            <span className="text-xs font-mono-sci font-bold uppercase tracking-wider text-[#F4F4F4]">
              FUNDAMENTAL PHYSICAL CHARACTERISTICS
            </span>
          </div>

          <div className="space-y-2.5 text-xs font-mono-sci">
            <div className="flex justify-between items-center p-2 bg-[#141414] border border-[#242424]">
              <div>
                <span className="text-[#888] block text-[10px]">THEORETICAL DENSITY</span>
                <span className="text-sm font-bold text-[#F4F4F4]">{material.density_g_cm3} g/cm³</span>
              </div>
              <ProvenanceBadge category="Physics-based calculation" />
            </div>

            <div className="flex justify-between items-center p-2 bg-[#141414] border border-[#242424]">
              <div>
                <span className="text-[#888] block text-[10px]">AVERAGE ATOMIC WEIGHT</span>
                <span className="text-sm font-bold text-[#F4F4F4]">{material.average_atomic_mass} g/mol</span>
              </div>
              <ProvenanceBadge category="Physics-based calculation" />
            </div>

            <div className="flex justify-between items-center p-2 bg-[#141414] border border-[#242424]">
              <div>
                <span className="text-[#888] block text-[10px]">DOMINANT EQUILIBRIUM PHASE</span>
                <span className="text-sm font-bold text-[#35C6D9]">{material.dominant_structure} LATTICE</span>
              </div>
              <ProvenanceBadge category="Published literature data" />
            </div>
          </div>
        </div>

        {/* Saved Simulation History */}
        <div className="p-4 bg-[#191919] border border-[#303030] space-y-3">
          <div className="flex items-center justify-between border-b border-[#262626] pb-2">
            <span className="text-xs font-mono-sci font-bold uppercase tracking-wider text-[#F4F4F4]">
              SAVED SIMULATION HISTORY ({history.length})
            </span>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {loadingHistory && (
              <div className="text-xs font-mono-sci text-[#666]">LOADING HISTORY...</div>
            )}

            {!loadingHistory && history.length === 0 && (
              <div className="p-4 border border-dashed border-[#262626] text-center text-xs font-mono-sci text-[#666]">
                NO LOGGED SIMULATIONS YET FOR THIS ALLOY. RUN SIMULATIONS IN THE LAB TO POPULATE.
              </div>
            )}

            {!loadingHistory &&
              history.map((sim) => (
                <div
                  key={sim.id}
                  className="p-2 bg-[#141414] border border-[#242424] text-xs font-mono-sci space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#35C6D9] uppercase">{sim.simulation_type}</span>
                    <span className="text-[10px] text-[#666]">{sim.created_at.slice(0, 19).replace('T', ' ')}</span>
                  </div>
                  <div className="text-[11px] text-[#929292]">{sim.model_name}</div>
                  <ProvenanceBadge category={sim.data_category} />
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};
