import { MakeTime, Observer, Equator, Horizon, Illumination, MoonPhase, Body,  AstroTime, GeoVector, RAD2DEG} from 'astronomy-engine';
import { AU_KM } from './sun';

function clamp360(x: number): number { let y = x % 360; if (y < 0) y += 360; return y; }
function norm360(x: number): number { return clamp360(x); }
const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;

export const R_SUN_KM = 695700;

// Julian day UTC
function jdUTC(date: Date): number { return date.getTime() / 86400000 + 2440587.5; }
// ΔT approx (s) — approximation grossière suffisante pour affichage
function deltaTSecondsApprox(year: number, month: number): number {
  const y = year + (month - 0.5) / 12;
  if (y < 2005) { const t = (y - 2000) / 100; return 62.92 + 32.217*t + 55.89*t*t; }
  if (y < 2050) { const t = (y - 2000) / 100; return 62.92 + 32.217*t + 55.89*t*t; }
  const u = (y - 1820) / 100; return -20 + 32*u*u;
}
// Siècles juliens TT depuis J2000.0
function julianCenturiesTT(date: Date): number {
  const jd = jdUTC(date);
  const dt = deltaTSecondsApprox(date.getUTCFullYear(), date.getUTCMonth() + 1);
  const jdTT = jd + (dt + 32.184) / 86400;
  return (jdTT - 2451545.0) / 36525.0;
}
// Obliquité moyenne (deg) — Meeus 22.2
function meanObliquityDeg(T: number): number {
  const sec = 84381.448 - 46.8150*T - 0.00059*T*T + 0.001813*T*T*T; // arcsec
  return sec / 3600;
}
// Conversion Equatorial(of-date) RA/Dec -> Ecliptique(of-date) lambda/beta (deg)
function eclipticFromRaDec(raDeg: number, decDeg: number, epsDeg: number): { lambdaDeg: number; betaDeg: number } {
  const a = raDeg * D2R;
  const d = decDeg * D2R;
  const e = epsDeg * D2R;
  const sinA = Math.sin(a), cosA = Math.cos(a);
  const sinD = Math.sin(d), cosD = Math.cos(d);
  const sinE = Math.sin(e), cosE = Math.cos(e);
  const lam = Math.atan2(sinA * cosE + Math.tan(d) * sinE, cosA) * R2D;
  const bet = Math.asin(sinD * cosE - cosD * sinE * sinA) * R2D;
  return { lambdaDeg: norm360(lam), betaDeg: bet };
}
// Arguments moyens (deg) — Meeus
function meanArgsDeg(T: number) {
  const D  = 297.8501921 + 445267.1114034*T - 0.0018819*T*T + (T*T*T)/545868 - (T*T*T*T)/113065000;
  const Mp = 134.9633964 + 477198.8675055*T + 0.0087414*T*T + (T*T*T)/69699 - (T*T*T*T)/14712000;
  const F  = 93.2720950 + 483202.0175233*T - 0.0036539*T*T - (T*T*T)/3526000 + (T*T*T*T)/863310000;
  const Omega = 125.0445550 - 1934.1361849*T + 0.0020762*T*T + (T*T*T)/467410 - (T*T*T*T)/60616000;
  return {
    D: norm360(D),
    Mp: norm360(Mp),
    F: norm360(F),
    Omega: norm360(Omega),
  };
}
// Libration optique (Meeus chap. 53) + angle de position P (correction nutation Δψ cos ε négligée ici)
function computeMoonLibrationMeeus(date: Date, lambdaDeg: number, betaDeg: number, deltaPsiDeg = 0, trueObliqDeg?: number): { lonDeg: number; latDeg: number; paDeg: number } {
  const T = julianCenturiesTT(date);
  const { F, Omega } = meanArgsDeg(T);
  const I = 1.54242 * D2R; // inclinaison de l’équateur lunaire sur l’écliptique
  const beta = betaDeg * D2R;
  const W = (lambdaDeg - Omega) * D2R;
  const sinW = Math.sin(W), cosW = Math.cos(W);
  const sinB = Math.sin(beta), cosB = Math.cos(beta);
  const sinI = Math.sin(I), cosI = Math.cos(I);
  const A = Math.atan2(sinW * cosB * cosI - sinB * sinI, cosW * cosB);
  const b = Math.asin(-sinW * cosB * sinI - sinB * cosI);
  const l = A - (F * D2R);
  const X = Math.sin(I) * Math.sin(W);
  const Y = Math.sin(beta) * Math.cos(I) - Math.cos(beta) * Math.sin(I) * Math.cos(W);
  let P = Math.atan2(X, Y);
  const eps = (trueObliqDeg ?? meanObliquityDeg(T)) * D2R;
  P += (deltaPsiDeg * D2R) * Math.cos(eps);
  return { lonDeg: norm360(l * R2D), latDeg: b * R2D, paDeg: P * R2D };
}

