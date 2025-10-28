import { norm360 } from '../utils/math';
import { projectToScreen } from './projection';

type ProjCtx = {
  refAz: number;
  refAlt: number;
  viewport: { w: number; h: number };
  fovXDeg: number;
  fovYDeg: number;
  projectionMode: import("./projection").ProjectionMode;
  lockHorizon: boolean;
  eclipticUpAzDeg?: number;
  eclipticUpAltDeg?: number;
};

/**
 * Projection-aware local vertical angle at a given sky position, in screen angle degrees:
 * 0 = →
 * 90 = ↓
 * 180 = ←
 * 270 = ↑
 */
export function localUpAngleOnScreen(azDeg: number, altDeg: number, ctx: ProjCtx): number {
  const {
    refAz, refAlt, viewport, fovXDeg, fovYDeg, projectionMode,
    lockHorizon, eclipticUpAzDeg, eclipticUpAltDeg,
  } = ctx;

  const eps = 0.01;

  const p0 = projectToScreen(
    azDeg, altDeg,
    refAz, viewport.w, viewport.h, refAlt, 0,
    fovXDeg, fovYDeg, projectionMode,
    lockHorizon, eclipticUpAzDeg, eclipticUpAltDeg
  );
  const pU = projectToScreen(
    azDeg, altDeg + eps,
    refAz, viewport.w, viewport.h, refAlt, 0,
    fovXDeg, fovYDeg, projectionMode,
    lockHorizon, eclipticUpAzDeg, eclipticUpAltDeg
  );
  const pD = projectToScreen(
    azDeg, altDeg - eps,
    refAz, viewport.w, viewport.h, refAlt, 0,
    fovXDeg, fovYDeg, projectionMode,
    lockHorizon, eclipticUpAzDeg, eclipticUpAltDeg
  );

  // Centered difference to avoid forward/back flips
  let vx = pU.x - pD.x;
  let vy = pU.y - pD.y;
  const m = Math.hypot(vx, vy);

  // Fallback to larger single-sided step if degenerate
  if (m < 1e-6) {
    const dxU = pU.x - p0.x, dyU = pU.y - p0.y;
    const dxD = pD.x - p0.x, dyD = pD.y - p0.y;
    const mU = Math.hypot(dxU, dyU), mD = Math.hypot(dxD, dyD);
    vx = (mU >= mD ? dxU : dxD);
    vy = (mU >= mD ? dyU : dyD);
  }

  // Sign with the “upward” screen vector (toward pU)
  const ux = pU.x - p0.x, uy = pU.y - p0.y;
  let ang = Math.atan2(vy, vx) * 180 / Math.PI; // 0=→, 90=↓
  if (ux * vx + uy * vy < 0) ang = norm360(ang + 180);
  return ang;
}

