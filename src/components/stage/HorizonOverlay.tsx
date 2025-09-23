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

  // New: robust 360° horizon path (ignores FOV clipping, handles seams)
  const buildAltPath360 = (altDeg: number) => {
    const startAz = refAzDeg - 180;
    const endAz = refAzDeg + 180;
    const steps = 720; // 0.5° resolution
    const step = (endAz - startAz) / steps;
    const maxJump2 = Math.pow(0.3 * Math.hypot(viewport.w, viewport.h), 2);

    let d = "";
    let inSeg = false;
    let prev: { x: number; y: number } | null = null;

    for (let i = 0; i <= steps; i++) {
      const az = startAz + i * step;
      const p = projectToScreen(
        az,
        altDeg,
        refAzDeg,
        viewport.w,
        viewport.h,
        refAltDeg,
        0,
        fovXDeg,
        fovYDeg,
        projectionMode
      );
      const finite = Number.isFinite(p.x) && Number.isFinite(p.y);
      if (!finite) {
        inSeg = false;
        prev = null;
        continue;
      }

      const x = p.x;
      const y = p.y;

      // Break at projection seams/large jumps to avoid long wrap lines
      if (prev) {
        const dx = x - prev.x, dy = y - prev.y;
        if (dx * dx + dy * dy > maxJump2) {
          inSeg = false;
          prev = null;
        }
      }

      if (!inSeg) {
        d += `M ${x.toFixed(2)} ${y.toFixed(2)} `;
        inSeg = true;
      } else {
        d += `L ${x.toFixed(2)} ${y.toFixed(2)} `;
      }
      prev = { x, y };
    }

    return d.trim();
  };

  // New: build 360° horizon segments similar to the path builder (handles seams/jumps)
  const buildAltSegments360 = (altDeg: number) => {
    const startAz = refAzDeg - 180;
    const endAz = refAzDeg + 180;
    const steps = 720; // 0.5° resolution
    const step = (endAz - startAz) / steps;
    const maxJump2 = Math.pow(0.3 * Math.hypot(viewport.w, viewport.h), 2);

    type Pt = { x: number; y: number };
    const segs: Pt[][] = [];
    let curr: Pt[] = [];
    let prev: Pt | null = null;

    for (let i = 0; i <= steps; i++) {
      const az = startAz + i * step;
      const p = projectToScreen(
        az,
        altDeg,
        refAzDeg,
        viewport.w,
        viewport.h,
        refAltDeg,
        0,
        fovXDeg,
        fovYDeg,
        projectionMode
      );
      const finite = Number.isFinite(p.x) && Number.isFinite(p.y);
      if (!finite) {
        if (curr.length) segs.push(curr);
        curr = [];
        prev = null;
        continue;
      }

      const pt = { x: p.x, y: p.y } as Pt;
      if (prev) {
        const dx = pt.x - prev.x, dy = pt.y - prev.y;
        if (dx * dx + dy * dy > maxJump2) {
          if (curr.length) segs.push(curr);
          curr = [];
          prev = null;
        }
      }
      curr.push(pt);
      prev = pt;
    }
    if (curr.length) segs.push(curr);
    return segs;
  };

  // New: build visible horizon segments to create earth fill polygons
  const buildAltVisibleSegments = (altDeg: number, azSpanDeg: number = fovXDeg) => {
    const startAz = refAzDeg - azSpanDeg / 2;
    const endAz = refAzDeg + azSpanDeg / 2;
    const steps = Math.max(64, Math.min(512, Math.round(azSpanDeg * 2)));
    const step = (endAz - startAz) / steps;

    type Pt = { x: number; y: number };
    const segs: Pt[][] = [];
    let curr: Pt[] = [];

    for (let i = 0; i <= steps; i++) {
      const az = startAz + i * step;
      const p = projectToScreen(
        az,
        altDeg,
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
      if (visible) {
        curr.push({ x: p.x, y: p.y });
      } else if (curr.length) {
        segs.push(curr);
        curr = [];
      }
    }
    if (curr.length) segs.push(curr);
    return segs;
  };

  // Helpers for ground split by horizon and "bas" (prime-vertical -90° arc)
  type Pt = { x: number; y: number };
  // Note: Reuse DEG, RAD, clamp01, altAzToVec, norm, cross from the prime-vertical helpers below.

  // Sample horizon arc from azStart -> azEnd (degrees), alt=0
  const buildHorizonArcPts = (azStart: number, azEnd: number) => {
    const span = azEnd - azStart;
    const steps = Math.max(180, Math.min(1440, Math.round(Math.abs(span) * 2))); // ~0.5°
    const step = span / steps;
    const pts: Pt[] = [];
    for (let i = 0; i <= steps; i++) {
      const az = azStart + i * step;
      const p = projectToScreen(
        az, 0,
        refAzDeg,
        viewport.w, viewport.h,
        refAltDeg, 0,
        fovXDeg, fovYDeg,
        projectionMode
      );
      if (Number.isFinite(p.x) && Number.isFinite(p.y)) pts.push({ x: p.x, y: p.y });
    }
    return pts;
  };

  // Build bottom arc (prime vertical via nadir) from C1 to C2
  const buildBottomArcPts = (c1: Pt, c2: Pt) => {
    // Prime-vertical basis (same as in buildPrimeVerticalPaths)
    const n = altAzToVec(0, refAzDeg);
    const z = [0, 0, 1] as const;
    let a = cross(n, z); a = norm([a[0], a[1], a[2]]);
    let b = cross(n, a); b = norm([b[0], b[1], b[2]]);
    const step = Math.max(0.4, Math.min(2, Math.min(fovXDeg, fovYDeg) / 120)); // keep close to label sampling
    const epsAlt = 1e-3;

    const pts: (Pt & { t: number })[] = [];
    for (let t = 0; t <= 360 + 1e-9; t += step) {
      const ct = Math.cos(t * DEG), st = Math.sin(t * DEG);
      const v = [a[0] * ct + b[0] * st, a[1] * ct + b[1] * st, a[2] * ct + b[2] * st] as const;
      const alt = Math.asin(clamp01(v[2])) * RAD;
      if (alt <= epsAlt) {
        const p = projectToScreen(
          Math.atan2(v[0], v[1]) * RAD, alt,
          refAzDeg,
          viewport.w, viewport.h,
          refAltDeg, 0,
          fovXDeg, fovYDeg,
          projectionMode
        );
        if (Number.isFinite(p.x) && Number.isFinite(p.y)) {
          pts.push({ x: p.x, y: p.y, t });
        }
      }
    }
    if (pts.length < 2) return [] as Pt[];

    // Find indices closest to C1 and C2
    const dist2 = (p: Pt, q: Pt) => (p.x - q.x) ** 2 + (p.y - q.y) ** 2;
    let i1 = 0, i2 = 0, d1 = Infinity, d2 = Infinity;
    for (let i = 0; i < pts.length; i++) {
      const dC1 = dist2(pts[i], c1);
      if (dC1 < d1) { d1 = dC1; i1 = i; }
      const dC2 = dist2(pts[i], c2);
      if (dC2 < d2) { d2 = dC2; i2 = i; }
    }

    // Slice from i1 -> i2 along bottom arc
    let arc = i1 <= i2 ? pts.slice(i1, i2 + 1) : pts.slice(i1).concat(pts.slice(0, i2 + 1));
    // Ensure orientation C1 -> C2
    const startCloserToC1 = dist2(arc[0], c1) <= dist2(arc[0], c2);
    if (!startCloserToC1) arc = arc.slice().reverse();

    return arc.map(p => ({ x: p.x, y: p.y }));
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

  // Use the 360° horizon path so it renders even at zenith/nadir
  const horizonPath = buildAltPath360(0);

  // Build ground as two polygons between horizon arcs and "bas" (bottom prime-vertical arc)
  const c1Proj = projectToScreen(refAzDeg - 90, 0, refAzDeg, viewport.w, viewport.h, refAltDeg, 0, fovXDeg, fovYDeg, projectionMode);
  const c2Proj = projectToScreen(refAzDeg + 90, 0, refAzDeg, viewport.w, viewport.h, refAltDeg, 0, fovXDeg, fovYDeg, projectionMode);
  const c1Finite = Number.isFinite(c1Proj.x) && Number.isFinite(c1Proj.y);
  const c2Finite = Number.isFinite(c2Proj.x) && Number.isFinite(c2Proj.y);

  let earthPaths: string[] = [];
  if (c1Finite && c2Finite) {
    const C1: Pt = { x: c1Proj.x, y: c1Proj.y };
    const C2: Pt = { x: c2Proj.x, y: c2Proj.y };

    // Horizon arcs
    const Hshort = buildHorizonArcPts(refAzDeg - 90, refAzDeg + 90);
    const Hlong = buildHorizonArcPts(refAzDeg + 90, refAzDeg + 270);

    // Bottom arc via nadir
    const B = buildBottomArcPts(C1, C2);

    if (Hshort.length >= 2 && Hlong.length >= 2 && B.length >= 2) {
      // Ground A: Hshort + reverse(B)
      let d1 = `M ${Hshort[0].x.toFixed(2)} ${Hshort[0].y.toFixed(2)} `;
      for (let i = 1; i < Hshort.length; i++) d1 += `L ${Hshort[i].x.toFixed(2)} ${Hshort[i].y.toFixed(2)} `;
      const Brev = [...B].reverse();
      for (let i = 0; i < Brev.length; i++) d1 += `L ${Brev[i].x.toFixed(2)} ${Brev[i].y.toFixed(2)} `;
      d1 += "Z";

      // Ground B: Hlong + B
      let d2 = `M ${Hlong[0].x.toFixed(2)} ${Hlong[0].y.toFixed(2)} `;
      for (let i = 1; i < Hlong.length; i++) d2 += `L ${Hlong[i].x.toFixed(2)} ${Hlong[i].y.toFixed(2)} `;
      for (let i = 0; i < B.length; i++) d2 += `L ${B[i].x.toFixed(2)} ${B[i].y.toFixed(2)} `;
      d2 += "Z";

      earthPaths = [d1.trim(), d2.trim()];
    }
  }

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

        {/* Ground fill: use two polygons between horizon arcs and "bas"; fallback if construction fails */}
        {showEarth && (
          earthPaths.length >= 2 ? (
            <svg
              width={viewport.w}
              height={viewport.h}
              className="absolute"
              style={{ left: 0, top: 0, zIndex: Z.horizon - 4 }}
            >
              {earthPaths.map((d, i) => (
                <path key={i} d={d} fill="hsla(132, 27%, 18%, 0.98)" />
              ))}
            </svg>
          ) : (
            // Fallback to simple rect below the local horizon Y
            <div
              className="absolute left-0 right-0"
              style={{ top: yH, bottom: 0, zIndex: Z.horizon - 4, background: "hsla(132, 27%, 18%, 0.98)" }}
            />
          )
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
    