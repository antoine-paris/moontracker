// Re-export from common
export { toRad, toDeg, norm360, normLng, clamp, clampLat } from './common';

// Keep angularDiff here as it's more specialized
export function angularDiff(a: number, b: number): number {
  let d = ((a - b) % 360 + 360) % 360;
  if (d > 180) d -= 360;
  return d;
}
