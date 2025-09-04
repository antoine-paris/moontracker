import { angularDiff } from "../utils/math";

export function projectToScreen(
  azDeg: number,
  altDeg: number,
  refAzDeg: number,
  width: number,
  height: number,
  refAltDeg: number = 0,
  radiusPx: number = 0,
  fovXDeg: number = 220,
  fovYDeg: number = 220,
) {
  const fovHalfX = Math.max(5, fovXDeg / 2);
  const fovHalfY = Math.max(5, fovYDeg / 2);
  const dx = angularDiff(azDeg, refAzDeg); // [-180, +180]
  // Convert pixel radius to angular margin in both axes
  const marginXDeg = width > 0 ? (radiusPx / (width / 2)) * fovHalfX : 0;
  const marginYDeg = height > 0 ? (radiusPx / (height / 2)) * fovHalfY : 0;
  const visibleX = Math.abs(dx) <= (fovHalfX + marginXDeg);
  const visibleY = Math.abs(altDeg - refAltDeg) <= (fovHalfY + marginYDeg);
  const x = width / 2 + (dx / fovHalfX) * (width / 2);
  const y = height / 2 - ((altDeg - refAltDeg) / fovHalfY) * (height / 2);
  return { x, y, visibleX, visibleY };
}
