import type { PlanetId } from '../astro/planets';

export const PLANETS: PlanetId[] = ['Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune'];

export type PlanetRenderInfo = {
  id: PlanetId;
  label: string;
  color: string;    // fallback for small "dot"
  modelUrl: string; // GLB in assets
  hasRings?: boolean; // Saturn
};

export const PLANET_REGISTRY: Record<PlanetId, PlanetRenderInfo> = {
  Mercury: { id: 'Mercury', label: 'Mercure', color: '#b1b1b1', modelUrl: new URL('../assets/mercury.glb', import.meta.url).href },
  Venus:   { id: 'Venus',   label: 'Vénus',   color: '#e0c16c', modelUrl: new URL('../assets/venus.glb',   import.meta.url).href },
  Mars:    { id: 'Mars',    label: 'Mars',    color: '#d8694e', modelUrl: new URL('../assets/mars.glb',    import.meta.url).href },
  Jupiter: { id: 'Jupiter', label: 'Jupiter', color: '#d8b58f', modelUrl: new URL('../assets/jupiter.glb', import.meta.url).href },
  Saturn:  { id: 'Saturn',  label: 'Saturne', color: '#d9c7a4', modelUrl: new URL('../assets/saturn.glb',  import.meta.url).href, hasRings: true },
  Uranus:  { id: 'Uranus',  label: 'Uranus',  color: '#8fd0d8', modelUrl: new URL('../assets/uranus.glb',  import.meta.url).href },
  Neptune: { id: 'Neptune', label: 'Neptune', color: '#6a8fd8', modelUrl: new URL('../assets/neptune.glb', import.meta.url).href },
};

// Heuristic thresholds (px) similar to Moon auto-switching
export const PLANET_DOT_MIN_PX = 5;
export const PLANET_3D_MIN_PX  = 50;