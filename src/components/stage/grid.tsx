import { useMemo } from "react";
import { projectToScreen } from "../../render/projection";
import { clamp, norm360 } from "../../utils/math";

type Viewport = { x: number; y: number; w: number; h: number };

type Props = {
  viewport: Viewport;
  refAzDeg: number;
  refAltDeg: number;
  fovXDeg: number;
  fovYDeg: number;
  // added: keep Grid in sync with HorizonOverlay
  projectionMode: import("../../render/projection").ProjectionMode;
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

// +++ added: perf helpers (trig table + tight-loop hypot)
type TrigTable = { cos: Float32Array; sin: Float32Array; len: number; step: number };
const TRIG_CACHE = new Map<string, TrigTable>();
function getTrigTable(stepDeg: number): TrigTable {
  const s = Math.max(1e-3, stepDeg); // guard
  const key = s.toFixed(6);
  const cached = TRIG_CACHE.get(key);
  if (cached) return cached;
  const angles: number[] = [];
  for (let t = 0; t <= 360 + 1e-9; t += s) angles.push(t * DEG);
  const len = angles.length;
  const cos = new Float32Array(len);
  const sin = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    cos[i] = Math.cos(angles[i]);
    sin[i] = Math.sin(angles[i]);
  }
  const table: TrigTable = { cos, sin, len, step: s };
  TRIG_CACHE.set(key, table);
  return table;
}
function hypot2d(dx: number, dy: number) {
  return Math.sqrt(dx * dx + dy * dy);
}
// +++ added: coarse bbox + culling helpers (used in refShapes and altPaths)
type BBox = { minX: number; minY: number; maxX: number; maxY: number; hasAny: boolean };

function isBBoxOutsideViewport(b: BBox, vp: { w: number; h: number }, marginPx: number) {
  if (!b.hasAny) return true;
  return (
    b.maxX < -marginPx ||
    b.minX > vp.w + marginPx ||
    b.maxY < -marginPx ||
    b.minY > vp.h + marginPx
  );
}

function estimateSmallCircleBBox(
  centerAltDeg: number,
  centerAzDeg: number,
  radiusDeg: number,
  proj: (az: number, alt: number) => { x: number; y: number; visible: boolean },
  sampleStepDeg = 30
): BBox {
  const table = getTrigTable(sampleStepDeg);

  const vc = altAzToVec(centerAltDeg, centerAzDeg);
  const ref: readonly number[] = Math.abs(vc[2]) > 0.98 ? [1, 0, 0] : [0, 0, 1];
  let u1 = cross(vc, ref);
  const u1len = Math.hypot(u1[0], u1[1], u1[2]) || 1;
  u1 = [u1[0] / u1len, u1[1] / u1len, u1[2] / u1len];
  let u2 = cross(u1, vc);
  const u2len = Math.hypot(u2[0], u2[1], u2[2]) || 1;
  u2 = [u2[0] / u2len, u2[1] / u2len, u2[2] / u2len];

  const cr = Math.cos(radiusDeg * DEG);
  const sr = Math.sin(radiusDeg * DEG);

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  let any = false;

  const v = [0, 0, 0] as number[];
  for (let i = 0; i < table.len; i++) {
    const ct = table.cos[i], st = table.sin[i];
    v[0] = vc[0] * cr + (u1[0] * ct + u2[0] * st) * sr;
    v[1] = vc[1] * cr + (u1[1] * ct + u2[1] * st) * sr;
    v[2] = vc[2] * cr + (u1[2] * ct + u2[2] * st) * sr;
    const { alt, az } = vecToAltAz(v);
    const p = proj(az, alt);
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) continue;
    if (!p.visible) continue;
    any = true;
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  return { minX, minY, maxX, maxY, hasAny: any };
}
// +++ end added

