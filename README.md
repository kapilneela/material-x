# MATERIAL X
> **Design. Simulate. Discover.**  
> A computational materials design, simulation, and discovery environment for metallurgical engineering.

---

## 1. System Overview

**MATERIAL X** is a scientific engineering platform for designing hypothetical alloys, predicting multi-physical behavior under real-world operating conditions, and analyzing crystallographic structures.

### Visual Design System
- **Primary Background**: `#0B0B0B`
- **Secondary Background**: `#141414`
- **Card Background**: `#191919`
- **Primary Text**: `#F4F4F4`
- **Secondary Text**: `#929292`
- **Borders**: `#303030`
- **Accent**: Restrained Electric Cyan `#35C6D9`
- **Typography**: Inter / Geist for interface prose; JetBrains Mono / IBM Plex Mono for formulas, numeric measurements, identifiers, and simulation outputs.
- **Strict Scientific Integrity**: No decorative AI blobs, no fake statistics, no fabricated experimental data. Every value is marked with its exact data provenance category.

---

## 2. Platform Architecture

```
material-x/
│
├── frontend/                     # React 19 + TypeScript + Vite + Tailwind CSS + Three.js
│   ├── src/
│   │   ├── components/           # Navigation, ScientificChart (SVG), ProvenanceBadge
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx     # Workspace overview & metrics
│   │   │   ├── MaterialStudio.tsx # Stoichiometry editor & periodic selector
│   │   │   ├── MaterialProfile.tsx# Detailed alloy profile & provenance matrix
│   │   │   ├── SimulationLab.tsx # 4 Multi-physical numerical simulation engines
│   │   │   ├── AtomicExplorer.tsx# Real interactive 3D crystal lattice visualizer
│   │   │   ├── MaterialComparison.tsx # Side-by-side up to 4 materials
│   │   │   ├── DiscoveryWorkspace.tsx # Multi-objective Pareto candidate ranking
│   │   │   └── ReportsPage.tsx   # Formal PDF datasheet preview and download
│   │   ├── services/api.ts       # Unified REST API client
│   │   └── types/index.ts        # Crystallographic & simulation TypeScript interfaces
│   └── package.json
│
├── backend/                      # Python FastAPI + SQLAlchemy + NumPy + SciPy + ReportLab
│   ├── app/
│   │   ├── api/                  # REST routes (/materials, /simulations, /discovery, /reports)
│   │   ├── database/             # SQLite database engine, models, and migrations
│   │   ├── schemas/              # Pydantic validation schemas
│   │   ├── services/             # CRUD service & ReportLab PDF generator
│   │   └── simulations/          # Scientific calculation modules:
│   │       ├── elements_data.py  # 15 Authoritative reference elements (CRC / ASM)
│   │       ├── composition_utils.py # wt% <-> at% conversions & 100% mass balance
│   │       ├── mechanical.py     # Voigt-Reuss-Hill + Labusch + Ramberg-Osgood
│   │       ├── thermal.py        # 1D FTCS Fourier conduction & Neumann-Kopp
│   │       ├── electrical.py     # Matthiessen-Nordheim & reciprocal conductivity
│   │       ├── corrosion.py      # PREN, Pourbaix nobility, Stern-Geary kinetics
│   │       ├── atomic_structure.py# Vegard's law 3D coordinates for BCC, FCC, HCP
│   │       └── discovery.py      # Multi-objective Pareto candidate optimization
│   └── requirements.txt
│
└── data/
    └── material_x.db             # Persistent SQLite database
```

---

## 3. Scientific Calculation Models

### Data Provenance Categories
MATERIAL X explicitly distinguishes between four data tiers for every metric:
1. **Experimental reference data**: CRC Handbook of Chemistry & Physics, ASM International Handbooks.
2. **Published literature data**: Peer-reviewed empirical metallurgical correlations.
3. **Physics-based calculations**: Continuum thermodynamic and mechanical models (Voigt-Reuss-Hill, Neumann-Kopp, Fourier conduction, Matthiessen-Nordheim).
4. **Educational approximations**: Solid solution hardening estimates, Arrhenius environmental corrosion rates.

### Mathematical Foundations
- **Stoichiometric Conversion**:
  $$at\%_i = \frac{w_i / M_i}{\sum_j w_j / M_j} \times 100, \quad wt\%_i = \frac{x_i M_i}{\sum_j x_j M_j} \times 100$$
  *Never silently normalized. Sum must equal exactly 100.00% within 0.05% floating tolerance.*

- **Elastic Modulus (Young's E)**: Hill average of Voigt (iso-strain) and Reuss (iso-stress) bounds:
  $$E_{Hill} = \frac{1}{2}\left(\sum_i w_i E_i + \left[\sum_i \frac{w_i}{E_i}\right]^{-1}\right)$$

- **Solid-Solution Strengthening (Labusch-Fleischer Model)**:
  $$\Delta \sigma_{ss} = \sum_i G \cdot \left(\frac{|r_i - r_{base}|}{r_{base}}\right)^{4/3} c_i^{2/3}$$

- **1D Transient Heat Conduction**: Explicit forward-time central-space (FTCS) finite-difference solver:
  $$\frac{\partial T}{\partial t} = \alpha_d \frac{\partial^2 T}{\partial x^2}, \quad \alpha_d = \frac{k_{eff}}{\rho c_p}$$

- **Reciprocal Electrical Conduction**:
  $$\text{Resistivity } \rho(T) = \rho_0 [1 + \alpha_R(T - T_0)], \quad \text{Conductivity } \sigma = \frac{1}{\rho}$$

- **Pitting Resistance Equivalent Number (PREN)**:
  $$\text{PREN} = \%Cr + 3.3\%Mo + 1.65\%W$$

---

## 4. How to Run Locally

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Start the Backend Server
```bash
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
The FastAPI backend starts at `http://127.0.0.1:8000`.  
Swagger API documentation: `http://127.0.0.1:8000/docs`.

### 2. Start the Frontend Application
```bash
cd frontend
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## 5. Available Features

1. **Workspace Dashboard**: Real-time inventory of saved alloys, active simulations, and engineering shortcuts.
2. **Material Studio**: Composition editor with periodic table selector for 15 metallic elements (Fe, Cr, Ni, C, Al, Cu, Ti, Zn, Mg, Mo, Mn, Si, Co, W, V). Supports wt% and at% conversion and strict 100% mass validation.
3. **Material Profile**: Stoichiometric breakdown, mass fraction horizontal distribution chart, provenance badges, and historical simulation logs.
4. **Simulation Lab**:
   - Mechanical solver with stress-strain constitutive curves.
   - Thermal solver with 1D transient conduction spatial profiles.
   - Electrical solver with temperature sweep and Joule dissipation.
   - Corrosion solver with pH sensitivity curves and PREN ratings.
5. **Atomic Explorer (3D)**: Interactive Three.js crystallographic visualizer for BCC, FCC, and HCP crystal structures with atom selection and coordinate inspection in Ångströms.
6. **Material Comparison**: Multi-material side-by-side comparison for up to 4 alloys with genuine availability flags.
7. **Discovery Workspace**: Multi-objective Pareto candidate optimization for lightweighting, strength, and conductivity.
8. **Reports**: Instant downloadable formal PDF datasheets generated dynamically via ReportLab.
