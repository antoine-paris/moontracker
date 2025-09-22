// Camera-based projection with selectable projection modes.

type ProjectionMode = 'recti-panini' | 'stereo-centered' | 'ortho';

function clamp(v: number, a: number, b: number) { return Math.max(a, Math.min(b, v)); }
function toRad(d: number) { return (d * Math.PI) / 180; }
function toDeg(r: number) { return (r * 180) / Math.PI; }
function norm360(v: number) { return ((v % 360) + 360) % 360; }
function dot(a: readonly number[], b: readonly number[]) { return a[0]*b[0] + a[1]*b[1] + a[2]*b[2]; }
function cross(a: readonly number[], b: readonly number[]) {
  return [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]] as const;
}
function norm(v: readonly number[]) {
  const m = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0]/m, v[1]/m, v[2]/m] as const;
}
// ENU unit vector from Alt/Az (Az=0=N, +E; Alt up)
function altAzToVec(azDeg: number, altDeg: number) {
  const az = toRad(azDeg);
  const alt = toRad(altDeg);
  const ca = Math.cos(alt), sa = Math.sin(alt);
  const x = ca * Math.sin(az); // East
  const y = ca * Math.cos(az); // North
  const z = sa;                // Up
  return [x, y, z] as const;
}

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
  // NEW: projection mode (default keeps previous behavior = "recti-panini")
  projectionMode: ProjectionMode = 'recti-panini',
) {
  const halfW = width / 2;
  const halfH = height / 2;

  // Build camera basis from refAlt/refAz
  const fwd = altAzToVec(refAzDeg, refAltDeg); // forward = center direction
  const worldUp = [0, 0, 1] as const;
  let right = cross(fwd, worldUp);
  let rLen = Math.hypot(right[0], right[1], right[2]);
  if (rLen < 1e-6) {
    // looking close to zenith/nadir → choose arbitrary right on horizon East
    right = [1, 0, 0] as const;
    rLen = 1;
  }
  right = [right[0]/rLen, right[1]/rLen, right[2]/rLen] as const;
  const up = norm(cross(right, fwd));

  // Target direction in camera coords
  const v = altAzToVec(azDeg, altDeg);
  const xCam = dot(v, right);
  const yCam = dot(v, up);
  const zCam = dot(v, fwd);

  // Helper to set fx/fy for each projection so that half FOV maps to half viewport
  const thetaX = clamp((fovXDeg || 1) / 2, 0.1, 179.9) * Math.PI / 180;
  const thetaY = clamp((fovYDeg || 1) / 2, 0.1, 179.9) * Math.PI / 180;

  let sx = NaN, sy = NaN;
  let visible = true;

  if (projectionMode === 'stereo-centered') {
    // Stereographic: u = 2 f x / (1 + z), v = 2 f y / (1 + z)
    // Calibrate: halfW = 2 f sin(thetaX)/(1 + cos(thetaX)) = 2 f tan(thetaX/2)
    const fx = halfW / (2 * Math.tan(thetaX / 2));
    const fy = halfH / (2 * Math.tan(thetaY / 2));
    const denom = (1 + zCam);
    if (denom <= 1e-6) visible = false;
    else {
      const u = (2 * fx) * (xCam / denom);
      const v2 = (2 * fy) * (yCam / denom);
      sx = halfW + u;
      sy = halfH - v2;
    }
  } else if (projectionMode === 'ortho') {
    // Orthographic (hemisphere): u = f x, v = f y, visible if z>=0
    visible = zCam >= 0;
    const fx = halfW / Math.max(1e-6, Math.sin(thetaX));
    const fy = halfH / Math.max(1e-6, Math.sin(thetaY));
    const u = fx * xCam;
    const v2 = fy * yCam;
    sx = halfW + u;
    sy = halfH - v2;
  } else {
    // recti-panini: rectilinear for narrow FOV, Panini-like for ultra-wide
    const minFov = Math.min(fovXDeg, fovYDeg);
    if (minFov <= 30) {
      // Rectilinear (perspective)
      const fx = halfW / Math.tan(thetaX);
      const fy = halfH / Math.tan(thetaY);
      const denom = zCam;
      if (denom <= 1e-6) visible = false;
      else {
        const u = fx * (xCam / denom);
        const v2 = fy * (yCam / denom);
        sx = halfW + u;
        sy = halfH - v2;
      }
    } else {
      // Generalized "Panini-like": u = f x / (z + d), v = f y / (z + d)
      // d controls compression; increase with FOV for stability
      const t = clamp((minFov - 30) / 150, 0, 1); // 30°→0 .. 180°→1
      const d = 0.5 + 0.5 * t;                    // 0.5 .. 1.0
      const fx = halfW * (Math.cos(thetaX) + d) / Math.max(1e-6, Math.sin(thetaX));
      const fy = halfH * (Math.cos(thetaY) + d) / Math.max(1e-6, Math.sin(thetaY));
      const denom = zCam + d;
      if (denom <= 1e-6) visible = false;
      else {
        const u = fx * (xCam / denom);
        const v2 = fy * (yCam / denom);
        sx = halfW + u;
        sy = halfH - v2;
      }
    }
  }

  // Fallback to non-visible if mapping invalid
  if (!Number.isFinite(sx) || !Number.isFinite(sy)) visible = false;

  // Visibility with radius padding against the viewport
  const visibleX = visible && (sx + radiusPx >= 0 && sx - radiusPx <= width);
  const visibleY = visible && (sy + radiusPx >= 0 && sy - radiusPx <= height);

  // Approximate local px/deg using viewport/FOV (fast and good enough for sizing)
  const pxPerDegX = width / Math.max(1e-9, fovXDeg);
  const pxPerDegY = height / Math.max(1e-9, fovYDeg);

  return { x: sx, y: sy, visibleX, visibleY, pxPerDegX, pxPerDegY } as const;
}
