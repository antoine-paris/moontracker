// Common coordinate types
export interface AltAz {
  altDeg: number;
  azDeg: number;
}

export interface RaDec {
  raDeg: number;
  decDeg: number;
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface ScreenPos {
  x: number;
  y: number;
  visible?: boolean;
  visibleX?: boolean;
  visibleY?: boolean;
}

// Astronomical body data
export interface CelestialBody extends AltAz {
  distAU?: number;
  distKm?: number;
  appDiamDeg?: number;
  phaseFraction?: number;
}

// Orientation angles
export interface OrientationAngles {
  qDeg: number;
  rotationToHorizonDeg: number;
  positionAngleDeg?: number;
}

export type FollowMode = 'SOLEIL' | 'LUNE' | 'N' | 'E' | 'S' | 'O' | 'MERCURE' | 'VENUS' | 'MARS' | 'JUPITER' | 'SATURNE' | 'URANUS' | 'NEPTUNE';

export type LocationOption = {
  id: string;
  label: string; // Pays — Capitale
  lat: number;
  lng: number;
  timeZone: string;
};
