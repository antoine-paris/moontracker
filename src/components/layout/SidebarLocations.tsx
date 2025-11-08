import React, { Suspense, useEffect, useMemo, useRef, useState, useLayoutEffect } from 'react';
import appLogo from '../../assets/applogos/android-chrome-192x192.png';
// import earthModel from '../../assets/Earth_1_12756.glb'; // removed: GLB is not a TS module
import type { LocationOption } from '../../data/locations';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
// + astro helpers to derive Sun direction at UTC
import { getSunAndMoonAltAzDeg } from '../../astro/aeInterop';
import { lstDeg } from '../../astro/time';
import { altazToRaDec } from '../../astro/coords';
import SidebarLocationsCities from './SidebarLocationsCities';
import SidebarLocationsCoord from './SidebarLocationsCoord';

// Increase sun light intensity here
const SUN_LIGHT_INTENSITY = 10.0;
//  viewer light intensity (fill light from camera position)
const VIEWER_LIGHT_INTENSITY = 3.0;

// Location marker parameters
const LOCATION_MARKER_DISTANCE = 0.57; // Distance from Earth surface as fraction of radius (100% = close, 50% = 50% away)

// Fix base GLB orientation (degrees)
const MODEL_ROT_FIX_X_DEG = 0;
const MODEL_ROT_FIX_Y_DEG = 180; // flip 180° so Lng 0/180 face correctly
const MODEL_ROT_FIX_Z_DEG = 0;

// Build an asset URL at runtime (works with Vite and TS)
const earthModelUrl = new URL('../../assets/Earth_1_12756.glb', import.meta.url).href;

type Props = {
  locations: LocationOption[];
  selectedLocation: LocationOption;
  onSelectLocation: (loc: LocationOption) => void;
  utcMs: number; // + current UTC time from the app
  //  active viewing direction from App (follow mode)
  activeAzDeg: number;
  activeAltDeg: number;
  preselectedCityIds: string[];
  setPreselectedCityIds: React.Dispatch<React.SetStateAction<string[]>>;
};

function normLng(deg: number): number {
  let x = ((deg + 180) % 360 + 360) % 360 - 180;
  // keep 180 instead of -180 for display clarity
  if (Object.is(x, -180)) x = 180;
  return x;
}

