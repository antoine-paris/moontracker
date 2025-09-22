import React, { useMemo } from "react";
import { projectToScreen } from "../../render/projection";
import { clamp, norm360 } from "../../utils/math";

type Viewport = { x: number; y: number; w: number; h: number };

type Props = {
  viewport: Viewport;
  refAzDeg: number;
  refAltDeg: number;
  fovXDeg: number;
  fovYDeg: number;
};

function chooseMajorStep(rangeDeg: number) {
  const targets = [90, 45, 30, 15, 10, 5, 2, 1, 0.5];
  for (const s of targets) {
    if (rangeDeg / s <= 10) return s;
  }
  return 90;
}
function minorForMajor(major: number) {
  if (major >= 90) return 30;
  if (major === 45) return 15;
  if (major === 30) return 10;
  if (major === 15) return 5;
  if (major === 10) return 2;
  if (major === 5) return 1;
  if (major === 2) return 1;
  if (major === 1) return 0.5;
  return Math.max(major / 2, 0.5);
}

function buildPathFromPoints(points: Array<{ x: number; y: number; visible: boolean }>, gapPx = 32) {
  let d = "";
  let penDown = false;
  let prev: { x: number; y: number } | null = null;
  for (const p of points) {
    if (!p.visible) { penDown = false; prev = null; continue; }
    if (!penDown) {
      d += `M${p.x.toFixed(2)},${p.y.toFixed(2)} `;
      penDown = true;
      prev = { x: p.x, y: p.y };
      continue;
    }
    if (prev) {
      const dx = p.x - prev.x;
      const dy = p.y - prev.y;
      if (dx * dx + dy * dy > gapPx * gapPx) {
        d += `M${p.x.toFixed(2)},${p.y.toFixed(2)} `;
      } else {
        d += `L${p.x.toFixed(2)},${p.y.toFixed(2)} `;
      }
    } else {
      d += `M${p.x.toFixed(2)},${p.y.toFixed(2)} `;
    }
    prev = { x: p.x, y: p.y };
  }
  return d.trim();
}

// Helpers: Alt/Az <-> unit vector in ENU (x=East, y=North, z=Up)
const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;
function altAzToVec(altDeg: number, azDeg: number) {
  const alt = altDeg * DEG;
  const az = azDeg * DEG;
  const ca = Math.cos(alt), sa = Math.sin(alt);
  // az=0 => +Y (North), az=90 => +X (East)
  const x = ca * Math.sin(az);
  const y = ca * Math.cos(az);
  const z = sa;
  return [x, y, z] as const;
}
function vecToAltAz(v: readonly number[]) {
  const [x, y, z] = v;
  const alt = Math.asin(clamp(z, -1, 1)) * RAD;
  const az = norm360(Math.atan2(x, y) * RAD);
  return { alt, az };
}
function norm(v: number[]) {
  const m = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / m, v[1] / m, v[2] / m];
}
function cross(a: readonly number[], b: readonly number[]) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

// +++ added: densify step as zoom increases (smaller FOV => finer step)
function densifyStep(stepDeg: number, rangeDeg: number) {
  let f = 1;
  if (rangeDeg < 30) f = 2;
  if (rangeDeg < 12) f = 4;
  if (rangeDeg < 6) f = 8;
  return Math.max(0.25, stepDeg / f);
}
// +++ end added