export function localPoleAngleOnScreen(
  azDeg: number,
  altDeg: number,
  poleAzDeg: number,
  poleAltDeg: number,
  ctx: ProjCtx
): number {
  const { refAz, refAlt, viewport, fovXDeg, fovYDeg, projectionMode, lockHorizon, eclipticUpAzDeg, eclipticUpAltDeg } = ctx;

  // Vec helpers (ENU: +X=East, +Y=North, +Z=Up)
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const altAzToVec = (azD: number, altD: number) => {
    const az = toRad(azD), alt = toRad(altD);
    const ca = Math.cos(alt), sa = Math.sin(alt);
    return [ca * Math.sin(az), ca * Math.cos(az), sa] as const;
  };
  const vecToAltAz = (v: readonly number[]) => {
    const x = v[0], y = v[1], z = v[2];
    const alt = Math.asin(Math.max(-1, Math.min(1, z)));
    const az = Math.atan2(x, y);
    return { azDeg: norm360(toDeg(az)), altDeg: toDeg(alt) };
  };
  const dot = (a: readonly number[], b: readonly number[]) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
  const add = (a: readonly number[], b: readonly number[]) => [a[0]+b[0], a[1]+b[1], a[2]+b[2]] as const;
  const mul = (a: readonly number[], s: number) => [a[0]*s, a[1]*s, a[2]*s] as const;
  const norm = (a: readonly number[]) => {
    const m = Math.hypot(a[0], a[1], a[2]) || 1;
    return [a[0]/m, a[1]/m, a[2]/m] as const;
  };

  const r = altAzToVec(azDeg, altDeg);
  const n = altAzToVec(poleAzDeg, poleAltDeg);

  // Tangent toward pole: t = n - (n·r) r
  let t = add(n, mul(r, -dot(n, r)));
  const tLen = Math.hypot(t[0], t[1], t[2]);

  const p0 = projectToScreen(azDeg, altDeg, refAz, viewport.w, viewport.h, refAlt, 0, fovXDeg, fovYDeg, projectionMode, lockHorizon, eclipticUpAzDeg, eclipticUpAltDeg);

  // Fallback: if degenerate, reuse horizon up sampling
  if (tLen < 1e-9) {
    const eps = 0.01;
    const pU = projectToScreen(azDeg, altDeg + eps, refAz, viewport.w, viewport.h, refAlt, 0, fovXDeg, fovYDeg, projectionMode, lockHorizon, eclipticUpAzDeg, eclipticUpAltDeg);
    const pD = projectToScreen(azDeg, altDeg - eps, refAz, viewport.w, viewport.h, refAlt, 0, fovXDeg, fovYDeg, projectionMode, lockHorizon, eclipticUpAzDeg, eclipticUpAltDeg);
    const dxU = pU.x - p0.x, dyU = pU.y - p0.y;
    const dxD = pD.x - p0.x, dyD = pD.y - p0.y;
    const mU = Math.hypot(dxU, dyU), mD = Math.hypot(dxD, dyD);
    const useDown = mD > mU;
    let ang = Math.atan2(useDown ? dyD : dyU, useDown ? dxD : dxU) * 180 / Math.PI;
    if (useDown) ang = norm360(ang + 180);
    return ang;
  }

  // Symmetric small step along ±t to avoid forward/back branch flips
  t = norm(t);
  const EPS = 7e-4; // ~0.04°
  const rF = norm(add(r, mul(t, EPS)));
  const rB = norm(add(r, mul(t, -EPS)));
  const aF = vecToAltAz(rF);
  const aB = vecToAltAz(rB);

  const pF = projectToScreen(aF.azDeg, aF.altDeg, refAz, viewport.w, viewport.h, refAlt, 0, fovXDeg, fovYDeg, projectionMode, lockHorizon, eclipticUpAzDeg, eclipticUpAltDeg);
  const pB = projectToScreen(aB.azDeg, aB.altDeg, refAz, viewport.w, viewport.h, refAlt, 0, fovXDeg, fovYDeg, projectionMode, lockHorizon, eclipticUpAzDeg, eclipticUpAltDeg);

  // Direction via centered difference
  let vx = pF.x - pB.x;
  let vy = pF.y - pB.y;
  const m = Math.hypot(vx, vy);

  // If nearly degenerate, fall back to the larger single-sided step
  if (m < 1e-6) {
    const dxF = pF.x - p0.x, dyF = pF.y - p0.y;
    const dxB = pB.x - p0.x, dyB = pB.y - p0.y;
    const mF = Math.hypot(dxF, dyF), mB = Math.hypot(dxB, dyB);
    vx = (mF >= mB ? dxF : dxB);
    vy = (mF >= mB ? dyF : dyB);
  }

  // Sign with the screen vector toward the projected pole (makes orientation consistent)
  const pN = projectToScreen(poleAzDeg, poleAltDeg, refAz, viewport.w, viewport.h, refAlt, 0, fovXDeg, fovYDeg, projectionMode, lockHorizon, eclipticUpAzDeg, eclipticUpAltDeg);
  const nx = pN.x - p0.x, ny = pN.y - p0.y;
  let ang = Math.atan2(vy, vx) * 180 / Math.PI;
  if (nx * vx + ny * vy < 0) ang = norm360(ang + 180);
  return ang;
}



/**
 * Convert “rotation vs horizon north” to on-screen rotation so that local vertical aligns with screen vertical.
 * Matches the formula used for Sun/Moon in App.tsx.
 */
export function correctedSpriteRotationDeg(rotationToHorizonNorthDeg: number, localUpAngleDeg: number): number {
  return -(-rotationToHorizonNorthDeg + (-90 - localUpAngleDeg));
}