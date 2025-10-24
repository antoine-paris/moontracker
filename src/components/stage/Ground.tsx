import React, { useMemo } from "react";
import { Z } from "../../render/constants";
import { projectToScreen } from "../../render/projection";

// Colors (kept consistent with Earth.tsx)
const COLOR_GROUND = "hsla(125, 64%, 12%, 1.00)";
const COLOR_GROUND_FRONT = "rgba(19, 246, 72, 0.53)";
const COLOR_GROUND_BACK = "#f6131387";
const COLOR_HZ_FRONT = "hsla(0, 93%, 52%, 0.90)";
const COLOR_HZ_BACK = "hsla(61, 91%, 50%, 1.00)";

// NEW: Flat-mode thresholds (same spirit as Earth.tsx)
const FLAT_FOV_X_THRESHOLD = 58;
const FLAT_FOV_Y_THRESHOLD = 40;

import type { ProjectionMode } from "../../render/projection";

type Props = {
  viewport: { x: number; y: number; w: number; h: number };
  refAzDeg: number;
  refAltDeg: number;
  fovXDeg: number;
  fovYDeg: number;
  projectionMode: ProjectionMode;
  showEarth?: boolean;      // same prop name for drop-in replacement
  debugMask?: boolean;      // optional: show debug horizon
};

type Sph = { az: number; alt: number };
type Pt = { x: number; y: number };

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const wrapDeg180 = (a: number) => {
  let x = ((a + 180) % 360 + 360) % 360 - 180;
  return x === -180 ? 180 : x;
};

// Interpolate in spherical parameter space, ensuring shortest az path
function lerpSph(a: Sph, b: Sph, t: number): Sph {
  const dAlt = b.alt - a.alt;
  let dAz = wrapDeg180(b.az - a.az);
  return { az: a.az + dAz * t, alt: a.alt + dAlt * t };
}

// Clip polygon against half-space alt <= 0 using Sutherland–Hodgman
function clipAltLE0(poly: Sph[]): Sph[] {
  if (poly.length === 0) return [];
  const out: Sph[] = [];
  for (let i = 0; i < poly.length; i++) {
    const A = poly[i];
    const B = poly[(i + 1) % poly.length];
    const Ain = A.alt <= 0;
    const Bin = B.alt <= 0;

    if (Ain && Bin) {
      // ... A -> B both in: keep B
      out.push(B);
    } else if (Ain && !Bin) {
      // A in, B out: add intersection
      const t = (0 - A.alt) / ((B.alt - A.alt) || 1e-9);
      out.push(lerpSph(A, B, t));
    } else if (!Ain && Bin) {
      // A out, B in: add intersection then B
      const t = (0 - A.alt) / ((B.alt - A.alt) || 1e-9);
      out.push(lerpSph(A, B, t));
      out.push(B);
    } else {
      // both out: keep nothing
    }
  }
  return out;
}

// NEW: vector helpers for ortho front-hemisphere clipping
const toRad = (d: number) => (d * Math.PI) / 180;
const toDeg = (r: number) => (r * 180) / Math.PI;
function altAzToVec(azDeg: number, altDeg: number) {
  const az = toRad(azDeg);
  const alt = toRad(altDeg);
  const ca = Math.cos(alt), sa = Math.sin(alt);
  return [ca * Math.sin(az), ca * Math.cos(az), sa] as const; // ENU: x=E, y=N, z=Up
}
function vecToAltAz(v: readonly number[]) {
  const [x, y, z] = v;
  const alt = Math.asin(Math.max(-1, Math.min(1, z)));
  const az = Math.atan2(x, y);
  return { az: toDeg(az), alt: toDeg(alt) };
}
function dot3(a: readonly number[], b: readonly number[]) { return a[0]*b[0] + a[1]*b[1] + a[2]*b[2]; }
function norm3(a: readonly number[]) {
  const m = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0]/m, a[1]/m, a[2]/m] as const;
}
function slerp(a: readonly number[], b: readonly number[], t: number) {
  // great-circle interpolation on the unit sphere
  let cosT = Math.max(-1, Math.min(1, dot3(a, b)));
  const theta = Math.acos(cosT);
  if (theta < 1e-6) {
    // nearly identical → lerp+normalize
    const x = (1 - t) * a[0] + t * b[0];
    const y = (1 - t) * a[1] + t * b[1];
    const z = (1 - t) * a[2] + t * b[2];
    return norm3([x, y, z]);
  }
  const sA = Math.sin((1 - t) * theta);
  const sB = Math.sin(t * theta);
  const sT = Math.sin(theta) || 1;
  const x = (sA * a[0] + sB * b[0]) / sT;
  const y = (sA * a[1] + sB * b[1]) / sT;
  const z = (sA * a[2] + sB * b[2]) / sT;
  return [x, y, z] as const;
}

