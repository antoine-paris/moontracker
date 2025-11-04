import React, { useRef, useState, useMemo, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber'; // + useThree
import { OrbitControls, Text, Line, useTexture, Billboard, useHelper } from '@react-three/drei';
import * as THREE from 'three';


const EARTH_CIRCUMFERENCE_KM = 40075; // diamètre du disque = circonférence terrestre

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

// Projection azimutale équidistante centrée sur le pôle Nord
// Réglages pour aligner la projection sur la texture du planisphère
const MAP_LON_OFFSET_DEG = 0;      // rotation de la texture (déplace le méridien de référence)
const MAP_LON_CLOCKWISE = false;   // true si la texture inverse l’est/ouest


// Projection azimutale équidistante centrée sur le pôle Nord
function latLonToXZ(latDeg: number, lonDeg: number, diskRadius: number) {
  // r: 0 au pôle Nord, 0.5*R à l’équateur, R au pôle Sud
  const colat = 90 - latDeg;                 // [0..180]
  const r = (colat / 180) * diskRadius;

  // 0° en haut (+Z), 90E à droite (+X). Option d’inversion/décalage via constantes.
  const lon = (MAP_LON_CLOCKWISE ? -lonDeg : lonDeg) + MAP_LON_OFFSET_DEG;
  const theta = THREE.MathUtils.degToRad(lon);

  const x = r * Math.sin(theta);
  const z = r * Math.cos(theta);
  return [x, z] as const;
}

function CityMarkers({ cities, radius }: { cities: City[]; radius: number }) {
  return (
    <group>
      {cities.map((c) => {
        const [x, z] = latLonToXZ(c.lat, c.lon, radius);
        const markerR = 0.1;
        const labelOffset = 0.04;
        return (
          <group key={c.id} position={[x, 0, z]}>
            <mesh position={[0, 0, 0]} castShadow>
              <sphereGeometry args={[markerR, 16, 16]} />
              <meshStandardMaterial color="#ff5555" emissive="#aa2222" emissiveIntensity={0.6} />
            </mesh>
            <Billboard position={[0, markerR + labelOffset, 0]} follow>
              <Text fontSize={0.12} color="#ffdede" anchorX="center" anchorY="bottom" maxWidth={0.8}>
                {c.label}
              </Text>
            </Billboard>
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
}

// Composant pour le disque terrestre
function EarthDisk({ radius }: { radius: number }) {
  // Texture depuis le dossier public => accessible via /img/flatearth/flatearth.png
  const texture = useTexture('/img/flatearth/flatearth.png');
  useMemo(() => {
    if ('colorSpace' in texture) {
      (texture as any).colorSpace = THREE.SRGBColorSpace;
    } else {
      (texture as any).encoding = THREE.sRGBEncoding;
    }
    texture.anisotropy = 8;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
  }, [texture]);

  return (
    <group>
      {/* Disque texturé */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <circleGeometry args={[radius, 128]} />
        <meshStandardMaterial
          map={texture}
          color="#ffffff"
          roughness={0.9}
          metalness={0.0}
          side={THREE.DoubleSide}
          transparent
          alphaTest={0.1}
        />
      </mesh>

      {/* Cercles concentriques pour les latitudes (légers) */}
      {[0.2, 0.4, 0.6, 0.8].map((ratio) => (
        <mesh key={ratio} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <ringGeometry args={[radius * ratio - 0.1, radius * ratio + 0.1, 64]} />
          <meshBasicMaterial color="#ffffff" opacity={0.18} transparent />
        </mesh>
      ))}

      {/* Centre (Pôle Nord) */}
      <mesh position={[0, 0.1, 0]} castShadow>
        <cylinderGeometry args={[0.5, 0.5, 0.2, 32]} />
        <meshStandardMaterial color="#f0f0f0" />
      </mesh>

      
    </group>
  );
}

// Composant pour le dôme céleste
function CelestialDome({ radius, height, visible }: { radius: number; height: number; visible: boolean }) {
  const starsRef = useRef<THREE.Points>(null);

  const starsGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    for (let i = 0; i < 1200; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI / 2;
      const r = radius * 0.95;
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);
      vertices.push(x, z, y);
    }
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    return geometry;
  }, [radius]);

  // Sprite circulaire pour étoiles (rond + bord doux)
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

  useFrame(() => {
    if (starsRef.current) starsRef.current.rotation.y += 0.0001;
  });

  if (!visible) return null;

  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <sphereGeometry args={[radius, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshBasicMaterial color="#0b1e3a" opacity={0.1} transparent side={THREE.BackSide} />
      </mesh>
      <points ref={starsRef}>
        <primitive attach="geometry" object={starsGeometry} />
        <pointsMaterial
          attach="material"
          color="#ffffff"
          size={0.75}              // plus petites
          sizeAttenuation
          map={starSprite}         // rondes via sprite
          transparent
          alphaTest={0.5}          // coupe les pixels carrés
          depthWrite={false}       // meilleur blending
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

  // Helper pour le projecteur
  useHelper(mode === 'spot' && showCone ? spotLightRef : null, THREE.SpotLightHelper, '#ffaa00');

  useFrame(() => {
    const angle = (hour / 24) * Math.PI * 2 - Math.PI / 2;
    const x = Math.cos(angle) * distance;
    const z = Math.sin(angle) * distance;
    const y = height;

    sunMeshRef.current?.position.set(x, y, z);

    if (mode === 'spot' && spotLightRef.current && spotTargetRef.current) {
      spotLightRef.current.position.set(x, y, z);
      // vertical: cible directement sous le soleil
      spotTargetRef.current.position.set(x, 0, z);
      spotLightRef.current.target = spotTargetRef.current;
      spotLightRef.current.target.updateMatrixWorld();
    }
  });

  return (
    <>
      <mesh ref={sunMeshRef} castShadow={false}>
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial color="#ffd166" emissive="#ffd166" emissiveIntensity={1.2} roughness={0.2} metalness={0} />
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
            shadow-camera-near={0.5}
            shadow-camera-far={1500}
          />
          <object3D ref={spotTargetRef} />
        </>
      )}

      {mode === 'point' && (
        <pointLight
          position={[
            Math.cos((hour / 24) * Math.PI * 2 - Math.PI / 2) * distance,
            height,
            Math.sin((hour / 24) * Math.PI * 2 - Math.PI / 2) * distance,
          ]}
          intensity={intensity}
          color={color}
          distance={0}
          castShadow={castShadows}
        />
      )}
    </>
  );
}

// Composant pour la Lune
function Moon({ size, distance, height, hour }: { 
  size: number; 
  distance: number; 
  height: number; 
  hour: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    const angle = ((hour + 12) / 24) * Math.PI * 2 - Math.PI / 2;
    if (meshRef.current) {
      meshRef.current.position.x = Math.cos(angle) * distance;
      meshRef.current.position.z = Math.sin(angle) * distance;
      meshRef.current.position.y = height;
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


// Composant pour afficher les trajectoires
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
function ControlPanel({ params, setParams, onReset }: { 
  params: FlatEarthParams; 
  setParams: React.Dispatch<React.SetStateAction<FlatEarthParams>>;
  onReset: () => void;
}) {
  // conversion: 1 unité scène = (circumference / (2*radius)) km
  const kmPerUnit = EARTH_CIRCUMFERENCE_KM / (2 * params.diskRadius);
  const fmtKm = (u: number) => `${Math.round(u * kmPerUnit)} km`;

  // Estimation diamètre éclairé (approx 2*h*tan(angle))
  const approxSpotDiameterKm =
    Math.round((2 * params.sunHeight * Math.tan(THREE.MathUtils.degToRad(params.sunSpotAngleDeg))) * kmPerUnit);

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
      overflowY: 'auto',
      boxSizing: 'border-box',
      fontSize: '12px',        // <-- texte réduit globalement
      lineHeight: 1.2
    }}>
      {/* Slider FOV AVANT "Temps" */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '12px', marginBottom: '8px' }}>
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
      </div>

      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <label style={{ display: 'block', fontSize: '12px', marginBottom: 0, flex: 1, minWidth: 0 }}>
            Heure du jour : {params.currentHour.toFixed(1)}h
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

          <label style={{ display: 'block', fontSize: '12px', marginBottom: 0, flex: 1, minWidth: 0 }}>
            Vitesse du temps : ×{params.daySpeed}
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={params.daySpeed}
              onChange={(e) => setParams({ ...params, daySpeed: parseFloat(e.target.value) })}
              style={{ width: '100%', fontSize: '12px' }}
            />
          </label>
        </div>
      </div>
      
      {/* Sliders Soleil sur une seule ligne */}
      <div style={{ display: 'flex', gap: 12, marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '12px', marginBottom: 0, flex: 1, minWidth: 0 }}>
          Soleil : {fmtKm(params.sunHeight)}
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

        <label style={{ display: 'block', fontSize: '12px', marginBottom: 0, flex: 1, minWidth: 0 }}>
          {fmtKm(params.sunSize*2)}
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

        <label style={{ display: 'block', fontSize: '12px', marginBottom: 0, flex: 1, minWidth: 0 }}>
          {fmtKm(params.sunDistance)}
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

      {/* Sliders Lune sur une seule ligne */}
      <div style={{ display: 'flex', gap: 12, marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '12px', marginBottom: '8px' }}>
          ☾ {fmtKm(params.moonHeight)}
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

        <label style={{ display: 'block', fontSize: '12px', marginBottom: '8px' }}>
          {fmtKm(params.moonSize*2)}
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
        
        <label style={{ display: 'block', fontSize: '12px', marginBottom: '8px' }}>
          {fmtKm(params.moonDistance)}
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

      <label style={{ display: 'block', fontSize: '12px', marginBottom: '8px' }}>
        Hauteur du dôme : {fmtKm(params.domeHeight)}
        <input
          type="range"
          min="50"
          max="100"
          step="5"
          value={params.domeHeight}
          onChange={(e) => setParams({ ...params, domeHeight: parseFloat(e.target.value) })}
          style={{ width: '100%', fontSize: '12px' }}
        />
      </label>
    
      <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px' }}>
        <input
          type="checkbox"
          checked={params.showDome}
          onChange={(e) => setParams({ ...params, showDome: e.target.checked })}
        />
        {' '}Afficher le dôme
      </label>
      
      <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px' }}>
        <input
          type="checkbox"
          checked={params.showLightCone}
          onChange={(e) => setParams({ ...params, showLightCone: e.target.checked })}
        />
        {' '}Afficher le cône de lumière
      </label>
      
      <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px' }}>
        <input
          type="checkbox"
          checked={params.showTrajectories}
          onChange={(e) => setParams({ ...params, showTrajectories: e.target.checked })}
        />
        {' '}Afficher les trajectoires
      </label>

      {/* Lumière du Soleil */}
      <div style={{ marginBottom: '16px', padding: '8px', border: '1px solid #222', borderRadius: 6 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <label style={{ display: 'block', fontSize: '12px', flex: 1 }}>
            Intensité: {params.sunLightIntensity.toFixed(1)}
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
        </div>

        {/* Largeur du faisceau: <=90° => spot, 91° => point */}
        <div style={{ marginTop: 8 }}>
          <label style={{ display: 'block', fontSize: '12px' }}>
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
        </div>
      </div>

      
      <button
        onClick={() => {
          setParams({
            diskRadius: 50,
            domeHeight: 50,
            sunHeight: 12,
            moonHeight: 11,
            sunSize: 0.07,
            moonSize: 0.06,
            sunDistance: 25,
            moonDistance: 20,
            daySpeed: 0,
            currentHour: 12,
            latitude: 45,
            showDome: true,
            showGrid: false,
            showLightCone: false,
            showTrajectories: true,
            cameraFov: 50,

            sunLightMode: 'spot',
            sunLightIntensity: 1000,
            sunLightColor: '#ffffff',
            sunCastShadows: true,
            sunSpotAngleDeg: 70,

            showMoon: true,
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
          cursor: 'pointer',
          fontSize: '12px'
        }}
      >
        Réinitialiser
      </button>
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

// Composant principal
export default function FlatEarthSimulator() {
  const [params, setParams] = useState<FlatEarthParams>({
    diskRadius: 50,
    domeHeight: 50,
    sunHeight: 12,
    moonHeight: 10,
    sunSize: 0.07,
    moonSize: 0.06,
    sunDistance: 25,
    moonDistance: 20,
    daySpeed: 0,
    currentHour: 12,
    latitude: 45,
    showDome: true,
    showGrid: false,
    showLightCone: false,
    showTrajectories: true,
    cameraFov: 50,

    sunLightMode: 'spot',
    sunLightIntensity: 1000.0,
    sunLightColor: '#ffffff',
    sunCastShadows: true,
    sunSpotAngleDeg: 70,
    showMoon: true,
  });

  const controlsRef = useRef<any>(null);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);

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

    const [x, z] = latLonToXZ(city.lat, city.lon, params.diskRadius);

    const r = Math.hypot(x, z) || 1;
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
function CameraPrincipalPointOffset({ bottomMarginPx = 50 }: { bottomMarginPx?: number }) {
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
    <div style={{ width: '100%', height: '100%', display: 'flex' }}>
      {/* Colonne gauche: barre villes au-dessus + Canvas en dessous */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* --- Barre de villes --- */}
        <div style={{
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          padding: '8px 10px',
          background: '#0d0f12',
          borderBottom: '1px solid #222',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
          color: '#ddd'
        }}>
          {sortedCities.map((c) => (
            <button
              key={c.id}
              onClick={() => focusCity(c)}
              style={{
                background: '#1f2937',
                border: '1px solid #2b3545',
                color: '#e5e7eb',
                padding: '6px 10px',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 12,
                whiteSpace: 'nowrap'
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
        {/* --- Canvas prend le reste --- */}
        <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
          <Canvas
            camera={{ position: [80, 60, 80], fov: params.cameraFov }}
            style={{ width: '100%', height: '100%' }}
            dpr={[1, 1.75]}
            shadows
            gl={{ antialias: true, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping }}
          >
            <CameraFovUpdater fov={params.cameraFov} />
            {selectedCity && <CameraPrincipalPointOffset bottomMarginPx={50} />}
            <color attach="background" args={['#0b1020']} />
            <Suspense fallback={null}>
              {/* Lights d'ambiance (gardez faibles pour mieux voir le spot) */}
              <hemisphereLight args={['#89b4fa', '#1f2937', 0.35]} />
              <ambientLight intensity={0.25} />
              {/* Supprimé: la directionnelle globale qui éclairait toute la scène */}

              {/* Scène */}
              <EarthDisk radius={params.diskRadius} />
              <CelestialDome radius={params.domeHeight} height={params.domeHeight} visible={params.showDome} />

              <Sun
                size={params.sunSize}
                distance={params.sunDistance}
                height={params.sunHeight}
                hour={params.currentHour}
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
              />

              <Trajectories
                sunDistance={params.sunDistance}
                moonDistance={params.moonDistance}
                sunHeight={params.sunHeight}
                moonHeight={params.moonHeight}
                visible={params.showTrajectories}   // FIX: was params.showTrajectoires
              />

              <CityMarkers cities={sortedCities} radius={params.diskRadius} />

              <GridHelper size={params.diskRadius} visible={params.showGrid} />
              
              <OrbitControls
                ref={controlsRef}
                enablePan
                enableZoom
                enableRotate
                minPolarAngle={0}
                maxPolarAngle={Math.PI / 2 - 0.01}
              />
            </Suspense>
          </Canvas>
        </div>
      </div>

      {/* Panneau droit */}
      <div style={{ width: 340, height: '100%', borderLeft: '1px solid #222' }}>
        <ControlPanel params={params} setParams={setParams} onReset={resetCamera} />
      </div>
    </div>
  );
}