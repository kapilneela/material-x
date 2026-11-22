import React, { useState, useEffect } from 'react';
import { Material, ElementInfo } from './types';
import { api } from './services/api';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, PageId } from './components/layout/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { MaterialStudio } from './pages/MaterialStudio';
import { MaterialProfile } from './pages/MaterialProfile';
import { SimulationLab } from './pages/SimulationLab';
import { AtomicExplorer } from './pages/AtomicExplorer';
import { MaterialComparison } from './pages/MaterialComparison';
import { DiscoveryWorkspace } from './pages/DiscoveryWorkspace';
import { ReportsPage } from './pages/ReportsPage';

export function App() {
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [materials, setMaterials] = useState<Material[]>([]);
  const [activeMaterial, setActiveMaterial] = useState<Material | null>(null);
  const [elements, setElements] = useState<Record<string, ElementInfo>>({});
  const [serverOnline, setServerOnline] = useState<boolean>(true);
  const [loadingInitial, setLoadingInitial] = useState<boolean>(true);

  // Initial load
  const loadData = async () => {
    try {
      const [els, mats] = await Promise.all([
        api.getElements(),
        api.getMaterials(),
      ]);
      setElements(els);
      setMaterials(mats);
      if (mats.length > 0 && !activeMaterial) {
        setActiveMaterial(mats[0]);
      }
      setServerOnline(true);
    } catch (err) {
      console.error('Initialization error:', err);
      setServerOnline(false);
    } finally {
      setLoadingInitial(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/health');
        setServerOnline(res.ok);
      } catch {
        setServerOnline(false);
      }
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleMaterialSaved = (saved: Material) => {
    setActiveMaterial(saved);
    api.getMaterials().then(setMaterials).catch(console.error);
  };

  const handleSelectMaterial = (mat: Material) => {
    setActiveMaterial(mat);
  };

  const handleImportToStudio = (composition: Record<string, number>, name: string) => {
    // Create temporary material representation for Studio
    const tempMat: Material = {
      id: 'DRAFT-OPTIMIZED',
      name,
      category: 'Optimized Candidate',
      base_element: Object.keys(composition)[0],
      dominant_structure: 'BCC',
      density_g_cm3: 0,
      average_atomic_mass: 0,
      composition_wt: composition,
      composition_at: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setActiveMaterial(tempMat);
    setCurrentPage('studio');
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-[#F4F4F4] flex flex-col font-sans">
      <Navbar
        activeMaterial={activeMaterial}
        serverOnline={serverOnline}
        elementsCount={Object.keys(elements).length}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          currentPage={currentPage}
          onSelectPage={setCurrentPage}
          savedMaterialsCount={materials.length}
        />

        <main className="flex-1 overflow-y-auto p-6 bg-[#0B0B0B]">
          {loadingInitial ? (
            <div className="h-full flex items-center justify-center text-xs font-mono-sci text-[#35C6D9]">
              INITIALIZING SCIENTIFIC ENVIRONMENT...
            </div>
          ) : (
            <>
              {currentPage === 'dashboard' && (
                <Dashboard
                  materials={materials}
                  elements={elements}
                  onSelectMaterial={handleSelectMaterial}
                  onNavigate={setCurrentPage}
                />
              )}

              {currentPage === 'studio' && (
                <MaterialStudio
                  elements={elements}
                  activeMaterial={activeMaterial}
                  onMaterialSaved={handleMaterialSaved}
                  onNavigateToSim={(mat) => {
                    setActiveMaterial(mat);
                    setCurrentPage('simulation');
                  }}
                />
              )}

              {currentPage === 'profile' && (
                <MaterialProfile
                  material={activeMaterial}
                  elements={elements}
                  onNavigate={setCurrentPage}
                  onEditInStudio={(mat) => {
                    setActiveMaterial(mat);
                    setCurrentPage('studio');
                  }}
                />
              )}

              {currentPage === 'simulation' && (
                <SimulationLab
                  materials={materials}
                  selectedMaterial={activeMaterial}
                  onSelectMaterial={handleSelectMaterial}
                />
              )}

              {currentPage === 'atomic' && (
                <AtomicExplorer activeMaterial={activeMaterial} />
              )}

              {currentPage === 'comparison' && (
                <MaterialComparison materials={materials} />
              )}

              {currentPage === 'discovery' && (
                <DiscoveryWorkspace
                  elements={elements}
                  onImportToStudio={handleImportToStudio}
                  onNavigate={setCurrentPage}
                />
              )}

              {currentPage === 'reports' && (
                <ReportsPage materials={materials} />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
