import { julianDay } from "./time";
import { toDeg } from "../utils/math";

export const AU_KM = 149_597_870.7;
export const RSUN_KM = 696_340;

export function sunDistanceAU(date: Date): number {
  const D = julianDay(date) - 2451545.0; // days since J2000.0
  const g = (Math.PI / 180) * (357.529 + 0.98560028 * D); // mean anomaly (rad)
  return 1.00014 - 0.01671 * Math.cos(g) - 0.00014 * Math.cos(2 * g);
}

export function sunApparentDiameterDeg(date: Date): number {
  const rAU = sunDistanceAU(date);
  return 2 * toDeg(Math.atan(RSUN_KM / (AU_KM * Math.max(1e-9, rAU))));
}
