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
    Mercury: { id: 'Mercury', az: 10, alt: 10, appDiamDeg: 0 },
    Venus:   { id: 'Venus',   az: 15, alt: 15, appDiamDeg: 0 },
    Mars:    { id: 'Mars',    az: 20, alt: 20, appDiamDeg: 0 },
    Jupiter: { id: 'Jupiter', az: 25, alt: 25, appDiamDeg: 0 },
    Saturn:  { id: 'Saturn',  az: 30, alt: 30, appDiamDeg: 0 },
    Uranus:  { id: 'Uranus',  az: 35, alt: 35, appDiamDeg: 0 },
    Neptune: { id: 'Neptune', az: 40, alt: 40, appDiamDeg: 0 },
  };
  return base;
}