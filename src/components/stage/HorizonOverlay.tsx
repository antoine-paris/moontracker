import React from "react";
import { Z } from "../../render/constants";
import { projectToScreen } from "../../render/projection";

// --- colors (statics) ---
const COLOR_BOTTOM = "hsla(127, 100%, 66%, 0.90)";     // bottomPath
const COLOR_TOP = "hsla(239, 100%, 50%, 0.90)";         // topPath
const COLOR_HZ_FRONT = "hsla(0, 93%, 52%, 0.90)";  // horizon in front of viewer
const COLOR_HZ_BACK = "hsla(61, 91%, 50%, 1.00)";   // horizon behind viewer
const COLOR_GROUND_FRONT = "rgba(246, 19, 19, 0.53)";
// Add a subtle fill for the back union
const COLOR_GROUND_BACK = "rgba(48, 127, 255, 0.30)";

// Define a shared 2D point type for segment work
type Pt = { x: number; y: number };

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

  // Robust 360° horizon path (ignores FOV clipping, handles seams)
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

  // Normalize angle to (-180, 180]
  const wrap180 = (a: number) => {
    let x = ((a + 180) % 360 + 360) % 360 - 180;
    return x === -180 ? 180 : x;
  };

  // Split the 360° horizon into front/back path strings (robust to seams, no viewport clipping)
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
        refAltDeg, 0,
        fovXDeg, fovYDeg,
        projectionMode
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
        refAltDeg,                    // reference altitude for camera
        0,                            // roll (unused here)
        fovXDeg,                      // horizontal field of view
        fovYDeg,                      // vertical field of view
        projectionMode                // projection model
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
    return { topPath: dTop, bottomPath: dBottom, bottomLabelPath: dBottomLabel, bottomSegs: segsBottom };
  };

  // Use the 360° horizon path so it renders even at zenith/nadir
  const horizonPath = buildAltPath360(0);

  // Horizon split in two parts
  const { frontD: horizonFrontPath, backD: horizonBackPath, frontSegs, backSegs } = buildHorizonFrontBackPaths(0);

  const { topPath, bottomPath, bottomLabelPath, bottomSegs } = buildPrimeVerticalPaths();

  const topPathId = "alt-top-path";
  const bottomPathId = "alt-bottom-path";
  const bottomLabelPathId = "alt-bottom-label-path";

  // Build a closed polygon between horizonFront (I1->I2) and bottom arc (I2->I1)
  const buildGroundunionPathFront = (): string | null => {
    // Short-hand projection wrapper for the current viewport and camera parameters
    const proj = (az: number, alt: number) =>
      projectToScreen(az, alt, refAzDeg, viewport.w, viewport.h, refAltDeg, 0, fovXDeg, fovYDeg, projectionMode);

    // Predicate to check if a projected point has finite screen coordinates
    const finite = (p: any) => Number.isFinite(p.x) && Number.isFinite(p.y);
    // Helper to flatten a list of polyline segments into a single point array
    const flatten = (segs: Pt[][]) => segs.flat();
    // Squared Euclidean distance between two points (avoids sqrt)
    const dist2 = (a: Pt, b: Pt) => { const dx = a.x - b.x, dy = a.y - b.y; return dx * dx + dy * dy; };
    // Find the index of the point in pts that is closest to p (by squared distance)
    const nearestIdx = (pts: Pt[], p: Pt) => {
      let mi = 0, md = Infinity;
      for (let i = 0; i < pts.length; i++) {
        const d = dist2(pts[i], p);
        if (d < md) { md = d; mi = i; }
      }
      return mi;
    };
    // Take the forward slice from i0 to i1 (wrapping if i0 > i1) over a circular sequence
    const sliceForward = (pts: Pt[], i0: number, i1: number) => {
      if (!pts.length) return [] as Pt[];
      if (i0 <= i1) return pts.slice(i0, i1 + 1);
      return [...pts.slice(i0), ...pts.slice(0, i1 + 1)];
    };
    // Compute the average y of a polyline to decide which one is visually lower
    const meanY = (pts: Pt[]) => pts.reduce((s, p) => s + p.y, 0) / Math.max(1, pts.length);

    // Extract the horizon-front polyline points by flattening its segments
    const hPts = flatten(frontSegs || []);
    // If insufficient data, return nothing
    if (hPts.length < 2) return null;

    // Branch for orthographic projection: the visible Earth edge is the limb, not the bottom prime-vertical arc
    if (projectionMode === "ortho") {
      // Compute the camera center direction vector from current ref alt-az
      const C = altAzToVec(refAltDeg, refAzDeg);
      // World up axis
      const zAxis = [0, 0, 1] as const;
      // Vector perpendicular to C in the horizontal plane (for limb basis)
      let a = cross(C, zAxis); // perpendicular to C
      // Check degeneracy when C aligns with zAxis
      const aLen = Math.hypot(a[0], a[1], a[2]);
      // Fallback to an arbitrary axis if degenerate
      if (aLen < 1e-6) a = [1, 0, 0]; // fallback if C // z
      // Normalize a with an inline normalizer to avoid capturing outer helpers
      const an = ((v: number[]) => { const m = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0]/m, v[1]/m, v[2]/m]; })(a as unknown as number[]);
      // Build the second limb basis vector orthogonal to both C and a
      const b = norm(cross(C, an));

      // Number of samples around the limb (full circle)
      const steps = 720;
      // Angular step in degrees
      const step = 360 / steps;
      // Screen-space jump threshold squared to split limb segments on seams
      const maxJump2 = Math.pow(0.3 * Math.hypot(viewport.w, viewport.h), 2);
      // Accumulator for limb polyline segments
      const limbSegs: Pt[][] = [];
      // Current limb segment under construction
      let curr: Pt[] = [];
      // Previous projected limb point
      let prev: Pt | null = null;

      // Sweep around the limb great circle defined by vectors an and b
      for (let t = 0; t <= 360 + 1e-9; t += step) {
        // Precompute cos/sin at angle t
        const ct = Math.cos(t * DEG), st = Math.sin(t * DEG);
        // Build 3D direction on the limb plane (dot(v, C) = 0)
        const v = [an[0] * ct + b[0] * st, an[1] * ct + b[1] * st, an[2] * ct + b[2] * st] as const;
        // Convert to alt-az for projection
        const { alt, az } = vecToAltAz(v);
        // Project the limb point
        const p = proj(az, alt);
        // Check if the projection is finite
        const isFinite = finite(p);
        // If not finite, close current segment and reset
        if (!isFinite) {
          if (curr.length) limbSegs.push(curr);
          curr = [];
          prev = null;
          continue;
        }
        // Wrap projected coordinates into a point
        const pt = { x: p.x, y: p.y };
        // If we have a previous point, test for large jump to split segments
        if (prev) {
          const dx = pt.x - prev.x, dy = pt.y - prev.y;
          if (dx * dx + dy * dy > maxJump2) {
            if (curr.length) limbSegs.push(curr);
            curr = [];
            prev = null;
          }
        }
        // Append to current limb segment
        curr.push(pt);
        // Update previous limb point
        prev = pt;
      }
      // Push the last limb segment if any
      if (curr.length) limbSegs.push(curr);

      // Flatten limb segments into a single list of points
      const lPts = flatten(limbSegs);
      // If limb cannot be built, abort
      if (lPts.length < 2) return null;

      // Analytic intersection azimuths of the horizon (z=0) and limb (dot(v, C)=0)
      // Solve sin(az)*cx + cos(az)*cy = 0 -> az = atan2(-cy, cx) and az+180
      const cx = C[0], cy = C[1];
      // First intersection azimuth in [0,360)
      const azI1Deg = (Math.atan2(-cy, cx) * RAD + 360) % 360;
      // Second intersection azimuth, opposite side
      const azI2Deg = (azI1Deg + 180) % 360;

      // Project both intersection points (alt=0 on horizon)
      const pI1 = proj(azI1Deg, 0);
      const pI2 = proj(azI2Deg, 0);
      // If any is not finite, we cannot form a valid polygon
      if (!finite(pI1) || !finite(pI2)) return null;

      // Wrap the intersection screen points
      const I1: Pt = { x: pI1.x, y: pI1.y };
      const I2: Pt = { x: pI2.x, y: pI2.y };

      // Find horizon indices closest to the intersections
      const hI1 = nearestIdx(hPts, I1);
      const hI2 = nearestIdx(hPts, I2);
      // Extract the forward horizon slice from I1 to I2 (inclusive)
      const hSeg = sliceForward(hPts, hI1, hI2);
      // Abort if not enough points for a polygon edge
      if (hSeg.length < 2) return null;

      // Find limb indices closest to the intersections
      const lI1 = nearestIdx(lPts, I1);
      const lI2 = nearestIdx(lPts, I2);
      // Candidate limb arc going one way (I2 -> I1)
      const limbArcA = sliceForward(lPts, lI2, lI1);
      // Candidate limb arc going the other way (I1 -> I2)
      const limbArcB = sliceForward(lPts, lI1, lI2);
      // Pick the visually lower arc (greater mean y in screen coordinates)
      const bottomArc = meanY(limbArcA) > meanY(limbArcB) ? limbArcA : limbArcB;
      // Abort if the chosen arc lacks points
      if (bottomArc.length < 2) return null;

      // Ensure the horizon segment is above the bottom arc (to avoid inverted fill)
      if (!(meanY(hSeg) < meanY(bottomArc))) return null;

      // Start building a closed SVG path: move to I1
      let d = `M ${I1.x.toFixed(2)} ${I1.y.toFixed(2)} `;
      // Draw horizon segment I1 -> ... -> I2
      for (const p of hSeg) d += `L ${p.x.toFixed(2)} ${p.y.toFixed(2)} `;
      // Explicitly include I2 to close the horizon side
      d += `L ${I2.x.toFixed(2)} ${I2.y.toFixed(2)} `;
      // Draw limb bottom arc back from I2 -> ... -> I1
      for (const p of bottomArc) d += `L ${p.x.toFixed(2)} ${p.y.toFixed(2)} `;
      // Close the polygon
      d += "Z";
      // Return the final path string
      return d;
    }

    // Non-orthographic branch: approximate ground by bottom prime-vertical arc between refAz±90 intersections
    const pI1 = proj(refAzDeg - 90, 0);
    const pI2 = proj(refAzDeg + 90, 0);
    // If intersections are not finite, we cannot fill the ground
    if (!finite(pI1) || !finite(pI2)) return null;

    // Wrap screen-space intersections
    const I1: Pt = { x: pI1.x, y: pI1.y };
    const I2: Pt = { x: pI2.x, y: pI2.y };

    // Locate nearest points on the horizon to intersections
    const hI1 = nearestIdx(hPts, I1);
    const hI2 = nearestIdx(hPts, I2);
    // Extract the forward horizon slice from I1 to I2
    const hSeg = sliceForward(hPts, hI1, hI2);

    // Flatten the bottom prime-vertical segments for the bottom edge
    const bPts = flatten(bottomSegs || []);
    // Validate we have enough points on both edges
    if (bPts.length < 2 || hSeg.length < 2) return null;

    // Locate nearest points on the bottom arc to intersections
    const bI1 = nearestIdx(bPts, I1);
    const bI2 = nearestIdx(bPts, I2);
    // Extract the bottom arc slice from I2 back to I1
    const bSeg = sliceForward(bPts, bI2, bI1);

    // Ensure horizon is above the bottom arc (standard screen y-down convention)
    if (!(meanY(hSeg) < meanY(bSeg))) return null;

    // Start the closed path at I1
    let d = `M ${I1.x.toFixed(2)} ${I1.y.toFixed(2)} `;
    // Draw the horizon edge from I1 to I2
    for (const p of hSeg) d += `L ${p.x.toFixed(2)} ${p.y.toFixed(2)} `;
    // Add the I2 vertex
    d += `L ${I2.x.toFixed(2)} ${I2.y.toFixed(2)} `;
    // Draw the bottom arc back to I1
    for (const p of bSeg) d += `L ${p.x.toFixed(2)} ${p.y.toFixed(2)} `;
    // Close the polygon
    d += "Z";
    // Return the union polygon path string
    return d;
  };

  // Build a closed polygon between horizonBack (I1->I2) and bottom arc (I2->I1)
  const buildGroundunionPathBack = (): string[] | null => {
    // Skip in orthographic mode (back horizon not drawn there)
    if (projectionMode === "ortho") return null;

    // Short-hand projection wrapper
    const proj = (az: number, alt: number) =>
      projectToScreen(az, alt, refAzDeg, viewport.w, viewport.h, refAltDeg, 0, fovXDeg, fovYDeg, projectionMode);

    const finite = (p: any) => Number.isFinite(p.x) && Number.isFinite(p.y);
    const wrap = (a: number) => {
      let x = ((a + 180) % 360 + 360) % 360 - 180;
      return x === -180 ? 180 : x;
    };
    const angDiff = (a: number, b: number) => Math.abs(wrap(a - b));
    const sliceForward = <T,>(arr: T[], i0: number, i1: number) => {
      if (!arr.length) return [] as T[];
      if (i0 <= i1) return arr.slice(i0, i1 + 1);
      return [...arr.slice(i0), ...arr.slice(0, i1 + 1)];
    };
    const meanY = (pts: { y: number }[]) => pts.reduce((s, p) => s + p.y, 0) / Math.max(1, pts.length);

    // Intersections of prime-vertical with horizon (screen points)
    const pI1 = proj(refAzDeg - 90, 0);
    const pI2 = proj(refAzDeg + 90, 0);
    if (!finite(pI1) || !finite(pI2)) return null;
    const I1: Pt = { x: pI1.x, y: pI1.y };
    const I2: Pt = { x: pI2.x, y: pI2.y };

    // Back horizon sampling (keep finite points)
    const startAz = refAzDeg - 180, endAz = refAzDeg + 180;
    const steps = 720, step = (endAz - startAz) / steps;
    type Sample = { x: number; y: number; az: number };
    const backSamples: Sample[] = [];
    for (let i = 0; i <= steps; i++) {
      const az = startAz + i * step;
      if (Math.abs(wrap(az - refAzDeg)) <= 90) continue; // back only
      const p = proj(az, 0);
      if (!finite(p)) continue;
      backSamples.push({ x: p.x, y: p.y, az });
    }
    if (backSamples.length < 2) return null;

    // Indices near refAz±90 on back horizon
    const idxNearAz = (arr: Sample[], targetAz: number) => {
      let mi = 0, md = Infinity;
      for (let i = 0; i < arr.length; i++) {
        const d = angDiff(arr[i].az, targetAz);
        if (d < md) { md = d; mi = i; }
      }
      return mi;
    };
    const i1 = idxNearAz(backSamples, refAzDeg - 90);
    const i2 = idxNearAz(backSamples, refAzDeg + 90);
    const hSegBack = sliceForward(backSamples, i2, i1); // I2 -> I1 along back

    // Bottom prime-vertical sampling (bottom half only)
    const zAxis = [0, 0, 1] as const;
    const n = altAzToVec(0, refAzDeg);
    let a = cross(n, zAxis); if (Math.hypot(a[0], a[1], a[2]) < 1e-6) a = [1, 0, 0]; a = norm(a);
    let b = cross(n, a); b = norm(b);
    const stepPrim = Math.max(0.25, Math.min(2, Math.min(fovXDeg, fovYDeg) / 120));
    const epsAlt = 1e-3;

    const bottomSamples: Sample[] = [];
    for (let t = 0; t <= 360 + 1e-9; t += stepPrim) {
      const ct = Math.cos(t * DEG), st = Math.sin(t * DEG);
      const v = [a[0] * ct + b[0] * st, a[1] * ct + b[1] * st, a[2] * ct + b[2] * st] as const;
      const { alt } = vecToAltAz(v);
      if (alt > epsAlt) continue;
      const az = Math.atan2(v[0], v[1]) * RAD;
      const p = proj(az, alt);
      if (!finite(p)) continue;
      bottomSamples.push({ x: p.x, y: p.y, az });
    }
    if (bottomSamples.length < 2) return null;

    // Build both candidate arcs I1->I2 from bottomSamples
    const bIdx1 = idxNearAz(bottomSamples, refAzDeg - 90);
    const bIdx2 = idxNearAz(bottomSamples, refAzDeg + 90);
    const bSegA = sliceForward(bottomSamples, bIdx1, bIdx2);                  // direct
    const bSegB = [...sliceForward(bottomSamples, bIdx2, bIdx1)].reverse();  // wrap

    const maxJump2 = Math.pow(0.3 * Math.hypot(viewport.w, viewport.h), 2);
    const splitBySeam = (seg: Sample[]) => {
      const chunks: Sample[][] = [];
      let curr: Sample[] = [];
      for (let i = 0; i < seg.length; i++) {
        const p = seg[i];
        if (i > 0) {
          const q = seg[i - 1];
          if (((p.x - q.x) ** 2 + (p.y - q.y) ** 2) > maxJump2) {
            if (curr.length >= 2) chunks.push(curr);
            curr = [];
          }
        }
        curr.push(p);
      }
      if (curr.length >= 2) chunks.push(curr);
      return chunks;
    };

    // Helper: horizon index by az within hSegBack
    const idxNearAzBack = (targetAz: number) => idxNearAz(hSegBack, targetAz);

    // Snap to I1/I2 at ~3° to avoid tiny diagonals
    const nearI1 = (az: number) => angDiff(az, refAzDeg - 90) < 3;
    const nearI2 = (az: number) => angDiff(az, refAzDeg + 90) < 3;

    // Build polygons for all seam chunks from both arcs; this ensures full coverage
    const buildChunkPolygon = (ch: Sample[]) => {
      const azStart = ch[0].az, azEnd = ch[ch.length - 1].az;
      const hIEnd = idxNearAzBack(azEnd);
      const hIStart = idxNearAzBack(azStart);
      const hSlice = sliceForward(hSegBack, hIEnd, hIStart);

      // If bottom is clearly under horizon on average, skip
      if (!(meanY(ch) < meanY(hSlice))) return null;

      // Start at horizon end
      const HEnd = hSegBack[hIEnd];
      let d = `M ${HEnd.x.toFixed(2)} ${HEnd.y.toFixed(2)} `;

      // Follow horizon to start
      for (const p of hSlice) d += `L ${p.x.toFixed(2)} ${p.y.toFixed(2)} `;

      // Connect to bottom start, snapping to I1/I2 if close
      const BStart = ch[0];
      /*if (nearI1(azStart)) d += `L ${I1.x.toFixed(2)} ${I1.y.toFixed(2)} `;
      else if (nearI2(azStart)) d += `L ${I2.x.toFixed(2)} ${I2.y.toFixed(2)} `;
      else d += `L ${BStart.x.toFixed(2)} ${BStart.y.toFixed(2)} `;
*/
      // Follow bottom chunk to its end
      for (const p of ch) {
        console.log(`bottom chunk L ${p.x.toFixed(2)} ${p.y.toFixed(2)} `);
        d += `L ${p.x.toFixed(2)} ${p.y.toFixed(2)} `;
      }

      // Close back to horizon end, snapping if close to I1/I2
      const BEnd = ch[ch.length - 1];
      if (nearI1(azEnd)) d += `L ${I1.x.toFixed(2)} ${I1.y.toFixed(2)} `;
      else if (nearI2(azEnd)) d += `L ${I2.x.toFixed(2)} ${I2.y.toFixed(2)} `;
      else d += `L ${HEnd.x.toFixed(2)} ${HEnd.y.toFixed(2)} `;

      d += "Z";
      return d;
    };

    const parts: string[] = [];
    const allChunks = [...splitBySeam(bSegA), ...splitBySeam(bSegB)];
    for (const ch of allChunks) {
      const poly = buildChunkPolygon(ch);
      if (poly) parts.push(poly);
    }

    return parts.length ? parts : null;
  };

  // Replace previous naive concat with the robust closed polygons
  const unionPathFront = buildGroundunionPathFront();
  const unionPathBack = buildGroundunionPathBack();

  return (
    <>
      {/* Viewport-anchored wrapper */}
      <div
        className="absolute"
        style={{ left: viewport.x, top: viewport.y, width: viewport.w, height: viewport.h, pointerEvents: "none" }}
      >
        {/* Atmosphere only */}
        {showAtmosphere && (
          <div
            className="absolute inset-0"
            style={{ zIndex: Z.horizon - 8, background: atmosphereGradient ?? "linear-gradient(to top, #000, #000)" }}
          />
        )}

        {/* Back-side union: between bottomPath and horizonBackPath */}
        {unionPathBack && unionPathBack.length > 0 && (
          <svg
            width={viewport.w}
            height={viewport.h}
            className="absolute"
            style={{ left: 0, top: 0, zIndex: Z.horizon + 1, overflow: "visible" }}
          >
            {unionPathBack.map((d, i) => (
              <path key={i} d={d} fill={COLOR_GROUND_BACK} stroke={COLOR_HZ_BACK} strokeWidth={1.5} />
            ))}
          </svg>
        )}

        {/* Projected curves only: horizon (front/back), top/bottom arcs and labels */}
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

          {/* Horizon split: draw back first (except in ortho), then front on top */}
          {projectionMode !== "ortho" && horizonBackPath && (
            <path d={horizonBackPath} stroke={COLOR_HZ_BACK} strokeWidth={1} fill="none" />
          )}
          {horizonFrontPath && <path d={horizonFrontPath} stroke={COLOR_HZ_FRONT} strokeWidth={1.5} fill="none" />}

          {/* +90° ALT arc (haut): via zenith */}
          {topPath && (
            <>
              <path d={topPath} fill="none" stroke={COLOR_TOP} strokeWidth={1} strokeDasharray="4 4" />
              <text fontSize="10" fill={COLOR_TOP}>
                <textPath href={`#${topPathId}`} startOffset="50%" textAnchor="middle">haut</textPath>
              </text>
            </>
          )}

          {/* -90° ALT arc (bas): via nadir */}
          {bottomPath && (
            <>
              <path d={bottomPath} fill="none" stroke={COLOR_BOTTOM} strokeWidth={1} strokeDasharray="4 4" />
              {bottomLabelPath && (
                <text fontSize="10" fill={COLOR_BOTTOM}>
                  <textPath href={`#${bottomLabelPathId}`} startOffset="50%" textAnchor="middle">bas</textPath>
                </text>
              )}
            </>
          )}
        </svg>

        {/* New SVG: union of horizonFrontPath and bottomPath as a closed polygon */}
        {unionPathFront && (
          <svg
            width={viewport.w}
            height={viewport.h}
            className="absolute"
            style={{ left: 0, top: 0, zIndex: Z.horizon + 3, overflow: "visible" }}
          >
            <path d={unionPathFront} fill={COLOR_GROUND_FRONT} stroke={COLOR_HZ_FRONT} strokeWidth={2} />
          </svg>
        )}
      </div>
    </>
  );
}



