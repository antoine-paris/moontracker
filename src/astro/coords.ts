import { toDeg, toRad, norm360 } from "../utils/math";

export function azFromSunCalc(radAz: number): number {
  // SunCalc: azimuth measured from South, positive towards West
  // Convert to compass azimuth (0=N, 90=E, 180=S, 270=O)
  return norm360(toDeg(radAz) + 180);
}

export function parallacticAngleDeg(azDeg: number, altDeg: number, latDeg: number): number {
  const A = (azDeg * Math.PI) / 180;
  const h = (altDeg * Math.PI) / 180;
  const phi = (latDeg * Math.PI) / 180;
  const num = Math.sin(A);
  const den = Math.tan(phi) * Math.cos(h) - Math.sin(h) * Math.cos(A);
  const q = Math.atan2(num, den);
  return (q * 180) / Math.PI;
}

export function altazToRaDec(azDeg: number, altDeg: number, latDeg: number, lstDegVal: number) {
  // Inputs: azDeg measured from NORTH toward EAST (0°=N, 90°=E), altDeg=h
  const A = toRad(azDeg);
  const h = toRad(altDeg);
  const phi = toRad(latDeg);
  // Correct north-referenced formulas
  // sinδ = sinφ·sinh + cosφ·cosh·cosA
  const sinDelta = Math.sin(phi) * Math.sin(h) + Math.cos(phi) * Math.cos(h) * Math.cos(A);
  const delta = Math.asin(Math.max(-1, Math.min(1, sinDelta)));
  const cosDelta = Math.max(1e-9, Math.cos(delta));
  // Hour angle H with A from North→East:
  // sinH = - (sinA · cosh) / cosδ
  // cosH = (sinh − sinφ·sinδ) / (cosφ·cosδ)
  const sinH = -(Math.sin(A) * Math.cos(h)) / cosDelta;
  const cosH = (Math.sin(h) - Math.sin(phi) * Math.sin(delta)) / (Math.max(1e-9, Math.cos(phi) * cosDelta));
  const H = Math.atan2(sinH, cosH); // radians (−π..+π), positive westward
  // RA = LST − H
  let ra = toRad(lstDegVal) - H;
  ra = ((ra % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  return { raDeg: toDeg(ra), decDeg: toDeg(delta), Hdeg: toDeg(H) };
}
