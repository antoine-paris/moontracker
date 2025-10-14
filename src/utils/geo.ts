export const R_EARTH_KM = 6371;

export function normLng(deg: number): number {
  let x = ((deg + 180) % 360 + 360) % 360 - 180;
  if (Object.is(x, -180)) x = 180;
  return x;
}

export function toRad(d: number) { return (d * Math.PI) / 180; }
export function toDeg(r: number) { return (r * 180) / Math.PI; }

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const φ1 = toRad(lat1), φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R_EARTH_KM * c;
}

export function bearingDeg(lat1: number, lon1: number, lat2: number, lon2: number) {
  const φ1 = toRad(lat1), φ2 = toRad(lat2);
  const λ1 = toRad(lon1), λ2 = toRad(lon2);
  const y = Math.sin(λ2 - λ1) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);
  const θ = Math.atan2(y, x);
  return (toDeg(θ) + 360) % 360;
}

// French 8-point abbreviations using O for West: N, NE, E, SE, S, SO, O, NO
export function dir8AbbrevFr(bearing: number): 'N'|'NE'|'E'|'SE'|'S'|'SO'|'O'|'NO' {
  const dirs: Array<'N'|'NE'|'E'|'SE'|'S'|'SO'|'O'|'NO'> = ['N','NE','E','SE','S','SO','O','NO'];
  const idx = Math.round(((bearing % 360) / 45)) % 8;
  return dirs[idx];
}

// Extract city part from "Pays — Ville" or return the whole label
export function labelToCity(label: string) {
  const parts = (label ?? '').split('—');
  return (parts[1] ?? parts[0] ?? '').trim();
}