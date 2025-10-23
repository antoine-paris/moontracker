import React from "react";
import { lstDeg } from "../../astro/time";
import { projectToScreen } from "../../render/projection";
import { createPortal } from "react-dom";
import { Z } from "../../render/constants";
import { refractAltitudeDeg } from "../../utils/refraction"; // NEW

type Viewport = { x: number; y: number; w: number; h: number };

type Props = {
  utcMs: number;
  latDeg: number;
  lngDeg: number;
  refAzDeg: number;
  refAltDeg: number;
  fovXDeg: number;
  fovYDeg: number;
  viewport: Viewport;
  debug?: boolean;
  enlargeObjects?: boolean;
  showMarkers?: boolean;
  onCruxCentroid?: (pos: { altDeg: number; azDeg: number } | null) => void;
  // NEW: projection mode
  projectionMode?: 'recti-panini' | 'stereo-centered' | 'ortho' | 'cylindrical';
  // NEW: refraction toggle
  showRefraction?: boolean;
};

type Star = {
  name: string;
  raDeg: number;
  decDeg: number;
  mag: number;
  constellation?: string;
  // NEW: precomputed terms for speed
  raRad: number;
  decRad: number;
  sinDec: number;
  cosDec: number;
};

function norm360(v: number) { return ((v % 360) + 360) % 360; }
function clamp(v: number, a: number, b: number) { return Math.max(a, Math.min(b, v)); }
function toRad(d: number) { return (d * Math.PI) / 180; }
function toDeg(r: number) { return (r * 180) / Math.PI; }

// Static: maximum visual magnitude to render (lower = brighter). Increase to show more dim stars.
const STAR_MAX_MAG = 5.0;

// NEW: presets to finely tune stars rendering in both modes
type StarRenderConfig = {
  maxMag: number; // faintest magnitude to render
  radiusBase: number; // base px at mag=0
  radiusSlope: number; // px decrease per mag (+mag -> smaller)
  rMin: number;
  rMax: number;
  opacityBase: number; // opacity at mag=0
  opacitySlope: number; // opacity decrease per mag
  oMin: number;
  oMax: number;
  highlightScale: number; // radius multiplier for highlighted debug stars
  glowNormal: number; // 0..1 alpha for white glow
  glowHighlight: number; // 0..1 alpha for red glow
  fovScaleExp: number; // small exponent to slightly adapt radius with FOV
};

// Tuned for enlargeObjects=true (current look)
const STAR_RENDER_ENLARGED: StarRenderConfig = {
  maxMag: STAR_MAX_MAG,
  radiusBase: 6.2,
  radiusSlope: 0.7,
  rMin: 0.8,
  rMax: 4.2,
  opacityBase: 1.4,
  opacitySlope: 0.18,
  oMin: 0.25,
  oMax: 1.0,
  highlightScale: 1.35,
  glowNormal: 1.35,
  glowHighlight: 0.45,
  fovScaleExp: 0.5, // keep appearance stable in enlarged mode
};

// Tuned for enlargeObjects=false (more “realistic”, smaller/softer)
const STAR_RENDER_REALISTIC: StarRenderConfig = {
  maxMag: STAR_MAX_MAG,       // allow a few more faint stars but keep it reasonable
  radiusBase: 2.8,   // much smaller base size
  radiusSlope: 0.35, // gentler slope so bright stars still stand out
  rMin: 0.35,
  rMax: 2.2,
  opacityBase: 1.4,
  opacitySlope: 0.18,
  oMin: 0.20,
  oMax: 0.90,
  highlightScale: 1.15,
  glowNormal: 0.35,
  glowHighlight: 0.45,
  fovScaleExp: 0.25, // slight compensation at very wide/narrow FOVs
};

// Module-level caches (fetch/parse once per session)
let STARS_CACHE: Star[] | null = null;
let STARS_PROMISE: Promise<Star[]> | null = null;
let DEBUG_STARS_CACHE: Star[] | null = null;
let DEBUG_STARS_PROMISE: Promise<Star[]> | null = null;

