// Séparation angulaire Soleil-Lune en degrés à partir d'alt/az (en degrés)
export function sepDeg(alt1: number, az1: number, alt2: number, az2: number): number {
  const d2r = Math.PI / 180;
  const a1 = alt1 * d2r, A1 = az1 * d2r;
  const a2 = alt2 * d2r, A2 = az2 * d2r;
  const s1 = Math.sin(a1), c1 = Math.cos(a1);
  const s2 = Math.sin(a2), c2 = Math.cos(a2);
  const cosSep = s1 * s2 + c1 * c2 * Math.cos(A1 - A2);
  const clamped = Math.min(1, Math.max(-1, cosSep));
  return Math.acos(clamped) * 180 / Math.PI;
}

// Classification locale selon rayons apparents (en degrés)
export function eclipseKind(sep: number, rSun: number, rMoon: number): "none" | "partial" | "annular" | "total" {
  if (sep >= rSun + rMoon) return "none";
  if (rMoon >= rSun) return sep < (rMoon - rSun) ? "total" : "partial";
  return sep < (rSun - rMoon) ? "annular" : "partial";
}
