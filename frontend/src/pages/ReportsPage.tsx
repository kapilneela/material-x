import React, { useState } from 'react';
import { Material } from '../types';
import { api } from '../services/api';
import { ProvenanceBadge } from '../components/common/Badge';
import { FileDown, Eye, CheckCircle2, AlertCircle } from 'lucide-react';

interface ReportsPageProps {
  materials: Material[];
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ materials }) => {
  const [selectedMatId, setSelectedMatId] = useState<string>(
    materials.length > 0 ? materials[0].id : ''
  );
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedMaterial = materials.find((m) => m.id === selectedMatId) || materials[0];

  const handleLoadPreview = async (matId: string) => {
    setSelectedMatId(matId);
    setLoadingPreview(true);
    setError(null);
    try {
      const data = await api.getReportPreview(matId);
      setPreviewData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to preview report');
    } finally {
      setLoadingPreview(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-[#303030] pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-[11px] font-mono-sci uppercase tracking-widest text-[#35C6D9]">
            REPORTS & EXPORT // FORMAL DATASHEET GENERATOR
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[#F4F4F4] mt-0.5">
            Publication-Grade Material Technical Reports
          </h1>
          <p className="text-xs text-[#929292] mt-1 font-mono-sci">
            Compile stoichiometry, multi-physical simulation results, assumptions, and provenance into downloadable PDF documents.
          </p>
        </div>

        {selectedMaterial && (
          <a
            href={api.getReportDownloadUrl(selectedMaterial.id)}
            download
            className="px-4 py-2 bg-[#191919] hover:bg-[#222] border border-[#2ECC71] text-[#2ECC71] text-xs font-mono-sci font-bold flex items-center gap-2 cursor-pointer transition-colors"
          >
            <FileDown className="w-4 h-4" />
            DOWNLOAD {selectedMaterial.name.toUpperCase()} (PDF)
          </a>
        )}
      </div>

      {error && (
        <div className="p-3 bg-[#2c1d1d] border border-[#E74C3C] text-[#E74C3C] text-xs font-mono-sci flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Material Selection List & Interactive Report Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Materials List (4 cols) */}
        <div className="lg:col-span-4 p-4 bg-[#191919] border border-[#303030] space-y-3">
          <div className="border-b border-[#262626] pb-2">
            <span className="text-xs font-mono-sci font-bold uppercase tracking-wider text-[#F4F4F4]">
              SELECT REPOSITORY ALLOY
            </span>
          </div>

          <div className="space-y-2">
            {materials.map((mat) => {
              const isSelected = mat.id === selectedMatId;
              return (
                <div
                  key={mat.id}
                  className={`p-3 border text-xs font-mono-sci transition-all ${
                    isSelected
                      ? 'border-[#35C6D9] bg-[#1a2b2e]'
                      : 'border-[#262626] bg-[#141414] hover:border-[#383838]'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-[#F4F4F4] truncate w-40">{mat.name}</span>
                    <span className="text-[10px] text-[#35C6D9]">{mat.id}</span>
                  </div>

                  <div className="text-[11px] text-[#888] truncate mb-2">
                    {mat.category}
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-[#222]">
                    <button
                      onClick={() => handleLoadPreview(mat.id)}
                      className="px-2 py-1 bg-[#191919] border border-[#303030] hover:border-[#35C6D9] text-[10px] text-[#F4F4F4] flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3 h-3 text-[#35C6D9]" />
                      PREVIEW
                    </button>
                    <a
                      href={api.getReportDownloadUrl(mat.id)}
                      download
                      className="px-2 py-1 bg-[#191919] border border-[#2ECC71]/40 hover:border-[#2ECC71] text-[10px] text-[#2ECC71] flex items-center gap-1 cursor-pointer"
                    >
                      <FileDown className="w-3 h-3" />
                      GET PDF
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Technical Datasheet Document Preview (8 cols) */}
        <div className="lg:col-span-8 p-6 bg-[#141414] border border-[#303030] space-y-6">
          {loadingPreview && (
            <div className="p-12 text-center text-xs font-mono-sci text-[#35C6D9]">
              COMPILING TECHNICAL DATASHEET SPECIFICATIONS...
            </div>
          )}

          {!loadingPreview && selectedMaterial && (
            <div className="space-y-6">
              {/* Document Header Representation */}
              <div className="border-b-2 border-[#35C6D9] pb-4">
                <div className="text-[10px] font-mono-sci tracking-widest text-[#35C6D9] uppercase">
                  MATERIAL X // TECHNICAL RESEARCH DATASHEET
                </div>
                <h2 className="text-lg font-bold text-[#F4F4F4] mt-1 font-mono-sci uppercase">
                  {selectedMaterial.name}
                </h2>
                <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono-sci text-[#888] mt-1">
                  <span>IDENTIFIER: <strong className="text-[#F4F4F4]">{selectedMaterial.id}</strong></span>
                  <span>CATEGORY: <strong className="text-[#F4F4F4]">{selectedMaterial.category}</strong></span>
                  <span>BASE PHASE: <strong className="text-[#35C6D9]">{selectedMaterial.dominant_structure}</strong></span>
                  <span>THEORETICAL DENSITY: <strong className="text-[#F4F4F4]">{selectedMaterial.density_g_cm3} g/cm³</strong></span>
                </div>
              </div>

              {/* Section 1: Chemical Composition */}
              <div className="space-y-2">
                <span className="text-xs font-mono-sci font-bold uppercase tracking-wider text-[#F4F4F4] block border-b border-[#242424] pb-1">
                  1. STOICHIOMETRIC FORMULATION & MASS BALANCES
                </span>
                <table className="w-full text-left text-xs font-mono-sci">
                  <thead>
                    <tr className="border-b border-[#242424] text-[#666] text-[10px] uppercase">
                      <th className="py-1 px-2">Element</th>
                      <th className="py-1 px-2">Weight Fraction (wt%)</th>
                      <th className="py-1 px-2">Atomic Fraction (at%)</th>
                      <th className="py-1 px-2">Provenance Category</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e1e1e]">
                    {Object.entries(selectedMaterial.composition_wt).map(([el, wt]) => (
                      <tr key={el}>
                        <td className="py-1.5 px-2 font-bold text-[#F4F4F4]">{el}</td>
                        <td className="py-1.5 px-2 text-[#35C6D9]">{wt.toFixed(2)} %</td>
                        <td className="py-1.5 px-2 text-[#F4F4F4]">
                          {selectedMaterial.composition_at[el]?.toFixed(2)} %
                        </td>
                        <td className="py-1.5 px-2">
                          <ProvenanceBadge category="Experimental reference data" />
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-[#191919] font-bold">
                      <td className="py-1.5 px-2 text-[#F4F4F4]">TOTAL</td>
                      <td className="py-1.5 px-2 text-[#2ECC71]">100.00 %</td>
                      <td className="py-1.5 px-2 text-[#2ECC71]">100.00 %</td>
                      <td className="py-1.5 px-2 text-[10px] text-[#888]">Mass Conserved</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Section 2: Multi-Physical Simulation Results */}
              {previewData && previewData.simulations && (
                <div className="space-y-3">
                  <span className="text-xs font-mono-sci font-bold uppercase tracking-wider text-[#F4F4F4] block border-b border-[#242424] pb-1">
                    2. COMPUTED PHYSICAL & MECHANICAL PROPERTIES
                  </span>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono-sci">
                    <div className="p-2.5 bg-[#191919] border border-[#282828]">
                      <span className="text-[10px] text-[#888] block">YIELD STRENGTH</span>
                      <span className="text-base font-bold text-[#F4F4F4]">
                        {previewData.simulations.mechanical?.results.yield_strength_mpa} MPa
                      </span>
                      <span className="text-[9px] text-[#666] block">Labusch solid solution</span>
                    </div>

                    <div className="p-2.5 bg-[#191919] border border-[#282828]">
                      <span className="text-[10px] text-[#888] block">ELASTIC MODULUS</span>
                      <span className="text-base font-bold text-[#35C6D9]">
                        {previewData.simulations.mechanical?.results.elastic_modulus_gpa} GPa
                      </span>
                      <span className="text-[9px] text-[#666] block">Voigt-Reuss-Hill Hill avg</span>
                    </div>

                    <div className="p-2.5 bg-[#191919] border border-[#282828]">
                      <span className="text-[10px] text-[#888] block">THERMAL CONDUCTIVITY</span>
                      <span className="text-base font-bold text-[#F4F4F4]">
                        {previewData.simulations.thermal?.results.thermal_conductivity_w_mk} W/m·K
                      </span>
                      <span className="text-[9px] text-[#666] block">Phonon scattering corrected</span>
                    </div>

                    <div className="p-2.5 bg-[#191919] border border-[#282828]">
                      <span className="text-[10px] text-[#888] block">ELECTRICAL RESISTIVITY</span>
                      <span className="text-base font-bold text-[#F4F4F4]">
                        {previewData.simulations.electrical?.results.resistivity_nano_ohm_m} nΩ·m
                      </span>
                      <span className="text-[9px] text-[#666] block">Nordheim Matthiessen</span>
                    </div>

                    <div className="p-2.5 bg-[#191919] border border-[#282828]">
                      <span className="text-[10px] text-[#888] block">PITTING INDEX (PREN)</span>
                      <span className="text-base font-bold text-[#2ECC71]">
                        {previewData.simulations.corrosion?.results.pitting_resistance_equivalent_number_pren}
                      </span>
                      <span className="text-[9px] text-[#666] block">Cr + 3.3Mo + 1.65W</span>
                    </div>

                    <div className="p-2.5 bg-[#191919] border border-[#282828]">
                      <span className="text-[10px] text-[#888] block">CORROSION RATE</span>
                      <span className="text-base font-bold text-[#F4F4F4]">
                        {previewData.simulations.corrosion?.results.estimated_corrosion_rate_mm_year} mm/yr
                      </span>
                      <span className="text-[9px] text-[#666] block">Stern-Geary approximation</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Section 3: Scientific Assumptions & Disclaimers */}
              <div className="p-3.5 bg-[#191919] border border-[#282828] text-[11px] font-mono-sci text-[#888] space-y-2">
                <span className="text-[#F4F4F4] font-bold block uppercase">
                  3. SCIENTIFIC ASSUMPTIONS & DISCLOSURES
                </span>
                <p>
                  Calculated values are generated via MATERIAL X's continuum mechanics and physical metallurgy models.
                  Polycrystalline isotropy is assumed without grain boundary segregation or manufacturing voids.
                  Constitutive yield strength incorporates Labusch-Fleischer solid solution misfit scaling and Hall-Petch grain boundary hardening.
                </p>
                <p className="text-[10px] text-[#e07a5f]">
                  Real properties depend critically on processing history (cold working, quenching, tempering, precipitation aging).
                  Always validate exploratory alloys through certified ASTM tensile testing and electrochemical polarization.
                </p>
              </div>

              {/* PDF Download Trigger */}
              <div className="pt-2 flex justify-end">
                <a
                  href={api.getReportDownloadUrl(selectedMaterial.id)}
                  download
                  className="px-4 py-2 bg-[#191919] hover:bg-[#222] border border-[#2ECC71] text-[#2ECC71] text-xs font-mono-sci font-bold flex items-center gap-2 cursor-pointer"
                >
                  <FileDown className="w-4 h-4" />
                  DOWNLOAD FORMAL PDF REPORT
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