// +++ added: streaming builders using precomputed trig tables and minimal allocations
function buildSmallCirclePathTable(
  centerAltDeg: number,
  centerAzDeg: number,
  radiusDeg: number,
  proj: (az: number, alt: number) => { x: number; y: number; visible: boolean },
  table: TrigTable,
  gapPx = 32
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

  let d = "";
  let penDown = false;
  let prevX = 0, prevY = 0;
  const gap2 = gapPx * gapPx;
  const v = [0, 0, 0] as number[];

  for (let i = 0; i < table.len; i++) {
    const ct = table.cos[i], st = table.sin[i];
    v[0] = vc[0] * cr + (u1[0] * ct + u2[0] * st) * sr;
    v[1] = vc[1] * cr + (u1[1] * ct + u2[1] * st) * sr;
    v[2] = vc[2] * cr + (u1[2] * ct + u2[2] * st) * sr;
    const { alt, az } = vecToAltAz(v);
    const p = proj(az, alt);
    if (!p.visible) { penDown = false; continue; }
    if (!penDown) {
      d += `M${p.x.toFixed(2)},${p.y.toFixed(2)} `;
      penDown = true;
      prevX = p.x; prevY = p.y;
    } else {
      const dx = p.x - prevX, dy = p.y - prevY;
      if (dx * dx + dy * dy > gap2) {
        d += `M${p.x.toFixed(2)},${p.y.toFixed(2)} `;
      } else {
        d += `L${p.x.toFixed(2)},${p.y.toFixed(2)} `;
      }
      prevX = p.x; prevY = p.y;
    }
  }
  return d.trim();
}

function buildGreatCircleFromNormalTable(
  nIn: readonly number[],
  proj: (az: number, alt: number) => { x: number; y: number; visible: boolean },
  table: TrigTable,
  gapPx = 32
) {
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

  let d = "";
  let penDown = false;
  let prevX = 0, prevY = 0;
  const gap2 = gapPx * gapPx;
  const v = [0, 0, 0] as number[];

  for (let i = 0; i < table.len; i++) {
    const ct = table.cos[i], st = table.sin[i];
    v[0] = a[0] * ct + b[0] * st;
    v[1] = a[1] * ct + b[1] * st;
    v[2] = a[2] * ct + b[2] * st;
    const { alt, az } = vecToAltAz(v);
    const p = proj(az, alt);
    if (!p.visible) { penDown = false; continue; }
    if (!penDown) {
      d += `M${p.x.toFixed(2)},${p.y.toFixed(2)} `;
      penDown = true;
      prevX = p.x; prevY = p.y;
    } else {
      const dx = p.x - prevX, dy = p.y - prevY;
      if (dx * dx + dy * dy > gap2) {
        d += `M${p.x.toFixed(2)},${p.y.toFixed(2)} `;
      } else {
        d += `L${p.x.toFixed(2)},${p.y.toFixed(2)} `;
      }
      prevX = p.x; prevY = p.y;
    }
  }
  return d.trim();
}
// +++ end added

// Colors (statics)
const COLOR_MAJOR = "rgba(219, 142, 142, 0.88)";
const COLOR_CARDINAL = "rgba(219, 142, 142, 0.88)";
const COLOR_REF_CIRCLE = "rgba(219, 142, 142, 0.88)";
// +++ added
const COLOR_ALT_LINE = "rgba(219, 142, 142, 0.88)";
const SHAPE_RADIUS_PX = 10; // target on-screen radius for reference shapes
// Only render shapes within this altitude band (deg)
const MIN_SHAPE_ALT_DEG = -60;
const MAX_SHAPE_ALT_DEG = 60;
// +++ end added

// +++ added: compass-aligned quantum (22.5° subdivided by powers of two, not below 0.25°)
function compassQuantum(stepDeg: number) {
  let q = 22.5;
  while (stepDeg <= q / 2 && q > 0.25) q /= 2;
  return q;
}
// +++ end added

