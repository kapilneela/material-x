import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Material, LatticeData, LatticeAtom } from '../types';
import { api } from '../services/api';
import { ProvenanceBadge } from '../components/common/Badge';
import { Box, RotateCw, ZoomIn, Info } from 'lucide-react';

interface AtomicExplorerProps {
  activeMaterial: Material | null;
}

export const AtomicExplorer: React.FC<AtomicExplorerProps> = ({ activeMaterial }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [latticeType, setLatticeType] = useState<string>('BCC');
  const [latticeData, setLatticeData] = useState<LatticeData | null>(null);
  const [selectedAtom, setSelectedAtom] = useState<LatticeAtom | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set default structure to dominant structure of active material if available
  useEffect(() => {
    if (activeMaterial?.dominant_structure) {
      setLatticeType(activeMaterial.dominant_structure);
    }
  }, [activeMaterial]);

  // Fetch lattice coordinates
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    api
      .getLatticeData({
        lattice_type: latticeType,
        material_id: activeMaterial?.id,
        composition_wt: activeMaterial?.composition_wt,
      })
      .then((data) => {
        if (isMounted) {
          setLatticeData(data);
          setSelectedAtom(data.atoms[0] || null);
        }
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'Failed to generate 3D crystal lattice');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [latticeType, activeMaterial]);

  // Three.js Render Scene
  useEffect(() => {
    if (!mountRef.current || !latticeData) return;

    const container = mountRef.current;
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 480;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0b0b);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 2. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight1.position.set(20, 30, 20);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x35c6d9, 0.4);
    dirLight2.position.set(-20, -10, -20);
    scene.add(dirLight2);

    // 3. Atom Mesh Group & Raycasting Targets
    const atomGroup = new THREE.Group();
    const atomMeshes: THREE.Mesh[] = [];

    // Sphere geometry shared
    const sphereGeo = new THREE.SphereGeometry(1, 24, 24);

    // Bounding Box to center the crystal
    const min = latticeData.unit_bounds.min;
    const max = latticeData.unit_bounds.max;
    const center = new THREE.Vector3(
      (min[0] + max[0]) / 2,
      (min[1] + max[1]) / 2,
      (min[2] + max[2]) / 2
    );

    latticeData.atoms.forEach((atom) => {
      // Scale radius for clear visualization
      const visualRadius = (atom.radius_pm / 140.0) * 0.45;

      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(atom.color || '#35C6D9'),
        roughness: 0.35,
        metalness: 0.7,
      });

      const mesh = new THREE.Mesh(sphereGeo, mat);
      mesh.scale.set(visualRadius, visualRadius, visualRadius);
      mesh.position.set(atom.x - center.x, atom.y - center.y, atom.z - center.z);
      mesh.userData = { atomData: atom };

      atomGroup.add(mesh);
      atomMeshes.push(mesh);
    });

    // 4. Unit Cell Bounding Wireframe
    const boxSize = new THREE.Vector3(max[0] - min[0], max[1] - min[1], max[2] - min[2]);
    const boxGeo = new THREE.BoxGeometry(boxSize.x, boxSize.y, boxSize.z);
    const wireGeo = new THREE.WireframeGeometry(boxGeo);
    const wireMat = new THREE.LineBasicMaterial({ color: 0x303030, linewidth: 1 });
    const wireframe = new THREE.LineSegments(wireGeo, wireMat);
    atomGroup.add(wireframe);

    scene.add(atomGroup);

    // Position Camera
    const maxDim = Math.max(boxSize.x, boxSize.y, boxSize.z);
    camera.position.set(maxDim * 1.8, maxDim * 1.5, maxDim * 2.2);
    camera.lookAt(0, 0, 0);

    // 5. Interactive Orbit & Drag Handlers
    let isDragging = false;
    let prevMousePos = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMousePos.x;
      const deltaY = e.clientY - prevMousePos.y;

      atomGroup.rotation.y += deltaX * 0.008;
      atomGroup.rotation.x += deltaY * 0.008;

      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY * 0.002;
      camera.position.multiplyScalar(1 + zoomFactor);
    };

    // 6. Raycasting on Click
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onClick = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(atomMeshes);

      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        if (hit.userData?.atomData) {
          setSelectedAtom(hit.userData.atomData);
        }
      }
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('wheel', onWheel, { passive: false });
    container.addEventListener('click', onClick);

    // Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      // Gentle auto-rotation when idle
      if (!isDragging) {
        atomGroup.rotation.y += 0.0015;
      }
      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('click', onClick);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      sphereGeo.dispose();
    };
  }, [latticeData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-[#303030] pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-[11px] font-mono-sci uppercase tracking-widest text-[#35C6D9]">
            ATOMIC EXPLORER // 3D CRYSTALLOGRAPHY
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[#F4F4F4] mt-0.5">
            Interactive Crystal Lattice & Unit Cell Inspector
          </h1>
          <p className="text-xs text-[#929292] mt-1 font-mono-sci">
            Inspect Bravais lattices (BCC, FCC, HCP), coordination shells, and Vegard's law solid-solution site occupancy.
          </p>
        </div>

        {/* Structure Presets */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono-sci text-[#929292]">LATTICE PRESET:</span>
          <div className="flex border border-[#303030] bg-[#141414] p-0.5">
            {['BCC', 'FCC', 'HCP'].map((type) => (
              <button
                key={type}
                onClick={() => setLatticeType(type)}
                className={`px-3 py-1 text-xs font-mono-sci font-bold transition-all cursor-pointer ${
                  latticeType === type
                    ? 'bg-[#35C6D9] text-[#0B0B0B]'
                    : 'text-[#929292] hover:text-[#F4F4F4]'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-[#2c1d1d] border border-[#E74C3C] text-[#E74C3C] text-xs font-mono-sci">
          {error}
        </div>
      )}

      {/* Main 3D Canvas & Technical Inspector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 3D Viewport (8 cols) */}
        <div className="lg:col-span-8 bg-[#141414] border border-[#303030] relative flex flex-col">
          {/* Viewport Top Bar */}
          <div className="p-3 border-b border-[#242424] flex items-center justify-between text-xs font-mono-sci z-10 bg-[#141414]">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#F4F4F4]">{latticeType} SUPERCELL (2x2x2)</span>
              <span className="text-[#666]">&bull;</span>
              <span className="text-[#35C6D9]">
                {activeMaterial ? activeMaterial.name : 'Pure Baseline'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-[#888]">
              <span>[DRAG TO ROTATE &bull; SCROLL TO ZOOM &bull; CLICK TO INSPECT]</span>
            </div>
          </div>

          {/* Three.js Canvas Container */}
          <div
            ref={mountRef}
            className="w-full h-[460px] cursor-grab active:cursor-grabbing relative overflow-hidden"
          >
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#0B0B0B]/80 z-20 text-xs font-mono-sci text-[#35C6D9]">
                GENERATING 3D ATOMIC COORDINATES...
              </div>
            )}
          </div>

          {/* Viewport Footer Notice */}
          <div className="p-2 border-t border-[#242424] bg-[#0B0B0B] text-[10px] font-mono-sci text-[#666] flex justify-between items-center">
            <span>CLASSIFICATION: EDUCATIONAL LATTICE VISUALIZATION</span>
            <span>UNITS: ANGSTROMS (Å)</span>
          </div>
        </div>

        {/* Right: Crystallographic Parameters & Atom Inspector (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Crystallographic Metrics */}
          {latticeData && (
            <div className="p-4 bg-[#191919] border border-[#303030] space-y-3">
              <div className="border-b border-[#262626] pb-2">
                <span className="text-xs font-mono-sci font-bold uppercase tracking-wider text-[#F4F4F4]">
                  LATTICE CHARACTERISTICS
                </span>
              </div>

              <div className="space-y-2.5 text-xs font-mono-sci">
                <div className="flex justify-between items-center p-2 bg-[#141414] border border-[#242424]">
                  <span className="text-[#888]">LATTICE PARAMETER (a):</span>
                  <span className="font-bold text-[#F4F4F4]">
                    {latticeData.parameters.lattice_constant_a_angstrom} Å
                  </span>
                </div>

                {latticeData.parameters.lattice_constant_c_angstrom && (
                  <div className="flex justify-between items-center p-2 bg-[#141414] border border-[#242424]">
                    <span className="text-[#888]">LATTICE PARAMETER (c):</span>
                    <span className="font-bold text-[#F4F4F4]">
                      {latticeData.parameters.lattice_constant_c_angstrom} Å (c/a={latticeData.parameters.c_over_a_ratio})
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center p-2 bg-[#141414] border border-[#242424]">
                  <span className="text-[#888]">COORDINATION NUMBER:</span>
                  <span className="font-bold text-[#35C6D9]">
                    {latticeData.parameters.coordination_number} nearest neighbors
                  </span>
                </div>

                <div className="flex justify-between items-center p-2 bg-[#141414] border border-[#242424]">
                  <span className="text-[#888]">ATOMIC PACKING FACTOR:</span>
                  <span className="font-bold text-[#2ECC71]">
                    {(latticeData.parameters.atomic_packing_factor * 100).toFixed(1)} %
                  </span>
                </div>

                <div className="flex justify-between items-center p-2 bg-[#141414] border border-[#242424]">
                  <span className="text-[#888]">NEAREST NEIGHBOR (d):</span>
                  <span className="font-bold text-[#F4F4F4]">
                    {latticeData.parameters.nearest_neighbor_distance_angstrom} Å
                  </span>
                </div>

                <div className="flex justify-between items-center p-2 bg-[#141414] border border-[#242424]">
                  <span className="text-[#888]">RENDERED ATOMS:</span>
                  <span className="font-bold text-[#929292]">
                    {latticeData.parameters.total_atoms_rendered} sites
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Selected Atom Inspector */}
          <div className="p-4 bg-[#191919] border border-[#303030] space-y-3">
            <div className="border-b border-[#262626] pb-2">
              <span className="text-xs font-mono-sci font-bold uppercase tracking-wider text-[#F4F4F4]">
                SELECTED ATOMIC SITE
              </span>
            </div>

            {selectedAtom ? (
              <div className="space-y-2 text-xs font-mono-sci">
                <div className="flex items-center gap-3 p-2 bg-[#141414] border border-[#242424]">
                  <span
                    className="w-8 h-8 flex items-center justify-center font-bold text-sm font-mono-sci border"
                    style={{
                      borderColor: selectedAtom.color,
                      color: selectedAtom.color,
                      backgroundColor: '#191919',
                    }}
                  >
                    {selectedAtom.element}
                  </span>
                  <div>
                    <div className="font-bold text-[#F4F4F4]">{selectedAtom.element} ATOM</div>
                    <div className="text-[10px] text-[#666]">
                      Radius: {selectedAtom.radius_pm} pm &bull; Site: {selectedAtom.site_type}
                    </div>
                  </div>
                </div>

                <div className="p-2.5 bg-[#141414] border border-[#242424] space-y-1">
                  <span className="text-[10px] text-[#888] block uppercase">
                    SPATIAL CARTESIAN COORDINATES (Å):
                  </span>
                  <div className="grid grid-cols-3 gap-1 font-bold text-[#c9d1d9] text-center pt-1">
                    <div className="bg-[#191919] p-1 border border-[#282828]">
                      <span className="text-[9px] text-[#666] block">X</span>
                      {selectedAtom.x.toFixed(3)}
                    </div>
                    <div className="bg-[#191919] p-1 border border-[#282828]">
                      <span className="text-[9px] text-[#666] block">Y</span>
                      {selectedAtom.y.toFixed(3)}
                    </div>
                    <div className="bg-[#191919] p-1 border border-[#282828]">
                      <span className="text-[9px] text-[#666] block">Z</span>
                      {selectedAtom.z.toFixed(3)}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 border border-dashed border-[#262626] text-center text-xs font-mono-sci text-[#666]">
                CLICK ANY ATOM SPHERE IN THE 3D CANVAS TO INSPECT COORDINATES.
              </div>
            )}
          </div>

          {/* Model Disclaimer */}
          {latticeData && (
            <div className="p-3 bg-[#141414] border border-[#262626] text-[10px] font-mono-sci text-[#777] space-y-1">
              <span className="text-[#F4F4F4] font-bold block">SCIENTIFIC STRUCTURE NOTICE:</span>
              <p>{latticeData.scientific_disclaimer}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