export type SunAltAz = { altDeg: number; azDeg: number; distAU: number };
export type MoonAltAz = { altDeg: number; azDeg: number; distanceKm: number };
export type MoonIllum = { fraction: number; phase: number; angleDeg: number };
export type MoonLibration = { latDeg: number; lonDeg: number; paDeg: number };

// Parallaxe horizontale et distance topocentrique (approx.)
export const EARTH_RADIUS_KM = 6378.137;
export function moonHorizontalParallaxDeg(distanceKm: number): number {
  const r = Math.min(1, EARTH_RADIUS_KM / Math.max(1, distanceKm));
  return Math.asin(r) * R2D;
}
export function topocentricMoonDistanceKm(distanceKm: number, altDeg: number): number {
  const z = (90 - altDeg) * D2R; // distance zénithale
  const D = distanceKm, R = EARTH_RADIUS_KM;
  return Math.sqrt(D * D + R * R - 2 * D * R * Math.cos(z));
}

// Projection alt/az via AE: azimut boussole (0=N, 90=E), altitude en degrés, refraction 'normal'
export function getSunAltAzDeg(date: Date, lat: number, lng: number): SunAltAz {
  const time = MakeTime(date);
  const obs = new Observer(lat, lng, 0);
  const eq = Equator(Body.Sun, time, obs, true, true);
  const hz = Horizon(time, obs, eq.ra, eq.dec, 'normal');
  return { altDeg: hz.altitude, azDeg: hz.azimuth, distAU: eq.dist }; // eq.dist in AU
}

export function getMoonAltAzDeg(date: Date, lat: number, lng: number): MoonAltAz {
  const time = MakeTime(date);
  const obs = new Observer(lat, lng, 0);
  const eq = Equator(Body.Moon, time, obs, true, true);
  const hz = Horizon(time, obs, eq.ra, eq.dec, 'normal');
  return { altDeg: hz.altitude, azDeg: hz.azimuth, distanceKm: eq.dist * AU_KM };
}

// New: compute Sun and Moon alt/az in one pass (reuses MakeTime/Observer)
export function getSunAndMoonAltAzDeg(date: Date, lat: number, lng: number): { sun: SunAltAz; moon: MoonAltAz } {
  const time = MakeTime(date);
  const obs = new Observer(lat, lng, 0);
  const eqSun = Equator(Body.Sun, time, obs, true, true);
  const eqMoon = Equator(Body.Moon, time, obs, true, true);
  const sunHz = Horizon(time, obs, eqSun.ra, eqSun.dec, 'normal');
  const moonHz = Horizon(time, obs, eqMoon.ra, eqMoon.dec, 'normal');
  return {
    sun: { altDeg: sunHz.altitude, azDeg: sunHz.azimuth, distAU: eqSun.dist },
    moon: { altDeg: moonHz.altitude, azDeg: moonHz.azimuth, distanceKm: eqMoon.dist * AU_KM }
  };
}

