import { toRad, toDeg, norm360 } from '../utils/math';

export function altAzToVec(azDeg: number, altDeg: number) {
  const az = toRad(azDeg);
  const alt = toRad(altDeg);
  const E = Math.cos(alt) * Math.sin(az);
  const N = Math.cos(alt) * Math.cos(az);
  const U = Math.sin(alt);
  return [E, N, U] as const;
}

export function normalize3(v: readonly number[]) {
  const L = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / L, v[1] / L, v[2] / L] as const;
}