import { MakeTime, Observer, Equator, Horizon, Illumination, Body } from 'astronomy-engine';
import { AU_KM } from './sun';

export type PlanetId = 'Mercury' | 'Venus' | 'Mars' | 'Jupiter' | 'Saturn' | 'Uranus' | 'Neptune';

export type PlanetEphemeris = {
  id: PlanetId;
  // Topocentric apparent
  az: number;         // degrees
  alt: number;        // degrees
  appDiamDeg: number; // apparent angular diameter in degrees
  distAU: number;     // topocentric distance in AU   <-- NEW
  // Optional phase info (relevant to Mercury/Venus only)
  phaseFraction?: number;        // 0..1
  brightLimbAngleDeg?: number;   // PA of bright limb
  // For inferior planets only: relative position w.r.t. the Sun-Earth line
  // 'near'  => planet is between Earth and Sun (closer to Earth than the Sun)
  // 'far'   => planet is on the far side of the Sun (farther from Earth than the Sun)
  sunSide?: 'near' | 'far';
};

export type PlanetsEphemerides = Record<PlanetId, PlanetEphemeris>;

// Mean planetary radii (km) — used for apparent diameter
const MEAN_RADIUS_KM: Record<PlanetId, number> = {
  Mercury: 2439.7,
  Venus:   6051.8,
  Mars:    3389.5,
  Jupiter: 69911,
  Saturn:  58232,
  Uranus:  25362,
  Neptune: 24622,
};

const R2D = 180 / Math.PI;
const D2R = Math.PI / 180;

function normalizeAngle360(deg: number): number {
  let a = deg % 360;
  if (a < 0) a += 360;
  return a;
}

// Position angle of the Sun as seen from the planet disc, measured from celestial north toward east (deg).
function brightLimbPAdeg(alphaPlanetDeg: number, deltaPlanetDeg: number, alphaSunDeg: number, deltaSunDeg: number): number {
  const ap = alphaPlanetDeg * D2R;
  const dp = deltaPlanetDeg * D2R;
  const as = alphaSunDeg * D2R;
  const ds = deltaSunDeg * D2R;

  const dAlpha = as - ap;
  const num = Math.cos(ds) * Math.sin(dAlpha);
  const den = Math.sin(ds) * Math.cos(dp) - Math.cos(ds) * Math.sin(dp) * Math.cos(dAlpha);
  let pa = Math.atan2(num, den) * R2D;
  return normalizeAngle360(pa);
}

// Small-angle-safe apparent diameter from radius and distance (km → deg)
function apparentDiameterDeg(radiusKm: number, distanceKm: number): number {
  if (!Number.isFinite(radiusKm) || !Number.isFinite(distanceKm) || distanceKm <= 0) return 0;
  // full diameter = 2 * atan(R / d)
  return 2 * Math.atan(radiusKm / Math.max(1e-6, distanceKm)) * R2D;
}

/**
 * Compute selected planets (topocentric alt/az + apparent diameter) using astronomy-engine.
 * If includeIds is omitted/empty, computes all 7 planets (backward compatible).
 */
export function getPlanetsEphemerides(
  when: Date | number,
  latitudeDeg: number,
  longitudeDeg: number,
  elevationM = 0,
  _timeZone?: string,
  includeIds?: PlanetId[]
): PlanetsEphemerides {
  const date = typeof when === 'number' ? new Date(when) : when;
  const time = MakeTime(date);
  const obs = new Observer(latitudeDeg, longitudeDeg, elevationM);

  // Compute Sun RA/Dec once (topocentric apparent-of-date)
  const eqSun = Equator(Body.Sun, time, obs, true, true);
  const alphaSunDeg = eqSun.ra * 15;
  const deltaSunDeg = eqSun.dec;

  const mapBody: Record<PlanetId, Body> = {
    Mercury: Body.Mercury,
    Venus:   Body.Venus,
    Mars:    Body.Mars,
    Jupiter: Body.Jupiter,
    Saturn:  Body.Saturn,
    Uranus:  Body.Uranus,
    Neptune: Body.Neptune,
  };

  const out = {} as PlanetsEphemerides;

  const ids: PlanetId[] =
    (includeIds && includeIds.length)
      ? includeIds
      : (Object.keys(mapBody) as PlanetId[]);

  ids.forEach((id) => {
    const body = mapBody[id];
    const eq = Equator(body, time, obs, true, true);
    const hz = Horizon(time, obs, eq.ra, eq.dec, 'normal');
    // Distance (AU -> km)
    const distKm = Math.max(1e-6, eq.dist * AU_KM);
    // Apparent diameter (deg) via helper
    const radiusKm = MEAN_RADIUS_KM[id];
    const appDiamDeg = apparentDiameterDeg(radiusKm, distKm);

    // Phase (illumination fraction)
    const illum = Illumination(body, time);
    const phaseFraction = illum.phase_fraction;

    // Bright limb position angle via helper
    const alphaPlanetDeg = eq.ra * 15;
    const deltaPlanetDeg = eq.dec;
    const brightLimbAngleDeg = brightLimbPAdeg(alphaPlanetDeg, deltaPlanetDeg, alphaSunDeg, deltaSunDeg); // FIX

    // Near-side vs far-side relative to the Sun (inferior vs superior side)
    const planetDistAU = eq.dist;
    const sunDistAU = eqSun.dist; // ~1 AU
    const sunSide: 'near' | 'far' = planetDistAU < sunDistAU ? 'near' : 'far';

    const base: PlanetEphemeris = {
      id,
      az: hz.azimuth,
      alt: hz.altitude,
      appDiamDeg,
      distAU: planetDistAU, // NEW
    };

    if (id === 'Mercury' || id === 'Venus' || id === 'Mars') {
      base.phaseFraction = phaseFraction;
      base.brightLimbAngleDeg = brightLimbAngleDeg;
    }
    if (id === 'Mercury' || id === 'Venus') {
      base.sunSide = sunSide;
    }

    out[id] = base;
  });
  return out;
}