// Build a small-circle (constant angular radius) around a center (alt, az).
function buildSmallCirclePath(
  centerAltDeg: number,
  centerAzDeg: number,
  radiusDeg: number,
  proj: (az: number, alt: number) => { x: number; y: number; visible: boolean },
  thetaStepDeg = 15
) {
  const vc = altAzToVec(centerAltDeg, centerAzDeg);
  // pick a reference not parallel to vc
  let ref: readonly number[] = Math.abs(vc[2]) > 0.98 ? [1, 0, 0] : [0, 0, 1];
  let u1 = cross(vc, ref);
  const u1len = Math.hypot(u1[0], u1[1], u1[2]) || 1;
  u1 = [u1[0] / u1len, u1[1] / u1len, u1[2] / u1len];
  let u2 = cross(u1, vc);
  const u2len = Math.hypot(u2[0], u2[1], u2[2]) || 1;
  u2 = [u2[0] / u2len, u2[1] / u2len, u2[2] / u2len];

  const cr = Math.cos(radiusDeg * DEG);
  const sr = Math.sin(radiusDeg * DEG);

  const pts: { x: number; y: number; visible: boolean }[] = [];
  for (let t = 0; t <= 360 + 1e-9; t += thetaStepDeg) {
    const ct = Math.cos(t * DEG), st = Math.sin(t * DEG);
    const v = [
      vc[0] * cr + (u1[0] * ct + u2[0] * st) * sr,
      vc[1] * cr + (u1[1] * ct + u2[1] * st) * sr,
      vc[2] * cr + (u1[2] * ct + u2[2] * st) * sr,
    ];
    const { alt, az } = vecToAltAz(v);
    const p = proj(az, alt);
    pts.push({ x: p.x, y: p.y, visible: p.visible });
  }
  return buildPathFromPoints(pts);
}

// Build a small "square": 4 vertices at same angular radius along u1/u2 axes.
// Skips if any vertex is offscreen to avoid wrap artifacts.
function buildSmallSquarePath(
  centerAltDeg: number,
  centerAzDeg: number,
  radiusDeg: number,
  proj: (az: number, alt: number) => { x: number; y: number; visible: boolean }
) {
  const vc = altAzToVec(centerAltDeg, centerAzDeg);
  let ref: readonly number[] = Math.abs(vc[2]) > 0.98 ? [1, 0, 0] : [0, 0, 1];
  let u1 = cross(vc, ref);
  const u1len = Math.hypot(u1[0], u1[1], u1[2]) || 1;
  u1 = [u1[0] / u1len, u1[1] / u1len, u1[2] / u1len];
  let u2 = cross(u1, vc);
  const u2len = Math.hypot(u2[0], u2[1], u2[2]) || 1;
  u2 = [u2[0] / u2len, u2[1] / u2len, u2[2] / u2len];

  const cr = Math.cos(radiusDeg * DEG);
  const sr = Math.sin(radiusDeg * DEG);

  const verts: { x: number; y: number; visible: boolean }[] = [];
  const dirs = [
    [1, 0], // +u1
    [0, 1], // +u2
    [-1, 0], // -u1
    [0, -1], // -u2
  ];
  for (const [a, b] of dirs) {
    const v = [
      vc[0] * cr + (u1[0] * a + u2[0] * b) * sr,
      vc[1] * cr + (u1[1] * a + u2[1] * b) * sr,
      vc[2] * cr + (u1[2] * a + u2[2] * b) * sr,
    ];
    const { alt, az } = vecToAltAz(v);
    const p = proj(az, alt);
    verts.push({ x: p.x, y: p.y, visible: p.visible });
  }
  if (verts.some(v => !v.visible)) return ""; // skip if any corner offscreen
  const d = `M${verts[0].x.toFixed(2)},${verts[0].y.toFixed(2)} ` +
            `L${verts[1].x.toFixed(2)},${verts[1].y.toFixed(2)} ` +
            `L${verts[2].x.toFixed(2)},${verts[2].y.toFixed(2)} ` +
            `L${verts[3].x.toFixed(2)},${verts[3].y.toFixed(2)} Z`;
  return d;
}
// +++ end added helpers

