// Formule de Saemundsson (1986) en minutes d'arc, paramètres standard: P=1010 hPa, T=10°C

/**
 * Réfraction apparente (Saemundsson).
 * altDeg vraie -> alt apparente.
 */
export function refractAltitudeDeg(
  altDeg: number,
  pressureHPa: number = 1010,
  temperatureC: number = 10
): number {
  // Formule stable pour ~[-1°, 90°]. En-dessous, on n’applique pas.
  if (!Number.isFinite(altDeg)) return altDeg;
  if (altDeg < -1) return altDeg;
  const a = Math.min(89.9, altDeg);
  const tanArg = a + 10.3 / (a + 5.11);
  const R_arcmin =
    (1.02 / Math.tan((Math.PI / 180) * tanArg)) *
    (pressureHPa / 1010) *
    (283 / (273 + temperatureC));
  const app = altDeg + R_arcmin / 60;
  return Math.min(app, 89.999);
}

/**
 * Inverse approx continue: altitude apparente -> altitude vraie.
 * Itération fixe: altTrue = altApp - R(altTrue).
 */
export function unrefractAltitudeDeg(
  apparentAltDeg: number,
  pressureHPa: number = 1010,
  temperatureC: number = 10,
  iterations: number = 4
): number {
  if (!Number.isFinite(apparentAltDeg)) return apparentAltDeg;

  // Point de départ borné dans le domaine de validité de R(·)
  let altTrue = Math.max(-1, Math.min(89.9, apparentAltDeg));

  for (let i = 0; i < Math.max(1, iterations); i++) {
    const a = Math.max(-1, Math.min(89.9, altTrue));
    const tanArg = a + 10.3 / (a + 5.11);
    const R_arcmin =
      (1.02 / Math.tan((Math.PI / 180) * tanArg)) *
      (pressureHPa / 1010) *
      (283 / (273 + temperatureC));
    altTrue = apparentAltDeg - R_arcmin / 60;
  }
  // Pas de seuils/discontinuités: on retourne tel quel (borné haut)
  return Math.min(altTrue, 89.999);
}