import { MakeTime, Observer, Equator, Horizon, Illumination, MoonPhase, Body } from 'astronomy-engine';
import { AU_KM } from './sun';

function clamp360(x: number): number { let y = x % 360; if (y < 0) y += 360; return y; }

export type SunAltAz = { altDeg: number; azDeg: number; distAU: number };
export type MoonAltAz = { altDeg: number; azDeg: number; distanceKm: number };
export type MoonIllum = { fraction: number; phase: number; angleDeg: number };

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
