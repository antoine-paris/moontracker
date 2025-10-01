import { MakeTime, Observer, Equator, Horizon, Illumination, Body, AstroTime } from 'astronomy-engine';
import { parallacticAngleFromAltAz } from './aeInterop';
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

// --- NEW: IAU/WGCCRE north pole (EQJ/J2000) for planets + position angle P ---

type Pole = { raDeg: number; decDeg: number };

// Julian centuries TT since J2000 (using Astronomy Engine)
function centuriesTT(date: Date): number {
  const t = new AstroTime(date);
  return t.tt / 36525.0;
}

// IAU 2009/2015 approximations for planet poles in EQJ (J2000), linear in T when applicable.
// Good enough for visual orientation overlays.
function planetPoleEqj(id: PlanetId, date: Date): Pole {
  const T = centuriesTT(date);
  switch (id) {
    case 'Mercury': return { raDeg: 281.0103 - 0.0328 * T, decDeg: 61.4155 - 0.0049 * T };
    case 'Venus':   return { raDeg: 272.76,               decDeg: 67.16 };
    case 'Mars':    return { raDeg: 317.68143 - 0.1061 * T, decDeg: 52.88650 - 0.0609 * T };
    case 'Jupiter': return { raDeg: 268.056595 - 0.006499 * T, decDeg: 64.495303 + 0.002413 * T };
    case 'Saturn':  return { raDeg: 40.589 - 0.036 * T,   decDeg: 83.537 - 0.004 * T };
    case 'Uranus':  return { raDeg: 257.311,              decDeg: -15.175 };
    case 'Neptune': return { raDeg: 299.36,               decDeg: 43.46 };
  }
}

// Position angle of the planet’s north pole (E from N), in EQJ/J2000 frame (deg).
export function planetNorthPositionAngleJ2000Deg(date: Date, id: PlanetId): number {
  const time = MakeTime(date);
  // Geocentric, EQJ (ofDate=false) for consistency with pole definition
  const eq = Equator(
    { Mercury: Body.Mercury, Venus: Body.Venus, Mars: Body.Mars, Jupiter: Body.Jupiter, Saturn: Body.Saturn, Uranus: Body.Uranus, Neptune: Body.Neptune }[id],
    time,
    new Observer(0, 0, 0),
    false,
    true
  );
  const a0 = (eq.ra * 15) * D2R;
  const d0 = (eq.dec) * D2R;

  const pole = planetPoleEqj(id, date);
  const ap = pole.raDeg * D2R;
  const dp = pole.decDeg * D2R;

  const y = Math.sin(ap - a0) * Math.cos(dp);
  const x = Math.sin(dp) * Math.cos(d0) - Math.cos(dp) * Math.sin(d0) * Math.cos(ap - a0);
  return -Math.atan2(y, x) * R2D; // [-180,180], east from north
}

// Orientation angles relative to the local horizon at observer location (deg).
export function getPlanetOrientationAngles(
  when: Date | number,
  latitudeDeg: number,
  longitudeDeg: number,
  id: PlanetId
): {
  qDeg: number;                             // parallactic angle at planet
  planetPolePositionAngleDeg: number;       // P (E from N), EQJ/J2000
  rotationToHorizonDeg: number;             // celestial-N up
  rotationToHorizonDegPlanetNorth: number;  // planet-N up
} {
  const date = typeof when === 'number' ? new Date(when) : when;
  const time = MakeTime(date);
  const obs = new Observer(latitudeDeg, longitudeDeg, 0);
  const body = ({ Mercury: Body.Mercury, Venus: Body.Venus, Mars: Body.Mars, Jupiter: Body.Jupiter, Saturn: Body.Saturn, Uranus: Body.Uranus, Neptune: Body.Neptune })[id];

  // Topocentric apparent for local parallactic angle
  const eqTopo = Equator(body, time, obs, true, true);
  const hz = Horizon(time, obs, eqTopo.ra, eqTopo.dec, 'normal');
  const q = parallacticAngleFromAltAz(hz.azimuth, hz.altitude, latitudeDeg);

  // J2000 position angle of the planet north pole
  const P = planetNorthPositionAngleJ2000Deg(date, id);

  return {
    qDeg: q,
    planetPolePositionAngleDeg: P,
    rotationToHorizonDeg: -q,
    rotationToHorizonDegPlanetNorth: -q + P,
  };
}

// Batch helper for multiple planets
export function getPlanetsOrientationAngles(
  when: Date | number,
  latitudeDeg: number,
  longitudeDeg: number,
  includeIds?: PlanetId[]
): Record<PlanetId, {
  qDeg: number;
  planetPolePositionAngleDeg: number;
  rotationToHorizonDeg: number;
  rotationToHorizonDegPlanetNorth: number;
}> {
  const ids: PlanetId[] = includeIds && includeIds.length
    ? includeIds
    : ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'];
  const res = {} as any;
  ids.forEach(id => { res[id] = getPlanetOrientationAngles(when, latitudeDeg, longitudeDeg, id); });
  return res;
}