// Location marker component
function LocationMarker({
  lat,
  lng,
  earthRadius = 1,
  //  direction to point (az/alt from App)
  azDeg,
  altDeg,
}: {
  lat: number;
  lng: number;
  earthRadius?: number;
  azDeg: number;
  altDeg: number;
}) {
  const markerRef = useRef<THREE.Mesh>(null);
  const lineRef = useRef<THREE.LineSegments>(null);
  
  // Convert lat/lng to 3D position on sphere
  const position = useMemo(() => {
    // Place marker on Earth surface
    const r = earthRadius;
    // Convert to radians
    const phi = THREE.MathUtils.degToRad(89 - lat); // latitude to polar angle
    const theta = THREE.MathUtils.degToRad(lng); // longitude
    
    // Spherical to Cartesian coordinates
    const x = r * Math.sin(phi) * Math.sin(theta);
    const y = r * Math.cos(phi);
    const z = r * Math.sin(phi) * Math.cos(theta);
    
    return new THREE.Vector3(x, y, z);
  }, [lat, lng, earthRadius]);
  
  // Calculate rotation to point the cone towards Earth center (tip pointing down)
  const rotation = useMemo(() => {
    // Get the direction from position to Earth center (inward)
    const direction = position.clone().normalize().negate(); // Negate to point inward
    
    // Create a quaternion to rotate from default cone orientation (pointing up along Y) to our direction
    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
    
    // Convert to Euler angles
    const euler = new THREE.Euler();
    euler.setFromQuaternion(quaternion);
    
    return euler;
  }, [position]);
  
  // Calculate cone position (above Earth surface)
  const conePosition = useMemo(() => {
    // Cone dimensions relative to Earth radius
    const coneHeight = earthRadius * 0.10; // 10% of Earth radius
    // Position the cone using the static distance variable
    const normalizedPos = position.clone().normalize();
    const distanceFromCenter = earthRadius * (0 + LOCATION_MARKER_DISTANCE) + coneHeight / 2;
    
    const finalPos = normalizedPos.multiplyScalar(distanceFromCenter);
    
    return finalPos;
  }, [position, earthRadius]);
  
  // Update line geometry when position changes
  useEffect(() => {
    if (lineRef.current) {
      const positions = new Float32Array([0, 0, 0, position.x, position.y, position.z]);
      lineRef.current.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      lineRef.current.geometry.attributes.position.needsUpdate = true;
    }
  }, [position]);
  
  // Pulse animation for visibility
  useFrame(({ clock }) => {
    if (!markerRef.current) return;
    const scale = 1 + Math.sin(clock.getElapsedTime() * 2) * 0.1; // Subtle pulse
    markerRef.current.scale.set(scale, scale, scale);
  });
  
  //  Arrow (tube + cone) pointing toward active azimuth/altitude from this location
  const arrowMeshes = useMemo(() => {
    // Local frame at the site
    const U = position.clone().normalize(); // Up (radial)
    // Project global +Y (north pole) onto tangent plane to get local North
    const Y = new THREE.Vector3(0, 1, 0);
    let N = Y.clone().sub(U.clone().multiplyScalar(Y.dot(U)));
    if (N.lengthSq() < 1e-9) {
      // Fallback near poles: use +Z projected
      const Zaxis = new THREE.Vector3(0, 0, 1);
      N = Zaxis.clone().sub(U.clone().multiplyScalar(Zaxis.dot(U)));
    }
    N.normalize();
    // East = N × U
    const E = new THREE.Vector3().crossVectors(N, U).normalize();

    // Build direction from azimuth (from North -> East) and altitude
    const az = THREE.MathUtils.degToRad(azDeg);
    const alt = THREE.MathUtils.degToRad(altDeg);
    const cosAlt = Math.cos(alt);
    const sinAlt = Math.sin(alt);
    const cosAz = Math.cos(az);
    const sinAz = Math.sin(az);

    const dir = N.clone().multiplyScalar(cosAlt * cosAz)
      .add(E.clone().multiplyScalar(cosAlt * sinAz))
      .add(U.clone().multiplyScalar(sinAlt))
      .normalize();

    // Arrow geometry sizing
    const coneHeight = earthRadius * 0.10; // same as marker
    const baseRFromCenter = earthRadius * LOCATION_MARKER_DISTANCE + coneHeight;
    const gap = earthRadius * 0.02;
    const shaftLen = earthRadius * 0.35;
    const headLen = earthRadius * 0.08;
    const shaftR = earthRadius * 0.008;
    const headR = shaftR * 2.0;

    // Positions
    const start = U.clone().multiplyScalar(baseRFromCenter + gap);
    const shaftCenter = start.clone().add(dir.clone().multiplyScalar(shaftLen / 2));
    const headCenter = start.clone().add(dir.clone().multiplyScalar(shaftLen + headLen / 2));

    // Orientation (default Y up → dir)
    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);

    return { shaftCenter, headCenter, shaftLen, headLen, shaftR, headR, quat };
  }, [position, earthRadius, azDeg, altDeg]);

  //  color based on altitude sign (>=0 green, <0 red)
  const arrowColor = useMemo(() => (altDeg >= 0 ? '#00ff66' : '#ff4040'), [altDeg]);

  return (
    <>
      {/* Location marker - cone pointing towards Earth (matching Moon3D style) */}
      <mesh ref={markerRef} position={conePosition} rotation={rotation}>
        <coneGeometry args={[
          earthRadius * 0.03,  // radius: 3% of Earth radius
          earthRadius * 0.1,  // height: 5% of Earth radius
          8                    // radial segments
        ]} />
        <meshStandardMaterial 
          color="#ff0000"
          emissive="#ff0000"
          emissiveIntensity={0.5}
          metalness={0.3}
          roughness={0.4}
        />
      </mesh>
      

      {/*  Direction arrow (tube + cone) from top of city cone */}
      <mesh position={arrowMeshes.shaftCenter} quaternion={arrowMeshes.quat}>
        <cylinderGeometry args={[arrowMeshes.shaftR, arrowMeshes.shaftR, arrowMeshes.shaftLen, 12]} />
        <meshStandardMaterial
          color={arrowColor}
          emissive={arrowColor}
          emissiveIntensity={0.9}
          metalness={0.2}
          roughness={0.4}
        />
      </mesh>
      <mesh position={arrowMeshes.headCenter} quaternion={arrowMeshes.quat}>
        <coneGeometry args={[arrowMeshes.headR, arrowMeshes.headLen, 16]} />
        <meshStandardMaterial
          color={arrowColor}
          emissive={arrowColor}
          emissiveIntensity={1.2}
          metalness={0.2}
          roughness={0.4}
        />
      </mesh>
    </>
  );
}

