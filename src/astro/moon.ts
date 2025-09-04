import { toDeg } from "../utils/math";

export const RMOON_KM = 1_737.4;

export function moonApparentDiameterDeg(distanceKm: number): number {
  return 2 * toDeg(Math.atan(RMOON_KM / Math.max(1, distanceKm)));
}