export function getMoonIllumination(date: Date): MoonIllum {
  const time = MakeTime(date);
  const ill = Illumination(Body.Moon, time);
  const phaseAngle = ill.phase_angle; // degrees
  const phaseCycle = clamp360(MoonPhase(time)) / 360; // 0..1 like SunCalc.phase
  return { fraction: ill.phase_fraction, phase: phaseCycle, angleDeg: phaseAngle };
}

// Libration lunaire: latitude/longitude de libration et angle de position de l’axe (Meeus)
export function getMoonLibration(date: Date, obs?: { lat: number; lng: number }): MoonLibration {
  const time = MakeTime(date);
  let raDeg: number;
  let decDeg: number;
  if (obs) {
    const eqTopo = Equator(Body.Moon, time, new Observer(obs.lat, obs.lng, 0), true, true);
    raDeg = eqTopo.ra * 15;
    decDeg = eqTopo.dec;
  } else {
    // proper geocentric call—no cast/try/catch
    const eqGeo = Equator(Body.Moon, time, new Observer(0, 0, 0), true, true);
    raDeg = eqGeo.ra * 15;
    decDeg = eqGeo.dec;
  }
  const T = julianCenturiesTT(date);
  const epsDeg = meanObliquityDeg(T);
  const { lambdaDeg, betaDeg } = eclipticFromRaDec(raDeg, decDeg, epsDeg);
  const lib = computeMoonLibrationMeeus(date, lambdaDeg, betaDeg, 0, epsDeg);
  return { latDeg: lib.latDeg, lonDeg: lib.lonDeg, paDeg: lib.paDeg };
}


/**
 * Sun direction relative to the Moon.
 * - bearingDeg: 0°=north, 90°=east, 180°=south, 270°=west (around spin axis)
 * - declinationDeg: +north / -south of the lunar equator (≈ ±1.54° range)
 */
