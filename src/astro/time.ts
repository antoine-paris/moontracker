import { norm360 } from "../utils/math";

export function julianDay(date: Date): number { return date.getTime() / 86400000 + 2440587.5; }

export function gmstDeg(date: Date): number {
  const JD = julianDay(date);
  const D = JD - 2451545.0; // days since J2000.0
  const T = D / 36525.0;
  const GMST = 280.46061837 + 360.98564736629 * D + 0.000387933 * T * T - (T * T * T) / 38710000.0;
  return norm360(GMST);
}

export function lstDeg(date: Date, lonDeg: number): number { return norm360(gmstDeg(date) + lonDeg); }
