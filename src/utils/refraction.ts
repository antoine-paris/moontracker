// Formule de Saemundsson (1986) en minutes d'arc, paramètres standard: P=1010 hPa, T=10°C

export function refractAltitudeDeg(
  altDeg: number,
  pressureHPa: number = 1010,
  temperatureC: number = 10
): number {
  // Appliquer la réfraction seulement près de l’horizon et jusqu’au zénith
  if (altDeg < -1) return altDeg;           // ne pas remonter tout ce qui est bien sous l’horizon
  const a = Math.min(89.9, altDeg);         // éviter tan(≈90°)
  const tanArg = a + 10.3 / (a + 5.11);
  const R_arcmin =
    (1.02 / Math.tan((Math.PI / 180) * tanArg)) *
    (pressureHPa / 1010) *
    (283 / (273 + temperatureC));
  const app = altDeg + R_arcmin / 60;
  return Math.min(app, 89.999);             // ne pas dépasser 90°
}

/**
 * Inverse approx: à partir de l'altitude apparente, retrouver l'altitude vraie.
 */
export function unrefractAltitudeDeg(
  apparentAltDeg: number,
  pressureHPa: number = 1010,
  temperatureC: number = 10,
  iterations: number = 3
): number {
  // Si très bas (bien sous l’horizon), considérer qu’il n’y avait pas de réfraction utile
  if (apparentAltDeg < -0.5) return apparentAltDeg;

  let altTrue = Math.min(89.9, apparentAltDeg); // point de départ sûr
  for (let i = 0; i < iterations; i++) {
    const a = Math.min(89.9, Math.max(-1, altTrue));
    const tanArg = a + 10.3 / (a + 5.11);
    const R_arcmin =
      (1.02 / Math.tan((Math.PI / 180) * tanArg)) *
      (pressureHPa / 1010) *
      (283 / (273 + temperatureC));
    altTrue = apparentAltDeg - R_arcmin / 60;
  }
  return altTrue;
}