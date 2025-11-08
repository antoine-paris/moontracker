import React, { useRef, useState, useMemo, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber'; // + useThree
import { OrbitControls, Line, useTexture, Html } from '@react-three/drei';
import * as THREE from 'three';
import InfoLogo from '../../InfoLogo';

const EARTH_CIRCUMFERENCE_KM = 40075; // diamètre du disque = circonférence terrestre
const CITY_VIEW_BOTTOM_MARGIN = 50;   // marge utilisée quand on centre la caméra en bas de l'écran
const EARTH_DISK_THICKNESS = 5;

// --- Ajouts: villes + projection ---
type City = { id: string; label: string; lat: number; lon: number };

const CITIES: City[] = [
  { id: 'london',    label: 'London',         lat: 51.5074, lon:  -0.1278 },
  { id: 'newyork',   label: 'New York',       lat: 40.7128, lon: -74.0060 },
  { id: 'losangeles',label: 'Los Angeles',    lat: 34.0522, lon:-118.2437 },
  { id: 'tokyo',     label: 'Tokyo',          lat: 35.6762, lon: 139.6503 },
  { id: 'rio',       label: 'Rio de Janeiro', lat:-22.9068, lon: -43.1729 },
  { id: 'dakar',     label: 'Dakar',          lat: 14.7167, lon: -17.4677 },
  { id: 'capetown',  label: 'Cape Town',      lat:-33.9249, lon:  18.4241 },
  { id: 'sydney',    label: 'Sydney',         lat:-33.8688, lon: 151.2093 },
  { id: 'moscow',    label: 'Moscow',         lat: 55.7558, lon:  37.6173 },
  { id: 'beijing',   label: 'Beijing',        lat: 39.9042, lon: 116.4074 },
  { id: 'paris',        label: 'Paris',          lat: 48.8566, lon:   2.3522 },
  { id: 'berlin',       label: 'Berlin',         lat: 52.5200, lon:  13.4050 },
  { id: 'madrid',       label: 'Madrid',         lat: 40.4168, lon:  -3.7038 },
  { id: 'rome',         label: 'Rome',           lat: 41.9028, lon:  12.4964 },
  { id: 'istanbul',     label: 'Istanbul',       lat: 41.0082, lon:  28.9784 },
  { id: 'cairo',        label: 'Cairo',          lat: 30.0444, lon:  31.2357 },
  { id: 'lagos',        label: 'Lagos',          lat:  6.5244, lon:   3.3792 },
  { id: 'nairobi',      label: 'Nairobi',        lat: -1.2921, lon:  36.8219 },
  { id: 'johannesburg', label: 'Johannesburg',   lat:-26.2041, lon:  28.0473 },
  { id: 'dubai',        label: 'Dubai',          lat: 25.2048, lon:  55.2708 },
  { id: 'delhi',        label: 'Delhi',          lat: 28.6139, lon:  77.2090 },
  { id: 'mumbai',       label: 'Mumbai',         lat: 19.0760, lon:  72.8777 },
  { id: 'bangkok',      label: 'Bangkok',        lat: 13.7563, lon: 100.5018 },
  { id: 'singapore',    label: 'Singapore',      lat:  1.3521, lon: 103.8198 },
  { id: 'jakarta',      label: 'Jakarta',        lat: -6.2088, lon: 106.8456 },
  { id: 'seoul',        label: 'Seoul',          lat: 37.5665, lon: 126.9780 },
  { id: 'shanghai',     label: 'Shanghai',       lat: 31.2304, lon: 121.4737 },
  { id: 'mexicocity',   label: 'Mexico City',    lat: 19.4326, lon: -99.1332 },
  { id: 'toronto',      label: 'Toronto',        lat: 43.6532, lon: -79.3832 },
  { id: 'buenosaires',  label: 'Buenos Aires',   lat:-34.6037, lon: -58.3816 },
];


function CityMarkers({
  cities,
  radius,
  lonOffsetDeg,
  lonClockwise,
}: {
  cities: City[];
  radius: number;
  lonOffsetDeg: number;
  lonClockwise: boolean;
}) {
  const { camera } = useThree();

  // km per scene unit depends on disk radius (1 unit = EARTH_CIRCUMFERENCE_KM / (2*radius) km)
  const kmPerUnit = EARTH_CIRCUMFERENCE_KM / (2 * radius);

  // Desired real-world sizes
  const cylDiameterKm = 80.15;
  const cylHeightKm = 1;

  // Gnomon: 10 km high, 5 km diameter 
  const gnomonHeightKm = 10;
  const gnomonDiameterKm = 5;

  // Convert to scene units
  const cylRadiusUnits = (cylDiameterKm / 2) / kmPerUnit;
  const cylHeightUnits = cylHeightKm / kmPerUnit;

  const gnomonRadiusUnits = (gnomonDiameterKm / 2) / kmPerUnit;
  const gnomonHeightUnits = gnomonHeightKm / kmPerUnit;

  // Seuil d'affichage en km
  const MAX_LABEL_DISTANCE_KM = 10000;
  const maxDistanceUnits = MAX_LABEL_DISTANCE_KM / kmPerUnit;

  // Offset vertical du label
  const labelOffsetUnits = 0.04;

  // Pré-calcul des positions des labels
  const positions = useMemo(
    () =>
      cities.map((c) => {
        const lon = (lonClockwise ? -c.lon : c.lon) + lonOffsetDeg;
        const theta = THREE.MathUtils.degToRad(lon);
        const colat = 90 - c.lat;
        const r = (colat / 180) * radius;
        const x = r * Math.sin(theta);
        const z = r * Math.cos(theta);
        return {
          id: c.id,
          x,
          // distance check from camera to top of gnomon + offset
          y: cylHeightUnits + gnomonHeightUnits + labelOffsetUnits,
          z,
          city: c
        };
      }),
    [cities, radius, cylHeightUnits, gnomonHeightUnits, labelOffsetUnits, lonOffsetDeg, lonClockwise]
  );

  // Visibilité par ville
  const [visibleById, setVisibleById] = useState<Record<string, boolean>>({});
  const prevVisibleRef = useRef<Record<string, boolean>>({});

  useFrame(() => {
    const cam = camera.position;
    let changed = false;
    const next: Record<string, boolean> = {};

    for (const p of positions) {
      const dx = cam.x - p.x;
      const dy = cam.y - p.y;
      const dz = cam.z - p.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const vis = dist <= maxDistanceUnits;
      next[p.id] = vis;
      if (prevVisibleRef.current[p.id] !== vis) changed = true;
    }

    if (changed) {
      prevVisibleRef.current = next;
      setVisibleById(next);
    }
  });

  return (
    <group>
      {positions.map((p) => {
        const c = p.city;
        const isVisible = visibleById[c.id] !== false; // par défaut visible jusqu'au 1er calcul

        return (
          <group key={c.id} position={[p.x, 0, p.z]}>
            {/* Base marker: cylinder at ground */}
            <mesh position={[0, cylHeightUnits / 2, 0]}  receiveShadow>
              <cylinderGeometry args={[cylRadiusUnits, cylRadiusUnits, cylHeightUnits, 24]} />
              <meshStandardMaterial color="#ff5555" emissive="#aa2222" emissiveIntensity={0.6} />
            </mesh>

            {/* Gnomon: thin cylinder rising from top of the base marker */}
            <mesh position={[0, cylHeightUnits + gnomonHeightUnits / 2 , 0]} castShadow receiveShadow>
              <cylinderGeometry args={[gnomonRadiusUnits, gnomonRadiusUnits, gnomonHeightUnits, 16]} />
              <meshStandardMaterial color="#d6c28b" roughness={0.6} metalness={0.1} />
            </mesh>

            {/* Label above the gnomon */}
            <Html
              position={[0, cylHeightUnits + gnomonHeightUnits + labelOffsetUnits, 0]}
              center
              occlude
              transform={false}
              style={{
                display: isVisible ? 'block' : 'none',
                pointerEvents: 'none',
                color: '#ffdede',
                fontSize: '12px',
                fontWeight: 500,
                whiteSpace: 'nowrap',
                textShadow: '0 1px 2px rgba(0,0,0,0.9)',
              }}
            >
              {c.label}
            </Html>
          </group>
        );
      })}
    </group>
  );
}
// --- Fin ajouts ---


// Types pour les paramètres du modèle
interface FlatEarthParams {
  // Dimensions du monde
  diskRadius: number;
  domeHeight: number;
  // Hauteurs séparées
  sunHeight: number;
  moonHeight: number;
  // Tailles des objets célestes
  sunSize: number;
  moonSize: number;
  sunDistance: number;
  moonDistance: number;
  // Vitesses et temps
  daySpeed: number;
  currentHour: number;
  latitude: number;
  // Options d'affichage
  showDome: boolean;
  showGrid: boolean;
  showLightCone: boolean;
  showTrajectories: boolean;
  cameraFov: number;

  // Mode d’éclairage du soleil (directionnelle supprimée)
  sunLightMode: 'spot' | 'point';
  sunLightIntensity: number;
  sunLightColor: string;
  sunCastShadows: boolean;
  sunSpotAngleDeg: number;

  showMoon: boolean;
  // Projection texture (centrée pôle Nord)
  mapLonOffsetDeg: number;     // décale le méridien 0° sur la texture
  mapLonClockwise: boolean;    // inverse Est/Ouest si la texture est miroir
  showProjectionDebug?: boolean;

}

// Composant pour le disque terrestre
function EarthDisk({ radius }: { radius: number }) {
  const texture = useTexture('/img/flatearth/flatearth.png');
  useMemo(() => {
    if ('colorSpace' in texture) {
      (texture as any).colorSpace = THREE.SRGBColorSpace;
    } else {
      // For older Three.js versions, use the numeric value for sRGB encoding
      (texture as any).encoding = 3001; // THREE.sRGBEncoding constant value
    }
    texture.anisotropy = 8;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
  }, [texture]);

  return (
    <group>
      {/* Cylindre fermé: top à y=0, épaisseur vers -Y */}
      <mesh position={[0, -EARTH_DISK_THICKNESS / 2, 0]} receiveShadow>
        <cylinderGeometry
          args={[radius, radius, EARTH_DISK_THICKNESS, 128, 1, false]}
        />
        {/* group order: 0=side, 1=top, 2=bottom */}
        <meshStandardMaterial
          attach="material-0"
          color="#233141"
          roughness={0.9}
          metalness={0.0}
        />
        <meshStandardMaterial
          attach="material-1"
          map={texture}
          color="#ffffff"
          roughness={0.9}
          metalness={0.0}
          side={THREE.FrontSide}
        />
        <meshStandardMaterial
          attach="material-2"
          color="#0b0f1a"
          roughness={0.9}
          metalness={0.0}
          side={THREE.FrontSide}
        />
      </mesh>
    </group>
  );
}

// Composant pour le dôme céleste
function CelestialDome({ radius, visible, currentHour, daySpeed }: { radius: number; height: number; visible: boolean; currentHour: number; daySpeed: number }) {
  const starsRef = useRef<THREE.Points>(null);
  const starsDaysRef = useRef(currentHour / 24);

  useEffect(() => {
    // When paused, sync phase to slider; when playing, we keep integrating.
    if (daySpeed <= 0) starsDaysRef.current = currentHour / 24;
  }, [currentHour, daySpeed]);

  const starsGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const N = 2500; // a bit more stars
    for (let i = 0; i < N; i++) {
      // Uniform hemisphere: y >= 0
      const theta = Math.random() * Math.PI * 2;
      const mu = Math.random();              // cos(phi) in [0,1]
      const phi = Math.acos(mu);             // phi in [0, pi/2]
      const r = radius * 0.98;

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.cos(phi);
      const z = r * Math.sin(phi) * Math.sin(theta);
      vertices.push(x, y, z);
    }
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    return geometry;
  }, [radius]);

  const starSprite = useMemo(() => {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, size, size);

    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0.0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0.6)');
    grad.addColorStop(1.0, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.fill();

    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    return tex;
  }, []);

  useFrame((_, delta) => {
    if (!starsRef.current) return;

    // Integrate elapsed days when playing (no modulo so ratio accumulates across days)
    if (daySpeed > 0) {
      starsDaysRef.current += ((daySpeed / 6) * (delta || 0)) / 24;
    } else {
      starsDaysRef.current = currentHour / 24;
    }

    const STARS_SPEED_RATIO = 364 / 365;
    // Keep clockwise for stars
    const angle = -(starsDaysRef.current) * Math.PI * 2 * STARS_SPEED_RATIO;
    starsRef.current.rotation.y = angle;
  });

  if (!visible) return null;

  return (
    <group>
      {/* Upper hemisphere aligned with +Y (no rotation) */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[radius, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshBasicMaterial color="#1b2b5a" opacity={0.15} transparent side={THREE.BackSide} />
      </mesh>
      <points ref={starsRef}>
        <primitive attach="geometry" object={starsGeometry} />
        <pointsMaterial
          attach="material"
          color="#ffffff"
          size={0.5}
          sizeAttenuation
          map={starSprite}
          transparent
          alphaTest={0.5}
          depthWrite={false}
        />
      </points>
    </group>
  );
}

// Composant pour le Soleil
function Sun({
  size,
  distance,
  height,
  hour,
  daySpeed,
  mode,
  intensity,
  color,
  showCone,
  castShadows,
  spotAngleDeg,
}: {
  size: number;
  distance: number;
  height: number;
  hour: number;
  daySpeed: number;
  mode: 'spot' | 'point';
  intensity: number;
  color: string;
  showCone: boolean;
  castShadows: boolean;
  spotAngleDeg: number;
}) {
  const sunMeshRef = useRef<THREE.Mesh>(null);
  const spotLightRef = useRef<THREE.SpotLight>(null);
  const spotTargetRef = useRef<THREE.Object3D>(null);
  const pointLightRef = useRef<THREE.PointLight>(null);
  const sunDaysRef = useRef(hour / 24);
  useEffect(() => {
    if (daySpeed <= 0) sunDaysRef.current = hour / 24;
  }, [hour, daySpeed]);

  useFrame((_, delta) => {
    if (daySpeed > 0) {
      sunDaysRef.current += ((daySpeed / 6) * (delta || 0)) / 24;
    } else {
      sunDaysRef.current = hour / 24;
    }

    // Counterclockwise sun now
    const angle = (sunDaysRef.current) * Math.PI * 2 - Math.PI / 2;
    const x = Math.cos(angle) * distance;
    const z = Math.sin(angle) * distance;
    const y = height;

    sunMeshRef.current?.position.set(x, y, z);

    if (mode === 'spot' && spotLightRef.current && spotTargetRef.current) {
      spotLightRef.current.position.set(x, y, z);
      spotTargetRef.current.position.set(x, 0, z);
      spotLightRef.current.target = spotTargetRef.current;
      spotLightRef.current.target.updateMatrixWorld();
    }
    if (mode === 'point' && pointLightRef.current) {
      pointLightRef.current.position.set(x, y, z);
    }
  });

  return (
    <>
      <mesh ref={sunMeshRef} castShadow={false}>
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial color="#ffd166" emissive="#ffd166" emissiveIntensity={1.2} roughness={0.2} metalness={0} />
        {mode === 'spot' && showCone && (
          <AttachedSunCone height={height} angleDeg={spotAngleDeg} groundY={0} penumbra={0.1} />
        )}
      </mesh>

      {mode === 'spot' && (
        <>
          <spotLight
            ref={spotLightRef}
            args={[color, intensity]}
            angle={THREE.MathUtils.degToRad(spotAngleDeg)}
            penumbra={0.3}
            decay={2}
            distance={0}
            castShadow={castShadows}
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-bias={-0.0005}
            shadow-normalBias={0.02}
          />
          <object3D ref={spotTargetRef} />
        </>
      )}

      {mode === 'point' && (
        <pointLight
          ref={pointLightRef}
          intensity={intensity}
          color={color}
          distance={0}
          castShadow={castShadows}
        />
      )}

      
    </>
  );
}



function AttachedSunCone({
  height,
  angleDeg,
  groundY = 0,
  overshoot = 0.25,
  penumbra = 0,              // NEW: match SpotLight.penumbra
}: {
  height: number;
  angleDeg: number;
  groundY?: number;
  overshoot?: number;
  penumbra?: number;
}) {
  const beamLen = Math.max(0.001, (height - groundY) + overshoot);
  const outerHalfRad = THREE.MathUtils.degToRad(angleDeg);
  const innerHalfRad = Math.max(0, outerHalfRad * (1 - penumbra));

  const outerR = Math.max(0, Math.tan(outerHalfRad) * beamLen);
  const innerR = Math.max(0, Math.tan(innerHalfRad) * beamLen);

  return (
    <group
      // Render after the earth disk and ignore depth to prevent being cut
      renderOrder={1000}
      position={[0, -beamLen / 2, 0]}
    >
      {/* Inner bright cone (matches perceived light) */}
      <mesh scale={[innerR, beamLen, innerR]} castShadow={false} receiveShadow={false}>
        <coneGeometry args={[1, 1, 48, 1, true]} />
        <meshBasicMaterial
          color="rgba(102, 179, 255, 1)"
          transparent
          opacity={0.72}
          depthWrite={false}
          depthTest={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Optional outer penumbra cone (faint) */}
      {penumbra > 0 && outerR > innerR && (
        <mesh scale={[outerR, beamLen, outerR]} castShadow={false} receiveShadow={false}>
          <coneGeometry args={[1, 1, 48, 1, true]} />
          <meshBasicMaterial
            color="rgba(102, 179, 255, 1)"
            transparent
            opacity={0.18}
            depthWrite={false}
            depthTest={false}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}
    </group>
  );
}

// Composant pour la Lune
function Moon({ size, distance, height, hour, daySpeed }: { 
  size: number; 
  distance: number; 
  height: number; 
  hour: number;
  daySpeed: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const moonDaysRef = useRef(hour / 24);
  useEffect(() => {
    if (daySpeed <= 0) moonDaysRef.current = hour / 24;
  }, [hour, daySpeed]);
  
  useFrame((_, delta) => {
    if (daySpeed > 0) {
      moonDaysRef.current += ((daySpeed / 6) * (delta || 0)) / 24;
    } else {
      moonDaysRef.current = hour / 24;
    }

    const MOON_SPEED_RATIO = 1 / 29;
    // Counterclockwise, continuous across day wrap
    const angle = (moonDaysRef.current) * Math.PI * 2 * MOON_SPEED_RATIO - Math.PI / 2;
    if (meshRef.current) {
      meshRef.current.position.set(
        Math.cos(angle) * distance,
        height,
        Math.sin(angle) * distance
      );
    }
  });
  
  return (
    <mesh ref={meshRef} castShadow>
      <sphereGeometry args={[size, 32, 32]} />
      <meshStandardMaterial color="#cccccc" emissive="#666666" emissiveIntensity={0.2} />
    </mesh>
  );
}
// Composant pour les observateurs


// Composant pour afficher les Trajectories
function Trajectories({ sunDistance, moonDistance, sunHeight, moonHeight, visible }: {
  sunDistance: number;
  moonDistance: number;
  sunHeight: number;
  moonHeight: number;
  visible: boolean;
}) {
  if (!visible) return null;

  const sunPoints: THREE.Vector3[] = [];
  const moonPoints: THREE.Vector3[] = [];

  for (let i = 0; i <= 64; i++) {
    const angle = (i / 64) * Math.PI * 2;
    sunPoints.push(new THREE.Vector3(
      Math.cos(angle) * sunDistance,
      sunHeight,
      Math.sin(angle) * sunDistance
    ));
    moonPoints.push(new THREE.Vector3(
      Math.cos(angle) * moonDistance,
      moonHeight,
      Math.sin(angle) * moonDistance
    ));
  }

  return (
    <>
      <Line points={sunPoints} color="#ffff00" lineWidth={2} opacity={0.5} transparent />
      <Line points={moonPoints} color="#cccccc" lineWidth={2} opacity={0.5} transparent />
    </>
  );
}

// Composant pour la grille
function GridHelper({ size, visible }: { size: number; visible: boolean }) {
  if (!visible) return null;
  return <gridHelper args={[size * 2, 20, '#666666', '#2a2a2a']} position={[0, 0.01, 0]} />;
}

// Panneau de contrôle
function ControlPanel({ params, setParams, onReset, isExpanded, onToggleExpand }: { 
  params: FlatEarthParams; 
  setParams: React.Dispatch<React.SetStateAction<FlatEarthParams>>;
  onReset: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) {
  // conversion: 1 unité scène = (circumference / (2*radius)) km
  const kmPerUnit = EARTH_CIRCUMFERENCE_KM / (2 * params.diskRadius);
  const fmtKm = (u: number) => `${Math.round(u * kmPerUnit)} km`;

  
  // Etat du bouton Lecture/Pause
  const isPlaying = params.daySpeed > 0;

  return (
    <div style={{
      height: '100%',
      width: '100%',
      background: 'rgba(0, 0, 0, 0.9)',
      padding: '16px',
      borderRadius: '0',
      color: 'white',
      maxWidth: '100%',
      maxHeight: '100%',
      textAlign: 'left',
      overflowY: 'auto',
      boxSizing: 'border-box',
      fontSize: '12px',
      lineHeight: 1.2
    }}>
      {/* Slider FOV + bouton Agrandir/Retour */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
          <label style={{ display: 'block', fontSize: '12px', marginBottom: 0, flex: 1, minWidth: 0 }}>
            Champ de vision (FOV) : {params.cameraFov.toFixed(0)}°
            <input
              type="range"
              min={50}
              max={120}
              step={1}
              value={params.cameraFov}
              onChange={(e) => setParams({ ...params, cameraFov: parseFloat(e.target.value) })}
              style={{ width: '100%', fontSize: '12px' }}
            />
          </label>

          <button
            onClick={onToggleExpand}
            title={isExpanded ? 'Retour' : 'Agrandir'}
            aria-label={isExpanded ? 'Retour' : 'Agrandir'}
            style={{
              padding: '6px 10px',
              background: '#1f2937',
              color: '#e5e7eb',
              border: '1px solid #2b3545',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 12,
              userSelect: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {isExpanded ? 'Retour' : 'Agrandir'}
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <label style={{ display: 'block', fontSize: '12px', marginBottom: 0, flex: 1, minWidth: 0 }}>
            Animation (24h)
            <input
              type="range"
              min="0"
              max="24"
              step="0.1"
              value={params.currentHour}
              onChange={(e) => setParams({ ...params, currentHour: parseFloat(e.target.value) })}
              style={{ width: '100%', fontSize: '12px' }}
            />
          </label>

          {/* Bouton Play/Pause remplaçant le slider de vitesse */}
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              aria-label={isPlaying ? 'Mettre en pause' : 'Lecture'}
              title={isPlaying ? 'Pause' : 'Lecture'}
              aria-pressed={isPlaying}
              onClick={() =>
                setParams({
                  ...params,
                  daySpeed: isPlaying ? 0 : 10,
                })
              }
              style={{
                width: 36,
                height: 28,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isPlaying ? '#2563eb' : '#1f2937',
                color: '#e5e7eb',
                border: '1px solid #2b3545',
                borderRadius: 6,
                cursor: 'pointer',
                padding: 0,
              }}
            >
              {/* SVG sans texte */}
              {isPlaying ? (
                // Pause
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                // Play
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <polygon points="6,4 6,20 18,12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>        
        <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px' }}>
          <input
            type="checkbox"
            checked={params.showTrajectories}
            onChange={(e) => setParams({ ...params, showTrajectories: e.target.checked })}
          />
          {' '}Afficher les Trajectories
        </label>

      
      {/* Sliders Soleil sur une seule ligne */}
      <h4 style={{ display: 'flex', gap: 12, fontSize: '14px', color:'white' }}>Soleil</h4>
      <div style={{ display: 'flex', gap: 12 }}>
        <label style={{ display: 'block', fontSize: '10px', marginBottom: 0, flex: 1, minWidth: 0 }}>
           Hauteur: {fmtKm(params.sunHeight)}
          <input
            type="range"
            min="2"
            max="50"
            step="1"
            value={params.sunHeight}
            onChange={(e) => setParams({ ...params, sunHeight: parseFloat(e.target.value) })}
            style={{ width: '100%', fontSize: '12px' }}
          />
        </label>

        <label style={{ display: 'block', fontSize: '10px', marginBottom: 0, flex: 1, minWidth: 0 }}>
          Taille: {fmtKm(params.sunSize*2)}
          <input
            type="range"
            min="0.05"
            max="5"
            step="0.01"
            value={params.sunSize}
            onChange={(e) => setParams({ ...params, sunSize: parseFloat(e.target.value) })}
            style={{ width: '100%', fontSize: '12px' }}
          />
        </label>

        <label style={{ display: 'block', fontSize: '10px', marginBottom: 0, flex: 1, minWidth: 0 }}>
          Orbite: {fmtKm(params.sunDistance)}
          <input
            type="range"
            min="5"
            max="40"
            step="1"
            value={params.sunDistance}
            onChange={(e) => setParams({ ...params, sunDistance: parseFloat(e.target.value) })}
            style={{ width: '100%', fontSize: '12px' }}
          />
        </label>
      </div>

      {/* Lumière du Soleil */}
      <div style={{ display: 'flex', gap: 12 }}>
        <label style={{ display: 'block', fontSize: '10px', flex: 1 }}>
          Intensité
          <input
            type="range"
            min="200"
            max="3000"
            step="100"
            value={params.sunLightIntensity}
            onChange={(e) => setParams({ ...params, sunLightIntensity: parseFloat(e.target.value) })}
            style={{ width: '100%' }}
          />
        </label>

        <label style={{ display: 'block', fontSize: '10px', flex: 1 }}>
          Largeur du faisceau
          <input
            type="range"
            min="2"
            max="91"
            step="1"
            value={params.sunSpotAngleDeg}
            onChange={(e) => {
              const angle = parseFloat(e.target.value);
              setParams({
                ...params,
                sunSpotAngleDeg: angle,
                sunLightMode: angle > 90 ? 'point' : 'spot',
              });
            }}
            style={{ width: '100%' }}
          />
        </label>
         
          <input
            type="checkbox"
            checked={params.showLightCone}
            onChange={(e) => setParams({ ...params, showLightCone: e.target.checked })}
          />
          
        
      </div>


      {/* Sliders Lune sur une seule ligne */}
      <h4 style={{ display: 'flex', gap: 12, fontSize: '14px', color:'white' }}>Lune</h4>
      <div style={{ display: 'flex', gap: 12, marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '10px', marginBottom: '8px' }}>
          Hauteur: {fmtKm(params.moonHeight)}
          <input
            type="range"
            min="5"
            max="50"
            step="1"
            value={params.moonHeight}
            onChange={(e) => setParams({ ...params, moonHeight: parseFloat(e.target.value) })}
            style={{ width: '100%', fontSize: '12px' }}
          />
        </label>

        <label style={{ display: 'block', fontSize: '10px', marginBottom: '8px' }}>
          Taille: {fmtKm(params.moonSize*2)}
          <input
            type="range"
            min="0.05"
            max="5"
            step="0.01"
            value={params.moonSize}
            onChange={(e) => setParams({ ...params, moonSize: parseFloat(e.target.value) })}
            style={{ width: '100%', fontSize: '12px' }}
          />
        </label>
        
        <label style={{ display: 'block', fontSize: '10px', marginBottom: '8px' }}>
          Orbite:{fmtKm(params.moonDistance)}
          <input
            type="range"
            min="5"
            max="40"
            step="1"
            value={params.moonDistance}
            onChange={(e) => setParams({ ...params, moonDistance: parseFloat(e.target.value) })}
            style={{ width: '100%', fontSize: '12px' }}
          />
        </label>
      </div>

       {/* Etoiles: titre + checkbox sur une même ligne */}
       <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, margin: '16px 0 8px' }}>
         <h4 style={{ fontSize: '14px', color: 'white', margin: 0 }}>Etoiles</h4>
         <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '10px', margin: 0 }}>
           <input
             type="checkbox"
             checked={params.showDome}
             onChange={(e) => setParams({ ...params, showDome: e.target.checked })}
           />
           Afficher le dôme
         </label>
       </div>
         
      <button
        onClick={() => {
          setParams({
            diskRadius: 50,
            domeHeight: 50,
            sunHeight: 12,
            moonHeight: 8,
            sunSize: 0.7,
            moonSize: 0.6,
            sunDistance: 25,
            moonDistance: 25,
            daySpeed: 10,
            currentHour: 12,
            latitude: 45,
            showDome: true,
            showGrid: false,
            showLightCone: false,
            showTrajectories: true,
            cameraFov: 60,

            sunLightMode: 'spot',
            sunLightIntensity: 1000,
            sunLightColor: '#ffffff',
            sunCastShadows: true,
            sunSpotAngleDeg: 60,

            showMoon: true,
            
            mapLonOffsetDeg: -90,
            mapLonClockwise: false,
            showProjectionDebug: false,
          });
          onReset();
        }}
        style={{
          width: '100%',
          padding: '8px',
          background: '#444',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          marginTop: '12px',
          cursor: 'pointer',
          fontSize: '12px'
        }}
      >
        Réinitialiser
      </button>
      
      <small>
      Avec cette application, simulez votre hypothèse de terre plate et comparez au simulateur <InfoLogo showBackground={false} size={16} /> SpaceView.me (qui est basé sur une terre sphérique).
      Dans cette version, la lune fait un "tour" en 29 jours.

      <br/><strong style={{ color: 'white' }}>Si vous pensez que nous devons rajouter un paramètre réglable pour tester votre hypothèse, contactez nous sur les réseaux sociaux.</strong>
      </small>
    </div>
  );
}

// Met à jour le FOV du vrai THREE.PerspectiveCamera quand l'état change
function CameraFovUpdater({ fov }: { fov: number }) {
  const { camera, size } = useThree();
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    if (!cam.isPerspectiveCamera) return;

    const aspect = (size.width || 1) / (size.height || 1);

    // Applique le FOV sur le plus grand côté:
    // - paysage: slider = FOV horizontal -> convertir en FOV vertical pour Three.js
    // - portrait: slider = FOV vertical directement
    let vFovDeg: number;
    if (aspect >= 1) {
      const hRad = THREE.MathUtils.degToRad(fov);
      const vRad = 2 * Math.atan(Math.tan(hRad / 2) / aspect);
      vFovDeg = THREE.MathUtils.radToDeg(vRad);
    } else {
      vFovDeg = fov;
    }

    if (Math.abs(cam.fov - vFovDeg) > 0.01) {
      cam.fov = vFovDeg;
      cam.updateProjectionMatrix();
    }
  }, [camera, size.width, size.height, fov]);
  return null;
}

// Driver de la rose des vents: calcule la rotation et l'applique sur un élément DOM
function CompassRoseYawDriver({ rotRef }: { rotRef: React.RefObject<HTMLDivElement | null> }) {
  const { camera } = useThree();

  useFrame(() => {
    const cam = camera as THREE.PerspectiveCamera;

    // Yaw caméra (direction regardée) projeté sur XZ
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion);
    forward.y = 0;
    if (forward.lengthSq() < 1e-8) return;
    const yawCam = Math.atan2(forward.x, forward.z);

    // "Nord" = direction radiale vers le centre du disque (origine)
    const cp = cam.position.clone(); cp.y = 0;
    let yawNorth = 0;
    if (cp.lengthSq() > 1e-8) yawNorth = Math.atan2(-cp.x, -cp.z);

    // On fait tourner le disque des lettres pour que la flèche fixe (haut) pointe vers le Nord
    const rot = (yawCam - yawNorth);
    if (rotRef.current) rotRef.current.style.transform = `rotate(${rot}rad)`;
  });

  return null;
}



// Composant principal
export default function FlatEarthSimulator() {
  const [params, setParams] = useState<FlatEarthParams>({
    diskRadius: 50,
    domeHeight: 50,
    sunHeight: 12,
    moonHeight: 8,
    sunSize: 0.7,
    moonSize: 0.6,
    sunDistance: 25,
    moonDistance: 25,
    daySpeed: 10,
    currentHour: 12,
    latitude: 45,
    showDome: true,
    showGrid: false,
    showLightCone: false,
    showTrajectories: true,
    cameraFov: 60,

    sunLightMode: 'spot',
    sunLightIntensity: 1000.0,
    sunLightColor: '#ffffff',
    sunCastShadows: true,
    sunSpotAngleDeg: 60,
    showMoon: true,
    mapLonOffsetDeg: -90,
    mapLonClockwise: false,
    showProjectionDebug: false,
  });

  const controlsRef = useRef<any>(null);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const compassRotRef = useRef<HTMLDivElement>(null); // <-- ref du disque rotatif

  // NEW: état d’agrandissement
  const [isExpanded, setIsExpanded] = useState(false);

  // --- sort cities alphabetically by label for UI ---
  const sortedCities = useMemo(
    () => [...CITIES].sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' })),
    []
  );

  const resetCamera = () => {
    const controls = controlsRef.current;
    if (!controls) return;
    const cam = controls.object as THREE.PerspectiveCamera;
    cam.position.set(80, 60, 80);
    controls.target.set(0, 0, 0);   // orbite autour du pôle nord
    // Clear any optical center shift
    if ((cam as any).clearViewOffset) {
      cam.clearViewOffset();
      cam.updateProjectionMatrix();
    }
    controls.update();
    setSelectedCity(null);           // <-- retour au comportement par défaut
  };

  // -- focus caméra sur ville + orbite autour de la ville --
  const focusCity = (city: City) => {
    const controls = controlsRef.current;
    if (!controls) return;
    const cam = controls.object as THREE.PerspectiveCamera;

    // Projection azimutale équidistante avec offset/orientation texture
    const lon = (params.mapLonClockwise ? -city.lon : city.lon) + params.mapLonOffsetDeg;
    const theta = THREE.MathUtils.degToRad(lon);
    const colat = 90 - city.lat;
    const r = (colat / 180) * params.diskRadius;
    const x = r * Math.sin(theta);
    const z = r * Math.cos(theta);

    const vx = x / r;
    const vz = z / r;

    // Altitude beaucoup plus basse (presque au sol)
    const eyeY = 0.01;// Math.max(0.01, params.diskRadius * 0.004); // avant: Math.max(0.9, R*0.01)
    const camBack = 2;

    cam.position.set(x - vx * camBack, eyeY, z - vz * camBack);
    controls.target.set(x, eyeY, z); // visée horizontale
    controls.update();

    setSelectedCity(city);
  };


  // Shift the camera principal point so the "center" is near the bottom (+50px)
function CameraPrincipalPointOffset({ bottomMarginPx = CITY_VIEW_BOTTOM_MARGIN }: { bottomMarginPx?: number }) {
  const { camera, size, gl } = useThree();
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    if (!cam.isPerspectiveCamera) return;

    const dpr = gl.getPixelRatio ? gl.getPixelRatio() : (window.devicePixelRatio || 1);
    const fullW = Math.round(size.width * dpr);
    const fullH = Math.round(size.height * dpr);

    // We want the optical center bottomMarginPx above the bottom
    const desiredCenterY = fullH - Math.round(bottomMarginPx * dpr);

    // Invert the sign: positive offsetY moves the principal point up
    const shiftY = Math.round(fullH / 2) - desiredCenterY;

    cam.setViewOffset(fullW, fullH, 0, shiftY, fullW, fullH);
    cam.updateProjectionMatrix();

    return () => {
      cam.clearViewOffset();
      cam.updateProjectionMatrix();
    };
  }, [camera, size.width, size.height, gl, bottomMarginPx]);
  return null;
}

  // Animation du temps
  useEffect(() => {
    if (params.daySpeed > 0) {
      const interval = setInterval(() => {
        setParams(prev => ({
          ...prev,
          currentHour: (prev.currentHour + prev.daySpeed / 60) % 24
        }));
      }, 100);
      return () => clearInterval(interval);
    }
  }, [params.daySpeed]);

  return (
    // NEW wrapper: bascule entre mode normal et plein navigateur
    <div
      style={
        isExpanded
          ? {
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              background: '#0b1020',
            }
          : {
              position: 'relative',
              width: '100%',
              height: '100%',
            }
      }
    >
      {/* Contenu principal inchangé, juste déplacé dans un conteneur qui remplit 100% */}
      <div style={{ width: '100%', height: '100%', display: 'flex' }}>
        {/* Global thin dark scrollbar styles */}
        <style>{`
          .thin-scroll {
            scrollbar-width: thin;              /* Firefox */
            scrollbar-color: #374151 #0d0f12;  /* thumb track */
          }
          .thin-scroll::-webkit-scrollbar {
            width: 8px;                        /* Chrome/Edge/Safari */
          }
          .thin-scroll::-webkit-scrollbar-track {
            background: #0d0f12;
          }
          .thin-scroll::-webkit-scrollbar-thumb {
            background-color: #374151;
            border-radius: 8px;
            border: 2px solid #0d0f12;
          }
          .thin-scroll::-webkit-scrollbar-thumb:hover {
            background-color: #4b5563;
          }
        `}</style>
        {/* Barre de villes (gauche) */}
        <div
          style={{
            width: 160,
            minWidth: 140,
            maxWidth: 220,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: '#0d0f12',
            borderRight: '1px solid #222',
          }}
        >
          <div
            className="thin-scroll"
            style={{ flex: 1, overflowY: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}
          >
            <div style={{ flex: 1, overflowY: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <button
                onClick={resetCamera}
                title="Réinitialiser la vue"
                style={{
                  width: '100%',
                  minHeight: 24,
                  textAlign: 'left',
                  background: 'rgba(66, 38, 60, 1)',
                  border: '1px solid #2b3545',
                  color: '#e5e7eb',
                  padding: '2px 2px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 12,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                Toute la terre
              </button>
              {sortedCities.map((c) => (
                <button
                  key={c.id}
                  onClick={() => focusCity(c)}
                  style={{
                    width: '100%',
                    minHeight: 24,
                    textAlign: 'left',
                    background: '#1f2937',
                    border: '1px solid #2b3545',
                    color: '#e5e7eb',
                    padding: '2px 2px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 12,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Vue 3D (centre) */}
        <div style={{ flex: 1, minWidth: 0, minHeight: 0, position: 'relative' }}>
          <Canvas
            camera={{ position: [80, 60, 80], fov: params.cameraFov }}
            style={{ width: '100%', height: '100%' }}
            dpr={[1, 1.75]}
            shadows
            onCreated={({ gl }) => {
              gl.shadowMap.enabled = true;
              gl.shadowMap.type = THREE.PCFSoftShadowMap;
            }}
            gl={{ antialias: true, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping }}
          >
            <CameraFovUpdater fov={params.cameraFov} />
            {selectedCity && <CameraPrincipalPointOffset bottomMarginPx={CITY_VIEW_BOTTOM_MARGIN} />}
            <color attach="background" args={['#0b1020']} />
            <Suspense fallback={null}>
              {/* Lights d'ambiance (gardez faibles pour mieux voir le spot) */}
              <hemisphereLight args={['#89b4fa', '#1f2937', 0.35]} />
              <ambientLight intensity={0.05} />

              {/* Scène */}
              <EarthDisk radius={params.diskRadius} />
              <CelestialDome
                radius={params.domeHeight}
                height={params.domeHeight}
                visible={params.showDome}
                currentHour={params.currentHour}
                daySpeed={params.daySpeed}
              />
              <Sun
                size={params.sunSize}
                distance={params.sunDistance}
                height={params.sunHeight}
                hour={params.currentHour}
                daySpeed={params.daySpeed}
                mode={params.sunLightMode}
                intensity={params.sunLightIntensity}
                color={params.sunLightColor}
                showCone={params.showLightCone}
                castShadows={params.sunCastShadows}
                spotAngleDeg={params.sunSpotAngleDeg}
              />
              <Moon
                size={params.moonSize}
                distance={params.moonDistance}
                height={params.moonHeight}
                hour={params.currentHour}
                daySpeed={params.daySpeed}
              />
              <Trajectories
                sunDistance={params.sunDistance}
                moonDistance={params.moonDistance}
                sunHeight={params.sunHeight}
                moonHeight={params.moonHeight}
                visible={params.showTrajectories}
              />
              <CityMarkers
                cities={sortedCities}
                radius={params.diskRadius}
                lonOffsetDeg={params.mapLonOffsetDeg}
                lonClockwise={params.mapLonClockwise}
              />
              <GridHelper size={params.diskRadius} visible={params.showGrid} />

              <OrbitControls
                ref={controlsRef}
                enablePan
                enableZoom
                enableRotate
                minPolarAngle={0}
                maxPolarAngle={Math.PI - 0.01}
              />
            </Suspense>
            <CompassRoseYawDriver rotRef={compassRotRef} />
          </Canvas>

          {/* Rose des vents */}
          <div
            style={{
              position: 'absolute',
              right: 12,
              bottom: selectedCity ? 12 + CITY_VIEW_BOTTOM_MARGIN : 12,
              width: 84,
              height: 84,
              color: '#e5e7eb',
              fontFamily: 'system-ui, sans-serif',
              userSelect: 'none',
              zIndex: 5,
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                background: 'rgba(13,16,24,0.55)',
                border: '1px solid #2b3545',
                boxShadow: '0 0 8px rgba(0,0,0,0.45) inset',
              }}
            />
            <div ref={compassRotRef} style={{ position: 'absolute', inset: 0 }}>
              <span style={{ position: 'absolute', top: 4, left: '50%', transform: 'translateX(-50%)', fontSize: 12, fontWeight: 700, color: '#fca5a5' }}>N</span>
              <span style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', fontSize: 12 }}>E</span>
              <span style={{ position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)', fontSize: 12 }}>S</span>
              <span style={{ position: 'absolute', left: 4, top: '50%', transform: 'translateY(-50%)', fontSize: 12 }}>O</span>
              {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
                <div
                  key={deg}
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    width: 2,
                    height: deg % 90 === 0 ? 10 : 6,
                    background: '#4b5563',
                    transformOrigin: 'center calc(42px)',
                    transform: `translate(-50%, -42px) rotate(${deg}deg)`,
                    borderRadius: 1,
                    opacity: deg % 90 === 0 ? 0.9 : 0.6,
                  }}
                />
              ))}
            </div>
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: 6,
                height: 6,
                background: '#94a3b8',
                borderRadius: '50%',
                transform: 'translate(-50%, -50%)',
                boxShadow: '0 0 4px rgba(255,255,255,0.4)',
              }}
            />
          </div>
        </div>

        {/* Panneau droit */}
        <div
          style={{
            width: 340,
            height: '100%',
            borderLeft: '1px solid #222',
            display: 'flex',
            flexDirection: 'column',
            background: '#0d0f12',
          }}
        >
          {/* Contenu du panneau (scroll si nécessaire) */}
          <div style={{ flex: 1, minHeight: 0 }}>
            <ControlPanel
              params={params}
              setParams={setParams}
              onReset={resetCamera}
              isExpanded={isExpanded}
              onToggleExpand={() => setIsExpanded((v) => !v)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}