function parseCsv(text: string): Star[] {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  if (!lines.length) return [];
  const out: Star[] = [];
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i];
    const cols = row.split(",").map(s => s.trim());
    if (cols.length < 4) continue;
    // Columns: Name,Vmag,RA_deg,Dec_deg,SpType,Parallax_arcsec,Distance_ly,Constellation
    const nameRaw = cols[0] || "";
    const name = nameRaw.replace(/\s+/g, " ").trim();
    const vmag = parseFloat(cols[1]);
    const ra = parseFloat(cols[2]);
    const dec = parseFloat(cols[3]);
    const constellation = (cols[7] || "").replace(/\s+/g, " ").trim() || undefined;
    if (!Number.isFinite(ra) || !Number.isFinite(dec)) continue;
    const mag = Number.isFinite(vmag) ? vmag : 6;

    // NEW: precompute trig
    const raRad = toRad(ra);
    const decRad = toRad(dec);
    const sinDec = Math.sin(decRad);
    const cosDec = Math.cos(decRad);

    out.push({ name, raDeg: ra, decDeg: dec, mag, constellation, raRad, decRad, sinDec, cosDec });
  }
  return out;
}

// Cache-aware loaders
function loadStarsCatalog(): Promise<Star[]> {
  if (STARS_CACHE) return Promise.resolve(STARS_CACHE);
  if (!STARS_PROMISE) {
    const url = new URL("../../assets/stars-mag-9.csv", import.meta.url).toString();
    STARS_PROMISE = fetch(url)
      .then(r => r.text())
      .then(txt => (STARS_CACHE = parseCsv(txt)))
      .catch(() => (STARS_CACHE = []))
      .finally(() => { STARS_PROMISE = null; }) as unknown as Promise<Star[]>;
  }
  return STARS_PROMISE.then(() => STARS_CACHE || []);
}

function loadDebugStarsCatalog(): Promise<Star[]> {
  if (DEBUG_STARS_CACHE) return Promise.resolve(DEBUG_STARS_CACHE);
  if (!DEBUG_STARS_PROMISE) {
    const url = new URL("../../assets/stars-polaris-south-cross.csv", import.meta.url).toString();
    DEBUG_STARS_PROMISE = fetch(url)
      .then(r => r.text())
      .then(txt => (DEBUG_STARS_CACHE = parseCsv(txt)))
      .catch(() => (DEBUG_STARS_CACHE = []))
      .finally(() => { DEBUG_STARS_PROMISE = null; }) as unknown as Promise<Star[]>;
  }
  return DEBUG_STARS_PROMISE.then(() => DEBUG_STARS_CACHE || []);
}

function useStarsCatalog(): Star[] {
  const [stars, setStars] = React.useState<Star[]>(() => STARS_CACHE || []);
  React.useEffect(() => {
    let cancelled = false;
    if (STARS_CACHE) {
      setStars(STARS_CACHE);
      return;
    }
    loadStarsCatalog().then(arr => { if (!cancelled) setStars(arr); });
    return () => { cancelled = true; };
  }, []);
  return stars;
}

function useDebugStarsCatalog(): Star[] {
  const [stars, setStars] = React.useState<Star[]>(() => DEBUG_STARS_CACHE || []);
  React.useEffect(() => {
    let cancelled = false;
    if (DEBUG_STARS_CACHE) {
      setStars(DEBUG_STARS_CACHE);
      return;
    }
    loadDebugStarsCatalog().then(arr => { if (!cancelled) setStars(arr); });
    return () => { cancelled = true; };
  }, []);
  return stars;
}

// RA/Dec -> Alt/Az for given date/observer
function raDecToAltAz(raDeg: number, decDeg: number, latDeg: number, lngDeg: number, date: Date) {
  const LST = lstDeg(date, lngDeg); // deg
  // FIX: hour angle must be LST - RA (not RA - LST)
  let H = LST - raDeg;
  H = ((H + 180) % 360 + 360) % 360 - 180;
  const φ = toRad(latDeg);
  const δ = toRad(decDeg);
  const Hrad = toRad(H);

  const sinAlt = Math.sin(φ) * Math.sin(δ) + Math.cos(φ) * Math.cos(δ) * Math.cos(Hrad);
  const alt = Math.asin(clamp(sinAlt, -1, 1));

  const cosAlt = Math.cos(alt);
  const sinA = -Math.cos(δ) * Math.sin(Hrad) / Math.max(1e-9, cosAlt);
  const cosA = (Math.sin(δ) - Math.sin(alt) * Math.sin(φ)) / Math.max(1e-9, (cosAlt * Math.cos(φ)));
  // FIX: atan2(sinA, cosA) already yields azimuth from North (0=N, +90=E)
  const A = Math.atan2(sinA, cosA);
  const azFromNorth = norm360(toDeg(A));

  return { altDeg: toDeg(alt), azDeg: azFromNorth };
}