export function sunOnMoon(date: Date): { bearingDeg: number; declinationDeg: number } {
  // ---- Sun as seen from the Moon, in EQJ (J2000 equator) ----
  const t = new AstroTime(date);
  const sun = GeoVector(Body.Sun, t, true);
  const moon = GeoVector(Body.Moon, t, true);
  const v = { x: sun.x - moon.x, y: sun.y - moon.y, z: sun.z - moon.z }; // AU, direction only matters

  // ---- Time arguments (TT) ----
  const d = t.tt;               // days TT since J2000
  const T = d / 36525.0;        // Julian centuries TT since J2000

  // ---- Nutation precession angles E1..E13 in radians (deg constants from IAU/WGCCRE) ----
  const E = (deg: number) => deg2rad(deg);
  const E1  = E(125.045  - 0.0529921 * d);
  const E2  = E(250.089  - 0.1059842 * d);
  const E3  = E(260.008  + 13.0120009 * d);
  const E4  = E(176.625  + 13.3407154 * d);
  const E5  = E(357.529  +  0.9856003 * d);
  const E6  = E(311.589  + 26.4057084 * d);
  const E7  = E(134.963  + 13.0649930 * d);
  const E8  = E(276.617  +  0.3287146 * d);
  const E9  = E( 34.226  +  1.7484877 * d);
  const E10 = E( 15.134  -  0.1589763 * d);
  const E11 = E(119.743  +  0.0036096 * d);
  const E12 = E(239.961  +  0.1643573 * d);
  const E13 = E( 25.053  + 12.9590088 * d);

  // ---- IAU/WGCCRE 2015 lunar orientation with periodic terms (degrees) ----
  // RA (deg)
  const RAdeg =
    269.9949 + 0.0031 * T
    - 3.8787 * Math.sin(E1)  - 0.1204 * Math.sin(E2)
    + 0.0700 * Math.sin(E3)  - 0.0172 * Math.sin(E4)
    + 0.0072 * Math.sin(E6)  - 0.0052 * Math.sin(E10)
    + 0.0043 * Math.sin(E13);

  // DEC (deg)
  const DECdeg =
     66.5392 + 0.0130 * T
    + 1.5419 * Math.cos(E1)  + 0.0239 * Math.cos(E2)
    - 0.0278 * Math.cos(E3)  + 0.0068 * Math.cos(E4)
    - 0.0029 * Math.cos(E6)  + 0.0009 * Math.cos(E7)
    + 0.0008 * Math.cos(E10) - 0.0009 * Math.cos(E13);

  // W (deg)
  const Wdeg =
     38.3213 + 13.17635815 * d - 1.4e-12 * d * d
    + 3.5610 * Math.sin(E1)   + 0.1208 * Math.sin(E2)
    - 0.0642 * Math.sin(E3)   + 0.0158 * Math.sin(E4)
    + 0.0252 * Math.sin(E5)   - 0.0066 * Math.sin(E6)
    - 0.0047 * Math.sin(E7)   - 0.0046 * Math.sin(E8)
    + 0.0028 * Math.sin(E9)   + 0.0052 * Math.sin(E10)
    + 0.0040 * Math.sin(E11)  + 0.0019 * Math.sin(E12)
    - 0.0044 * Math.sin(E13);

  const RA  = deg2rad(RAdeg);
  const DEC = deg2rad(DECdeg);
  const W   = deg2rad(Wdeg);

  // ---- Rotation EQJ -> Moon-fixed (x=lon 0°, y=+90°E, z=+North) ----
  const R3a = rotZ(RA + Math.PI / 2);
  const R1b = rotX(Math.PI / 2 - DEC);
  const R3c = rotZ(W);
  const Reqj_from_body = matMul(matMul(R3a, R1b), R3c);
  const Rbody_from_eqj = matTranspose(Reqj_from_body);

  // ---- Bearing: from +Z (north) toward +Y (east) in Moon-fixed ----
  const vb = matVec(Rbody_from_eqj, v);
  let bearingDeg = Math.atan2(vb.y, vb.z) * RAD2DEG;
  if (bearingDeg < 0) bearingDeg += 360;

  // ---- Declination via dot(ŝ, ẑ_moon) (robust) ----
  const sNorm = Math.hypot(v.x, v.y, v.z);
  const zx = Math.cos(DEC) * Math.cos(RA);
  const zy = Math.cos(DEC) * Math.sin(RA);
  const zz = Math.sin(DEC);
  const declinationDeg = Math.asin((v.x * zx + v.y * zy + v.z * zz) / sNorm) * RAD2DEG;

  return { bearingDeg, declinationDeg };
}

// --- helpers hoisted to avoid re-allocation on every call ---
function deg2rad(d: number) { return d * Math.PI / 180; }
function rotZ(a: number) {
  const c = Math.cos(a), s = Math.sin(a);
  return [[ c,-s,0],[ s, c,0],[0,0,1]] as number[][];
}
function rotX(a: number) {
  const c = Math.cos(a), s = Math.sin(a);
  return [[1,0,0],[0, c,-s],[0, s, c]] as number[][];
}
function matMul(A: number[][], B: number[][]) {
  return A.map((r,i)=>r.map((_,j)=>A[i][0]*B[0][j] + A[i][1]*B[1][j] + A[i][2]*B[2][j]));
}
function matTranspose(A: number[][]) {
  return [
    [A[0][0], A[1][0], A[2][0]],
    [A[0][1], A[1][1], A[2][1]],
    [A[0][2], A[1][2], A[2][2]],
  ];
}
function matVec(A: number[][], v: {x:number;y:number;z:number}) {
  return {
    x: A[0][0]*v.x + A[0][1]*v.y + A[0][2]*v.z,
    y: A[1][0]*v.x + A[1][1]*v.y + A[1][2]*v.z,
    z: A[2][0]*v.x + A[2][1]*v.y + A[2][2]*v.z,
  };
}

