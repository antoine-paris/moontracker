import { sepDeg, eclipseKind } from './eclipse';

export function computeEclipseInfo(
  sunAltDeg: number, sunAzDeg: number, sunDiamDeg: number,
  moonAltDeg: number, moonAzDeg: number, moonDiamDeg: number
) {
  const sep = sepDeg(sunAltDeg, sunAzDeg, moonAltDeg, moonAzDeg);
  const rS = (sunDiamDeg ?? 0) / 2;
  const rM = (moonDiamDeg ?? 0) / 2;
  const kind = eclipseKind(sep, rS, rM);
  return { sep, rS, rM, kind } as const;
}