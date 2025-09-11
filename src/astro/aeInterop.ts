import { MakeTime, Observer, Equator, Horizon, Illumination, MoonPhase, Body } from 'astronomy-engine';
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
