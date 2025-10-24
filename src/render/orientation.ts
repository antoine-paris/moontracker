import { norm360 } from '../utils/math';
import { projectToScreen } from './projection';

type ProjCtx = {
  refAz: number;
  refAlt: number;
  viewport: { w: number; h: number };
  fovXDeg: number;
  fovYDeg: number;
  projectionMode: import("./projection").ProjectionMode;
};

/**
 * Projection-aware local vertical angle at a given sky position, in screen angle degrees:
 * 0 = →
 * 90 = ↓
 * 180 = ←
 * 270 = ↑
 */
export function localUpAngleOnScreen(azDeg: number, altDeg: number, ctx: ProjCtx): number {
  const { refAz, refAlt, viewport, fovXDeg, fovYDeg, projectionMode } = ctx;
  const eps = 0.01;
  const p0 = projectToScreen(azDeg, altDeg, refAz, viewport.w, viewport.h, refAlt, 0, fovXDeg, fovYDeg, projectionMode);
  const pU = projectToScreen(azDeg, altDeg + eps, refAz, viewport.w, viewport.h, refAlt, 0, fovXDeg, fovYDeg, projectionMode);
  const pD = projectToScreen(azDeg, altDeg - eps, refAz, viewport.w, viewport.h, refAlt, 0, fovXDeg, fovYDeg, projectionMode);
  const dxU = pU.x - p0.x, dyU = pU.y - p0.y;
  const dxD = pD.x - p0.x, dyD = pD.y - p0.y;
  const mU = Math.hypot(dxU, dyU);
  const mD = Math.hypot(dxD, dyD);
  const useDown = mD > mU;
  let ang = Math.atan2(useDown ? dyD : dyU, useDown ? dxD : dxU) * 180 / Math.PI; // 0=→, 90=↓
  if (useDown) ang = norm360(ang + 180);
  return ang;
}

/**
 * Convert “rotation vs horizon north” to on-screen rotation so that local vertical aligns with screen vertical.
 * Matches the formula used for Sun/Moon in App.tsx.
 */
export function correctedSpriteRotationDeg(rotationToHorizonNorthDeg: number, localUpAngleDeg: number): number {
  return -(-rotationToHorizonNorthDeg + (-90 - localUpAngleDeg));
}