// +++ added: parallactic angle from alt/az (deg)
// Angle between celestial north and the local vertical (toward zenith), positive toward east.
export function parallacticAngleFromAltAz(azDeg: number, altDeg: number, latitudeDeg: number): number {
  const A = azDeg * D2R;     // azimuth: 0=N, 90=E
  const a = altDeg * D2R;    // altitude
  const phi = latitudeDeg * D2R;

  const num = Math.sin(A);
  const den = Math.tan(phi) * Math.cos(a) - Math.sin(a) * Math.cos(A);
  let q = Math.atan2(num, den) * R2D; // [-180,180]
  if (q > 180) q -= 360;
  if (q <= -180) q += 360;
  return q;
}
// +++ end added

// Internal: tilt of the ecliptic vs horizon given Sun RA/Dec and parallactic angle q (deg).
function eclipticTiltFromEqAndQ(raDeg: number, decDeg: number, qDeg: number, date: Date): number {
  // Obliquity (of-date): mean is sufficient for a visual overlay
  const T = julianCenturiesTT(date);
  const eps = meanObliquityDeg(T) * D2R;

  // Sun unit vector in equatorial frame
  const alpha = raDeg * D2R;
  const delta = decDeg * D2R;
  const r = {
    x: Math.cos(delta) * Math.cos(alpha),
    y: Math.cos(delta) * Math.sin(alpha),
    z: Math.sin(delta),
  };

  // North ecliptic pole (equatorial frame)
  const Ne = { x: 0, y: -Math.sin(eps), z: Math.cos(eps) };

  // Tangent to the ecliptic at the Sun
  let te = cross(Ne, r);
  te = norm(te);

  // Local tangent basis (north, east) at the Sun in equatorial frame
  let e_alpha = { x: -Math.cos(delta) * Math.sin(alpha), y: Math.cos(delta) * Math.cos(alpha), z: 0 };
  let e_delta = { x: -Math.sin(delta) * Math.cos(alpha), y: -Math.sin(delta) * Math.sin(alpha), z: Math.cos(delta) };
  e_alpha = norm(e_alpha);
  e_delta = norm(e_delta);

  // Position angle of the ecliptic (from celestial north toward east)
  const Pe = Math.atan2(dot(te, e_alpha), dot(te, e_delta)) * R2D;

  // Horizon-line PA = q + 90°
  let Ph = qDeg + 90;
  while (Ph < -180) Ph += 360;
  while (Ph >  180) Ph -= 360;

  // Smallest angle between directions -> [0, 90] degrees
  let tilt = Math.abs(Pe - Ph);
  tilt = ((tilt + 180) % 360) - 180;
  tilt = Math.abs(tilt);
  if (tilt > 90) tilt = 180 - tilt;
  return tilt;
}

// Tilt of the ecliptic vs. the local horizon at the Sun's apparent position (degrees).
// Depends on local lat/lon through the topocentric Sun alt/az and parallactic angle.
export function eclipticTiltVsHorizonAtSun(date: Date, lat: number, lng: number): number {
  const time = MakeTime(date);
  const obs = new Observer(lat, lng, 0);
  const eqSun = Equator(Body.Sun, time, obs, true, true);
  const hzSun = Horizon(time, obs, eqSun.ra, eqSun.dec, 'normal');
  const q = parallacticAngleFromAltAz(hzSun.azimuth, hzSun.altitude, lat);
  return eclipticTiltFromEqAndQ(eqSun.ra * 15, eqSun.dec, q, date);
}

// small vector helpers
function dot(a:{x:number;y:number;z:number}, b:{x:number;y:number;z:number}){ return a.x*b.x + a.y*b.y + a.z*b.z; }
function cross(a:{x:number;y:number;z:number}, b:{x:number;y:number;z:number}){ return { x: a.y*b.z - a.z*b.y, y: a.z*b.x - a.x*b.z, z: a.x*b.y - a.y*b.x }; }
function norm(v:{x:number;y:number;z:number}){ const s = Math.hypot(v.x,v.y,v.z); return { x: v.x/s, y: v.y/s, z: v.z/s }; }

