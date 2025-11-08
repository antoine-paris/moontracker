import { useMemo } from "react";
import { useTranslation } from 'react-i18next';
import { Z } from "../../render/constants";
import { projectToScreen } from "../../render/projection";

// --- colors (statics) ---
const COLOR_BOTTOM = "hsla(127, 100%, 66%, 0.90)";     // bottomPath
const COLOR_TOP = "rgba(85, 185, 244, 0.9)";         // topPath
const COLOR_HZ_FRONT = "hsla(0, 93%, 52%, 0.90)";  // horizon in front of viewer
const COLOR_HZ_BACK = "hsla(61, 91%, 50%, 1.00)";   // horizon behind viewer
const COLOR_MARKER = "#b9b4b4e6";  // horizon in front of viewer

// Flat-mode thresholds (≈ 33mm on full-frame: ~58° horizontal, ~40° vertical)
const FLAT_FOV_X_THRESHOLD = 58;
const FLAT_FOV_Y_THRESHOLD = 40;

// Define a shared 2D point type for segment work
type Pt = { x: number; y: number };

type Props = {
  viewport: { x: number; y: number; w: number; h: number };
  // projection context
  refAzDeg: number;
  refAltDeg: number;
  fovXDeg: number;
  fovYDeg: number;
  // Change to shared ProjectionMode
  projectionMode: import("../../render/projection").ProjectionMode;
  // visuals
  showEarth?: boolean;
  debugMask?: boolean; // NEW: debug mask passthrough
  // horizon vs ecliptic alignment
  lockHorizon?: boolean;
  // optional ecliptic "up" direction (when lockHorizon=false)
  eclipticUpAzDeg?: number;
  eclipticUpAltDeg?: number;
};

// Hoisted math helpers (avoid reallocation each render)
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
// Normalize angle to (-180, 180]
const wrap180 = (a: number) => {
  let x = ((a + 180) % 360 + 360) % 360 - 180;
  return x === -180 ? 180 : x;
};

