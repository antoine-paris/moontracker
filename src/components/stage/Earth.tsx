import React, { useMemo } from "react";
import { Z } from "../../render/constants";
import { projectToScreen } from "../../render/projection";

// Ground colors
const COLOR_GROUND = "hsla(125, 64%, 12%, 1.00)";
const COLOR_GROUND_FRONT = "rgba(19, 246, 72, 0.53)";
const COLOR_GROUND_BACK = "#f6131387";
const COLOR_HZ_FRONT = "hsla(0, 93%, 52%, 0.90)";
const COLOR_HZ_BACK = "hsla(61, 91%, 50%, 1.00)";

// Flat-mode thresholds
const FLAT_FOV_X_THRESHOLD = 58;
const FLAT_FOV_Y_THRESHOLD = 40;

type Pt = { x: number; y: number };

type Props = {
  viewport: { x: number; y: number; w: number; h: number };
  refAzDeg: number;
  refAltDeg: number;
  fovXDeg: number;
  fovYDeg: number;
  projectionMode: 'recti-panini' | 'stereo-centered' | 'ortho' | 'cylindrical' | 'rectilinear' | 'cylindrical-horizon';
  showEarth?: boolean;
  debugMask?: boolean;
};

// Math helpers
const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;
const clamp01 = (v: number) => Math.max(-1, Math.min(1, v));
const altAzToVec = (altDeg: number, azDeg: number) => {
  const alt = altDeg * DEG, az = azDeg * DEG;
  const ca = Math.cos(alt), sa = Math.sin(alt);
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
const wrap180 = (a: number) => {
  let x = ((a + 180) % 360 + 360) % 360 - 180;
  return x === -180 ? 180 : x;
};

export default function Earth({
  viewport,
  refAzDeg,
  refAltDeg,
  fovXDeg,
  fovYDeg,
  projectionMode,
  showEarth = false,
  debugMask = false,
}: Props) {
  const refAltDegSafe = refAltDeg > 89 ? 89 : (refAltDeg < -89 ? -89 : refAltDeg);

  // Build horizon paths (front/back split)
  const buildHorizonFrontBackPaths = (altDeg = 0) => {
    const startAz = refAzDeg - 180;
    const endAz = refAzDeg + 180;
    const steps = 720;
    const step = (endAz - startAz) / steps;
    const maxJump2 = Math.pow(0.3 * Math.hypot(viewport.w, viewport.h), 2);

    const frontSegs: Pt[][] = [];
    const backSegs: Pt[][] = [];
    let curr: Pt[] = [];
    let prev: Pt | null = null;
    let currIsFront: boolean | null = null;

    const flush = () => {
      if (!curr.length) return;
      if (currIsFront) frontSegs.push(curr);
      else backSegs.push(curr);
      curr = [];
      prev = null;
      currIsFront = null;
    };

    for (let i = 0; i <= steps; i++) {
      const az = startAz + i * step;
      const p = projectToScreen(az, altDeg, refAzDeg, viewport.w, viewport.h, refAltDegSafe, 0, fovXDeg, fovYDeg, projectionMode);
      const finite = Number.isFinite(p.x) && Number.isFinite(p.y);
      if (!finite) {
        flush();
        continue;
      }

      const pt = { x: p.x, y: p.y };
      const da = wrap180(az - refAzDeg);
      const isFront = Math.abs(da) <= 90;

      if (prev) {
        const dx = pt.x - prev.x, dy = pt.y - prev.y;
        if (dx * dx + dy * dy > maxJump2 || (currIsFront !== null && isFront !== currIsFront)) {
          flush();
        }
      }

      if (currIsFront === null) currIsFront = isFront;
      curr.push(pt);
      prev = pt;
    }
    flush();

    return { frontSegs, backSegs };
  };

  // Build prime vertical paths (for bottom arc)
  const buildPrimeVerticalPaths = () => {
    const n = altAzToVec(0, refAzDeg);
    const z = [0, 0, 1] as const;
    let a = cross(n, z);
    const aLen = Math.hypot(a[0], a[1], a[2]);
    if (aLen < 1e-6) a = [1, 0, 0];
    a = norm(a);
    let b = cross(n, a);
    b = norm(b);

    const step = Math.max(0.25, Math.min(2, Math.min(fovXDeg, fovYDeg) / 120));
    const epsAlt = 1e-3;
    const maxJump2 = Math.pow(0.3 * Math.hypot(viewport.w, viewport.h), 2);

    const segsBottom: Pt[][] = [];
    let currBottom: Pt[] = [];
    let prevBottom: Pt | null = null;

    for (let t = 0; t <= 360 + 1e-9; t += step) {
      const ct = Math.cos(t * DEG), st = Math.sin(t * DEG);
      const v = [a[0] * ct + b[0] * st, a[1] * ct + b[1] * st, a[2] * ct + b[2] * st] as const;
      const { alt } = vecToAltAz(v);
      const p = projectToScreen(Math.atan2(v[0], v[1]) * RAD, alt, refAzDeg, viewport.w, viewport.h, refAltDegSafe, 0, fovXDeg, fovYDeg, projectionMode);
      const finite = Number.isFinite(p.x) && Number.isFinite(p.y);
      if (!finite) {
        if (currBottom.length) segsBottom.push(currBottom);
        currBottom = [];
        prevBottom = null;
        continue;
      }
      const pt = { x: p.x, y: p.y };

      if (alt <= epsAlt) {
        if (prevBottom) {
          const dx = pt.x - prevBottom.x, dy = pt.y - prevBottom.y;
          if (dx * dx + dy * dy > maxJump2) {
            if (currBottom.length) segsBottom.push(currBottom);
            currBottom = [];
            prevBottom = null;
          }
        }
        currBottom.push(pt);
        prevBottom = pt;
      } else if (currBottom.length) {
        segsBottom.push(currBottom);
        currBottom = [];
        prevBottom = null;
      }
    }
    if (currBottom.length) segsBottom.push(currBottom);

    return { bottomSegs: segsBottom };
  };

  const buildGroundUnionPathFront = (): string | null => {
    const proj = (az: number, alt: number) =>
      projectToScreen(az, alt, refAzDeg, viewport.w, viewport.h, refAltDegSafe, 0, fovXDeg, fovYDeg, projectionMode);

    const finite = (p: any) => Number.isFinite(p.x) && Number.isFinite(p.y);
    const flatten = (segs: Pt[][]) => segs.flat();
    const dist2 = (a: Pt, b: Pt) => { const dx = a.x - b.x, dy = a.y - b.y; return dx * dx + dy * dy; };
    const nearestIdx = (pts: Pt[], p: Pt) => {
      let mi = 0, md = Infinity;
      for (let i = 0; i < pts.length; i++) {
        const d = dist2(pts[i], p);
        if (d < md) { md = d; mi = i; }
      }
      return mi;
    };
    const sliceForward = (pts: Pt[], i0: number, i1: number) => {
      if (!pts.length) return [] as Pt[];
      if (i0 <= i1) return pts.slice(i0, i1 + 1);
      return [...pts.slice(i0), ...pts.slice(0, i1 + 1)];
    };
    const meanY = (pts: Pt[]) => pts.reduce((s, p) => s + p.y, 0) / Math.max(1, pts.length);

    const hPts = flatten(frontSegs || []);
    if (hPts.length < 2) return null;

    if (projectionMode === "ortho") {
      const C = altAzToVec(refAltDegSafe, refAzDeg);
      const zAxis = [0, 0, 1] as const;
      let a = cross(C, zAxis);
      const aLen = Math.hypot(a[0], a[1], a[2]);
      if (aLen < 1e-6) a = [1, 0, 0];
      const an = ((v: number[]) => { const m = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0]/m, v[1]/m, v[2]/m]; })(a as unknown as number[]);
      const b = norm(cross(C, an));

      const steps = 720;
      const step = 360 / steps;
      const maxJump2 = Math.pow(0.3 * Math.hypot(viewport.w, viewport.h), 2);
      const limbSegs: Pt[][] = [];
      let curr: Pt[] = [];
      let prev: Pt | null = null;

      for (let t = 0; t <= 360 + 1e-9; t += step) {
        const ct = Math.cos(t * DEG), st = Math.sin(t * DEG);
        const v = [an[0] * ct + b[0] * st, an[1] * ct + b[1] * st, an[2] * ct + b[2] * st] as const;
        const { alt, az } = vecToAltAz(v);
        const p = proj(az, alt);
        const isFinite = finite(p);
        if (!isFinite) {
          if (curr.length) limbSegs.push(curr);
          curr = [];
          prev = null;
          continue;
        }
        const pt = { x: p.x, y: p.y };
        if (prev) {
          const dx = pt.x - prev.x, dy = pt.y - prev.y;
          if (dx * dx + dy * dy > maxJump2) {
            if (curr.length) limbSegs.push(curr);
            curr = [];
            prev = null;
          }
        }
        curr.push(pt);
        prev = pt;
      }
      if (curr.length) limbSegs.push(curr);

      const lPts = flatten(limbSegs);
      if (lPts.length < 2) return null;

      const cx = C[0], cy = C[1];
      const azI1Deg = (Math.atan2(-cy, cx) * RAD + 360) % 360;
      const azI2Deg = (azI1Deg + 180) % 360;

      const pI1 = proj(azI1Deg, 0);
      const pI2 = proj(azI2Deg, 0);
      if (!finite(pI1) || !finite(pI2)) return null;

      const I1: Pt = { x: pI1.x, y: pI1.y };
      const I2: Pt = { x: pI2.x, y: pI2.y };

      const hI1 = nearestIdx(hPts, I1);
      const hI2 = nearestIdx(hPts, I2);
      const hSeg = sliceForward(hPts, hI1, hI2);
      if (hSeg.length < 2) return null;

      const lI1 = nearestIdx(lPts, I1);
      const lI2 = nearestIdx(lPts, I2);
      const limbArcA = sliceForward(lPts, lI2, lI1);
      const limbArcB = sliceForward(lPts, lI1, lI2);
      const bottomArc = meanY(limbArcA) > meanY(limbArcB) ? limbArcA : limbArcB;
      if (bottomArc.length < 2) return null;

      if (!(meanY(hSeg) < meanY(bottomArc))) return null;

      let d = `M ${I1.x.toFixed(2)} ${I1.y.toFixed(2)} `;
      for (const p of hSeg) d += `L ${p.x.toFixed(2)} ${p.y.toFixed(2)} `;
      d += `L ${I2.x.toFixed(2)} ${I2.y.toFixed(2)} `;
      for (const p of bottomArc) d += `L ${p.x.toFixed(2)} ${p.y.toFixed(2)} `;
      d += "Z";
      return d;
    }

    const pI1 = proj(refAzDeg - 90, 0);
    const pI2 = proj(refAzDeg + 90, 0);
    if (!finite(pI1) || !finite(pI2)) return null;

    const I1: Pt = { x: pI1.x, y: pI1.y };
    const I2: Pt = { x: pI2.x, y: pI2.y };

    const hI1 = nearestIdx(hPts, I1);
    const hI2 = nearestIdx(hPts, I2);
    const hSeg = sliceForward(hPts, hI1, hI2);

    const bPts = flatten(bottomSegs || []);
    if (bPts.length < 2 || hSeg.length < 2) return null;

    const bI1 = nearestIdx(bPts, I1);
    const bI2 = nearestIdx(bPts, I2);
    const bSeg = sliceForward(bPts, bI2, bI1);
    
    if (!(meanY(hSeg) < meanY(bSeg))) return null;

    let d = `M ${I1.x.toFixed(2)} ${I1.y.toFixed(2)} `;
    for (const p of hSeg) d += `L ${p.x.toFixed(2)} ${p.y.toFixed(2)} `;
    d += `L ${I2.x.toFixed(2)} ${I2.y.toFixed(2)} `;
    for (const p of bSeg) d += `L ${p.x.toFixed(2)} ${p.y.toFixed(2)} `;
    d += "Z";
    
    return d;
  };

  const buildGroundUnionPathBack = (): string | null => {
    const proj = (az: number, alt: number) =>
      projectToScreen(az, alt, refAzDeg, viewport.w, viewport.h, refAltDegSafe, 0, fovXDeg, fovYDeg, projectionMode);

    const finite = (p: any) => Number.isFinite(p.x) && Number.isFinite(p.y);
    const flatten = (segs: Pt[][]) => segs.flat();
    const dist2 = (a: Pt, b: Pt) => { const dx = a.x - b.x, dy = a.y - b.y; return dx * dx + dy * dy; };

    const horizonSegs = backSegs || [];
    if (!horizonSegs.length) return null;

    const pI1 = proj(refAzDeg - 90, 0);
    const pI2 = proj(refAzDeg + 90, 0);
    if (!finite(pI1) || !finite(pI2)) return null;

    const I1: Pt = { x: pI1.x, y: pI1.y };
    const I2: Pt = { x: pI2.x, y: pI2.y };

    const nearestOnSegs = (pt: Pt) => {
      let best = { seg: -1, idx: -1, d: Infinity };
      for (let s = 0; s < horizonSegs.length; s++) {
        const seg = horizonSegs[s];
        for (let i = 0; i < seg.length; i++) {
          const d = dist2(seg[i], pt);
          if (d < best.d) best = { seg: s, idx: i, d };
        }
      }
      return best;
    };

    const i1 = nearestOnSegs(I1);
    const i2 = nearestOnSegs(I2);
    if (i1.seg < 0 || i2.seg < 0) return null;

    const collectArc = (s0: number, i0: number, s1: number, i1_: number): Pt[] => {
      const arc: Pt[] = [];
      const nSegs = horizonSegs.length;
      let s = s0;
      let i = i0;
      let guard = 0;
      while (guard++ < 10000) {
        const seg = horizonSegs[s];
        for (; i < seg.length; i++) {
          arc.push(seg[i]);
          if (s === s1 && i === i1_) return arc;
        }
        s = (s + 1) % nSegs;
        i = 0;
      }
      return arc;
    };

    const arc12 = collectArc(i1.seg, i1.idx, i2.seg, i2.idx);
    const arc21 = collectArc(i2.seg, i2.idx, i1.seg, i1.idx);

    const polyLen = (pts: Pt[]) => {
      let L = 0;
      for (let k = 1; k < pts.length; k++) {
        const dx = pts[k].x - pts[k - 1].x;
        const dy = pts[k].y - pts[k - 1].y;
        L += Math.hypot(dx, dy);
      }
      return L;
    };

    let hSeg = polyLen(arc12) >= polyLen(arc21) ? arc12 : arc21;

    if (hSeg.length <= 2) hSeg = arc12.length > arc21.length ? arc12 : arc21;
    if (hSeg.length < 2) return null;

    const bPts = flatten(bottomSegs || []);
    if (bPts.length < 2) return null;

    const nearestIdx = (pts: Pt[], p: Pt) => {
      let mi = 0, md = Infinity;
      for (let k = 0; k < pts.length; k++) {
        const d = dist2(pts[k], p);
        if (d < md) { md = d; mi = k; }
      }
      return mi;
    };
    const bI1 = nearestIdx(bPts, I1);
    const bI2 = nearestIdx(bPts, I2);

    const sliceForward = (pts: Pt[], i0: number, i1: number) => {
      if (!pts.length) return [] as Pt[];
      if (i0 <= i1) return pts.slice(i0, i1 + 1);
      return [...pts.slice(i0), ...pts.slice(0, i1 + 1)];
    };

    const bSeg = sliceForward(bPts, bI2, bI1);
    if (bSeg.length < 2) return null;

    const meanY = (pts: Pt[]) => pts.reduce((s, p) => s + p.y, 0) / Math.max(1, pts.length);

    let d = `M ${I1.x.toFixed(2)} ${I1.y.toFixed(2)} `;
    if ((meanY(hSeg) > meanY(bSeg))){      
      for (let i = hSeg.length - 1; i >= 0; i--) {
        const p = hSeg[i];
        d += `L ${p.x.toFixed(2)} ${p.y.toFixed(2)} `;
      }
      d += `L ${I2.x.toFixed(2)} ${I2.y.toFixed(2)} `;
      for (const p of bSeg) d += `L ${p.x.toFixed(2)} ${p.y.toFixed(2)} `;
    } else if (meanY(hSeg) > 0 && (meanY(hSeg) < meanY(bSeg)) ||
              (meanY(bSeg) < 0 || meanY(hSeg) < 0 )){
      d += `L ${I1.x.toFixed(2)} ${viewport.h.toFixed(2)} `;
      d += `L ${viewport.w.toFixed(2)} ${viewport.h.toFixed(2)} `;
      d += `L ${I2.x.toFixed(2)} ${I2.y.toFixed(2)} `;
      for (const p of bSeg) d += `L ${p.x.toFixed(2)} ${p.y.toFixed(2)} `;
      if (refAltDegSafe > 10 || refAltDegSafe < -10) {
        d += `L ${I1.x.toFixed(2)} 0.00 `;
        d += `L 0.00 0.00 `;
        d += `L ${viewport.w.toFixed(2)} 0.00 `;
        for (const p of hSeg) d += `L ${p.x.toFixed(2)} ${p.y.toFixed(2)} `;
      }
    }
    d += "Z";
    return d;
  };

  // Memoize the segments separately
  const { frontSegs, backSegs } = useMemo(
    () => buildHorizonFrontBackPaths(0),
    [refAzDeg, refAltDegSafe, viewport.w, viewport.h, fovXDeg, fovYDeg, projectionMode]
  );

  const { bottomSegs } = useMemo(
    () => buildPrimeVerticalPaths(),
    [refAzDeg, refAltDegSafe, viewport.w, viewport.h, fovXDeg, fovYDeg, projectionMode]
  );

  // Build debug paths for horizon lines
  const horizonFrontPath = useMemo(() => {
    if (!debugMask || !frontSegs?.length) return null;
    return frontSegs.map(seg =>
      seg.reduce((acc, q, idx) => acc + `${idx ? "L" : "M"} ${q.x.toFixed(2)} ${q.y.toFixed(2)} `, "")
    ).join("").trim();
  }, [debugMask, frontSegs]);

  const horizonBackPath = useMemo(() => {
    if (!debugMask || !backSegs?.length) return null;
    return backSegs.map(seg =>
      seg.reduce((acc, q, idx) => acc + `${idx ? "L" : "M"} ${q.x.toFixed(2)} ${q.y.toFixed(2)} `, "")
    ).join("").trim();
  }, [debugMask, backSegs]);

  const simplifyFlat = fovXDeg <= FLAT_FOV_X_THRESHOLD || fovYDeg <= FLAT_FOV_Y_THRESHOLD;

  const flatHorizon = useMemo(() => {
    if (!simplifyFlat) return null as { y: number; groundBelow: boolean } | null;
    const p = projectToScreen(refAzDeg, 0, refAzDeg, viewport.w, viewport.h, refAltDegSafe, 0, fovXDeg, fovYDeg, projectionMode);
    let y = Number.isFinite(p.x) && Number.isFinite(p.y) ? p.y : viewport.h / 2;
    const pb = projectToScreen(refAzDeg, -1, refAzDeg, viewport.w, viewport.h, refAltDegSafe, 0, fovXDeg, fovYDeg, projectionMode);
    const groundBelow = (Number.isFinite(pb.x) && Number.isFinite(pb.y)) ? (pb.y > y) : true;
    y = Math.max(0, Math.min(viewport.h, y));
    return { y, groundBelow };
  }, [simplifyFlat, refAzDeg, refAltDegSafe, viewport.w, viewport.h, fovXDeg, fovYDeg, projectionMode]);

  const unionPathFront = useMemo(
    () => (showEarth && !simplifyFlat ? buildGroundUnionPathFront() : null),
    [showEarth, simplifyFlat, frontSegs, bottomSegs]
  );
  
  const unionPathBack = useMemo(
    () => (showEarth && !simplifyFlat ? buildGroundUnionPathBack() : null),
    [showEarth, simplifyFlat, backSegs, bottomSegs]
  );

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
        {/* Ground fill - simplified flat mode */}
        {simplifyFlat && flatHorizon && (
          <rect
            x={0}
            y={flatHorizon.groundBelow ? flatHorizon.y : 0}
            width={viewport.w}
            height={flatHorizon.groundBelow ? (viewport.h - flatHorizon.y) : flatHorizon.y}
            fill={debugMask ? COLOR_GROUND_FRONT : COLOR_GROUND}
          />
        )}

        {/* Ground fill - back hemisphere */}
        {!simplifyFlat && unionPathBack && projectionMode !== "ortho" && (
          <path
            d={unionPathBack}
            fill={debugMask ? COLOR_GROUND_BACK : COLOR_GROUND}
            stroke={COLOR_HZ_BACK}
            strokeWidth={debugMask ? 1.5 : 0}
          />
        )}

        {/* Ground fill - front hemisphere */}
        {!simplifyFlat && unionPathFront && (
          <path
            d={unionPathFront}
            fill={debugMask ? COLOR_GROUND_FRONT : COLOR_GROUND}
            stroke={COLOR_HZ_FRONT}
            strokeWidth={debugMask ? 2 : 0}
          />
        )}

        {/* Debug: horizon lines */}
        {debugMask && horizonBackPath && projectionMode !== "ortho" && (
          <path 
            d={horizonBackPath} 
            stroke={COLOR_HZ_BACK} 
            strokeWidth={1} 
            fill="none" 
          />
        )}
        {debugMask && horizonFrontPath && (
          <path 
            d={horizonFrontPath} 
            stroke={COLOR_HZ_FRONT} 
            strokeWidth={1.5} 
            fill="none" 
          />
        )}
        {debugMask && simplifyFlat && flatHorizon && (
          <line
            x1={0}
            y1={flatHorizon.y}
            x2={viewport.w}
            y2={flatHorizon.y}
            stroke={COLOR_HZ_FRONT}
            strokeWidth={1.5}
          />
        )}
      </svg>
    </div>
  );
}
