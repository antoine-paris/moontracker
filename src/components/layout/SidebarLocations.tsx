import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import appLogo from '../../assets/applogos/android-chrome-192x192.png';
// import earthModel from '../../assets/Earth_1_12756.glb'; // removed: GLB is not a TS module
import type { LocationOption } from '../../data/locations';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
// + astro helpers to derive Sun direction at UTC
import { getSunAndMoonAltAzDeg } from '../../astro/aeInterop';
import { lstDeg } from '../../astro/time';
import { altazToRaDec } from '../../astro/coords';

// Increase sun light intensity here
const SUN_LIGHT_INTENSITY = 10.0;
// New: viewer light intensity (fill light from camera position)
const VIEWER_LIGHT_INTENSITY = 3.0;

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
};

function normLng(deg: number): number {
  let x = ((deg + 180) % 360 + 360) % 360 - 180;
  // keep 180 instead of -180 for display clarity
  if (Object.is(x, -180)) x = 180;
  return x;
}
function norm360(deg: number): number {
  let x = deg % 360;
  if (x < 0) x += 360;
  return x;
}

// Simple Earth scene that rotates only around Y (east-west)
function EarthScene({
  glbUrl,
  selectedLng,
  onDragLng
}: {
  glbUrl: string;
  selectedLng: number;
  onDragLng: (lngDegRounded: number) => void;
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
    return { centeredScene: scene, scale: s };
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

  return (
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
      </group>
    </group>
  );
}

export default function SidebarLocations({ locations, selectedLocation, onSelectLocation, utcMs }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedLng, setSelectedLng] = useState<number>(() => Math.round(normLng(selectedLocation.lng)));
  const [search, setSearch] = useState('');
  const listRef = useRef<HTMLUListElement>(null);

  // Update selectedLng when selectedLocation changes externally
  useEffect(() => {
    setSelectedLng(Math.round(normLng(selectedLocation.lng)));
  }, [selectedLocation.lng]);

  // Keep body class in sync (optional)
  useEffect(() => {
    document.body.classList.toggle('sidebar-collapsed', collapsed);
    return () => document.body.classList.remove('sidebar-collapsed');
  }, [collapsed]);

  // Sun light direction from UTC (subsolar point -> world-space vector)
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
      // Flip day/night: add +180° to yaw (keep declination intact)
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
  }, [utcMs, selectedLng]); // <— now depends on selected longitude

  const width = collapsed ? 64 : 260;

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
      overflow: 'hidden', // Changed from 'auto' to 'hidden'
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
    search: {
      display: collapsed ? 'none' : 'block',
      width: '100%',
      padding: '8px 10px',
      borderRadius: 8,
      background: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(255,255,255,0.12)',
      color: '#fff',
      outline: 'none',
      marginBottom: 8,
      fontSize: 14,
    },
    miniToolbar: {
      display: collapsed ? 'none' : 'flex',
      gap: 6,
      alignItems: 'center',
      marginBottom: 8,
    },
    btn: {
      flex: '0 0 auto',
      padding: '6px 8px',
      borderRadius: 8,
      border: '1px solid rgba(255,255,255,0.15)',
      background: 'transparent',
      color: 'rgba(255,255,255,0.9)',
      cursor: 'pointer',
      fontSize: 13,
    },
    centerPill: {
      flex: 1,
      textAlign: 'center',
      padding: '6px 8px',
      borderRadius: 8,
      border: '1px solid rgba(255,255,255,0.15)',
      background: 'rgba(255,255,255,0.03)',
      color: 'rgba(255,255,255,0.95)',
      fontSize: 13,
    },
    list: {
      listStyle: 'none',
      padding: 0,
      margin: 0,
      display: collapsed ? 'none' : 'block',
      flex: 1,
      overflowY: 'auto',
      overflowX: 'hidden',
      minHeight: 0, // Important for flex child to scroll properly
      // Custom scrollbar styles
      scrollbarWidth: 'thin', // For Firefox
      scrollbarColor: 'rgba(255, 255, 255, 0.2) rgba(255, 255, 255, 0.05)', // For Firefox
      '&::-webkit-scrollbar': {
        width: '6px',
      },
      '&::-webkit-scrollbar-track': {
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '3px',
      },
      '&::-webkit-scrollbar-thumb': {
        background: 'rgba(255, 255, 255, 0.2)',
        borderRadius: '3px',
        '&:hover': {
          background: 'rgba(255, 255, 255, 0.3)',
        },
      },
    } as React.CSSProperties & {
      scrollbarWidth?: string;
      scrollbarColor?: string;
      '&::-webkit-scrollbar'?: React.CSSProperties;
      '&::-webkit-scrollbar-track'?: React.CSSProperties;
      '&::-webkit-scrollbar-thumb'?: React.CSSProperties & {
        '&:hover'?: React.CSSProperties;
      };
    },
    itemBtn: {
      width: '100%',
      textAlign: 'left' as const,
      padding: '8px 10px',
      borderRadius: 10,
      border:  '1px solid rgba(255,255,255,0.10)',
      background: 'transparent',
      color: '#fff',
      cursor: 'pointer',
      marginBottom: 6,
      fontSize: 13,
      transition: 'all 0.2s ease',
      outline: 'none',
    },
    sub: {
      fontSize: 11,
      color: 'rgba(255,255,255,0.55)',
      marginTop: 2,
    },
  };

  // Filter cities by rounded longitude == selectedLng, allow future search integration
  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    const match = (l: LocationOption) =>
      Math.round(normLng(l.lng)) === selectedLng &&
      (s.length === 0 || l.label.toLowerCase().includes(s));
    return locations.filter(match).sort((a, b) => b.lat - a.lat); // north -> south
  }, [locations, selectedLng, search]);

  const northPole: LocationOption = useMemo(() => ({
    id: `np@${selectedLng}`,
    label: 'Pôle Nord',
    lat: 90,
    lng: selectedLng,
    timeZone: 'Etc/UTC',
  }), [selectedLng]);

  const southPole: LocationOption = useMemo(() => ({
    id: `sp@${selectedLng}`,
    label: 'Pôle Sud',
    lat: -90,
    lng: selectedLng,
    timeZone: 'Etc/UTC',
  }), [selectedLng]);

  const decLng = () => setSelectedLng(v => normLng(v - 1));
  const incLng = () => setSelectedLng(v => normLng(v + 1));

  // Long-press handling for Ouest/Est
  const pressRef = useRef<{ tId: number | null; iId: number | null; long: boolean; dir: 1 | -1 }>({ tId: null, iId: null, long: false, dir: 1 });
  const clearPress = () => {
    if (pressRef.current.tId != null) { clearTimeout(pressRef.current.tId); pressRef.current.tId = null; }
    if (pressRef.current.iId != null) { clearInterval(pressRef.current.iId); pressRef.current.iId = null; }
    pressRef.current.long = false;
  };
  const startPress = (dir: 1 | -1) => {
    clearPress();
    pressRef.current.dir = dir;
    pressRef.current.tId = window.setTimeout(() => {
      pressRef.current.long = true;
      pressRef.current.iId = window.setInterval(() => {
        setSelectedLng(v => normLng(v + dir * 10));
      }, 500);
    }, 1000);
  };
  const endPress = () => {
    const wasLong = pressRef.current.long;
    const dir = pressRef.current.dir;
    clearPress();
    if (!wasLong) setSelectedLng(v => normLng(v + dir * 1));
  };
  useEffect(() => () => clearPress(), []);

  // Create combined list of all locations (north pole + filtered + south pole)
  const allLocations = useMemo(() => [
    northPole,
    ...filtered,
    southPole
  ], [northPole, filtered, southPole]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (collapsed) return;
      
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        
        const currentIndex = allLocations.findIndex(loc => loc.id === selectedLocation.id);
        let newIndex: number;
        
        if (e.key === 'ArrowDown') {
          newIndex = currentIndex < allLocations.length - 1 ? currentIndex + 1 : 0;
        } else {
          newIndex = currentIndex > 0 ? currentIndex - 1 : allLocations.length - 1;
        }
        
        onSelectLocation(allLocations[newIndex]);
        
        // Scroll the selected item into view and focus it
        setTimeout(() => {
          const selectedButton = listRef.current?.querySelector(`button[data-location-id="${allLocations[newIndex].id}"]`) as HTMLButtonElement;
          selectedButton?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          selectedButton?.focus();
        }, 0);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        
        // Remember current latitude for finding closest city
        const currentLat = selectedLocation.lat;
        
        // Change longitude
        const newLng = normLng(selectedLng + (e.key === 'ArrowRight' ? 1 : -1));
        setSelectedLng(newLng);
        
        // Find and select closest city by latitude at the new longitude
        setTimeout(() => {
          const citiesAtNewLng = locations.filter(l => Math.round(normLng(l.lng)) === newLng);
          
          let closestLocation: LocationOption;
          
          if (citiesAtNewLng.length === 0) {
            // No cities at this longitude, select based on latitude
            if (currentLat >= 45) {
              closestLocation = { id: `np@${newLng}`, label: 'Pôle Nord', lat: 90, lng: newLng, timeZone: 'Etc/UTC' };
            } else if (currentLat <= -45) {
              closestLocation = { id: `sp@${newLng}`, label: 'Pôle Sud', lat: -90, lng: newLng, timeZone: 'Etc/UTC' };
            } else {
              // Select north pole by default for mid-latitudes when no cities
              closestLocation = { id: `np@${newLng}`, label: 'Pôle Nord', lat: 90, lng: newLng, timeZone: 'Etc/UTC' };
            }
          } else {
            // Find closest city by latitude
            closestLocation = citiesAtNewLng.reduce((closest, city) => {
              const closestDiff = Math.abs(closest.lat - currentLat);
              const cityDiff = Math.abs(city.lat - currentLat);
              return cityDiff < closestDiff ? city : closest;
            });
          }
          
          onSelectLocation(closestLocation);
          
          // Scroll to the selected item and focus it
          setTimeout(() => {
            const selectedButton = listRef.current?.querySelector(`button[data-location-id="${closestLocation.id}"]`) as HTMLButtonElement;
            selectedButton?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            selectedButton?.focus();
          }, 0);
        }, 0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [collapsed, allLocations, selectedLocation, onSelectLocation, selectedLng, locations]);

  // Calculate local time for a location
  const getLocalTime = (timeZone: string): string => {
    try {
      const date = new Date(utcMs);
      const formatter = new Intl.DateTimeFormat('fr-FR', {
        timeZone: timeZone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      return formatter.format(date);
    } catch {
      // Fallback for UTC zones or invalid timezones
      const date = new Date(utcMs);
      return date.toISOString().slice(11, 19);
    }
  };

  return (
    <aside style={styles.aside} aria-label="Barre latérale des lieux">
      <div style={styles.header}>
        <img
          src={appLogo}
          alt="MoonTracker"
          width={48}
          height={48}
          style={styles.logo}
        />
        <span style={styles.brandText}>MoonTracker</span>
        <button
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
        {/* Square GLB viewer with react-three-fiber (east-west rotation only) */}
        <div style={styles.viewerWrap}>
          {!collapsed && (
            <Canvas
              dpr={[1, 2]}
              camera={{ position: [0, 0, 3], fov: 35 }}
              style={{ width: '100%', height: '100%', cursor: 'grab' }}
            >
              <color attach="background" args={['#000000']} />
              <ambientLight intensity={0.6} />
              {/* New: fill light from viewer (camera) position */}
              <pointLight position={[0, 0, 3]} intensity={VIEWER_LIGHT_INTENSITY} />
              {/* Sun light driven by UTC-selected time and selected longitude (Y) */}
              <directionalLight position={sunLightPos} intensity={SUN_LIGHT_INTENSITY} />
              <Suspense fallback={null}>
                <EarthScene
                  glbUrl={earthModelUrl}
                  selectedLng={selectedLng}
                  onDragLng={setSelectedLng}
                />
              </Suspense>
            </Canvas>
          )}
        </div>

        {/* Search city (placeholder for later) */}
        <input
          type="text"
          placeholder="Rechercher une ville..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={styles.search}
        />

        {/* Mini toolbar: Ouest / Lng X° / Est */}
        <div style={styles.miniToolbar} role="group" aria-label="Navigation par longitude">
          <button
            style={styles.btn}
            title="Ouest (−1°)"
            onMouseDown={() => startPress(-1)}
            onMouseUp={endPress}
            onMouseLeave={endPress}
            onTouchStart={(e) => { e.preventDefault(); startPress(-1); }}
            onTouchEnd={(e) => { e.preventDefault(); endPress(); }}
          >
            {'← Ouest'}
          </button>
          <div style={styles.centerPill} aria-live="polite">{`Lng ${selectedLng}°`}</div>
          <button
            style={styles.btn}
            title="Est (+1°)"
            onMouseDown={() => startPress(1)}
            onMouseUp={endPress}
            onMouseLeave={endPress} // Changed from endDrag to endPress
            onTouchStart={(e) => { e.preventDefault(); startPress(1); }}
            onTouchEnd={(e) => { e.preventDefault(); endPress(); }}
          >
            {'Est →'}
          </button>
        </div>

        {/* List: North Pole + matching cities north->south + South Pole */}
        <ul style={styles.list} className="cities-list" ref={listRef}>
          <style>{`
            .cities-list::-webkit-scrollbar {
              width: 6px;
            }
            .cities-list::-webkit-scrollbar-track {
              background: rgba(255, 255, 255, 0.05);
              border-radius: 3px;
            }
            .cities-list::-webkit-scrollbar-thumb {
              background: rgba(255, 255, 255, 0.2);
              border-radius: 3px;
            }
            .cities-list::-webkit-scrollbar-thumb:hover {
              background: rgba(255, 255, 255, 0.3);
            }
          `}</style>
          <li>
            <button
              style={{
                ...styles.itemBtn,
                background: selectedLocation.id === northPole.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                borderColor: selectedLocation.id === northPole.id ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.10)',
              }}
              onClick={() => onSelectLocation(northPole)}
              title={`90° LAT ${selectedLng}° LNG`}
              data-location-id={northPole.id}
              onFocus={(e) => e.currentTarget.blur()}
            >
              <div>{'Pôle Nord'}</div>
              <div style={styles.sub}>
                {`90.000°, ${selectedLng.toFixed(0)}° • ${getLocalTime(northPole.timeZone)}`}
              </div>
            </button>
          </li>

          {filtered.map(loc => (
            <li key={loc.id}>
              <button
                style={{
                  ...styles.itemBtn,
                  background: loc.id === selectedLocation.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                  borderColor: loc.id === selectedLocation.id ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.10)',
                }}
                onClick={() => onSelectLocation(loc)}
                data-location-id={loc.id}
                onFocus={(e) => e.currentTarget.blur()}
              >
                <div>{loc.label}</div>
                <div style={styles.sub}>
                  {`${loc.lat.toFixed(3)}°, ${loc.lng.toFixed(3)}° • ${getLocalTime(loc.timeZone)}`}
                </div>
              </button>
            </li>
          ))}

          <li>
            <button
              style={{
                ...styles.itemBtn,
                background: selectedLocation.id === southPole.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                borderColor: selectedLocation.id === southPole.id ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.10)',
              }}
              onClick={() => onSelectLocation(southPole)}
              title={`-90° LAT ${selectedLng}° LNG`}
              data-location-id={southPole.id}
              onFocus={(e) => e.currentTarget.blur()}
            >
              <div>{'Pôle Sud'}</div>
              <div style={styles.sub}>
                {`-90.000°, ${selectedLng.toFixed(0)}° • ${getLocalTime(southPole.timeZone)}`}
              </div>
            </button>
          </li>
        </ul>
      </div>
    </aside>
  );
}