// NEW: clip polygon (in alt/az) against front hemisphere dot(fwd, v) >= 0 for ortho
function clipFrontHemisphere(poly: Sph[], fwd: readonly number[]): Sph[] {
  if (poly.length === 0) return [];
  const out: Sph[] = [];
  for (let i = 0; i < poly.length; i++) {
    const A = poly[i];
    const B = poly[(i + 1) % poly.length];
    const vA = altAzToVec(A.az, A.alt);
    const vB = altAzToVec(B.az, B.alt);
    const inA = dot3(fwd, vA) >= 0;
    const inB = dot3(fwd, vB) >= 0;

    if (inA && inB) {
      // keep B
      out.push(B);
    } else if (inA && !inB) {
      // A in, B out: add intersection
      let t0 = 0, t1 = 1;
      for (let it = 0; it < 12; it++) {
        const tm = (t0 + t1) / 2;
        const vm = slerp(vA, vB, tm);
        if (dot3(fwd, vm) >= 0) t0 = tm; else t1 = tm;
      }
      const vI = slerp(vA, vB, (t0 + t1) / 2);
      const I = vecToAltAz(vI);
      out.push(I);
    } else if (!inA && inB) {
      // A out, B in: add intersection then B
      let t0 = 0, t1 = 1;
      for (let it = 0; it < 12; it++) {
        const tm = (t0 + t1) / 2;
        const vm = slerp(vA, vB, tm);
        if (dot3(fwd, vm) >= 0) t1 = tm; else t0 = tm; // invert to approach boundary from outside
      }
      const vI = slerp(vA, vB, (t0 + t1) / 2);
      const I = vecToAltAz(vI);
      out.push(I);
      out.push(B);
    } else {
      // both out: nothing
    }
  }
  return out;
}

