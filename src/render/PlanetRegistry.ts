import type { PlanetId } from '../astro/planets';
import * as THREE from 'three';
import i18n from '../i18n/index';

export const PLANETS: PlanetId[] = ['Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune'];

export type PlanetRenderInfo = {
  id: PlanetId;
  label: string;
  color: string;    // fallback for small "dot"
  modelUrl: string; // GLB in assets
  hasRings?: boolean; // Saturn
};

// Helper function to get translated celestial body names
const getCelestialBodyName = (key: string): string => {
  return i18n.t(`ui:celestialBodies.${key.toLowerCase()}`);
};

// Function to get dynamic planet registry with current translations
export const getPlanetRegistry = () => ({
  Mercury: { 
    id: 'Mercury', label: getCelestialBodyName('mercury'), color: '#b1b1b1', modelUrl: new URL('../assets/Mercury.glb', import.meta.url).href,
    render: {
      sunlightIntensity: 1.0,
      ambientFillIntensity: 0.1,
      noPhaseAmbientIntensity: 0.5,
      reliefScale: 0.5,
      glbCalib: { 
          rotationBaseDeg: { x: 0, y: 0, z: 0 },
          northLocal: new THREE.Vector3(0, 0, -1),
          viewForwardLocal: new THREE.Vector3(0, 0, 1),
          lon0EquatorLocal: new THREE.Vector3(-1, 0, 0),
       },
    },
   },
  Venus:   { id: 'Venus',   label: getCelestialBodyName('venus'),   color: '#e0c16c', modelUrl: new URL('../assets/Venus.glb',   import.meta.url).href,
    render: {
      sunlightIntensity: 0.8,
      ambientFillIntensity: 0.02,
      noPhaseAmbientIntensity: 0.5,
      reliefScale: 0.5,
      glbCalib: { 
          rotationBaseDeg: { x: 0, y: 0, z: 0 },
          northLocal: new THREE.Vector3(0, 0, -1),
          viewForwardLocal: new THREE.Vector3(0, 0, 1),
          lon0EquatorLocal: new THREE.Vector3(-1, 0, 0),
       },
    },
   },
  Mars:    { id: 'Mars',    label: getCelestialBodyName('mars'),    color: '#d8694e', modelUrl: new URL('../assets/Mars.glb',    import.meta.url).href,
    render: {
      sunlightIntensity: 1.0,
      ambientFillIntensity: 0.05,
      noPhaseAmbientIntensity: 0.5,
      reliefScale: 0.5,
      glbCalib: { 
          rotationBaseDeg: { x: 0, y: 0, z: 0 },
          northLocal: new THREE.Vector3(0, 0, -1),
          viewForwardLocal: new THREE.Vector3(0, 0, 1),
          lon0EquatorLocal: new THREE.Vector3(-1, 0, 0),
       },
    },



   },
  Jupiter: { id: 'Jupiter', label: getCelestialBodyName('jupiter'), color: '#d8b58f', modelUrl: new URL('../assets/Jupiter.glb', import.meta.url).href,
    render: {
      sunlightIntensity: 0.8,
      ambientFillIntensity: 0.02,
      noPhaseAmbientIntensity: 0.5,
      reliefScale: 0.5,
      glbCalib: { 
          rotationBaseDeg: { x: 0, y: 0, z: 0 },
          northLocal: new THREE.Vector3(0, 0, -1),
          viewForwardLocal: new THREE.Vector3(0, 0, 1),
          lon0EquatorLocal: new THREE.Vector3(-1, 0, 0),
       },
    },
   },
  Saturn:  { id: 'Saturn',  label: getCelestialBodyName('saturn'), color: '#d9c7a4', modelUrl: new URL('../assets/Saturn.glb',  import.meta.url).href, hasRings: true,
    render: {
      sunlightIntensity: 1.0,
      ambientFillIntensity: 0.2,
      noPhaseAmbientIntensity: 0.5,
      reliefScale: 1,
      glbCalib: { 
          rotationBaseDeg: { x: 0, y: 0, z: 0 },
          northLocal: new THREE.Vector3(0, 0, -1),
          viewForwardLocal: new THREE.Vector3(0, 0, 1),
          lon0EquatorLocal: new THREE.Vector3(-1, 0, 0),
       },
    },
   },
  Uranus:  { id: 'Uranus',  label: getCelestialBodyName('uranus'),  color: '#8fd0d8', modelUrl: new URL('../assets/Uranus.glb',  import.meta.url).href,
    render: {
      sunlightIntensity: 0.8,
      ambientFillIntensity: 0.02,
      noPhaseAmbientIntensity: 0.5,
      reliefScale: 0.5,
      glbCalib: { 
          rotationBaseDeg: { x: 0, y: 0, z: 0 },
          northLocal: new THREE.Vector3(0, 0, -1),
          viewForwardLocal: new THREE.Vector3(0, 0, 1),
          lon0EquatorLocal: new THREE.Vector3(-1, 0, 0),
       },
    }, },
  Neptune: { id: 'Neptune', label: getCelestialBodyName('neptune'), color: '#6a8fd8', modelUrl: new URL('../assets/Neptune.glb', import.meta.url).href,
    render: {
      sunlightIntensity: 0.8,
      ambientFillIntensity: 0.02,
      noPhaseAmbientIntensity: 0.5,
      reliefScale: 0.5,
      glbCalib: { 
          rotationBaseDeg: { x: 0, y: 0, z: 0 },
          northLocal: new THREE.Vector3(0, 0, -1),
          viewForwardLocal: new THREE.Vector3(0, 0, 1),
          lon0EquatorLocal: new THREE.Vector3(-1, 0, 0),
       },
    },
   },
});

// Static constant for backward compatibility
export const PLANET_REGISTRY = getPlanetRegistry();

// Heuristic thresholds (px) similar to Moon auto-switching
export const PLANET_DOT_MIN_PX = 5;
export const PLANET_3D_MIN_PX  = 20;
export const PLANET_3D_SWITCH_PX = 20;
