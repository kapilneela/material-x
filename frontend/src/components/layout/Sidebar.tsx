import React from 'react';
import {
  LayoutDashboard,
  Layers,
  FileSpreadsheet,
  Activity,
  Box,
  SplitSquareVertical,
  Compass,
  FileDown,
} from 'lucide-react';

export type PageId =
  | 'dashboard'
  | 'studio'
  | 'profile'
  | 'simulation'
  | 'atomic'
  | 'comparison'
  | 'discovery'
  | 'reports';

interface SidebarProps {
  currentPage: PageId;
  onSelectPage: (page: PageId) => void;
  savedMaterialsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onSelectPage,
  savedMaterialsCount,
}) => {
  const navItems = [
    {
      id: 'dashboard' as PageId,
      label: 'Workspace Dashboard',
      shortLabel: 'Dashboard',
      icon: LayoutDashboard,
      code: '01',
    },
    {
      id: 'studio' as PageId,
      label: 'Material Studio',
      shortLabel: 'Studio',
      icon: Layers,
      code: '02',
    },
    {
      id: 'profile' as PageId,
      label: 'Material Profile',
      shortLabel: 'Profile',
      icon: FileSpreadsheet,
      code: '03',
    },
    {
      id: 'simulation' as PageId,
      label: 'Simulation Lab',
      shortLabel: 'Sim Lab',
      icon: Activity,
      code: '04',
    },
    {
      id: 'atomic' as PageId,
      label: 'Atomic Explorer (3D)',
      shortLabel: 'Atomic 3D',
      icon: Box,
      code: '05',
    },
    {
      id: 'comparison' as PageId,
      label: 'Material Comparison',
      shortLabel: 'Compare',
      icon: SplitSquareVertical,
      code: '06',
    },
    {
      id: 'discovery' as PageId,
      label: 'Discovery Workspace',
      shortLabel: 'Discovery',
      icon: Compass,
      code: '07',
    },
    {
      id: 'reports' as PageId,
      label: 'Reports & Export',
      shortLabel: 'Reports',
      icon: FileDown,
      code: '08',
    },
  ];

  return (
    <aside className="w-64 bg-[#141414] border-r border-[#303030] flex flex-col justify-between select-none">
      <div className="p-3">
        <div className="px-3 py-2 text-[10px] font-mono-sci font-bold uppercase tracking-widest text-[#666666]">
          PLATFORM MODULES
        </div>
        <nav className="space-y-1 mt-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectPage(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-mono-sci transition-all text-left ${
                  isActive
                    ? 'bg-[#191919] text-[#F4F4F4] border-l-2 border-[#35C6D9] font-bold shadow-sm'
                    : 'text-[#929292] hover:bg-[#191919] hover:text-[#F4F4F4] border-l-2 border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-[#35C6D9]' : 'text-[#666666]'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                <span className="text-[10px] text-[#555555] font-mono-sci">
                  {item.code}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-[#262626] bg-[#0B0B0B]">
        <div className="text-[11px] font-mono-sci text-[#929292] space-y-1">
          <div className="flex justify-between">
            <span className="text-[#666666]">DATABASE:</span>
            <span className="text-[#F4F4F4]">{savedMaterialsCount} SAVED ALLOYS</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#666666]">SOLVER:</span>
            <span className="text-[#35C6D9]">NUMPY / SCIPY</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#666666]">PROVENANCE:</span>
            <span className="text-[#2ECC71]">VERIFIED</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
