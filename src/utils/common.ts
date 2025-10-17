// Common math utilities
export const DEG2RAD = Math.PI / 180;
export const RAD2DEG = 180 / Math.PI;

export function toRad(deg: number): number { return deg * DEG2RAD; }
export function toDeg(rad: number): number { return rad * RAD2DEG; }

export function norm360(deg: number): number {
  let x = ((deg % 360) + 360) % 360;
  return x;
}

export function normLng(deg: number): number {
  let x = ((deg + 180) % 360 + 360) % 360 - 180;
  if (Object.is(x, -180)) x = 180;
  return x;
}

export function clamp(x: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, x));
}

export function clampLat(x: number): number {
  return clamp(x, -90, 90);
}

// Common formatting
export function formatDeg(deg: number, decimals = 1): string {
  return `${deg.toFixed(decimals)}°`;
}

export function shortFloat(n: number, decimals = 1): string {
  const s = n.toFixed(decimals);
  return s.replace(/\.0+$/, '').replace(/(\.\d*?[1-9])0+$/, '$1');
}

// Base32 encoding/decoding for geohash
export const GH_BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';
export const GH_MAP: Record<string, number> = Object.fromEntries(
  [...GH_BASE32].map((c, i) => [c, i])
);

// Compact number encoding
export function toB36Int(n: number): string { 
  return Math.round(n).toString(36); 
}

export function fromB36Int(s: string): number { 
  const n = parseInt(s, 36); 
  return Number.isFinite(n) ? n : NaN; 
}

export function timeToB36(ms: number): string { 
  return toB36Int(Math.floor(ms / 1000)); 
}

export function timeFromB36(s: string): number { 
  const sec = fromB36Int(s); 
  return Number.isFinite(sec) ? sec * 1000 : NaN; 
}
