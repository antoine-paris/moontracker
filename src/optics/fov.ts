import { toDeg, toRad } from "../utils/math";

export function fovRect(sensorWmm: number, sensorHmm: number, focalMm: number) {
  const h = 2 * Math.atan(sensorWmm / (2 * focalMm));
  const v = 2 * Math.atan(sensorHmm / (2 * focalMm));
  return { h: toDeg(h), v: toDeg(v) };
}

export function fovFromF35(f35: number, aspect = 4 / 3) {
  const diagFF = Math.hypot(36, 24); // 43.266 mm
  const FOVd = 2 * Math.atan(diagFF / (2 * f35));
  const alpha = FOVd / 2;
  const a = aspect;
  const k = Math.tan(alpha) / Math.sqrt(a * a + 1);
  const hf = 2 * Math.atan(a * k);
  const vf = 2 * Math.atan(k);
  return { h: toDeg(hf), v: toDeg(vf) };
}

export function f35FromFov(hDeg: number, vDeg: number, aspect = 4 / 3) {
  const vf = toRad(Math.max(1e-6, Math.min(179.999, vDeg)));
  const k = Math.tan(vf / 2);
  const alpha = Math.atan(k * Math.sqrt(aspect * aspect + 1));
  const FOVd = 2 * alpha;
  const diagFF = Math.hypot(36, 24); // 43.266 mm
  return diagFF / (2 * Math.tan(FOVd / 2));
}
