// Camera-based projection with selectable projection modes.



// --- OLD: Full projection implementation (kept for reference) ---

type ProjectionMode = 'recti-panini' | 'stereo-centered' | 'ortho' | 'cylindrical' | 'rectilinear';

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
  } else if (projectionMode === 'cylindrical') {
    // Cylindrical (equirectangular, centered on reference/forward)
    // lon around forward axis: [-pi..pi], lat: [-pi/2..pi/2]
    const lon = Math.atan2(xCam, zCam);
    const lat = Math.asin(clamp(yCam, -1, 1));
    // Map half-FOV (thetaX/thetaY) to half viewport
    const fx = halfW / Math.max(1e-9, thetaX);
    const fy = halfH / Math.max(1e-9, thetaY);
    const u = fx * lon;
    const v2 = fy * lat;
    sx = halfW + u;
    sy = halfH - v2;
    // Visible if within the specified FOV window
    visible = Math.abs(lon) <= (thetaX + 1e-9) && Math.abs(lat) <= (thetaY + 1e-9);
  } else if (projectionMode === 'rectilinear') {
    // Perspective pure: lignes droites préservées, FOV < 180°
    const thetaXR = clamp((fovXDeg || 1) / 2, 0.1, 89.9) * Math.PI / 180;
    const thetaYR = clamp((fovYDeg || 1) / 2, 0.1, 89.9) * Math.PI / 180;
    const fx = halfW / Math.tan(thetaXR);
    const fy = halfH / Math.tan(thetaYR);
    const denom = zCam;
    visible = denom > 1e-6;
    if (visible) {
      const u = fx * (xCam / denom);
      const v2 = fy * (yCam / denom);
      sx = halfW + u;
      sy = halfH - v2;
    }
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

// --- NEW: Valid projections and ideal choice helpers ---

/**
 * Retourne les projections valides pour un FOV horizontal/vertical donné (en degrés).
 * Les heuristiques suivantes évitent les cas impossibles ou trop déformants:
 * - rectilinear: ≤ 140° sur chaque axe
 * - recti-panini: ≤ 175° sur chaque axe
 * - stereo-centered: ≤ 175° sur chaque axe
 * - ortho: ≤ 180° sur chaque axe (hémisphère avant)
 * - cylindrical: H ≤ 360°, V ≤ 180°
 * On peut prendre en compte l’aspect (viewport W/H) pour favoriser le panoramique.
 */
export function getValidProjectionModes(
  widthDeg: number,
  heightDeg: number,
  viewportW?: number,
  viewportH?: number
): ProjectionMode[] {
  const w = clamp(Math.abs(widthDeg || 0), 0.1, 360);
  const h = clamp(Math.abs(heightDeg || 0), 0.1, 360);

  // Seuils réglables
  const MAX_RECTILINEAR = 140;
  const MAX_PANINI = 175;
  const MAX_STEREO = 175;
  const MAX_ORTHO = 180;
  const MAX_CYL_H = 360;
  const MAX_CYL_V = 180;

  const out: ProjectionMode[] = [];

  // Rectilinear (perspective)
  if (w <= MAX_RECTILINEAR && h <= MAX_RECTILINEAR) {
    out.push('rectilinear');
  }

  // Recti-Panini (hybride)
  if (w <= MAX_PANINI && h <= MAX_PANINI) {
    out.push('recti-panini');
  }

  // Stéréographique
  if (w <= MAX_STEREO && h <= MAX_STEREO) {
    out.push('stereo-centered');
  }

  // Orthographique (hémisphère avant)
  if (w <= MAX_ORTHO && h <= MAX_ORTHO) {
    out.push('ortho');
  }

  // Cylindrique (panoramique)
  if (w <= MAX_CYL_H && h <= MAX_CYL_V) {
    out.push('cylindrical');
  }

  // Petit bonus: si l’aspect est très large, on s’assure que le mode cylindrique
  // est proposé (sans retirer les autres).
  const aspect = Number(viewportW) > 0 && Number(viewportH) > 0 ? (Number(viewportW) / Number(viewportH)) : NaN;
  if (!Number.isNaN(aspect) && aspect > 1.8 && !out.includes('cylindrical') && w <= MAX_CYL_H && h <= MAX_CYL_V) {
    out.push('cylindrical');
  }

  return out;
}

/**
 * Choisit une projection "idéale" pour (WidthDeg, HeightDeg).
 * Strategy:
 * - 'keep-if-valid' (par défaut): conserve `current` si encore valide.
 * - 'force-ideal': ignore `current` et choisit la meilleure selon les heuristiques.
 */
export function pickIdealProjection(
  widthDeg: number,
  heightDeg: number,
  current?: ProjectionMode,
  viewportW?: number,
  viewportH?: number,
  strategy: 'keep-if-valid' | 'force-ideal' = 'keep-if-valid'
): ProjectionMode {
  const valid = getValidProjectionModes(widthDeg, heightDeg, viewportW, viewportH);
  const w = Math.abs(widthDeg);
  const h = Math.abs(heightDeg);
  const minFov = Math.min(w, h);
  const maxFov = Math.max(w, h);
  const aspect = Number(viewportW) > 0 && Number(viewportH) > 0 ? (Number(viewportW) / Number(viewportH)) : 1;

  if (strategy === 'keep-if-valid' && current && valid.includes(current)) {
    return current;
  }

  // Heuristiques de choix:
  // - Panoramique H > 180°: cylindrique si dispo.
  if (w > 180 && valid.includes('cylindrical')) return 'cylindrical';

  // - Tout-ciel / quasi hémisphérique: ortho stabilise l’horizon
  if (minFov >= 170 && valid.includes('ortho')) return 'ortho';

  // - Ultra grand angle: privilégier stéréo, puis panini
  if (maxFov >= 140) {
    if (valid.includes('stereo-centered')) return 'stereo-centered';
    if (valid.includes('recti-panini')) return 'recti-panini';
  }

  // - Grand angle: panini avant perspective
  if (maxFov >= 110) {
    if (valid.includes('recti-panini')) return 'recti-panini';
    if (valid.includes('stereo-centered')) return 'stereo-centered';
  }

  // - Aspect très large: favoriser le cylindre si pertinent
  if (aspect > 2.8 && valid.includes('cylindrical')) return 'cylindrical';

  // - Étroit: perspective pure
  if (valid.includes('rectilinear')) return 'rectilinear';

  // Sinon: premiers valides en ordre de préférence bateau
  const preference: ProjectionMode[] = ['recti-panini', 'stereo-centered', 'ortho', 'cylindrical', 'rectilinear'];
  for (const m of preference) if (valid.includes(m)) return m;

  // Fallback
  return valid[0] ?? 'recti-panini';
}