// Position angle of the Sun's north pole (P), measured from celestial north toward east (degrees).
export function solarNorthPositionAngleDeg(date: Date): number {
  const time = MakeTime(date);
  // Geocentric apparent Sun (suffices for P; topocentric difference is negligible for the Sun)
  const eqSun = Equator(Body.Sun, time, new Observer(0, 0, 0), true, true);
  const raDeg = eqSun.ra * 15;
  const decDeg = eqSun.dec;

  // IAU (approx J2000) solar north pole direction in equatorial coords
  const RA_P = 286.13;
  const DEC_P = 63.87;

  const a0 = deg2rad(raDeg);
  const d0 = deg2rad(decDeg);
  const ap = deg2rad(RA_P);
  const dp = deg2rad(DEC_P);

  const y = Math.sin(ap - a0) * Math.cos(dp);
  const x = Math.sin(dp) * Math.cos(d0) - Math.cos(dp) * Math.sin(d0) * Math.cos(ap - a0);
  return -Math.atan2(y, x) * R2D; // [-180,180], E from N
}

// Aggregate Sun orientation angles relative to horizon at observer location.
export function getSunOrientationAngles(date: Date, lat: number, lng: number): {
  qDeg: number;  eclipticTiltDeg: number;  solarNorthPositionAngleDeg: number;
  rotationToHorizonDeg: number;  rotationToHorizonDegSolarNorth: number;
} {
  const time = MakeTime(date);
  const obs = new Observer(lat, lng, 0);

  // Sun topocentric for local parallactic angle
  const eq = Equator(Body.Sun, time, obs, true, true);
  const hz = Horizon(time, obs, eq.ra, eq.dec, 'normal');

  const q = parallacticAngleFromAltAz(hz.azimuth, hz.altitude, lat);
  const tilt = eclipticTiltFromEqAndQ(eq.ra * 15, eq.dec, q, date);
  const P = solarNorthPositionAngleDeg(date);

  return {
    qDeg: q,
    eclipticTiltDeg: tilt,
    solarNorthPositionAngleDeg: P,
    rotationToHorizonDeg: -q,
    rotationToHorizonDegSolarNorth: -q + P,
  };
}

// Aggregate Moon orientation angles relative to horizon at observer location.
export function getMoonOrientationAngles(date: Date, lat: number, lng: number): {
  qDeg: number;                          // parallactic angle at Moon
  moonPolePositionAngleDeg: number;      // P (E from N), J2000
  rotationToHorizonDeg: number;          // celestial-N up
  rotationToHorizonDegMoonNorth: number; // lunar-N up
} {
  const time = MakeTime(date);
  const obs = new Observer(lat, lng, 0);

  // Moon topocentric for local parallactic angle
  const eq = Equator(Body.Moon, time, obs, true, true);
  const hz = Horizon(time, obs, eq.ra, eq.dec, 'normal');

  const q = parallacticAngleFromAltAz(hz.azimuth, hz.altitude, lat);

  // Use J2000 Moon-North vs Earth-North angle
  const P = moonNorthPositionAngleJ2000Deg(date);

  return {
    qDeg: q,
    moonPolePositionAngleDeg: P,
    rotationToHorizonDeg: -q,
    rotationToHorizonDegMoonNorth: -q + P,
  };
}

