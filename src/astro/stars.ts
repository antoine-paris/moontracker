import { lstDeg } from './time';
import { toRad, toDeg, norm360, clamp } from '../utils/math';

export function altAzFromRaDec(date: Date, latDeg: number, lngDeg: number, raDeg: number, decDeg: number) {
  const LST = lstDeg(date, lngDeg);
  let H = LST - raDeg;
  H = ((H + 180) % 360 + 360) % 360 - 180;
  const φ = toRad(latDeg);
  const δ = toRad(decDeg);
  const Hr = toRad(H);
  const sinAlt = Math.sin(φ) * Math.sin(δ) + Math.cos(φ) * Math.cos(δ) * Math.cos(Hr);
  const alt = Math.asin(clamp(sinAlt, -1, 1));
  const cosAlt = Math.cos(alt);
  const sinA = -Math.cos(δ) * Math.sin(Hr) / Math.max(1e-9, cosAlt);
  const cosA = (Math.sin(δ) - Math.sin(alt) * Math.sin(φ)) / Math.max(1e-9, (cosAlt * Math.cos(φ)));
  const A = Math.atan2(sinA, cosA);
  return { altDeg: toDeg(alt), azDeg: norm360(toDeg(A)) };
}