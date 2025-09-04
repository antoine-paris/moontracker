export function toDeg(rad: number): number { return (rad * 180) / Math.PI; }
export function toRad(deg: number): number { return (deg * Math.PI) / 180; }
export function norm360(deg: number): number { return ((deg % 360) + 360) % 360; }
export function angularDiff(a: number, b: number): number {
  let d = norm360(a - b);
  if (d > 180) d -= 360;
  return d; // [-180, +180]
}
export function clamp(v: number, lo: number, hi: number): number { return Math.min(Math.max(v, lo), hi); }