export default function Grid({ viewport, refAzDeg, refAltDeg, fovXDeg, fovYDeg, projectionMode }: Props) {
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
    const p = projectToScreen(
      az,
      alt,
      refAzDeg,
      viewport.w,
      viewport.h,
      refAltDeg,
      0,
      fovXDeg,
      fovYDeg,
      // pass-through so curves match HorizonOverlay
      projectionMode
    );
    // relaxed visibility for non-orthographic projections so "backside" data can render
    const finite = Number.isFinite(p.x) && Number.isFinite(p.y);
    const maxCoord = Math.max(viewport.w, viewport.h) * 8; // generous guard against runaway values
    const withinGuard = finite && Math.abs(p.x) <= maxCoord && Math.abs(p.y) <= maxCoord;

    // orthographic: respect projector visibility; others: allow backside if finite and bounded
    const projectorVisible = (p.visibleX ?? true) && (p.visibleY ?? true);
    const visible = projectionMode === 'ortho' ? (withinGuard && projectorVisible) : withinGuard;

    return { x: p.x, y: p.y, visible };
  };

  const paths = useMemo(() => {
    // Sampling step for great circles (denser at narrow FOVs)
    const tStep = clamp(Math.min(fovXDeg, fovYDeg) / 120, 0.25, 2); // deg on circle
    const trigGC = getTrigTable(tStep);
    // adaptive path gap to break across singularities but keep continuity elsewhere
    const pathGapPx = Math.max(24, Math.sqrt(viewport.w * viewport.w + viewport.h * viewport.h) / 30);

    // 1) Meridians (great circles containing Up and azimuth dir)
    function buildMeridian(azDeg: number) {
      // Plane contains z and horizon vector at azDeg => n = z x h
      const h = altAzToVec(0, azDeg);
      const z = [0, 0, 1] as const;
      const n = cross(z, h);
      return buildGreatCircleFromNormalTable(n, proj, trigGC, pathGapPx);
    }

    // 2) Orthogonal family: planes with normal on the horizon at pole azimuth φ.
    //    φ=0 (North) → prime vertical (E–Zenith–W–Nadir–E).
    function buildOrthogonalCircle(poleAzDeg: number) {
      const n = altAzToVec(0, poleAzDeg); // pole lies on horizon
      return buildGreatCircleFromNormalTable(n, proj, trigGC, pathGapPx);
    }

    // Cardinal special circles:
    // - Horizon: pole n = Up (0,0,1) → E–N–W–S–E (as requested).
    const horizonPath = buildGreatCircleFromNormalTable([0, 0, 1], proj, trigGC, pathGapPx);
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
      const isMultiple = (m: number) => Math.abs(a - Math.round(a / m) * m) < 1e-6;
      if (isMultiple(90)) return "primary";      // N, E, S, W
      if (isMultiple(45)) return "inter";        // NE, SE, SW, NW
      return "secondary";                           // NNE, ENE, ESE, ...
    };
    const cardMeridians = meridianCardinals.map(az => ({
      d: buildMeridian(az),
      kind: classifyAz(az),
    })).filter(m => !!m.d);

    // Keep specials separate
    const cardSpecial = [horizonPath, primeVerticalPath].filter(Boolean);

    return { minor: pMinor, major: pMajor, cardinalMeridians: cardMeridians, cardinalSpecial: cardSpecial };
  }, [viewport, refAzDeg, refAltDeg, fovXDeg, fovYDeg, projectionMode, meridianMinor, meridianMajor, meridianCardinals, poleMinor, poleMajor]);

  // +++ updated: reference shapes with trig table and tight-loop hypot in dist
  const refShapes = useMemo(() => {
    const pad = 5;

    // Base steps from FOV, then densify as we zoom in
    const baseAzStep = minorForMajor(chooseMajorStep(Math.max(1, fovXDeg)));
    const baseAltStep = minorForMajor(chooseMajorStep(Math.max(1, fovYDeg)));
    const gridStepAz = densifyStep(baseAzStep, fovXDeg);
    const gridStepAlt = densifyStep(baseAltStep, fovYDeg);

    // Align azimuth columns to compass quantum
    const azQ = compassQuantum(gridStepAz);

    // Always render full 360° azimuth in all projections, including ortho
    const isOrtho = projectionMode === 'ortho';
    const azStart = Math.floor((refAzDeg - 180 - pad) / azQ) * azQ;
    const azEnd   = Math.ceil((refAzDeg + 180 + pad) / azQ) * azQ;

    // Keep existing vertical span computation then clamp to [-60, 60]
    const spanY = isOrtho ? fovYDeg : 180;

    const rawAltStart = isOrtho
      ? Math.max(-90, Math.floor((refAltDeg - spanY / 2 - pad) / gridStepAlt) * gridStepAlt)
      : -90;
    const rawAltEnd = isOrtho
      ? Math.min(90, Math.ceil((refAltDeg + spanY / 2 + pad) / gridStepAlt) * gridStepAlt)
      : 90;

    // Clamp sweep to [-60, 60]
    const altStart = Math.max(MIN_SHAPE_ALT_DEG, rawAltStart);
    const altEnd   = Math.min(MAX_SHAPE_ALT_DEG, rawAltEnd);

    const circles: string[] = [];
    // removed: const squares: string[] = [];

    // Local helpers to keep shapes equal size on screen
    const dist = (p1: {x:number;y:number}, p2: {x:number;y:number}) => hypot2d(p1.x - p2.x, p1.y - p2.y);
    // Removed the center-based culling that caused “behind” shapes to disappear
    // const isOnScreen = (p: {x:number;y:number;visible:boolean}, m = 96) =>
    //   p.x >= -m && p.x <= viewport.w + m && p.y >= -m && p.y <= viewport.h + m && p.visible;

    const estimatePxPerDegAt = (altDeg: number, azDeg: number, c: {x:number;y:number}) => {
      const d = 0.25; // deg
      const pAz = proj(azDeg + d, altDeg);
      const pAlt = proj(azDeg, clamp(altDeg + d, -89.9, 89.9));
      const ppdAz = dist(c, pAz) / d;
      const ppdAlt = dist(c, pAlt) / d;
      return {
        ppdAz: Math.max(ppdAz, 1e-3),
        ppdAlt: Math.max(ppdAlt, 1e-3),
      };
    };

    // +++ added: viewport margin for culling
    const CULL_MARGIN_PX = Math.max(64, Math.hypot(viewport.w, viewport.h) / 18);
    // +++ end added

    const pushAt = (altDeg: number, azDeg: number) => {
      const altC = clamp(altDeg, -90, 90);
      // Skip shapes outside the allowed band
      if (altC < MIN_SHAPE_ALT_DEG || altC > MAX_SHAPE_ALT_DEG) return;
      const azN = norm360(azDeg);

      // Project center for scale estimation only; do not cull by center visibility.
      const c = proj(azN, altC);

      // Compute local px/deg and convert target pixel radius to angular radius
      const { ppdAz, ppdAlt } = estimatePxPerDegAt(altC, azN, c);
      const ppdAvg = (ppdAz + ppdAlt) * 0.5;
      const rDeg = clamp(SHAPE_RADIUS_PX / ppdAvg, 0.1, 20);

      // Denser sampling to catch small visible arcs even when center is far.
      const circleStep = 5; // deg
      const trigCircle = getTrigTable(circleStep);
      const gapPx = Math.max(24, Math.sqrt(viewport.w * viewport.w + viewport.h * viewport.h) / 30);

      // +++ added: quick coarse cull before building a precise path
      const coarseBBox = estimateSmallCircleBBox(altC, azN, rDeg, proj, 30);
      if (isBBoxOutsideViewport(coarseBBox, viewport, CULL_MARGIN_PX)) return;
      // +++ end added

      const cd = buildSmallCirclePathTable(altC, azN, rDeg, proj, trigCircle, gapPx);
      if (cd) circles.push(cd);

      // removed squares
      // const sd = buildSmallSquarePath(altC, azN, rDeg * Math.SQRT1_2, proj);
      // if (sd) squares.push(sd);
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

    // Remove explicit zenith/nadir insertions (outside band)
    // pushAt(90, 0);
    // pushAt(-90, 0);

    // return circles only
    return { circles };
  }, [refAzDeg, refAltDeg, fovXDeg, fovYDeg, viewport.w, viewport.h, projectionMode]);

  // +++ updated: horizontal dashed lines at referenced altitudes (curved by projection)
  const altPaths = useMemo(() => {
    const pad = 5;
    // use the same step computation as refShapes
    const baseAltStep = minorForMajor(chooseMajorStep(Math.max(1, fovYDeg)));
    const stepAlt = densifyStep(baseAltStep, fovYDeg);

    const allowBackHemisphere = projectionMode !== 'ortho';

    // same visual window anchors as refShapes
    const visStart = Math.max(-90, Math.floor((refAltDeg - fovYDeg / 2 - pad) / stepAlt) * stepAlt);
    const visEnd   = Math.min(90,  Math.ceil((refAltDeg + fovYDeg / 2 + pad) / stepAlt) * stepAlt);

    // anchor to the same phase (visStart) but still cover full sphere if needed
    const anchor = visStart;
    const fullStart = (Math.ceil((-90 - anchor) / stepAlt) * stepAlt) + anchor;
    const fullEnd   = (Math.floor(( 90 - anchor) / stepAlt) * stepAlt) + anchor;

    const rangeStart = allowBackHemisphere ? fullStart : visStart;
    const rangeEnd   = allowBackHemisphere ? fullEnd   : visEnd;

    const values: number[] = [];
    for (let alt = rangeStart; alt <= rangeEnd + 1e-9; alt += stepAlt) values.push(alt);

    // always interleave half-step to match refShapes’ lattice
    const half = stepAlt / 2;
    for (let alt = rangeStart + half; alt <= rangeEnd + 1e-9; alt += stepAlt) values.push(alt);

    // dedupe and clamp
    const uniq = Array.from(new Set(values.map(v => +v.toFixed(6))))
      .filter(v => v >= -90 && v <= 90)
      .sort((a, b) => a - b);

    const thetaStep = clamp(Math.min(fovXDeg, fovYDeg) / 120, 0.25, 2);
    const trigGC = getTrigTable(thetaStep);
    const gapPx = Math.max(24, Math.sqrt(viewport.w * viewport.w + viewport.h * viewport.h) / 30);

    // +++ added: viewport margin for culling similar to refShapes
    const CULL_MARGIN_PX = Math.max(64, Math.hypot(viewport.w, viewport.h) / 18);
    // +++ end added

    const paths: string[] = [];
    for (const a of uniq) {
      const altC = clamp(a, -90, 90);
      const radius = 90 - altC;
      if (Math.abs(radius) < 1e-3 || Math.abs(180 - radius) < 1e-3) continue;

      // +++ added: quick coarse cull on altitude small circle (center at zenith)
      const coarseBBox = estimateSmallCircleBBox(90, 0, radius, proj, 30);
      if (isBBoxOutsideViewport(coarseBBox, viewport, CULL_MARGIN_PX)) continue;
      // +++ end added

      const d = buildSmallCirclePathTable(90, 0, radius, proj, trigGC, gapPx);
      if (d) paths.push(d);
    }
    return paths;
  }, [refAltDeg, fovXDeg, fovYDeg, viewport.w, viewport.h, projectionMode]);
 // +++ end updated

  // Merge path arrays into single d-attributes per style to reduce DOM nodes
  const mergedPaths = useMemo(() => {
    const dMajor = (paths.major?.join(" ") || "").trim();

    const dAlt = (altPaths?.join(" ") || "").trim();

    const cardSolids = [
      // primary + inter (solid)
      ...paths.cardinalMeridians.filter(m => m.kind !== "secondary").map(m => m.d),
      // specials (solid)
      ...paths.cardinalSpecial,
    ];
    const dCardSolid = (cardSolids.join(" ") || "").trim();

    const dCardDash = (paths.cardinalMeridians
      .filter(m => m.kind === "secondary")
      .map(m => m.d)
      .join(" ") || "").trim();

    const dRef = (refShapes.circles?.join(" ") || "").trim();

    return { dMajor, dAlt, dCardSolid, dCardDash, dRef };
  }, [paths.major, altPaths, paths.cardinalMeridians, paths.cardinalSpecial, refShapes.circles]);

  return (
    <svg
      width={viewport.w}
      height={viewport.h}
      viewBox={`0 0 ${viewport.w} ${viewport.h}`}
      style={{ display: "block" }}
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="geometricPrecision"
    >
      {/* Major grid (merged) */}
      {mergedPaths.dMajor && (
        <path d={mergedPaths.dMajor}
          fill="none"
          stroke={COLOR_MAJOR}
          strokeWidth={1.0}
        />
      )}

      {/* Horizontal dashed lines at referenced altitudes (merged) */}
      {mergedPaths.dAlt && (
        <path d={mergedPaths.dAlt}
          fill="none"
          stroke={COLOR_ALT_LINE}
          strokeWidth={0.75}
          strokeDasharray="6 4"
        />
      )}

      {/* Compass meridians + specials: solid (merged) */}
      {mergedPaths.dCardSolid && (
        <path d={mergedPaths.dCardSolid}
          fill="none"
          stroke={COLOR_CARDINAL}
          strokeWidth={1.25}
        />
      )}

      {/* Compass meridians: dashed secondary (merged) */}
      {mergedPaths.dCardDash && (
        <path d={mergedPaths.dCardDash}
          fill="none"
          stroke={COLOR_CARDINAL}
          strokeWidth={1.25}
          strokeDasharray="6 4"
        />
      )}

      {/* Reference shapes (merged) */}
      {mergedPaths.dRef && (
        <path d={mergedPaths.dRef}
          fill="none"
          stroke={COLOR_REF_CIRCLE}
          strokeWidth={0.9}
        />
      )}
    </svg>
  );
}