// Small helper: IAU/WGCCRE 2015 lunar pole RA/DEC in EQJ (J2000)
function lunarPoleEqj(date: Date): { raDeg: number; decDeg: number } {
  const t = new AstroTime(date);
  const d = t.tt;                    // days TT since J2000
  const T = d / 36525.0;

  const E = (deg: number) => deg2rad(deg);
  const E1  = E(125.045  - 0.0529921 * d);
  const E2  = E(250.089  - 0.1059842 * d);
  const E3  = E(260.008  + 13.0120009 * d);
  const E4  = E(176.625  + 13.3407154 * d);
  const E6  = E(311.589  + 26.4057084 * d);
  const E7  = E(134.963  + 13.0649930 * d);
  const E10 = E( 15.134  -  0.1589763 * d);
  const E13 = E( 25.053  + 12.9590088 * d);

  const RAdeg =
    269.9949 + 0.0031 * T
    - 3.8787 * Math.sin(E1)  - 0.1204 * Math.sin(E2)
    + 0.0700 * Math.sin(E3)  - 0.0172 * Math.sin(E4)
    + 0.0072 * Math.sin(E6)  - 0.0052 * Math.sin(E10)
    + 0.0043 * Math.sin(E13);

  const DECdeg =
     66.5392 + 0.0130 * T
    + 1.5419 * Math.cos(E1)  + 0.0239 * Math.cos(E2)
    - 0.0278 * Math.cos(E3)  + 0.0068 * Math.cos(E4)
    - 0.0029 * Math.cos(E6)  + 0.0009 * Math.cos(E7)
    + 0.0008 * Math.cos(E10) - 0.0009 * Math.cos(E13);

  return { raDeg: RAdeg, decDeg: DECdeg };
}

// Position angle of the Moon's north pole in EQJ (J2000), E from N.
// Angle between Moon North and Earth North in the J2000 equatorial frame.
export function moonNorthPositionAngleJ2000Deg(date: Date): number {
  const time = MakeTime(date);
  // Geocentric apparent Moon in EQJ (ofDate=false)
  const eqMoon = Equator(Body.Moon, time, new Observer(0, 0, 0), false, true);
  const a0 = deg2rad(eqMoon.ra * 15);
  const d0 = deg2rad(eqMoon.dec);

  const pole = lunarPoleEqj(date);
  const ap = deg2rad(pole.raDeg);
  const dp = deg2rad(pole.decDeg);

  const y = Math.sin(ap - a0) * Math.cos(dp);
  const x = Math.sin(dp) * Math.cos(d0) - Math.cos(dp) * Math.sin(d0) * Math.cos(ap - a0);
  return -Math.atan2(y, x) * R2D; // [-180,180], E from N
}

