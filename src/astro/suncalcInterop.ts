// SunCalc interop ESM/CJS centralisé + conversions d’unités
import * as SunCalcNS from "suncalc";
const SunCalc: typeof import("suncalc") = (SunCalcNS as { default?: typeof import("suncalc") }).default ?? SunCalcNS;

function toDeg(rad: number): number { return rad * 180 / Math.PI; }
function norm360(x: number): number { let y = x % 360; if (y < 0) y += 360; return y; }
// SunCalc: azimuth en radians mesuré depuis le Sud, positif vers l’Ouest.
// On convertit en azimut boussole (0°=Nord, 90°=Est, 180°=Sud, 270°=Ouest).
function azCompassFromSunCalcRad(azRad: number): number { return norm360(toDeg(azRad) + 180); }

export type SunAltAz = { altDeg: number; azDeg: number };
export type MoonAltAz = { altDeg: number; azDeg: number; distanceKm: number; parallacticAngleDeg?: number };
export type MoonIllum = { fraction: number; phase: number; angleDeg: number };

export function getSunAltAzDeg(date: Date, lat: number, lng: number): SunAltAz {
  const p = SunCalc.getPosition(date, lat, lng);
  return { altDeg: toDeg(p.altitude), azDeg: azCompassFromSunCalcRad(p.azimuth) };
}

export function getMoonAltAzDeg(date: Date, lat: number, lng: number): MoonAltAz {
  const m = SunCalc.getMoonPosition(date, lat, lng) as import("suncalc").GetMoonPositionResult & { parallacticAngle?: number };
  const altDeg = toDeg(m.altitude);
  const azDeg = azCompassFromSunCalcRad(m.azimuth);
  const distanceKm = m.distance;
  const parallacticAngleDeg = typeof m.parallacticAngle === 'number' ? toDeg(m.parallacticAngle) : undefined;
  return { altDeg, azDeg, distanceKm, parallacticAngleDeg };
}

export function getMoonIllumination(date: Date): MoonIllum {
  const ill = SunCalc.getMoonIllumination(date);
  return { fraction: ill.fraction ?? 0, phase: ill.phase ?? 0, angleDeg: toDeg(ill.angle ?? 0) };
}

// Optionnel: accès brut si nécessaire pour des fonctionnalités non couvertes
export const SunCalcRaw = SunCalc;
