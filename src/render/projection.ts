// no external utils needed

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
  const halfW = width / 2;
  const halfH = height / 2;

  // Différences angulaires centrées
  const dAz = ((azDeg - refAzDeg + 540) % 360) - 180; // [-180,180]
  const dAlt = altDeg - refAltDeg;                   // peut dépasser +/-90, mappage géré par FOV

  const fovHalfX = Math.max(1e-6, fovXDeg / 2);
  const fovHalfY = Math.max(1e-6, fovYDeg / 2);

  // Choix de projection: gnomonique si FOV serré
  const useGnomonic = Math.min(fovXDeg, fovYDeg) <= 30;

  // Conversion degrés→radians
  const d2r = Math.PI / 180;
  const dAzR = dAz * d2r;
  const dAltR = dAlt * d2r;

  let sx: number, sy: number, pxPerDegX: number, pxPerDegY: number;

  if (useGnomonic) {
    const kx = halfW / Math.tan(fovHalfX * d2r);
    const ky = halfH / Math.tan(fovHalfY * d2r);
    sx = halfW + kx * Math.tan(dAzR);
    sy = halfH - ky * Math.tan(dAltR);
    // Échelles locales (dérivées de tan = sec^2)
    pxPerDegX = (kx * (1 / Math.cos(dAzR)) ** 2) * d2r; // px/rad → px/deg via *d2r
    pxPerDegY = (ky * (1 / Math.cos(dAltR)) ** 2) * d2r;
  } else {
    // Equirectangulaire
    sx = halfW + (dAz / fovHalfX) * halfW;
    sy = halfH - (dAlt / fovHalfY) * halfH;
    pxPerDegX = width / Math.max(1e-9, fovXDeg);
    pxPerDegY = height / Math.max(1e-9, fovYDeg);
  }

  // Position brute (pas de clamping par le rayon)
  const x = sx;
  const y = sy;

  // Visibilité selon le disque
  const visibleX = x + radiusPx >= 0 && x - radiusPx <= width;
  const visibleY = y + radiusPx >= 0 && y - radiusPx <= height;

  return { x, y, visibleX, visibleY, pxPerDegX, pxPerDegY } as const;
}
