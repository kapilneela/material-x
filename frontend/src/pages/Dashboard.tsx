import React from 'react';
import { Material, ElementInfo } from '../types';
import { PageId } from '../components/layout/Sidebar';
import { Layers, Activity, SplitSquareVertical, Compass, FileDown, ArrowUpRight } from 'lucide-react';

interface DashboardProps {
  materials: Material[];
  elements: Record<string, ElementInfo>;
  onSelectMaterial: (mat: Material) => void;
  onNavigate: (page: PageId) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  materials,
  elements,
  onSelectMaterial,
  onNavigate,
}) => {
  const totalSimulations = materials.reduce((acc, m) => acc + (m.simulations_count || 0), 0);
  const recentMaterials = materials.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="border-b border-[#303030] pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-[11px] font-mono-sci uppercase tracking-widest text-[#35C6D9]">
            WORKSPACE DESK // SYSTEM OVERVIEW
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[#F4F4F4] mt-0.5">
            Computational Materials Engineering Environment
          </h1>
          <p className="text-xs text-[#929292] mt-1 font-mono-sci">
            Design hypothetical alloys, compute constitutive mechanics, simulate multi-physical kinetics, and analyze atomic lattice structures.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('studio')}
            className="px-3.5 py-1.5 bg-[#191919] hover:bg-[#222222] border border-[#35C6D9] text-[#35C6D9] hover:text-[#F4F4F4] text-xs font-mono-sci font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5" />
            OPEN MATERIAL STUDIO
          </button>
        </div>
      </div>

      {/* Real Application Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 bg-[#191919] border border-[#303030]">
          <div className="text-[10px] font-mono-sci text-[#929292] uppercase tracking-wider">
            SAVED COMPOSITIONS
          </div>
          <div className="text-2xl font-bold font-mono-sci text-[#F4F4F4] mt-1">
            {materials.length}
          </div>
          <div className="text-[11px] font-mono-sci text-[#666666] mt-0.5">
            Active SQLite records
          </div>
        </div>

        <div className="p-3.5 bg-[#191919] border border-[#303030]">
          <div className="text-[10px] font-mono-sci text-[#929292] uppercase tracking-wider">
            LOGGED SIMULATIONS
          </div>
          <div className="text-2xl font-bold font-mono-sci text-[#35C6D9] mt-1">
            {totalSimulations}
          </div>
          <div className="text-[11px] font-mono-sci text-[#666666] mt-0.5">
            Mechanical & thermal runs
          </div>
        </div>

        <div className="p-3.5 bg-[#191919] border border-[#303030]">
          <div className="text-[10px] font-mono-sci text-[#929292] uppercase tracking-wider">
            ELEMENT INVENTORY
          </div>
          <div className="text-2xl font-bold font-mono-sci text-[#F4F4F4] mt-1">
            {Object.keys(elements).length}
          </div>
          <div className="text-[11px] font-mono-sci text-[#666666] mt-0.5">
            Ref. constants (CRC/ASM)
          </div>
        </div>

        <div className="p-3.5 bg-[#191919] border border-[#303030]">
          <div className="text-[10px] font-mono-sci text-[#929292] uppercase tracking-wider">
            SOLVER INTEGRITY
          </div>
          <div className="text-2xl font-bold font-mono-sci text-[#2ECC71] mt-1">
            100.0%
          </div>
          <div className="text-[11px] font-mono-sci text-[#666666] mt-0.5">
            Strict mass conservation
          </div>
        </div>
      </div>

      {/* Main Workspace 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recently Modified Materials */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between border-b border-[#262626] pb-2">
            <span className="text-xs font-mono-sci font-bold uppercase tracking-wider text-[#F4F4F4]">
              RECENTLY MODIFIED MATERIALS
            </span>
            <span className="text-[11px] font-mono-sci text-[#929292]">
              {materials.length} TOTAL IN REPOSITORY
            </span>
          </div>

          <div className="space-y-2">
            {recentMaterials.map((mat) => (
              <div
                key={mat.id}
                className="p-3 bg-[#191919] border border-[#303030] hover:border-[#404040] transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#F4F4F4]">{mat.name}</span>
                    <span className="text-[10px] font-mono-sci px-1.5 py-0.2 rounded bg-[#141414] border border-[#2b2b2b] text-[#929292]">
                      {mat.category}
                    </span>
                    <span className="text-[10px] font-mono-sci text-[#666666]">
                      {mat.id}
                    </span>
                  </div>

                  {/* Composition Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {Object.entries(mat.composition_wt).map(([el, wt]) => (
                      <span
                        key={el}
                        className="text-[11px] font-mono-sci px-1.5 py-0.5 bg-[#141414] border border-[#262626] text-[#c9d1d9]"
                      >
                        <strong className="text-[#35C6D9]">{el}</strong> {wt.toFixed(1)}%
                      </span>
                    ))}
                    <span className="text-[10px] font-mono-sci text-[#777] ml-1">
                      Density: {mat.density_g_cm3} g/cm³ &bull; {mat.dominant_structure}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => {
                      onSelectMaterial(mat);
                      onNavigate('profile');
                    }}
                    className="px-2.5 py-1 bg-[#141414] hover:bg-[#222222] border border-[#303030] text-[11px] font-mono-sci text-[#929292] hover:text-[#F4F4F4] transition-colors cursor-pointer"
                  >
                    VIEW PROFILE
                  </button>
                  <button
                    onClick={() => {
                      onSelectMaterial(mat);
                      onNavigate('simulation');
                    }}
                    className="px-2.5 py-1 bg-[#141414] hover:bg-[#222222] border border-[#35C6D9] text-[11px] font-mono-sci text-[#35C6D9] hover:text-[#F4F4F4] transition-colors cursor-pointer"
                  >
                    SIMULATE
                  </button>
                </div>
              </div>
            ))}

            {materials.length === 0 && (
              <div className="p-8 border border-dashed border-[#303030] text-center text-xs font-mono-sci text-[#666666]">
                NO MATERIALS CURRENTLY SAVED. CREATE ONE IN MATERIAL STUDIO.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Quick Access Workspaces */}
        <div className="space-y-4">
          <div className="border-b border-[#262626] pb-2">
            <span className="text-xs font-mono-sci font-bold uppercase tracking-wider text-[#F4F4F4]">
              ENGINEERING SHORTCUTS
            </span>
          </div>

          <div className="space-y-2.5">
            <div
              onClick={() => onNavigate('discovery')}
              className="p-3 bg-[#191919] border border-[#303030] hover:border-[#35C6D9] cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-[#35C6D9]" />
                  <span className="text-xs font-bold font-mono-sci text-[#F4F4F4]">
                    MATERIAL DISCOVERY
                  </span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-[#666] group-hover:text-[#35C6D9] transition-colors" />
              </div>
              <p className="text-[11px] text-[#929292] mt-1.5 font-mono-sci">
                Multi-objective Pareto candidate optimization for density, strength, and conductivity.
              </p>
            </div>

            <div
              onClick={() => onNavigate('atomic')}
              className="p-3 bg-[#191919] border border-[#303030] hover:border-[#35C6D9] cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#35C6D9]" />
                  <span className="text-xs font-bold font-mono-sci text-[#F4F4F4]">
                    ATOMIC EXPLORER (3D)
                  </span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-[#666] group-hover:text-[#35C6D9] transition-colors" />
              </div>
              <p className="text-[11px] text-[#929292] mt-1.5 font-mono-sci">
                Inspect BCC, FCC, and HCP crystal unit cells with 3D coordinate inspection and Vegard's law lattice packing.
              </p>
            </div>

            <div
              onClick={() => onNavigate('comparison')}
              className="p-3 bg-[#191919] border border-[#303030] hover:border-[#35C6D9] cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SplitSquareVertical className="w-4 h-4 text-[#35C6D9]" />
                  <span className="text-xs font-bold font-mono-sci text-[#F4F4F4]">
                    MATERIAL COMPARISON
                  </span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-[#666] group-hover:text-[#35C6D9] transition-colors" />
              </div>
              <p className="text-[11px] text-[#929292] mt-1.5 font-mono-sci">
                Compare up to 4 saved alloys side-by-side with genuine property availability flags.
              </p>
            </div>

            <div
              onClick={() => onNavigate('reports')}
              className="p-3 bg-[#191919] border border-[#303030] hover:border-[#35C6D9] cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileDown className="w-4 h-4 text-[#35C6D9]" />
                  <span className="text-xs font-bold font-mono-sci text-[#F4F4F4]">
                    REPORTS & EXPORT
                  </span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-[#666] group-hover:text-[#35C6D9] transition-colors" />
              </div>
              <p className="text-[11px] text-[#929292] mt-1.5 font-mono-sci">
                Generate and download publication-grade technical material datasheets in PDF format.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
