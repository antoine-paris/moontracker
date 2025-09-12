import { MakeTime, Observer, Equator, Horizon, Illumination, MoonPhase, Body,  AstroTime, GeoVector, RAD2DEG} from 'astronomy-engine';
import { AU_KM } from './sun';

function clamp360(x: number): number { let y = x % 360; if (y < 0) y += 360; return y; }
function norm360(x: number): number { return clamp360(x); }
const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;

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

export function getMoonIllumination(date: Date): MoonIllum {
  const time = MakeTime(date);
  const ill = Illumination(Body.Moon, time);
  const phaseAngle = ill.phase_angle; // degrees
  const phaseCycle = clamp360(MoonPhase(time)) / 360; // 0..1 like SunCalc.phase
  return { fraction: ill.phase_fraction, phase: phaseCycle, angleDeg: phaseAngle };
}


// Libration lunaire: latitude/longitude de libration et angle de position de l’axe (Meeus)
export function getMoonLibration(date: Date, obs?: { lat: number; lng: number }): MoonLibration {
  // RA/Dec of-date: géocentriques si obs absent, sinon topocentriques
  const time = MakeTime(date);
  let raDeg: number;
  let decDeg: number;
  if (obs) {
    const eqTopo = Equator(Body.Moon, time, new Observer(obs.lat, obs.lng, 0), true, true);
    raDeg = eqTopo.ra * 15;
    decDeg = eqTopo.dec;
  } else {
    try {
      const eqGeo = Equator(Body.Moon, time, undefined as unknown as Observer, true, true);
      raDeg = eqGeo.ra * 15;
      decDeg = eqGeo.dec;
    } catch {
      // Fallback: observateur à (0,0) si géocentrique direct indisponible
      const eq0 = Equator(Body.Moon, time, new Observer(0, 0, 0), true, true);
      raDeg = eq0.ra * 15;
      decDeg = eq0.dec;
    }
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
  const Reqj_from_body = mul(mul(R3a, R1b), R3c);
  const Rbody_from_eqj = transpose(Reqj_from_body);

  // ---- Bearing: from +Z (north) toward +Y (east) in Moon-fixed ----
  const vb = mvec(Rbody_from_eqj, v);
  let bearingDeg = Math.atan2(vb.y, vb.z) * RAD2DEG;
  if (bearingDeg < 0) bearingDeg += 360;

  // ---- Declination via dot(ŝ, ẑ_moon) (robust) ----
  const sNorm = Math.hypot(v.x, v.y, v.z);
  const zx = Math.cos(DEC) * Math.cos(RA);
  const zy = Math.cos(DEC) * Math.sin(RA);
  const zz = Math.sin(DEC);
  const declinationDeg = Math.asin((v.x * zx + v.y * zy + v.z * zz) / sNorm) * RAD2DEG;

  return { bearingDeg, declinationDeg };
  // --- tiny linear algebra + utils ---
  function deg2rad(d: number) { return d * Math.PI / 180; }
    function rotZ(a: number) {
    const c = Math.cos(a), s = Math.sin(a);
    return [[ c,-s,0],[ s, c,0],[0,0,1]] as const;
  }
  function rotX(a: number) {
    const c = Math.cos(a), s = Math.sin(a);
    return [[1,0,0],[0, c,-s],[0, s, c]] as const;
  }
  function mul(A: number[][], B: number[][]) {
    return A.map((r,i)=>r.map((_,j)=>A[i][0]*B[0][j] + A[i][1]*B[1][j] + A[i][2]*B[2][j]));
  }
  function transpose(A: number[][]) {
  return [
    [A[0][0], A[1][0], A[2][0]],
    [A[0][1], A[1][1], A[2][1]],
    [A[0][2], A[1][2], A[2][2]],
  ];
}
  function mvec(A: number[][], v: {x:number;y:number;z:number}) {
    return {
      x: A[0][0]*v.x + A[0][1]*v.y + A[0][2]*v.z,
      y: A[1][0]*v.x + A[1][1]*v.y + A[1][2]*v.z,
      z: A[2][0]*v.x + A[2][1]*v.y + A[2][2]*v.z,
    };
  }
}