export default function Ground({
  viewport,
  refAzDeg,
  refAltDeg,
  fovXDeg,
  fovYDeg,
  projectionMode,
  showEarth = false,
  debugMask = false,
}: Props) {
  const refAltDegSafe = clamp(refAltDeg, -89, 89);

  // NEW: simplify to a flat horizon fill for narrow FOV (≈50mm and longer)
  const simplifyFlat = fovXDeg <= FLAT_FOV_X_THRESHOLD || fovYDeg <= FLAT_FOV_Y_THRESHOLD;

  // NEW: compute the horizon Y position and whether ground is below it
  const flatHorizon = useMemo(() => {
    if (!simplifyFlat) return null as { y: number; groundBelow: boolean } | null;
    const p = projectToScreen(refAzDeg, 0, refAzDeg, viewport.w, viewport.h, refAltDegSafe, 0, fovXDeg, fovYDeg, projectionMode);
    let y = Number.isFinite(p.x) && Number.isFinite(p.y) ? p.y : viewport.h / 2;
    const pb = projectToScreen(refAzDeg, -1, refAzDeg, viewport.w, viewport.h, refAltDegSafe, 0, fovXDeg, fovYDeg, projectionMode);
    const groundBelow = (Number.isFinite(pb.x) && Number.isFinite(pb.y)) ? (pb.y > y) : true;
    y = Math.max(0, Math.min(viewport.h, y));
    return { y, groundBelow };
  }, [simplifyFlat, refAzDeg, refAltDegSafe, viewport.w, viewport.h, fovXDeg, fovYDeg, projectionMode]);

  // Adaptive sampling (kept modest for performance)
  const { stepAz, stepAlt } = useMemo(() => {
    const targetPx = 12; // ~cell size
    const approxCols = clamp(Math.floor(viewport.w / targetPx), 60, 240);
    const approxRows = clamp(Math.floor(viewport.h / targetPx), 30, 120);
    const sAz = clamp(360 / approxCols, 1, 6);
    const sAlt = clamp(90 / approxRows, 1, 6);
    return { stepAz: sAz, stepAlt: sAlt };
  }, [viewport.w, viewport.h]);

  // Build filled ground mesh (union of many clipped quads)
  const groundPath = useMemo(() => {
    if (!showEarth) return null;
    // NEW: skip heavy tessellation when in flat mode
    if (simplifyFlat) return null;

    const w = viewport.w, h = viewport.h;
    const maxJump2 = Math.pow(0.35 * Math.hypot(w, h), 2);

    const az0 = refAzDeg - 180;
    const nAz = Math.max(2, Math.ceil(360 / stepAz));
    const nAlt = Math.max(2, Math.ceil(90 / stepAlt));
    const pathParts: string[] = [];

    // NEW: precompute forward vector and whether we need front clip (ortho only)
    const needFrontClip = projectionMode === 'ortho';
    const fwd = needFrontClip ? altAzToVec(refAzDeg, refAltDegSafe) : [0, 0, 1];

    // Loop rows from -90 .. 0
    for (let j = 0; j < nAlt; j++) {
      const alt0 = -90 + j * stepAlt;
      const alt1 = Math.min(0, alt0 + stepAlt);

      for (let i = 0; i < nAz; i++) {
        const azA = az0 + i * stepAz;
        const azB = az0 + ((i + 1) % nAz) * stepAz;

        // Quad in parameter space (clockwise)
        const quad: Sph[] = [
          { az: azA, alt: alt0 },
          { az: azB, alt: alt0 },
          { az: azB, alt: alt1 },
          { az: azA, alt: alt1 },
        ];

        // Clip against alt <= 0 (horizon)
        let clipped = clipAltLE0(quad);
        if (clipped.length < 3) continue;

        // NEW: for orthographic, also clip against front hemisphere (dot(fwd,v) >= 0)
        if (needFrontClip) {
          clipped = clipFrontHemisphere(clipped, fwd);
          if (clipped.length < 3) continue;
        }

        // Project clipped polygon vertices
        const pts: Pt[] = [];
        let broken = false;
        for (let k = 0; k < clipped.length; k++) {
          const v = clipped[k];
          const p = projectToScreen(v.az, v.alt, refAzDeg, w, h, refAltDegSafe, 0, fovXDeg, fovYDeg, projectionMode);
          if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) { broken = true; break; }
          pts.push({ x: p.x, y: p.y });
        }
        if (broken || pts.length < 3) continue;

        // If polygon stretches across projection seam, skip it to avoid long spikes
        let seam = false;
        for (let k = 0; k < pts.length; k++) {
          const a = pts[k], b = pts[(k + 1) % pts.length];
          const d2 = (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
          if (d2 > maxJump2) { seam = true; break; }
        }
        if (seam) continue;

        // Append polygon path
        const first = pts[0];
        let d = `M ${first.x.toFixed(2)} ${first.y.toFixed(2)} `;
        for (let k = 1; k < pts.length; k++) {
          d += `L ${pts[k].x.toFixed(2)} ${pts[k].y.toFixed(2)} `;
        }
        d += "Z";
        pathParts.push(d);
      }
    }

    return pathParts.join(" ");
  }, [showEarth, simplifyFlat, viewport.w, viewport.h, refAzDeg, refAltDegSafe, fovXDeg, fovYDeg, projectionMode, stepAz, stepAlt]);

  
  if (!showEarth) return null;

  return (
    <div
      className="absolute"
      style={{ left: 0, top: 0, width: viewport.w, height: viewport.h, pointerEvents: "none" }}
    >
      <svg
        width={viewport.w}
        height={viewport.h}
        className="absolute"
        style={{ left: 0, top: 0, zIndex: Z.horizon - 25, overflow: "visible" }}
      >
        {/* NEW: Ground fill - simplified flat mode for narrow FOV */}
        {simplifyFlat && flatHorizon && (
          <rect
            x={0}
            y={flatHorizon.groundBelow ? flatHorizon.y : 0}
            width={viewport.w}
            height={flatHorizon.groundBelow ? (viewport.h - flatHorizon.y) : flatHorizon.y}
            fill={debugMask ? COLOR_GROUND_FRONT : COLOR_GROUND}
          />
        )}

        {/* Ground fill from tessellated mesh (robust for all projections) */}
        {!simplifyFlat && groundPath && (
          <path
            d={groundPath}
            fill={debugMask ? COLOR_GROUND_FRONT : COLOR_GROUND}
            fillRule="nonzero"
            stroke="none"
          />
        )}

        {/* Optional: show sampled horizon for debug */}
        

        {/* NEW: Debug flat horizon line */}
        {debugMask && simplifyFlat && flatHorizon && (
          <line x1={0} y1={flatHorizon.y} x2={viewport.w} y2={flatHorizon.y} stroke={COLOR_HZ_FRONT} strokeWidth={1.5} />
        )}
      </svg>
    </div>
  );
}