export default function HorizonOverlay({
  viewport,
  refAzDeg,
  refAltDeg,
  fovXDeg,
  fovYDeg,
  projectionMode,
  debugMask = false,
  lockHorizon = true,
  eclipticUpAzDeg,
  eclipticUpAltDeg,
}: Props) {
  const { t } = useTranslation('astro');
  // NEW: avoid closer ±90° to prevent singularities
  const refAltDegSafe = refAltDeg > 89 ? 89 : (refAltDeg < -89 ? -89 : refAltDeg);

  // --- helpers to build the prime-vertical great circle (through zenith, crossing horizon at refAz±90)
  const buildHorizonFrontBackPaths = (altDeg = 0) => {
    const startAz = refAzDeg - 180;
    const endAz = refAzDeg + 180;
    const steps = 720; // 0.5°
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
      const p = projectToScreen(
        az, altDeg,
        refAzDeg,
        viewport.w, viewport.h,
        refAltDegSafe, 0,
        fovXDeg, fovYDeg,
        projectionMode,
        lockHorizon, eclipticUpAzDeg, eclipticUpAltDeg
      );
      const finite = Number.isFinite(p.x) && Number.isFinite(p.y);
      if (!finite) {
        flush();
        continue;
      }

      const pt = { x: p.x, y: p.y };
      // classify: front if delta az within [-90, +90]
      const da = wrap180(az - refAzDeg);
      const isFront = Math.abs(da) <= 90;

      // seam/jump detection
      if (prev) {
        const dx = pt.x - prev.x, dy = pt.y - prev.y;
        if (dx * dx + dy * dy > maxJump2 || (currIsFront !== null && isFront !== currIsFront)) {
          // break either on seam or front/back change
          flush();
        }
      }

      if (currIsFront === null) currIsFront = isFront;
      curr.push(pt);
      prev = pt;
    }
    flush();

    const buildD = (segs: Pt[][]) =>
      segs.map(seg =>
        seg.reduce((acc, q, idx) => acc + `${idx ? "L" : "M"} ${q.x.toFixed(2)} ${q.y.toFixed(2)} `, "")
      ).join("").trim();

    return { frontD: buildD(frontSegs), backD: buildD(backSegs), frontSegs, backSegs };
  };

  const buildPrimeVerticalPaths = () => {
    // Compute the unit vector on the horizon at the reference azimuth (normal to the prime-vertical plane)
    const n = altAzToVec(0, refAzDeg);
    // Define the world up axis (zenith direction)
    const z = [0, 0, 1] as const;
    // Compute a basis vector a by crossing the plane normal with up to span the great-circle plane
    let a = cross(n, z);
    // Measure its length to detect degeneracy (when n is parallel to z)
    const aLen = Math.hypot(a[0], a[1], a[2]);
    // If degenerate (length ~ 0), pick an arbitrary axis to avoid division by zero
    if (aLen < 1e-6) a = [1, 0, 0]; // fallback if n // z
    // Normalize a to unit length
    a = norm(a);
    // Compute the second basis vector b that completes the plane basis (orthogonal to both n and a)
    let b = cross(n, a);
    // Normalize b to unit length
    b = norm(b);

    // Choose the sampling step along the great-circle (degrees), adaptive but bounded
    const step = Math.max(0.25, Math.min(2, Math.min(fovXDeg, fovYDeg) / 120));
    // Small tolerance to decide if a point belongs to top/bottom halves (alt close to 0)
    const epsAlt = 1e-3;
    // Threshold in screen space (squared) to detect projection seams/large jumps
    const maxJump2 = Math.pow(0.3 * Math.hypot(viewport.w, viewport.h), 2);

    // Accumulate polyline segments for the top arc (alt >= 0)
    const segsTop: Pt[][] = [];
    // Accumulate polyline segments for the bottom arc (alt <= 0)
    const segsBottom: Pt[][] = [];
    // Current working segment for the top arc
    let currTop: Pt[] = [];
    // Current working segment for the bottom arc
    let currBottom: Pt[] = [];
    // Previous sampled screen point for top (to test jumps)
    let prevTop: Pt | null = null;
    // Previous sampled screen point for bottom (to test jumps)
    let prevBottom: Pt | null = null;

    // Sweep the full 360° parameter t to trace the great circle in the plane spanned by a,b
    for (let t = 0; t <= 360 + 1e-9; t += step) {
      // Precompute cos and sin of the parameter in radians
      const ct = Math.cos(t * DEG), st = Math.sin(t * DEG);
      // Build the 3D point on the great circle: v = a*cos(t) + b*sin(t)
      const v = [a[0] * ct + b[0] * st, a[1] * ct + b[1] * st, a[2] * ct + b[2] * st] as const;
      // Convert the 3D vector to alt-az angles
      const { alt } = vecToAltAz(v);
      // Project that alt-az point into screen coordinates using current projection
      const p = projectToScreen(
        Math.atan2(v[0], v[1]) * RAD, // azimuth recovered from vector
        alt,                          // altitude from vector
        refAzDeg,                     // reference azimuth for camera
        viewport.w,                   // viewport width
        viewport.h,                   // viewport height
        refAltDegSafe,                    // reference altitude for camera
        0,                            // roll (unused here)
        fovXDeg,                      // horizontal field of view
        fovYDeg,                      // vertical field of view
        projectionMode,                // projection model
        lockHorizon, eclipticUpAzDeg, eclipticUpAltDeg
      );
      // Check that projection produced finite coordinates
      const finite = Number.isFinite(p.x) && Number.isFinite(p.y);
      // If not finite, finalize any open segments and reset accumulators
      if (!finite) {
        if (currTop.length) segsTop.push(currTop);
        if (currBottom.length) segsBottom.push(currBottom);
        currTop = []; currBottom = [];
        prevTop = null; prevBottom = null;
        continue;
      }
      // Wrap the projected point into a Pt object
      const pt = { x: p.x, y: p.y };

      // If this sample is on or above the horizon (top half)
      if (alt >= -epsAlt) {
        // If we have a previous point on top, test for large jumps to split segments
        if (prevTop) {
          const dx = pt.x - prevTop.x, dy = pt.y - prevTop.y;
          if (dx * dx + dy * dy > maxJump2) {
            // If jump detected, close current segment and start a new one
            if (currTop.length) segsTop.push(currTop);
            currTop = [];
            prevTop = null;
          }
        }
        // Append this point to the current top segment
        currTop.push(pt);
        // Update top previous point
        prevTop = pt;
      // If we just left the top half and had an open segment, finalize it
      } else if (currTop.length) {
        segsTop.push(currTop);
        currTop = [];
        prevTop = null;
      }

      // If this sample is on or below the horizon (bottom half)
      if (alt <= epsAlt) {
        // If we have a previous point on bottom, test for large jumps to split segments
        if (prevBottom) {
          const dx = pt.x - prevBottom.x, dy = pt.y - prevBottom.y;
          if (dx * dx + dy * dy > maxJump2) {
            // If jump detected, close current segment and start a new one
            if (currBottom.length) segsBottom.push(currBottom);
            currBottom = [];
            prevBottom = null;
          }
        }
        // Append this point to the current bottom segment
        currBottom.push(pt);
        // Update bottom previous point
        prevBottom = pt;
      // If we just left the bottom half and had an open segment, finalize it
      } else if (currBottom.length) {
        segsBottom.push(currBottom);
        currBottom = [];
        prevBottom = null;
      }
    }
    // After the loop, push any non-empty unfinished segments
    if (currTop.length) segsTop.push(currTop);
    if (currBottom.length) segsBottom.push(currBottom);

    // Helper to convert polyline segments into a single SVG path string with M/L commands
    const buildD = (segs: Pt[][]) =>
      segs.map(seg =>
        seg.reduce((acc, pt, i) => acc + `${i ? "L" : "M"} ${pt.x.toFixed(2)} ${pt.y.toFixed(2)} `, "")
      ).join("").trim();

    // Build path for the top arc
    const dTop = buildD(segsTop);
    // Build path for the bottom arc
    const dBottom = buildD(segsBottom);

    // Helper to compute a polyline length (for choosing a stable label path)
    const segLen = (seg: Pt[]) => seg.reduce((s, p, i) => i ? s + Math.hypot(p.x - seg[i - 1].x, p.y - seg[i - 1].y) : 0, 0);
    // Track the longest bottom segment
    let longestBottom: Pt[] | null = null;
    // Current maximum length among bottom segments
    let maxLen = 0;
    // Iterate over all bottom segments to find the longest one
    for (const s of segsBottom) {
      const L = segLen(s);
      if (L > maxLen) { maxLen = L; longestBottom = s; }
    }
    // Initialize an empty label path for the bottom
    let dBottomLabel = "";
    // If a valid longest segment exists and has at least two points, reverse it to keep text upright
    if (longestBottom && longestBottom.length >= 2) {
      const rev = [...longestBottom].reverse();
      dBottomLabel = rev.reduce((acc, pt, i) => acc + `${i ? "L" : "M"} ${pt.x.toFixed(2)} ${pt.y.toFixed(2)} `, "").trim();
    }

    // Return the two drawable paths and a label path, plus raw bottom segments for later use
    return { topPath: dTop, bottomPath: dBottom, bottomLabelPath: dBottomLabel, bottomSegs: segsBottom, topSegs: segsTop };
  };

  // Horizon split in two parts (memoized)
  const { frontD: horizonFrontPath, backD: horizonBackPath} = useMemo(
    () => buildHorizonFrontBackPaths(0),
    [refAzDeg, refAltDegSafe, viewport.w, viewport.h, fovXDeg, fovYDeg, projectionMode,
      lockHorizon, eclipticUpAzDeg, eclipticUpAltDeg, 
    ]
  );

  // Prime-vertical top/bottom arcs (memoized)
  const { topPath, bottomPath, bottomLabelPath} = useMemo(
    () => buildPrimeVerticalPaths(),
    [refAzDeg, refAltDegSafe, viewport.w, viewport.h, fovXDeg, fovYDeg, projectionMode,
      lockHorizon, eclipticUpAzDeg, eclipticUpAltDeg
    ]
  );

  const topPathId = "alt-top-path";
  const bottomPathId = "alt-bottom-path";
  const bottomLabelPathId = "alt-bottom-label-path";

  const simplifyFlat = fovXDeg <= FLAT_FOV_X_THRESHOLD || fovYDeg <= FLAT_FOV_Y_THRESHOLD;

  const flatHorizon = useMemo(() => {
    if (!simplifyFlat) return null as { x1: number; y1: number; x2: number; y2: number } | null;

    // Center point on world horizon (Alt=0) at refAz
    const p0 = projectToScreen(
      refAzDeg, 0, refAzDeg, viewport.w, viewport.h, refAltDegSafe, 0, fovXDeg, fovYDeg, projectionMode,
      lockHorizon, eclipticUpAzDeg, eclipticUpAltDeg
    );
    if (!Number.isFinite(p0.x) || !Number.isFinite(p0.y)) {
      // fallback: horizontal through center
      return { x1: 0, y1: viewport.h / 2, x2: viewport.w, y2: viewport.h / 2 };
    }

    // Sample left/right along horizon to estimate tangent slope at center
    const dAz = Math.max(0.5, Math.min(2, fovXDeg / 30));
    const pL = projectToScreen(
      refAzDeg - dAz, 0, refAzDeg, viewport.w, viewport.h, refAltDegSafe, 0, fovXDeg, fovYDeg, projectionMode,
      lockHorizon, eclipticUpAzDeg, eclipticUpAltDeg
    );
    const pR = projectToScreen(
      refAzDeg + dAz, 0, refAzDeg, viewport.w, viewport.h, refAltDegSafe, 0, fovXDeg, fovYDeg, projectionMode,
      lockHorizon, eclipticUpAzDeg, eclipticUpAltDeg
    );

    let dx = (pR.x - pL.x);
    let dy = (pR.y - pL.y);
    const len = Math.hypot(dx, dy);

    // If degenerate, fallback to horizontal
    if (!Number.isFinite(len) || len < 1e-3) {
      return { x1: 0, y1: p0.y, x2: viewport.w, y2: p0.y };
    }

    dx /= len; dy /= len; // direction along horizon
    // Compute intersections of the infinite line (p0 + t*[dx,dy]) with viewport rectangle
    const hits: { x: number; y: number }[] = [];
    const tryEdge = (t: number, x: number | null, y: number | null) => {
      const X = x ?? (p0.x + t * dx);
      const Y = y ?? (p0.y + t * dy);
      if (X >= 0 - 1e-3 && X <= viewport.w + 1e-3 && Y >= 0 - 1e-3 && Y <= viewport.h + 1e-3) {
        hits.push({ x: X, y: Y });
      }
    };
    const EPS = 1e-6;
    if (Math.abs(dx) > EPS) {
      // x = 0 and x = w
      let t = (0 - p0.x) / dx;    tryEdge(t, 0, null);
      t = (viewport.w - p0.x) / dx; tryEdge(t, viewport.w, null);
    }
    if (Math.abs(dy) > EPS) {
      // y = 0 and y = h
      let t = (0 - p0.y) / dy;    tryEdge(t, null, 0);
      t = (viewport.h - p0.y) / dy; tryEdge(t, null, viewport.h);
    }
    // Ensure we have two endpoints
    if (hits.length < 2) {
      return { x1: 0, y1: p0.y, x2: viewport.w, y2: p0.y };
    }
    // Pick two farthest hits to span the viewport
    let bestI = 0, bestJ = 1, bestD2 = -1;
    for (let i = 0; i < hits.length; i++) {
      for (let j = i + 1; j < hits.length; j++) {
        const d2 = (hits[i].x - hits[j].x) ** 2 + (hits[i].y - hits[j].y) ** 2;
        if (d2 > bestD2) { bestD2 = d2; bestI = i; bestJ = j; }
      }
    }
    const a = hits[bestI], b = hits[bestJ];
    return { x1: a.x, y1: a.y, x2: b.x, y2: b.y };
  }, [simplifyFlat, refAzDeg, refAltDegSafe, viewport.w, viewport.h, fovXDeg, fovYDeg, projectionMode,
    lockHorizon, eclipticUpAzDeg, eclipticUpAltDeg
  ]);

  return (
    <>
      {/* Viewport-anchored wrapper */}
      <div
        className="absolute"
        style={{ left: 0, top: 0, width: viewport.w, height: viewport.h, pointerEvents: "none" }}
      >
        {/* Projected curves only */}
        <svg
          width={viewport.w}
          height={viewport.h}
          className="absolute"
          style={{ left: 0, top: 0, zIndex: Z.horizon + 2, overflow: "visible" }}
        >
          <defs>
            {topPath && <path id={topPathId} d={topPath} />}
            {bottomPath && <path id={bottomPathId} d={bottomPath} />}
            {bottomLabelPath && <path id={bottomLabelPathId} d={bottomLabelPath} />}
          </defs>

          {/* Simplified flat rendering for narrow FOVs */}
          {simplifyFlat && flatHorizon && (
            <>
              {/* Flat horizon line */}
               <line
                x1={flatHorizon.x1}
                y1={flatHorizon.y1}
                x2={flatHorizon.x2}
                y2={flatHorizon.y2}
                stroke={debugMask ? COLOR_HZ_FRONT : COLOR_MARKER}
                strokeWidth={1.5}
              />
            </>
          )}

          {/* Back horizon path, disabled in flat mode */}
          {!simplifyFlat && projectionMode !== "ortho" && horizonBackPath && (
            <path d={horizonBackPath} stroke={debugMask ? COLOR_HZ_BACK : COLOR_MARKER} strokeWidth={1} fill="none" />
          )}
          {/* Front horizon path */}
          {!simplifyFlat && horizonFrontPath && (
            <path d={horizonFrontPath} stroke={debugMask ? COLOR_HZ_FRONT : COLOR_MARKER} strokeWidth={1.5} fill="none" />
          )}

          {/* +90° ALT arc (haut): via zenith */}
          {topPath && (refAltDeg > 0 || projectionMode !== "ortho") && (
            <>
              <path d={topPath} fill="none" stroke={debugMask ? COLOR_TOP : COLOR_MARKER} strokeWidth={1} strokeDasharray="4 4" />
              <text fontSize="10" fill={debugMask ? COLOR_TOP : COLOR_MARKER}>
                <textPath href={`#${topPathId}`} startOffset="50%" textAnchor="middle">{t('directions.top')}</textPath>
              </text>
            </>
          )}

          {/* -90° ALT arc (bas): via nadir */}
          {bottomPath && (refAltDeg < 0 || projectionMode !== "ortho") && (
            <>
              <path d={bottomPath} fill="none" stroke={debugMask ? COLOR_BOTTOM : COLOR_MARKER} strokeWidth={1} strokeDasharray="4 4" />
              {bottomLabelPath && (
                <text fontSize="10" fill={debugMask ? COLOR_BOTTOM : COLOR_MARKER}>
                  <textPath href={`#${bottomLabelPathId}`} startOffset="50%" textAnchor="middle">{t('directions.bottom')}</textPath>
                </text>
              )}
            </>
          )}
        </svg>
      </div>
    </>
  );
}




