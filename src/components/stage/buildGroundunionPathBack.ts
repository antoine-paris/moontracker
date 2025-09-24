
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
      if (nearI1(azStart)) d += `L ${I1.x.toFixed(2)} ${I1.y.toFixed(2)} `;
      else if (nearI2(azStart)) d += `L ${I2.x.toFixed(2)} ${I2.y.toFixed(2)} `;
      else d += `L ${BStart.x.toFixed(2)} ${BStart.y.toFixed(2)} `;

      // Follow bottom chunk to its end
      for (const p of ch) d += `L ${p.x.toFixed(2)} ${p.y.toFixed(2)} `;

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