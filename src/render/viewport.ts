export type Size = { w: number; h: number };
export type Viewport = { x: number; y: number; w: number; h: number };

export function computeViewport(
  showCameraFrame: boolean,
  stageSize: Size,
  deviceAspect: number,
  minMargin = 20
): Viewport {
  if (!showCameraFrame) {
    return { x: 0, y: 0, w: stageSize.w, h: stageSize.h };
  }
  const availW = Math.max(0, stageSize.w - 2 * minMargin);
  const availH = Math.max(0, stageSize.h - 2 * minMargin);
  if (availW <= 0 || availH <= 0) {
    return { x: 0, y: 0, w: stageSize.w, h: stageSize.h };
  }
  const ar = Math.max(0.1, deviceAspect || (stageSize.w / Math.max(1, stageSize.h)));
  let w = availW;
  let h = Math.round(w / ar);
  if (h > availH) { h = availH; w = Math.round(h * ar); }
  const x = Math.round((stageSize.w - w) / 2);
  const y = Math.round((stageSize.h - h) / 2);
  return { x, y, w, h };
}