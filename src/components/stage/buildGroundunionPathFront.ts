
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