// NEW: Alt/Az <-> unit vector helpers (Az from North, +E; Alt up)
function altAzToVec(altDeg: number, azDeg: number) {
  const alt = toRad(altDeg);
  const az = toRad(azDeg);
  const cosAlt = Math.cos(alt);
  return {
    x: cosAlt * Math.sin(az), // East
    y: cosAlt * Math.cos(az), // North
    z: Math.sin(alt),         // Up
  };
}
function vecToAltAz(x: number, y: number, z: number) {
  const r = Math.hypot(x, y, z) || 1;
  const nx = x / r, ny = y / r, nz = z / r;
  const alt = Math.asin(clamp(nz, -1, 1));
  const az = Math.atan2(nx, ny);
  return { altDeg: toDeg(alt), azDeg: norm360(toDeg(az)) };
}

// NEW: fast Alt/Az using precomputed star trig and per-frame observer terms
function altAzFromPrecomputed(
  star: Star,
  sinPhi: number,
  cosPhi: number,
  lstRad: number
) {
  let H = lstRad - star.raRad; // hour angle
  if (H > Math.PI) H -= 2 * Math.PI;
  else if (H < -Math.PI) H += 2 * Math.PI;

  const cosH = Math.cos(H);
  const sinH = Math.sin(H);

  const sinAlt = sinPhi * star.sinDec + cosPhi * star.cosDec * cosH;
  const alt = Math.asin(clamp(sinAlt, -1, 1));
  const cosAlt = Math.max(1e-9, Math.cos(alt));

  const sinA = -star.cosDec * sinH / cosAlt;
  const cosA = (star.sinDec - Math.sin(alt) * sinPhi) / Math.max(1e-9, (cosAlt * cosPhi));
  const A = Math.atan2(sinA, cosA);
  const azDeg = norm360(toDeg(A));

  return { altRad: alt, azDeg };
}

// NEW: small azimuth difference helper [-180, 180]
function angleDiffDeg(a: number, b: number) {
  return ((a - b + 540) % 360) - 180;
}

function useExternalDebug(debugProp?: boolean) {
  const [extDebug, setExtDebug] = React.useState<boolean>(() => {
    try {
      const qs = new URLSearchParams(globalThis.location?.search ?? "");
      const qsDebug = qs.get("debug") === "1";
      const w = globalThis as any;
      return !!(qsDebug || w.__MT_DEBUG);
    } catch {
      return false;
    }
  });

  React.useEffect(() => {
    const handler = (e: Event) => {
      // Expect CustomEvent<boolean>
      const ce = e as CustomEvent;
      setExtDebug(!!ce.detail);
    };
    window.addEventListener("moontracker:debug", handler as EventListener);
    return () => window.removeEventListener("moontracker:debug", handler as EventListener);
  }, []);

  return !!(debugProp || extDebug);
}