// Build a great circle path defined by a plane normal n (unit), i.e. n·u=0 on the unit sphere
function buildGreatCircleFromNormal(nIn: readonly number[], proj: (az: number, alt: number) => { x: number; y: number; visible: boolean }, tStepDeg = 1) {
  let n = norm([nIn[0], nIn[1], nIn[2]]);
  const z = [0, 0, 1] as const;
  // Find orthonormal basis (a, b) spanning the GC plane
  let a = cross(n, z);
  const aLen = Math.hypot(a[0], a[1], a[2]);
  if (aLen < 1e-6) {
    // n parallel to z => choose any horizontal axis
    a = [1, 0, 0];
  }
  a = norm(a);
  let b = cross(n, a);
  b = norm(b);

  const pts: { x: number; y: number; visible: boolean }[] = [];
  for (let t = 0; t <= 360 + 1e-9; t += tStepDeg) {
    const ct = Math.cos(t * DEG), st = Math.sin(t * DEG);
    const v = [a[0] * ct + b[0] * st, a[1] * ct + b[1] * st, a[2] * ct + b[2] * st];
    const { alt, az } = vecToAltAz(v);
    const p = proj(az, alt);
    pts.push({ x: p.x, y: p.y, visible: p.visible });
  }
  return buildPathFromPoints(pts);
}

// Colors (statics)
const COLOR_MINOR = "rgba(219, 142, 142, 0.88)";
const COLOR_MAJOR = "rgba(219, 142, 142, 0.88)";
const COLOR_CARDINAL = "rgba(219, 142, 142, 0.88)";
const COLOR_REF_CIRCLE = "rgba(219, 142, 142, 0.88)";
const COLOR_REF_SQUARE = "rgba(219, 142, 142, 0.88)";
// +++ added
const COLOR_ALT_LINE = "rgba(219, 142, 142, 0.88)";
const SHAPE_RADIUS_PX = 10; // target on-screen radius for reference shapes
// +++ end added

// +++ added: compass-aligned quantum (22.5° subdivided by powers of two, not below 0.25°)
function compassQuantum(stepDeg: number) {
  let q = 22.5;
  while (stepDeg <= q / 2 && q > 0.25) q /= 2;
  return q;
}
// +++ end added