// Simple Earth scene that rotates only around Y (east-west)
function EarthScene({
  glbUrl,
  selectedLng,
  selectedLat,
  selectedLocationLng,
  onDragLng,
  //  direction to pass down to marker
  activeAzDeg,
  activeAltDeg,
}: {
  glbUrl: string;
  selectedLng: number;
  selectedLat: number;
  selectedLocationLng: number;
  onDragLng: (lngDegRounded: number) => void;
  activeAzDeg: number;
  activeAltDeg: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const gltf = useLoader(GLTFLoader, glbUrl);
  const dragRef = useRef<{ active: boolean; startX: number; startLng: number }>({ active: false, startX: 0, startLng: selectedLng });

  // Center and scale the model (best effort)
  const { centeredScene, scale } = useMemo(() => {
    const scene = gltf.scene.clone(true);
    const box = new THREE.Box3().setFromObject(scene);
    const center = box.getCenter(new THREE.Vector3());
    scene.position.sub(center); // center at origin
    const size = box.getSize(new THREE.Vector3()).length();
    const s = size > 0 ? 2.0 / size : 1; // aim to fit in view
    // Calculate approximate Earth radius after scaling
    const r = (box.max.distanceTo(box.min) / 2) * s;
    
    return { centeredScene: scene, scale: s, radius: r };
  }, [gltf]);

  // Apply selected longitude to Y rotation (negative sign to match east-positive)
  useEffect(() => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = -THREE.MathUtils.degToRad(selectedLng);
  }, [selectedLng]);

  // Drag logic: horizontal drag -> change longitude (only Y rotation)
  const onPointerDown = (e: any) => {
    e.stopPropagation();
    dragRef.current.active = true;
    dragRef.current.startX = e.clientX ?? (e.pointer && e.pointer.x) ?? 0;
    dragRef.current.startLng = selectedLng;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: any) => {
    if (!dragRef.current.active) return;
    const x = e.clientX ?? (e.pointer && e.pointer.x) ?? 0;
    const dx = x - dragRef.current.startX;
    // Sensitivity: ~0.25° per px (invert to match drag → east)
    const newLng = normLng(dragRef.current.startLng - dx * 0.25);
    onDragLng(Math.round(newLng));
  };
  const endDrag = (e: any) => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  // Gentle idle spin when not dragging (optional: keep visual alive)
  useFrame((_, delta) => {
    if (!groupRef.current || dragRef.current.active) return;
    groupRef.current.rotation.y = THREE.MathUtils.damp(
      groupRef.current.rotation.y,
      -THREE.MathUtils.degToRad(selectedLng),
      6,
      delta
    );
  });

  // Precompute fix rotation in radians
  const FIX_ROT = useMemo<[number, number, number]>(() => [
    THREE.MathUtils.degToRad(MODEL_ROT_FIX_X_DEG),
    THREE.MathUtils.degToRad(MODEL_ROT_FIX_Y_DEG),
    THREE.MathUtils.degToRad(MODEL_ROT_FIX_Z_DEG),
  ], []);

  // Debug: log Earth rotation
  useEffect(() => {
  }, [selectedLng]);

  // Debug: log when location changes
  useEffect(() => {
  }, [selectedLat, selectedLocationLng]);

  return (
    <>
      <group
        ref={groupRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerOut={endDrag}
        onPointerCancel={endDrag}
        scale={scale}
      >
        <group rotation={FIX_ROT}>
          <primitive object={centeredScene} />
          {/* Location marker + arrow tied to location and active az/alt */}
          <LocationMarker
            key={`${selectedLat}-${selectedLocationLng}-${activeAzDeg.toFixed(2)}-${activeAltDeg.toFixed(2)}`}
            lat={selectedLat}
            lng={selectedLocationLng + MODEL_ROT_FIX_Y_DEG}
            earthRadius={1 / scale}
            azDeg={activeAzDeg}
            altDeg={activeAltDeg}
          />
        </group>
      </group>
    </>
  );
}

export default function SidebarLocations({
  locations,
  selectedLocation,
  onSelectLocation,
  utcMs,
  activeAzDeg,
  activeAltDeg,
  preselectedCityIds,
  setPreselectedCityIds,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedLng, setSelectedLng] = useState<number>(() => Math.round(normLng(selectedLocation.lng)));
  // refs for header measuring
  const headerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLImageElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const [collapsedWidth, setCollapsedWidth] = useState<number>(64);
  // Nouvel état pour l’onglet actif
  const [activeTab, setActiveTab] = useState<'cities' | 'coords'>('cities');

  useLayoutEffect(() => {
    const measure = () => {
      const padding = 8 * 2;
      const gap = 8;
      const logoW = logoRef.current?.offsetWidth ?? 48;
      const btnW = toggleRef.current?.offsetWidth ?? 28;
      const min = 64;
      setCollapsedWidth(Math.max(min, padding + logoW + gap + btnW));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (headerRef.current) ro.observe(headerRef.current);
    if (toggleRef.current) ro.observe(toggleRef.current);
    if (logoRef.current) ro.observe(logoRef.current);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  // Update selectedLng when selectedLocation changes externally
  useEffect(() => {
    setSelectedLng(Math.round(normLng(selectedLocation.lng)));
  }, [selectedLocation.lng]);

  // Keep body class in sync (optional)
  useEffect(() => {
    document.body.classList.toggle('sidebar-collapsed', collapsed);
    return () => document.body.classList.remove('sidebar-collapsed');
  }, [collapsed]);

  // Sun light direction from UTC (depends on selected longitude)
  const sunLightPos = useMemo<[number, number, number]>(() => {
    try {
      const date = new Date(utcMs);
      const sun = getSunAndMoonAltAzDeg(date, 0, 0).sun;
      const LST = lstDeg(date, 0);
      const eq = altazToRaDec(sun.azDeg, sun.altDeg, 0, LST);
      const subLat = eq.decDeg;
      const gha = ((eq.Hdeg % 360) + 360) % 360;
      const subLng = -gha;

      const phi = THREE.MathUtils.degToRad(subLat);
      const lamDeg = subLng - selectedLng + MODEL_ROT_FIX_Y_DEG + 180;
      const lam = THREE.MathUtils.degToRad(lamDeg);

      const R = 5;
      const x = Math.cos(phi) * Math.sin(lam) * R;
      const y = Math.sin(phi) * R;
      const z = Math.cos(phi) * Math.cos(lam) * R;
      return [x, y, z];
    } catch {
      return [3, 2, 5];
    }
  }, [utcMs, selectedLng]);

  // Use measured collapsed width
  const width = collapsed ? collapsedWidth : 260;

  const styles: Record<string, React.CSSProperties> = {
    aside: {
      width,
      transition: 'width 200ms ease',
      borderRight: '1px solid rgba(255,255,255,0.1)',
      height: '100vh',
      position: 'sticky',
      top: 0,
      background: '#000',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 10,
    },
    header: {
      height: 56,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '0 8px',
      borderBottom: '1px solid rgba(255,255,255,0.1)',
    },
    logo: {
      width: 48,
      height: 48,
      borderRadius: 6,
      flex: '0 0 auto',
      cursor: collapsed ? 'pointer' : 'default',
    },
    brandText: {
      fontWeight: 600,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      display: collapsed ? 'none' : 'inline',
      fontSize: '1rem',
      color: '#fff',
    },
    toggle: {
      marginLeft: 'auto',
      border: '1px solid rgba(255,255,255,0.15)',
      background: 'transparent',
      color: 'rgba(255,255,255,0.8)',
      cursor: 'pointer',
      fontSize: 14,
      lineHeight: 1,
      padding: '6px 8px',
      borderRadius: 8,
    },
    content: {
      padding: 8,
      overflow: 'hidden',
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
    },
    viewerWrap: {
      display: collapsed ? 'none' : 'block',
      width: '100%',
      aspectRatio: '1 / 1',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 8,
      overflow: 'hidden',
      background: 'rgba(255,255,255,0.03)',
      marginBottom: 8,
      position: 'relative',
    },
    // Styles des onglets
    tabs: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      flex: 1,
      minHeight: 0,
    },
    tabList: {
      display: collapsed ? 'none' : 'flex',   // <- masquer quand réduit
      gap: 12,
      marginBottom: 4,
      flex: '0 0 auto',
      alignSelf: 'stretch',
      padding: '0 2px',
      borderBottom: '1px solid rgba(255,255,255,0.12)',
      background: 'transparent',
      height: 28,
    },
    tabBtn: {
      appearance: 'none',
      background: 'transparent',
      border: 'none',
      color: 'rgba(255,255,255,0.85)',
      cursor: 'pointer',
      fontSize: 13,
      lineHeight: 1,
      padding: '6px 2px',                     // très compact
      height: 28,
      outline: 'none',
    },
    tabBtnActive: {
      color: '#fff',
      fontWeight: 600,
      boxShadow: 'inset 0 -2px 0 0 rgba(0,150,255,0.9)', // souligné actif
    },
    tabPanel: {
      minHeight: 0,
      flex: 1,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    },
  };

  return (
    <aside style={styles.aside} aria-label="Barre latérale des lieux">
      <div style={styles.header} ref={headerRef}>
        <img
          ref={logoRef}
          src={appLogo}
          alt="SpaceView.me"
          width={48}
          height={48}
          style={styles.logo}
        />
        <span style={styles.brandText}>SpaceView.me</span>
        <button
          ref={toggleRef}
          type="button"
          aria-label={collapsed ? 'Développer la barre latérale' : 'Réduire la barre latérale'}
          title={collapsed ? 'Développer' : 'Réduire'}
          onClick={() => setCollapsed(v => !v)}
          style={styles.toggle}
        >
          {collapsed ? '»' : '«'}
        </button>
      </div>

      <div style={styles.content}>
        {/* 3D viewer stays here */}
        <div style={styles.viewerWrap}>
          {!collapsed && (
            <Canvas
              dpr={[1, 2]}
              camera={{ position: [0, 0, 3], fov: 35 }}
              style={{ width: '100%', height: '100%', cursor: 'grab' }}
            >
              <color attach="background" args={['#000000']} />
              <ambientLight intensity={0.6} />
              <pointLight position={[0, 0, 3]} intensity={VIEWER_LIGHT_INTENSITY} />
              <directionalLight position={sunLightPos} intensity={SUN_LIGHT_INTENSITY} />
              <Suspense fallback={null}>
                <EarthScene
                  glbUrl={earthModelUrl}
                  selectedLng={selectedLng}
                  selectedLat={selectedLocation.lat}
                  selectedLocationLng={selectedLocation.lng}
                  onDragLng={setSelectedLng}
                  activeAzDeg={activeAzDeg}
                  activeAltDeg={activeAltDeg}
                />
              </Suspense>
            </Canvas>
          )}
        </div>

        {/* Onglets: Villes / Coordonnées */}
        <div style={styles.tabs}>
          <div
            style={styles.tabList}
            role="tablist"
            aria-label="Sélection du mode de lieux"
            aria-hidden={collapsed}              // <- accessibilité
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'cities'}
              onClick={() => setActiveTab('cities')}
              style={{ ...styles.tabBtn, ...(activeTab === 'cities' ? styles.tabBtnActive : {}) }}
            >
              Villes
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'coords'}
              onClick={() => setActiveTab('coords')}
              style={{ ...styles.tabBtn, ...(activeTab === 'coords' ? styles.tabBtnActive : {}) }}
            >
              Coordonnées
            </button>
          </div>

          <div role="tabpanel" hidden={activeTab !== 'cities'} style={styles.tabPanel}>
            <SidebarLocationsCities
              locations={locations}
              selectedLocation={selectedLocation}
              selectedLng={selectedLng}
              setSelectedLng={setSelectedLng}
              onSelectLocation={onSelectLocation}
              collapsed={collapsed}
              isActive={activeTab === 'cities'}
              preselectedIds={preselectedCityIds}
              setPreselectedIds={setPreselectedCityIds}
            />
          </div>

          <div role="tabpanel" hidden={activeTab !== 'coords'} style={styles.tabPanel}>
            <SidebarLocationsCoord
              locations={locations}
              selectedLocation={selectedLocation}
              selectedLng={selectedLng}
              setSelectedLng={setSelectedLng}
              onSelectLocation={onSelectLocation}
              collapsed={collapsed}
              isActive={activeTab === 'coords'}
            />
          </div>
        </div>
      </div>
    </aside>
  );
}