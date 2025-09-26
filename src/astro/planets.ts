export type PlanetId = 'Mercury' | 'Venus' | 'Mars' | 'Jupiter' | 'Saturn' | 'Uranus' | 'Neptune';

export type PlanetEphemeris = {
  id: PlanetId;
  // Topocentric apparent
  az: number;         // degrees
  alt: number;        // degrees
  appDiamDeg: number; // apparent angular diameter in degrees
  // Optional phase info (relevant to Mercury/Venus only)
  phaseFraction?: number;        // 0..1
  brightLimbAngleDeg?: number;   // PA of bright limb
};

export type PlanetsEphemerides = Record<PlanetId, PlanetEphemeris>;

/**
 * Compute all 7 planets (topocentric alt/az + apparent diameter).
 * TODO: implement with VSOP87/NPM ephemerides or an existing helper if present.
 */
export function getPlanetsEphemerides(
  whenUtcMs: number,
  latitudeDeg: number,
  longitudeDeg: number,
  elevationM: number,
  timeZone: string
): PlanetsEphemerides {
  // ...existing code...
  // Placeholder so the project compiles; replace with real ephemerides.
  const base: PlanetsEphemerides = {
    Mercury: { id: 'Mercury', az: 0, alt: -90, appDiamDeg: 0 },
    Venus:   { id: 'Venus',   az: 0, alt: -90, appDiamDeg: 0 },
    Mars:    { id: 'Mars',    az: 0, alt: -90, appDiamDeg: 0 },
    Jupiter: { id: 'Jupiter', az: 0, alt: -90, appDiamDeg: 0 },
    Saturn:  { id: 'Saturn',  az: 0, alt: -90, appDiamDeg: 0 },
    Uranus:  { id: 'Uranus',  az: 0, alt: -90, appDiamDeg: 0 },
    Neptune: { id: 'Neptune', az: 0, alt: -90, appDiamDeg: 0 },
  };
  return base;
}