import React from 'react';
import { Material } from '../../types';
import { Cpu, Database, Activity } from 'lucide-react';

interface NavbarProps {
  activeMaterial: Material | null;
  serverOnline: boolean;
  elementsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeMaterial,
  serverOnline,
  elementsCount,
}) => {
  return (
    <header className="h-14 bg-[#0B0B0B] border-b border-[#303030] px-5 flex items-center justify-between select-none z-30">
      <div className="flex items-center gap-4">
        <div className="flex items-baseline gap-2.5">
          <span className="font-mono-sci text-base font-bold tracking-widest text-[#F4F4F4]">
            MATERIAL<span className="text-[#35C6D9]">_X</span>
          </span>
          <span className="text-[10px] uppercase font-mono-sci tracking-wider text-[#929292] hidden sm:inline">
            // DESIGN &bull; SIMULATE &bull; DISCOVER
          </span>
        </div>
        <span className="h-4 w-px bg-[#303030]" />
        <span className="text-xs font-mono-sci text-[#929292] px-2 py-0.5 rounded border border-[#262626] bg-[#141414]">
          ENGINE V1.0.4-SCI
        </span>
      </div>

      <div className="flex items-center gap-5 text-xs font-mono-sci">
        {activeMaterial ? (
          <div className="hidden md:flex items-center gap-2 px-2.5 py-1 bg-[#191919] border border-[#303030] text-[#F4F4F4]">
            <span className="text-[#929292]">ACTIVE_MAT:</span>
            <span className="text-[#35C6D9] font-bold">{activeMaterial.name}</span>
            <span className="text-[#666666]">[{activeMaterial.id}]</span>
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-2 text-[#777777]">
            <span>NO ACTIVE MATERIAL SELECTED</span>
          </div>
        )}

        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-1.5 px-2 py-0.5 border border-[#222222] bg-[#141414] text-[11px]"
            title="Periodic Table Elements Loaded"
          >
            <Database className="w-3 h-3 text-[#35C6D9]" />
            <span className="text-[#929292]">{elementsCount} ELEMENTS</span>
          </div>

          <div
            className="flex items-center gap-1.5 px-2 py-0.5 border border-[#222222] bg-[#141414] text-[11px]"
            title="Computational Physics Kernel Status"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                serverOnline ? 'bg-[#2ECC71]' : 'bg-[#E74C3C]'
              }`}
            />
            <span className={serverOnline ? 'text-[#2ECC71]' : 'text-[#E74C3C]'}>
              {serverOnline ? 'KERNEL: ONLINE' : 'KERNEL: OFFLINE'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