// Ombre terrestre à la distance de la Lune (géocentrique)
export function earthShadowAtMoon(date: Date): {
  sunDistKm: number;
  moonDistKm: number;
  umbraRadiusKm: number;      // rayon de l'ombre (si négatif -> pas d’ombre, on clamp à 0)
  penumbraRadiusKm: number;   // rayon de la pénombre
  axisOffsetKm: number;       // distance perpendiculaire (scalaire)
  // Direction pour offset 2D
  axisPerpVecKm: { x: number; y: number; z: number }; // vecteur ⟂ à l’axe (EQ of-date, km)
  axisPerpUnit:  { x: number; y: number; z: number }; // unitaire, même repère
  axisPADeg: number;          // PA (E depuis N) RÉFÉRENCE NORD LUNAIRE
  axisPAEarthDeg: number;     // PA (E depuis N) RÉFÉRENCE NORD CÉLESTE (pour debug)
} {
  const t = new AstroTime(date);

  // Vecteurs géocentriques en UA (of-date)
  const vSun = GeoVector(Body.Sun, t, true);   // Terre -> Soleil
  const vMoon = GeoVector(Body.Moon, t, true); // Terre -> Lune

  // Distances (km)
  const sunDistKm  = Math.hypot(vSun.x, vSun.y, vSun.z) * AU_KM;
  const moonDistKm = Math.hypot(vMoon.x, vMoon.y, vMoon.z) * AU_KM;

  // Axe ombre: u = direction Terre -> anti-Soleil (unit)
  const ux = -vSun.x, uy = -vSun.y, uz = -vSun.z;
  const un = Math.hypot(ux, uy, uz) || 1;
  const u0 = ux / un, u1 = uy / un, u2 = uz / un;

  // Composante perpendiculaire de la position lunaire par rapport à l’axe
  const rx = vMoon.x, ry = vMoon.y, rz = vMoon.z;
  const dot = rx * u0 + ry * u1 + rz * u2;
  const pxAU = rx - dot * u0;
  const pyAU = ry - dot * u1;
  const pzAU = rz - dot * u2;

  const axisOffsetKm = Math.hypot(pxAU, pyAU, pzAU) * AU_KM;

  // Distance le long de l’axe antisolaire (proj. de la Lune sur u), en km
  const LaxisKm = Math.max(0, dot) * AU_KM; // clamp à 0 côté Soleil

  // Vecteur perpendiculaire en km + unitaire (même repère EQ of-date)
  const axisPerpVecKm = { x: pxAU * AU_KM, y: pyAU * AU_KM, z: pzAU * AU_KM };
  const plen = Math.max(1e-12, Math.hypot(axisPerpVecKm.x, axisPerpVecKm.y, axisPerpVecKm.z));
  const axisPerpUnit = { x: axisPerpVecKm.x / plen, y: axisPerpVecKm.y / plen, z: axisPerpVecKm.z / plen };

  // Rayon de l’ombre/pénombre au plan de la Lune
  const Re = EARTH_RADIUS_KM;
  const Rs = R_SUN_KM;
  let umbraRadiusKm = Re - LaxisKm * (Rs - Re) / Math.max(1, sunDistKm);
  if (umbraRadiusKm < 0) umbraRadiusKm = 0;
  const penumbraRadiusKm = Re + LaxisKm * (Rs + Re) / Math.max(1, sunDistKm);
  
  // Position angle sur le ciel (E de N) du vecteur perpendiculaire au centre lunaire
  const time = MakeTime(date);
  const eqMoon = Equator(Body.Moon, time, new Observer(0, 0, 0), true, true);
  const ra = eqMoon.ra * D2R * 15.0;
  const dec = eqMoon.dec * D2R;

  // Base (N,E) céleste (au centre lunaire)
  let e_alpha = { x: -Math.cos(dec) * Math.sin(ra), y: Math.cos(dec) * Math.cos(ra), z: 0 }; // Est
  let e_delta = { x: -Math.sin(dec) * Math.cos(ra), y: -Math.sin(dec) * Math.sin(ra), z: Math.cos(dec) }; // Nord
  const na = Math.hypot(e_alpha.x, e_alpha.y, e_alpha.z) || 1;
  const nd = Math.hypot(e_delta.x, e_delta.y, e_delta.z) || 1;
  e_alpha = { x: e_alpha.x / na, y: e_alpha.y / na, z: e_alpha.z / na };
  e_delta = { x: e_delta.x / nd, y: e_delta.y / nd, z: e_delta.z / nd };

  // PA par rapport au Nord céleste (Earth North)
  const projE = axisPerpUnit.x * e_alpha.x + axisPerpUnit.y * e_alpha.y + axisPerpUnit.z * e_alpha.z;
  const projN = axisPerpUnit.x * e_delta.x + axisPerpUnit.y * e_delta.y + axisPerpUnit.z * e_delta.z;
  let axisPAEarthDeg = Math.atan2(projE, projN) * R2D; // [-180,180], E from N
  if (axisPAEarthDeg <= -180) axisPAEarthDeg += 360;
  if (axisPAEarthDeg >   180) axisPAEarthDeg -= 360;

  // Angle du pôle lunaire vs Nord céleste (P), E depuis N (of-date via libration Meeus)
  const P = getMoonLibration(date).paDeg; // E from N, of-date

  // Converti en Nord lunaire: PA_lunar = PA_earth - P
  let axisPALunarDeg = axisPAEarthDeg - P;
  // normaliser vers [-180,180]
  axisPALunarDeg = ((axisPALunarDeg + 180) % 360 + 360) % 360 - 180;

  return {
    sunDistKm, moonDistKm,
    umbraRadiusKm, penumbraRadiusKm,
    axisOffsetKm,
    axisPerpVecKm,
    axisPerpUnit,
    axisPADeg: axisPALunarDeg,   // désormais PA en Nord lunaire (E depuis N_lunaire)
    axisPAEarthDeg,              // pour debug
  };
}






