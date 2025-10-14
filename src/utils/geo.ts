export const R_EARTH_KM = 6371;

// Keep lon within [-180, 180], with -180 normalized to 180
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

// Full French names
export type Dir8FullFr = 'Nord' | 'Nord-Est' | 'Est' | 'Sud-Est' | 'Sud' | 'Sud-Ouest' | 'Ouest' | 'Nord-Ouest';
export function dir8FullFr(bearing: number): Dir8FullFr {
  const dirs: Dir8FullFr[] = ['Nord','Nord-Est','Est','Sud-Est','Sud','Sud-Ouest','Ouest','Nord-Ouest'];
  const idx = Math.round(((bearing % 360) / 45)) % 8;
  return dirs[idx];
}

// Latitude clamp
export function clampLat(x: number) {
  return Math.max(-90, Math.min(90, x));
}

// Destination point given start/initial bearing/distance on a sphere
export function moveDest(latDeg: number, lngDeg: number, distanceKm: number, bearingDegIn: number) {
  const δ = distanceKm / R_EARTH_KM;
  const θ = toRad(bearingDegIn);
  const φ1 = toRad(latDeg);
  const λ1 = toRad(lngDeg);
  const sinφ1 = Math.sin(φ1), cosφ1 = Math.cos(φ1);
  const sinδ = Math.sin(δ), cosδ = Math.cos(δ);

  const sinφ2 = sinφ1 * cosδ + cosφ1 * sinδ * Math.cos(θ);
  const φ2 = Math.asin(Math.max(-1, Math.min(1, sinφ2)));

  const y = Math.sin(θ) * sinδ * cosφ1;
  const x = cosδ - sinφ1 * sinφ2;
  const λ2 = λ1 + Math.atan2(y, x);

  let lat2 = toDeg(φ2);
  let lng2 = toDeg(λ2);
  lat2 = clampLat(lat2);
  lng2 = normLng(lng2);
  return { lat: lat2, lng: lng2 };
}

// Limit NS move so latitude stays within ±89°
export const LAT_CAP_DEG = 89;
export function capNSDistanceKm(latDeg: number, distanceKm: number, bearingDegIn: number) {
  const b = ((bearingDegIn % 360) + 360) % 360;
  if (b !== 0 && b !== 180) return distanceKm; // only cap for N/S
  const φ1 = toRad(latDeg);
  const φCap = toRad(LAT_CAP_DEG);
  const δWanted = distanceKm / R_EARTH_KM;
  let maxδ = 0;
  if (b === 0) {
    // North: φ2 = φ1 + δ ≤ φCap → δ ≤ φCap - φ1
    maxδ = Math.max(0, φCap - φ1);
  } else {
    // South: φ2 = φ1 - δ ≥ -φCap → δ ≤ φ1 + φCap
    maxδ = Math.max(0, φ1 + φCap);
  }
  const δAdj = Math.min(δWanted, maxδ);
  return δAdj * R_EARTH_KM;
}

// Extract city part from "Pays — Ville" or return the whole label
export function labelToCity(label: string) {
  const parts = (label ?? '').split('—');
  return (parts[1] ?? parts[0] ?? '').trim();
}