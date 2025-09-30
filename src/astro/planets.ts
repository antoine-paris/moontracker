import { MakeTime, Observer, Equator, Horizon, Illumination, Body } from 'astronomy-engine';
import { AU_KM } from './sun';

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

// Mean planetary radii (km) — used for apparent diameter
const MEAN_RADIUS_KM: Record<PlanetId, number> = {
  Mercury: 2439.7,
  Venus:   6051.8,
  Mars:    3389.5,
  Jupiter: 69911,    // mean radius
  Saturn:  58232,    // mean radius
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
 * Compute all 7 planets (topocentric alt/az + apparent diameter) using astronomy-engine.
 * Accepts Date or epoch ms; elevation and timezone are optional to keep compatibility with older calls.
 */
export function getPlanetsEphemerides(
  when: Date | number,
  latitudeDeg: number,
  longitudeDeg: number,
  elevationM = 0,
  _timeZone?: string
): PlanetsEphemerides {
  const date = typeof when === 'number' ? new Date(when) : when;
  const time = MakeTime(date);
  const obs = new Observer(latitudeDeg, longitudeDeg, elevationM);

  // Compute Sun RA/Dec once (topocentric apparent-of-date)
  const eqSun = Equator(Body.Sun, time, obs, true, true);
  const alphaSunDeg = eqSun.ra * 15; // hours -> degrees
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

  (Object.keys(mapBody) as PlanetId[]).forEach((id) => {
    const body = mapBody[id];
    // Topocentric apparent RA/Dec
    const eq = Equator(body, time, obs, true, true);
    // Alt/Az with standard refraction
    const hz = Horizon(time, obs, eq.ra, eq.dec, 'normal');
    // Distance (AU -> km)
    const distKm = Math.max(1e-6, eq.dist * AU_KM);
    // Apparent diameter (deg)
    const radiusKm = MEAN_RADIUS_KM[id];
    const appDiamDeg = apparentDiameterDeg(radiusKm, distKm);

    // Phase (illumination fraction)
    const illum = Illumination(body, time);
    const phaseFraction = illum.phase_fraction;

    // Bright limb position angle (deg) measured from celestial north toward east
    const alphaPlanetDeg = eq.ra * 15; // hours -> degrees
    const deltaPlanetDeg = eq.dec;
    const brightLimbAngleDeg = brightLimbPAdeg(alphaPlanetDeg, deltaPlanetDeg, alphaSunDeg, deltaSunDeg);

    // Base result
    const base: PlanetEphemeris = {
      id,
      az: hz.azimuth,
      alt: hz.altitude,
      appDiamDeg,
    };

    // Only attach phase info for Mercury/Venus (others omit to keep object small)
    if (id === 'Mercury' || id === 'Venus' || id === 'Mars') {
      base.phaseFraction = phaseFraction;
      base.brightLimbAngleDeg = brightLimbAngleDeg;
    }

    out[id] = base;
  });

  return out;
}