export default function Grid({ viewport, refAzDeg, refAltDeg, fovXDeg, fovYDeg }: Props) {
  // Step selection
  const { azMinorStep, azMajorStep, polesMinorStep, polesMajorStep } = useMemo(() => {
    const azMajor = chooseMajorStep(Math.max(1, fovXDeg));
    const azMinor = minorForMajor(azMajor);
    // Use same cadence for pole-az family (orthogonal great circles)
    const poleMajor = chooseMajorStep(Math.max(1, fovXDeg));
    const poleMinor = minorForMajor(poleMajor);
    return {
      azMinorStep: azMinor,
      azMajorStep: azMajor,
      polesMinorStep: poleMinor,
      polesMajorStep: poleMajor,
    };
  }, [fovXDeg]);

  // Build lists around current pointing (to limit number of lines)
  const { meridianMinor, meridianMajor, meridianCardinals, poleMinor, poleMajor } = useMemo(() => {
    const pad = 5;
    // const azMin/azMax were unused; removed

    // Aligned to compass quantum (N, NNE, NE, ENE, ...)
    const alignMinor = compassQuantum(azMinorStep);
    const alignMajor = Math.max(alignMinor * 2, compassQuantum(azMajorStep));

    const mm: number[] = [];
    const mj: number[] = [];

    const azStartMinor = Math.floor((refAzDeg - fovXDeg / 2 - pad) / alignMinor) * alignMinor;
    const azEndMinor   = Math.ceil((refAzDeg + fovXDeg / 2 + pad) / alignMinor) * alignMinor;
    for (let a = azStartMinor; a <= azEndMinor + 1e-9; a += alignMinor) mm.push(norm360(a));

    const azStartMajor = Math.floor((refAzDeg - fovXDeg / 2 - pad) / alignMajor) * alignMajor;
    const azEndMajor   = Math.ceil((refAzDeg + fovXDeg / 2 + pad) / alignMajor) * alignMajor;
    for (let a = azStartMajor; a <= azEndMajor + 1e-9; a += alignMajor) mj.push(norm360(a));

    // 16-wind compass meridians emphasized
    const compass16 = Array.from({ length: 16 }, (_, i) => (i * 22.5) % 360);
    const cards = compass16;

    // Poles define the orthogonal GC family (prime-vertical family)
    const pm: number[] = [];
    const pM: number[] = [];
    const basePoleMinor = Math.round(refAzDeg / polesMinorStep) * polesMinorStep;
    const halfPoleCols = Math.ceil((fovXDeg / 2 + pad) / polesMinorStep) + 1;
    for (let i = -halfPoleCols; i <= halfPoleCols; i++) pm.push(norm360(basePoleMinor + i * polesMinorStep));

    const basePoleMajor = Math.round(refAzDeg / polesMajorStep) * polesMajorStep;
    const halfPoleColsMaj = Math.ceil((fovXDeg / 2 + pad) / polesMajorStep) + 1;
    for (let i = -halfPoleColsMaj; i <= halfPoleColsMaj; i++) pM.push(norm360(basePoleMajor + i * polesMajorStep));

    return {
      meridianMinor: mm,
      meridianMajor: mj,
      meridianCardinals: cards,
      poleMinor: pm,
      poleMajor: pM,
    };
  }, [refAzDeg, fovXDeg, azMinorStep, azMajorStep, polesMinorStep, polesMajorStep]);

  // Projection helper bound to current viewport/ref/fov
  const proj = (az: number, alt: number) => {
    const p = projectToScreen(az, alt, refAzDeg, viewport.w, viewport.h, refAltDeg, 0, fovXDeg, fovYDeg);
    return { x: p.x, y: p.y, visible: !!(p.visibleX && p.visibleY) };
  };

  const paths = useMemo(() => {
    // Sampling step for great circles (denser at narrow FOVs)
    const tStep = clamp(Math.min(fovXDeg, fovYDeg) / 120, 0.25, 2); // deg on circle

    // 1) Meridians (great circles containing Up and azimuth dir)
    function buildMeridian(azDeg: number) {
      // Plane contains z and horizon vector at azDeg => n = z x h
      const h = altAzToVec(0, azDeg);
      const z = [0, 0, 1] as const;
      const n = cross(z, h);
      return buildGreatCircleFromNormal(n, proj, tStep);
    }

    // 2) Orthogonal family: planes with normal on the horizon at pole azimuth φ.
    //    φ=0 (North) → prime vertical (E–Zenith–W–Nadir–E).
    function buildOrthogonalCircle(poleAzDeg: number) {
      const n = altAzToVec(0, poleAzDeg); // pole lies on horizon
      return buildGreatCircleFromNormal(n, proj, tStep);
    }

    // Cardinal special circles:
    // - Horizon: pole n = Up (0,0,1) → E–N–W–S–E (as requested).
    const horizonPath = buildGreatCircleFromNormal([0, 0, 1], proj, tStep);
    // - Prime vertical: pole at North
    const primeVerticalPath = buildOrthogonalCircle(0);

    // Collect
    // NOTE: remove dashed vertical meridians not on standard compass headings
    const pMinor = [
      // ...removed: ...meridianMinor.map(a => buildMeridian(a)),
      ...poleMinor.map(a => buildOrthogonalCircle(a)),
    ].filter(Boolean);

    const pMajor = [
      ...meridianMajor.map(a => buildMeridian(a)),
      ...poleMajor.map(a => buildOrthogonalCircle(a)),
    ].filter(Boolean);

    // Build compass-aligned meridians with classification
    const classifyAz = (az: number): "primary" | "inter" | "secondary" => {
      const a = norm360(az);
      const isMultiple = (x: number, m: number) => Math.abs(a - Math.round(a / m) * m) < 1e-6;
      if (isMultiple(a, 90)) return "primary";      // N, E, S, W
      if (isMultiple(a, 45)) return "inter";        // NE, SE, SW, NW
      return "secondary";                           // NNE, ENE, ESE, ...
    };
    const cardMeridians = meridianCardinals.map(az => ({
      d: buildMeridian(az),
      kind: classifyAz(az),
    })).filter(m => !!m.d);

    // Keep specials separate
    const cardSpecial = [horizonPath, primeVerticalPath].filter(Boolean);

    return { minor: pMinor, major: pMajor, cardinalMeridians: cardMeridians, cardinalSpecial: cardSpecial };
  }, [viewport, refAzDeg, refAltDeg, fovXDeg, fovYDeg, meridianMinor, meridianMajor, meridianCardinals, poleMinor, poleMajor]);

  // +++ updated: reference shapes anchored to alt/az; density grows with zoom; constant screen size
  const refShapes = useMemo(() => {
    const pad = 5;

    // Base steps from FOV, then densify as we zoom in
    const baseAzStep = minorForMajor(chooseMajorStep(Math.max(1, fovXDeg)));
    const baseAltStep = minorForMajor(chooseMajorStep(Math.max(1, fovYDeg)));
    const gridStepAz = densifyStep(baseAzStep, fovXDeg);
    const gridStepAlt = densifyStep(baseAltStep, fovYDeg);

    // Align azimuth columns to compass quantum
    const azQ = compassQuantum(gridStepAz);

    const azStart = Math.floor((refAzDeg - fovXDeg / 2 - pad) / azQ) * azQ;
    const azEnd = Math.ceil((refAzDeg + fovXDeg / 2 + pad) / azQ) * azQ;

    const altStart = Math.max(-90, Math.floor((refAltDeg - fovYDeg / 2 - pad) / gridStepAlt) * gridStepAlt);
    const altEnd = Math.min(90, Math.ceil((refAltDeg + fovYDeg / 2 + pad) / gridStepAlt) * gridStepAlt);

    const circles: string[] = [];
    const squares: string[] = [];

    // Local helpers to keep shapes equal size on screen
    const dist = (p1: {x:number;y:number}, p2: {x:number;y:number}) => Math.hypot(p1.x - p2.x, p1.y - p2.y);
    const estimatePxPerDegAt = (altDeg: number, azDeg: number) => {
      const d = 0.25; // deg
      const c = proj(azDeg, altDeg);
      const pAz = proj(azDeg + d, altDeg);
      const pAlt = proj(azDeg, clamp(altDeg + d, -89.9, 89.9));
      const ppdAz = dist(c, pAz) / d;
      const ppdAlt = dist(c, pAlt) / d;
      // Avoid zero scales
      return {
        ppdAz: Math.max(ppdAz, 1e-3),
        ppdAlt: Math.max(ppdAlt, 1e-3),
      };
    };

    const pushAt = (altDeg: number, azDeg: number) => {
      const altC = clamp(altDeg, -90, 90);
      const azN = norm360(azDeg);

      // Compute local px/deg and convert target pixel radius to angular radius
      const { ppdAz, ppdAlt } = estimatePxPerDegAt(altC, azN);
      const ppdAvg = (ppdAz + ppdAlt) * 0.5;
      const rDeg = clamp(SHAPE_RADIUS_PX / ppdAvg, 0.1, 20);

      const circleStep = 12; // keep simple; fine for small rDeg

      const cd = buildSmallCirclePath(altC, azN, rDeg, proj, circleStep);
      if (cd) circles.push(cd);

      const sd = buildSmallSquarePath(altC, azN, rDeg * Math.SQRT1_2, proj); // inscribed square
      if (sd) squares.push(sd);
    };

    // Primary lattice (aligned to compass)
    for (let alt = altStart; alt <= altEnd + 1e-9; alt += gridStepAlt) {
      for (let az = azStart; az <= azEnd + 1e-9; az += azQ) {
        pushAt(alt, az);
      }
    }

    // Interleaved lattices using compass half-quantum horizontally
    const azStart2 = azStart + azQ / 2;
    const altStart2 = altStart + gridStepAlt / 2;

    for (let alt = altStart2; alt <= altEnd + 1e-9; alt += gridStepAlt) {
      for (let az = azStart2; az <= azEnd + 1e-9; az += azQ) {
        pushAt(alt, az);
      }
    }

    // Extra interleaved lattices (az half only)
    for (let alt = altStart; alt <= altEnd + 1e-9; alt += gridStepAlt) {
      for (let az = azStart2; az <= azEnd + 1e-9; az += azQ) {
        pushAt(alt, az);
      }
    }
    // Extra interleaved lattices (alt half only)
    for (let alt = altStart2; alt <= altEnd + 1e-9; alt += gridStepAlt) {
      for (let az = azStart; az <= azEnd + 1e-9; az += azQ) {
        pushAt(alt, az);
      }
    }

    // Explicit shapes at zenith and nadir
    pushAt(90, 0);
    pushAt(-90, 0);

    return { circles, squares };
  }, [refAzDeg, refAltDeg, fovXDeg, fovYDeg, viewport.w, viewport.h]);
  // +++ end updated

  // +++ updated: horizontal dashed lines at referenced altitudes (denser when zoomed)
  const altLines = useMemo(() => {
    const pad = 5;
    const majorAlt = chooseMajorStep(Math.max(1, fovYDeg));
    const stepAlt = densifyStep(minorForMajor(majorAlt), fovYDeg);

    const altStart = Math.max(-90, Math.floor((refAltDeg - fovYDeg / 2 - pad) / stepAlt) * stepAlt);
    const altEnd = Math.min(90, Math.ceil((refAltDeg + fovYDeg / 2 + pad) / stepAlt) * stepAlt);

    const ys: number[] = [];
    const pushY = (altVal: number) => {
      const a = clamp(altVal, -90, 90);
      const p = proj(refAzDeg, a);
      if (p.visible) ys.push(p.y);
    };

    // Primary lines
    for (let alt = altStart; alt <= altEnd + 1e-9; alt += stepAlt) {
      pushY(alt);
    }
    // +++ added: half-step offset lines to double count
    const half = stepAlt / 2;
    for (let alt = altStart + half; alt <= altEnd + 1e-9; alt += stepAlt) {
      pushY(alt);
    }
    // +++ end added

    return ys;
  }, [refAzDeg, refAltDeg, fovXDeg, fovYDeg, viewport.w, viewport.h]);
  // +++ end updated

  return (
    <svg
      width={viewport.w}
      height={viewport.h}
      viewBox={`0 0 ${viewport.w} ${viewport.h}`}
      style={{ display: "block" }}
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="geometricPrecision"
    >
      
      {/* Major grid */}
      {paths.major.map((d, i) => (
        <path key={`mj-${i}`} d={d}
          fill="none"
          stroke={COLOR_MAJOR}
          strokeWidth={1.0}
        />
      ))}
      {/* Horizontal dashed lines at referenced altitudes */}
      {altLines.map((y, i) => (
        <line key={`al-${i}`}
          x1={0} y1={y} x2={viewport.w} y2={y}
          stroke={COLOR_ALT_LINE}
          strokeWidth={0.75}
          strokeDasharray="6 4"
        />
      ))}
      {/* Compass meridians: dashed for secondary, solid otherwise */}
      {paths.cardinalMeridians.map((m, i) => (
        <path key={`cm-${i}`} d={m.d}
          fill="none"
          stroke={COLOR_CARDINAL}
          strokeWidth={1.25}
          strokeDasharray={m.kind === "secondary" ? "6 4" : undefined}
        />
      ))}
      {/* Special great circles: horizon and prime vertical */}
      {paths.cardinalSpecial.map((d, i) => (
        <path key={`cs-${i}`} d={d}
          fill="none"
          stroke={COLOR_CARDINAL}
          strokeWidth={1.25}
        />
      ))}
      {/* Reference shapes */}
      {refShapes.circles.map((d, i) => (
        <path key={`rc-${i}`} d={d}
          fill="none"
          stroke={COLOR_REF_CIRCLE}
          strokeWidth={0.9}
        />
      ))}
      {refShapes.squares.map((d, i) => (
        <path key={`rs-${i}`} d={d}
          fill="none"
          stroke={COLOR_REF_SQUARE}
          strokeWidth={0.9}
        />
      ))}
    </svg>
  );
}
