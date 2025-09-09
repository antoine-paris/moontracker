import { MakeTime, Equator, Body, Observer } from 'astronomy-engine';

export const RSUN_KM = 696_340;
export const AU_KM = 149_597_870.7;

export function sunDistanceAU(date: Date): number {
  const time = MakeTime(date);
  const obs = new Observer(0, 0, 0);
  const eq = Equator(Body.Sun, time, obs, true, true);
  return eq.dist; // UA
}

export function sunApparentDiameterDeg(date: Date, distAU?: number): number {
  const rAU = typeof distAU === 'number' ? distAU : sunDistanceAU(date);
  const dKm = AU_KM * rAU;
  return 2 * (Math.atan2(RSUN_KM, dKm)) * 180 / Math.PI;
}
