import React from "react";
import { Z } from "../../render/constants";
import { projectToScreen } from "../../render/projection";

type Props = {
  viewport: { x: number; y: number; w: number; h: number };
  // projection context
  refAzDeg: number;
  refAltDeg: number;
  fovXDeg: number;
  fovYDeg: number;
  projectionMode: 'recti-panini' | 'stereo-centered' | 'ortho';
  // visuals
  showAtmosphere?: boolean;
  atmosphereGradient?: string;
  showEarth?: boolean;
};

export default function HorizonOverlay({
  viewport,
  refAzDeg,
  refAltDeg,
  fovXDeg,
  fovYDeg,
  projectionMode,
  showAtmosphere = false,
  atmosphereGradient,
  showEarth = false,
}: Props) {
  // Compute Y positions inside the viewport-local space
  const yH = projectToScreen(refAzDeg, 0, refAzDeg, viewport.w, viewport.h, refAltDeg, 0, fovXDeg, fovYDeg, projectionMode).y;

  // Build projected horizon/alt curves (alt = const)
  const buildAltPath = (altDeg: number, azSpanDeg: number = fovXDeg) => {
    const startAz = refAzDeg - azSpanDeg / 2;
    const endAz = refAzDeg + azSpanDeg / 2;
    const steps = Math.max(64, Math.min(512, Math.round(azSpanDeg * 2)));
    const step = (endAz - startAz) / steps;

    let d = "";
    let inSeg = false;

    for (let i = 0; i <= steps; i++) {
      const az = startAz + i * step;
      const p = projectToScreen(az, altDeg, refAzDeg, viewport.w, viewport.h, refAltDeg, 0, fovXDeg, fovYDeg, projectionMode);
      const visible = (p.visibleX ?? true) && (p.visibleY ?? true);
      if (visible) {
        const x = p.x;
        const y = p.y;
        if (!inSeg) {
          d += `M ${x.toFixed(2)} ${y.toFixed(2)} `;
          inSeg = true;
        } else {
          d += `L ${x.toFixed(2)} ${y.toFixed(2)} `;
        }
      } else {
        inSeg = false; // break segment
      }
    }
    return d.trim();
  };

  // --- helpers to build the prime-vertical great circle (through zenith, crossing horizon at refAz±90)
  const DEG = Math.PI / 180;
  const RAD = 180 / Math.PI;
  const clamp01 = (v: number) => Math.max(-1, Math.min(1, v));
  const altAzToVec = (altDeg: number, azDeg: number) => {
    const alt = altDeg * DEG, az = azDeg * DEG;
    const ca = Math.cos(alt), sa = Math.sin(alt);
    // ENU: az=0 => +Y (North), az=90 => +X (East)
    return [ca * Math.sin(az), ca * Math.cos(az), sa] as const;
  };
  const vecToAltAz = (v: readonly number[]) => {
    const [x, y, z] = v;
    const alt = Math.asin(clamp01(z)) * RAD;
    const az = Math.atan2(x, y) * RAD;
    return { alt, az };
  };
  const norm = (v: number[]) => {
    const m = Math.hypot(v[0], v[1], v[2]) || 1;
    return [v[0] / m, v[1] / m, v[2] / m];
  };
  const cross = (a: readonly number[], b: readonly number[]) => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];

  const buildPrimeVerticalPaths = () => {
    // Normal to the plane is the unit vector on the horizon at refAz
    const n = altAzToVec(0, refAzDeg);
    // Orthonormal basis spanning the GC plane
    const z = [0, 0, 1] as const;
    let a = cross(n, z);
    const aLen = Math.hypot(a[0], a[1], a[2]);
    if (aLen < 1e-6) a = [1, 0, 0]; // fallback if n // z
    a = norm(a);
    let b = cross(n, a);
    b = norm(b);

    const step = Math.max(0.25, Math.min(2, Math.min(fovXDeg, fovYDeg) / 120));
    const epsAlt = 1e-3;

    // collect visible polyline segments to be able to reverse for labels
    type Pt = { x: number; y: number };
    const segsTop: Pt[][] = [];
    const segsBottom: Pt[][] = [];
    let currTop: Pt[] = [];
    let currBottom: Pt[] = [];

    for (let t = 0; t <= 360 + 1e-9; t += step) {
      const ct = Math.cos(t * DEG), st = Math.sin(t * DEG);
      const v = [a[0] * ct + b[0] * st, a[1] * ct + b[1] * st, a[2] * ct + b[2] * st] as const;
      const { alt } = vecToAltAz(v);
      const p = projectToScreen(
        // we only need x,y/visibility; use alt/az from vector for correctness
        Math.atan2(v[0], v[1]) * RAD,
        alt,
        refAzDeg,
        viewport.w,
        viewport.h,
        refAltDeg,
        0,
        fovXDeg,
        fovYDeg,
        projectionMode
      );
      const visible = (p.visibleX ?? true) && (p.visibleY ?? true);

      if (visible && alt >= -epsAlt) {
        currTop.push({ x: p.x, y: p.y });
      } else if (currTop.length) {
        segsTop.push(currTop);
        currTop = [];
      }

      if (visible && alt <= epsAlt) {
        currBottom.push({ x: p.x, y: p.y });
      } else if (currBottom.length) {
        segsBottom.push(currBottom);
        currBottom = [];
      }
    }
    if (currTop.length) segsTop.push(currTop);
    if (currBottom.length) segsBottom.push(currBottom);

    const buildD = (segs: Pt[][]) =>
      segs.map(seg =>
        seg.reduce((acc, pt, i) => acc + `${i ? "L" : "M"} ${pt.x.toFixed(2)} ${pt.y.toFixed(2)} `, "")
      ).join("").trim();

    const dTop = buildD(segsTop);
    const dBottom = buildD(segsBottom);

    // pick the longest bottom segment and reverse it for an upright label path
    const segLen = (seg: Pt[]) => seg.reduce((s, p, i) => i ? s + Math.hypot(p.x - seg[i - 1].x, p.y - seg[i - 1].y) : 0, 0);
    let longestBottom: Pt[] | null = null;
    let maxLen = 0;
    for (const s of segsBottom) {
      const L = segLen(s);
      if (L > maxLen) { maxLen = L; longestBottom = s; }
    }
    let dBottomLabel = "";
    if (longestBottom && longestBottom.length >= 2) {
      const rev = [...longestBottom].reverse();
      dBottomLabel = rev.reduce((acc, pt, i) => acc + `${i ? "L" : "M"} ${pt.x.toFixed(2)} ${pt.y.toFixed(2)} `, "").trim();
    }

    return { topPath: dTop, bottomPath: dBottom, bottomLabelPath: dBottomLabel };
  };

  const horizonPath = buildAltPath(0);
  const { topPath, bottomPath, bottomLabelPath } = buildPrimeVerticalPaths();

  const topPathId = "alt-top-path";
  const bottomPathId = "alt-bottom-path";
  const bottomLabelPathId = "alt-bottom-label-path";

  return (
    <>
      {/* Viewport-anchored wrapper */}
      <div
        className="absolute"
        style={{ left: viewport.x, top: viewport.y, width: viewport.w, height: viewport.h, pointerEvents: "none" }}
      >
        {/* Atmosphere below everything else */}
        {showAtmosphere && (
          <div
            className="absolute inset-0"
            style={{ zIndex: Z.horizon - 8, background: atmosphereGradient ?? "linear-gradient(to top, #000, #000)" }}
          />
        )}

        {/* Ground mask to cover stars below horizon; stays below Sun/Moon */}
        {showEarth && (
          <div
            className="absolute left-0 right-0"
            style={{ top: yH, bottom: 0, zIndex: Z.horizon - 4, background: "rgba(0,0,0,0.6)" }}
          />
        )}

        {/* Projected curves */}
        <svg
          width={viewport.w}
          height={viewport.h}
          className="absolute"
          style={{ left: 0, top: 0, zIndex: Z.horizon + 2 }}
        >
          <defs>
            {topPath && <path id={topPathId} d={topPath} />}
            {bottomPath && <path id={bottomPathId} d={bottomPath} />}
            {bottomLabelPath && <path id={bottomLabelPathId} d={bottomLabelPath} />}
          </defs>

          {/* Horizon curve */}
          <path d={horizonPath} stroke="rgba(255,255,255,0.45)" strokeWidth={1} fill="none" />

          {/* +90° ALT arc (haut): from AZ-90 to AZ+90 via zenith */}
          {topPath && (
            <>
              <path d={topPath} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={1} strokeDasharray="4 4" />
              <text fontSize="10" fill="rgba(255,255,255,0.7)">
                <textPath href={`#${topPathId}`} startOffset="50%" textAnchor="middle">haut</textPath>
              </text>
            </>
          )}

          {/* -90° ALT arc (bas): symmetric via nadir */}
          {bottomPath && (
            <>
              <path d={bottomPath} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={1} strokeDasharray="4 4" />
              {bottomLabelPath && (
                <text fontSize="10" fill="rgba(255,255,255,0.7)">
                  <textPath href={`#${bottomLabelPathId}`} startOffset="50%" textAnchor="middle">bas</textPath>
                </text>
              )}
            </>
          )}
        </svg>
      </div>
    </>
  );
}