export default function Stars({
  utcMs, latDeg, lngDeg,
  refAzDeg, refAltDeg,
  fovXDeg, fovYDeg,
  viewport,
  debug = false,
  enlargeObjects = true,
  showMarkers = false,
  onCruxCentroid,
  projectionMode = 'recti-panini',
  showRefraction = true, // NEW
}: Props) {
  const stars = useStarsCatalog();
  const debugStars = useDebugStarsCatalog();
  const date = React.useMemo(() => new Date(utcMs), [utcMs]);
  const debugOn = useExternalDebug(debug);

  // NEW: canvas ref and rAF throttling
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const rafRef = React.useRef<number | null>(null);

  // Rendering config
  const cfg = enlargeObjects ? STAR_RENDER_ENLARGED : STAR_RENDER_REALISTIC;

  // NEW: draw stars on a single canvas, throttled to rAF
  const scheduleDraw = React.useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Size & scale for DPR
      const w = Math.max(0, Math.floor(viewport.w));
      const h = Math.max(0, Math.floor(viewport.h));
      const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      if (!stars.length) return;

      // Per-frame observer terms
      const lstRad = toRad(lstDeg(date, lngDeg));
      const phi = toRad(latDeg);
      const sinPhi = Math.sin(phi);
      const cosPhi = Math.cos(phi);

      // Camera-space angular cull setup (use FOV diagonal + small margin)
      const cam = altAzToVec(refAltDeg, refAzDeg);
      const fovRadiusRad = toRad(0.5 * Math.hypot(fovXDeg, fovYDeg) + 2); // margin 2°

      // Subtle FOV-based scaling
      const fovScale = Math.pow(100 / clamp(fovXDeg, 10, 240), cfg.fovScaleExp);

      // Optional highlight check
      const specialList = debugOn ? debugStars : [];
      const isSpecial = (raDeg: number, decDeg: number) => {
        if (!specialList.length) return false;
        for (let i = 0; i < specialList.length; i++) {
          const ds = specialList[i];
          if (Math.abs(ds.raDeg - raDeg) < 0.1 && Math.abs(ds.decDeg - decDeg) < 0.1) return true;
        }
        return false;
      };

      // Draw loop without allocations
      ctx.lineWidth = 0;
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        if (s.mag > cfg.maxMag) continue;

        // Fast Alt/Az (géométriques)
        const eq = altAzFromPrecomputed(s, sinPhi, cosPhi, lstRad);
        const altTrueRad = eq.altRad;
        const azDeg = eq.azDeg;

        // Réfraction optionnelle
        const altTrueDeg = toDeg(altTrueRad);
        const altAppDeg = showRefraction ? refractAltitudeDeg(altTrueDeg) : altTrueDeg;
        const altForCullRad = toRad(altAppDeg);
        const altForProjDeg = altAppDeg;

        // Projection-aware angular culling in camera space (utiliser alt réfractée si ON)
        {
          const azRad = toRad(azDeg);
          const cosAlt = Math.cos(altForCullRad);
          const sx = cosAlt * Math.sin(azRad); // East
          const sy = cosAlt * Math.cos(azRad); // North
          const sz = Math.sin(altForCullRad);  // Up
          const dot = sx * cam.x + sy * cam.y + sz * cam.z;
          const ang = Math.acos(clamp(dot, -1, 1));
          if (ang > fovRadiusRad) continue;
        }

        // Project and final visibility check
        const p = projectToScreen(azDeg, altForProjDeg, refAzDeg, w, h, refAltDeg, 0, fovXDeg, fovYDeg, projectionMode);
        if (!(p.visibleX && p.visibleY)) continue;

        const highlighted = isSpecial(s.raDeg, s.decDeg);

        // Size/opacity
        let r = cfg.radiusBase - cfg.radiusSlope * s.mag;
        r = clamp(r, cfg.rMin, cfg.rMax) * fovScale;
        if (highlighted) r = Math.min(r * cfg.highlightScale, cfg.rMax * 1.4);
        const opacity = clamp(cfg.opacityBase - cfg.opacitySlope * s.mag, cfg.oMin, cfg.oMax);

        // Glow via shadow
        ctx.globalAlpha = opacity;
        if (highlighted) {
          ctx.fillStyle = "#ff4d4d";
          ctx.shadowColor = `rgba(255,77,77,${cfg.glowHighlight})`;
        } else {
          ctx.fillStyle = "#ffffff";
          ctx.shadowColor = `rgba(255,255,255,${cfg.glowNormal})`;
        }
        ctx.shadowBlur = Math.max(1, r);
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Reset some state
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    });
  }, [stars, debugStars, debugOn, viewport.w, viewport.h, date, lngDeg, latDeg, refAzDeg, refAltDeg, fovXDeg, fovYDeg, cfg, projectionMode, showRefraction]); // NEW dep

  // Schedule drawing on changes (time/device motion -> rAF throttled)
  React.useEffect(() => {
    scheduleDraw();
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [scheduleDraw]);

  // NEW: compute a cross marker using opposite stars of the Southern Cross
  const cruxCross = React.useMemo(() => {
    type P = { x: number; y: number; s: Star; altDeg: number; azDeg: number };
    const findByName = (substr: string) =>
      debugStars.find(s => (s.name || "").toLowerCase().includes(substr.toLowerCase()));

    const projectStar = (s?: Star): P | null => {
      if (!s) return null;
      const eq = raDecToAltAz(s.raDeg, s.decDeg, latDeg, lngDeg, date); // géométrique
      const altForProj = showRefraction ? refractAltitudeDeg(eq.altDeg) : eq.altDeg; // NEW
      const p = projectToScreen(eq.azDeg, altForProj, refAzDeg, viewport.w, viewport.h, refAltDeg, 0, fovXDeg, fovYDeg, projectionMode);
      if (!(p.visibleX && p.visibleY)) return null;
      return { x: p.x, y: p.y, s, altDeg: altForProj, azDeg: eq.azDeg }; // NEW: altDeg cohérent
    };

    // Named endpoints
    const pGacrux = projectStar(findByName("Gacrux"));
    const pAcrux  = projectStar(findByName("Acrux"));
    const pMimosa = projectStar(findByName("Mimosa"));
    const pImai   = projectStar(findByName("Imai"));

    let main: { x1: number; y1: number; x2: number; y2: number } | null = null;
    let cross: { x1: number; y1: number; x2: number; y2: number } | null = null;

    // Prefer canonical pairs if both endpoints are visible
    const used: P[] = [];
    if (pGacrux && pAcrux) {
      main = { x1: pGacrux.x, y1: pGacrux.y, x2: pAcrux.x, y2: pAcrux.y };
      used.push(pGacrux, pAcrux);
    }
    if (pMimosa && pImai) {
      cross = { x1: pMimosa.x, y1: pMimosa.y, x2: pImai.x, y2: pImai.y };
      used.push(pMimosa, pImai);
    }

    // Fallback: select 4 brightest Crux stars, then build opposite pairs
    if (!main || !cross) {
      const pool = debugStars
        .filter(s => (s.constellation === "Cru") || ((s.name || "").includes("Cru")))
        .slice()
        .sort((a, b) => (a.mag ?? 10) - (b.mag ?? 10))
        .slice(0, 6);

      const vis = pool
        .map(projectStar)
        .filter((p): p is P => !!p);

      if (vis.length >= 4) {
        const pts = vis.slice(0, 4);
        let best = { i: 0, j: 1, d2: -1 };
        for (let i = 0; i < pts.length; i++) {
          for (let j = i + 1; j < pts.length; j++) {
            const dx = pts[i].x - pts[j].x;
            const dy = pts[i].y - pts[j].y;
            const d2 = dx * dx + dy * dy;
            if (d2 > best.d2) best = { i, j, d2 };
          }
        }
        const iSet = new Set([best.i, best.j]);
        const remIdx = [0, 1, 2, 3].filter(k => !iSet.has(k));
        main = { x1: pts[best.i].x, y1: pts[best.i].y, x2: pts[best.j].x, y2: pts[best.j].y };
        cross = { x1: pts[remIdx[0]].x, y1: pts[remIdx[0]].y, x2: pts[remIdx[1]].x, y2: pts[remIdx[1]].y };
        used.length = 0;
        used.push(pts[best.i], pts[best.j], pts[remIdx[0]], pts[remIdx[1]]);
      }
    }

    if (!main && !cross) return null;

    // Screen centroid for label
    const arr = [
      ...(main ? [{ x: main.x1, y: main.y1 }, { x: main.x2, y: main.y2 }] : []),
      ...(cross ? [{ x: cross.x1, y: cross.y1 }, { x: cross.x2, y: cross.y2 }] : []),
    ];
    const cx = arr.reduce((a, p) => a + p.x, 0) / arr.length;
    const cy = arr.reduce((a, p) => a + p.y, 0) / arr.length;

    // Angular centroid via unit-vector averaging
    if (used.length === 0) return { main, cross, cx, cy, centroidAltDeg: NaN, centroidAzDeg: NaN };
    let sx = 0, sy = 0, sz = 0;
    for (const u of used) {
      const v = altAzToVec(u.altDeg, u.azDeg);
      sx += v.x; sy += v.y; sz += v.z;
    }
    const { altDeg: centroidAltDeg, azDeg: centroidAzDeg } = vecToAltAz(sx, sy, sz);

    return { main, cross, cx, cy, centroidAltDeg, centroidAzDeg };
  }, [debugStars, latDeg, lngDeg, date, refAzDeg, refAltDeg, viewport, fovXDeg, fovYDeg, projectionMode, showRefraction]); // NEW dep

  // Notify App of the centroid Alt/Az (or null when unavailable) with change gating
  const centroidAlt = cruxCross?.centroidAltDeg;
  const centroidAz = cruxCross?.centroidAzDeg;
  const prevCentroidRef = React.useRef<{ alt: number; az: number } | null>(null);

  React.useEffect(() => {
    if (!onCruxCentroid) return;
    if (!showMarkers) return; // skip when markers are hidden

    const EPS = 0.05; // deg threshold
    const wrapDeg = (d: number) => ((d + 180) % 360) - 180;

    if (Number.isFinite(centroidAlt as number) && Number.isFinite(centroidAz as number)) {
      const alt = centroidAlt as number;
      const az = centroidAz as number;
      const prev = prevCentroidRef.current;
      const changed =
        !prev ||
        Math.abs(prev.alt - alt) > EPS ||
        Math.abs(wrapDeg(prev.az - az)) > EPS;

      if (changed) {
        prevCentroidRef.current = { alt, az };
        onCruxCentroid({ altDeg: alt, azDeg: az });
      }
    } else {
      if (prevCentroidRef.current !== null) {
        prevCentroidRef.current = null;
        onCruxCentroid(null);
      }
    }
  }, [centroidAlt, centroidAz, onCruxCentroid, showMarkers]);

  const fmt = (v?: number, frac = 2) => (typeof v === "number" ? v.toFixed(frac) : "");

  // Measure an anchor placed at the viewport top-left (inside Stars wrapper)
  const anchorRef = React.useRef<HTMLDivElement | null>(null);
  const [anchorPos, setAnchorPos] = React.useState<{ left: number; top: number }>({ left: 0, top: 0 });
  React.useLayoutEffect(() => {
    const upd = () => {
      const r = anchorRef.current?.getBoundingClientRect();
      if (r) setAnchorPos({ left: r.left, top: r.top });
    };
    upd();
    window.addEventListener("resize", upd);
    window.addEventListener("scroll", upd, { passive: true });
    return () => {
      window.removeEventListener("resize", upd);
      window.removeEventListener("scroll", upd as any);
    };
  }, [viewport.x, viewport.y, viewport.w, viewport.h]);

  return (
    <>
      {/* Invisible anchor at the viewport origin (used to align the portal in page coords) */}
      <div ref={anchorRef} style={{ position: "absolute", left: viewport.x, top: viewport.y, width: 0, height: 0, pointerEvents: "none" }} />

      {/* NEW: single canvas for stars */}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          left: viewport.x,
          top: viewport.y,
          width: viewport.w,
          height: viewport.h,
          pointerEvents: "none",
          zIndex: Z.horizon - 1, // ensure stars are below SVG marker but above background
        }}
      />

      {/* Keep Southern Cross marker as SVG portal */}
      {/* Crux overlay now rendered directly in subtree */}
      {showMarkers && cruxCross && (
        <div
          style={{
            position: "absolute",
            left: viewport.x,
            top: viewport.y,
            width: viewport.w,
            height: viewport.h,
            pointerEvents: "none",
            zIndex: Z.horizon,
          }}
        >
          <svg width={viewport.w} height={viewport.h}>
            {cruxCross.main && (
              <line
                x1={cruxCross.main.x1} y1={cruxCross.main.y1}
                x2={cruxCross.main.x2} y2={cruxCross.main.y2}
                stroke="#a78bfa" strokeWidth="1.8"
              />
            )}
            {cruxCross.cross && (
              <line
                x1={cruxCross.cross.x1} y1={cruxCross.cross.y1}
                x2={cruxCross.cross.x2} y2={cruxCross.cross.y2}
                stroke="#a78bfa" strokeWidth="1.8"
              />
            )}
            <text
              x={cruxCross.cx + 6}
              y={cruxCross.cy - 10}
              fill="#a78bfa"
              fontSize="11"
              style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}
            >
              Croix du Sud
            </text>
          </svg>
        </div>
      )}
    </>
  );
}
