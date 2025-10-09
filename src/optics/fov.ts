import { toDeg, toRad, clamp } from "../utils/math";

export const FOV_DEG_MIN = 0.1;
export const FOV_DEG_MAX = 360;
const LOG10_MIN = Math.log10(FOV_DEG_MIN);
const LOG10_MAX = Math.log10(FOV_DEG_MAX);

export function degToSlider(deg: number, steps = 1000) {
  const d = clamp(deg, FOV_DEG_MIN, FOV_DEG_MAX);
  const t = (Math.log10(d) - LOG10_MIN) / (LOG10_MAX - LOG10_MIN);
  return Math.round(clamp(t, 0, 1) * steps);
}

export function sliderToDeg(value: number, steps = 1000) {
  const t = clamp(value / steps, 0, 1);
  const log10 = LOG10_MIN + t * (LOG10_MAX - LOG10_MIN);
  return Math.pow(10, log10);
}

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

// New: compute from horizontal FOV
export function f35FromFovH(hDeg: number, aspect = 4 / 3) {
  const hf = toRad(Math.max(1e-6, Math.min(179.999, hDeg)));
  const th = Math.tan(hf / 2);
  const a = Math.max(1e-6, aspect);
  // From hf = 2*atan(a*k) ⇒ k = tan(hf/2)/a; tan(alpha) = k*sqrt(a^2+1)
  const tanAlpha = (th / a) * Math.sqrt(a * a + 1);
  const diagFF = Math.hypot(36, 24); // 43.266 mm
  return diagFF / (2 * tanAlpha);
}

// New: best-of using both axes (yields the smaller 35mm eq for wide FOVs)
export function f35FromFovBest(hDeg: number, vDeg: number, aspect = 4 / 3) {
  const fV = f35FromFov(hDeg, vDeg, aspect);
  const fH = f35FromFovH(hDeg, aspect);
  return Math.min(fV, fH);
}
