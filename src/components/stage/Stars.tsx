import React from "react";
import { lstDeg } from "../../astro/time";
import { projectToScreen } from "../../render/projection";

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
  // NEW: control “enlarged” look vs “realistic”
  enlargeObjects?: boolean;
  // NEW: toggle constellation markers
  showMarkers?: boolean;
  // NEW: centroid callback (Alt/Az) for the Southern Cross (null when unavailable)
  onCruxCentroid?: (pos: { altDeg: number; azDeg: number } | null) => void;
};

type Star = {
  name: string;
  raDeg: number;
  decDeg: number;
  mag: number;
  constellation?: string;
};

function norm360(v: number) { return ((v % 360) + 360) % 360; }
function clamp(v: number, a: number, b: number) { return Math.max(a, Math.min(b, v)); }
function toRad(d: number) { return (d * Math.PI) / 180; }
function toDeg(r: number) { return (r * 180) / Math.PI; }

// Static: maximum visual magnitude to render (lower = brighter). Increase to show more dim stars.
const STAR_MAX_MAG = 4.5;

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
  radiusBase: 4.2,
  radiusSlope: 0.7,
  rMin: 0.8,
  rMax: 4.2,
  opacityBase: 1.4,
  opacitySlope: 0.18,
  oMin: 0.25,
  oMax: 1.0,
  highlightScale: 1.35,
  glowNormal: 0.35,
  glowHighlight: 0.45,
  fovScaleExp: 0.0, // keep appearance stable in enlarged mode
};

// Tuned for enlargeObjects=false (more “realistic”, smaller/softer)
const STAR_RENDER_REALISTIC: StarRenderConfig = {
  maxMag: STAR_MAX_MAG,       // allow a few more faint stars but keep it reasonable
  radiusBase: 1.8,   // much smaller base size
  radiusSlope: 0.35, // gentler slope so bright stars still stand out
  rMin: 0.35,
  rMax: 2.2,
  opacityBase: 1.4,
  opacitySlope: 0.18,
  oMin: 0.20,
  oMax: 0.90,
  highlightScale: 1.15,
  glowNormal: 0.20,
  glowHighlight: 0.30,
  fovScaleExp: 0.25, // slight compensation at very wide/narrow FOVs
};

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
    out.push({ name, raDeg: ra, decDeg: dec, mag, constellation });
  }
  return out;
}

function useStarsCatalog(): Star[] {
  const [stars, setStars] = React.useState<Star[]>([]);
  React.useEffect(() => {
    let cancelled = false;
    const url = new URL("../../assets/stars-mag-5.csv", import.meta.url).toString();
    fetch(url)
      .then(r => r.text())
      .then(txt => {
        if (cancelled) return;
        setStars(parseCsv(txt));
      })
      .catch(() => { /* ignore */ });
    return () => { cancelled = true; };
  }, []);
  return stars;
}

// New: load special stars (Polaris + Southern Cross) for debug highlighting
function useDebugStarsCatalog(): Star[] {
  const [stars, setStars] = React.useState<Star[]>([]);
  React.useEffect(() => {
    let cancelled = false;
    const url = new URL("../../assets/stars-polaris-south-cross.csv", import.meta.url).toString();
    fetch(url)
      .then(r => r.text())
      .then(txt => { if (!cancelled) setStars(parseCsv(txt)); })
      .catch(() => { /* ignore */ });
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
}: Props) {
  const stars = useStarsCatalog();
  const debugStars = useDebugStarsCatalog();
  const date = React.useMemo(() => new Date(utcMs), [utcMs]);
  const debugOn = useExternalDebug(debug);

  // NEW: select rendering config
  const cfg = enlargeObjects ? STAR_RENDER_ENLARGED : STAR_RENDER_REALISTIC;

  const dots = React.useMemo(() => {
    const res: {
      x: number; y: number; r: number; opacity: number; visible: boolean; color: string; glowAlpha: number;
      name?: string; raDeg?: number; decDeg?: number; mag?: number; constellation?: string;
    }[] = [];

    // Helper: match special stars by RA/Dec proximity (deg)
    const isSpecialByEq = (ra: number, dec: number) =>
      debugOn && debugStars.some(ds =>
        Math.abs(ds.raDeg - ra) < 0.1 && Math.abs(ds.decDeg - dec) < 0.1
      );

    // Slight FOV-based micro-scaling (kept subtle)
    const fovScale = Math.pow(100 / clamp(fovXDeg, 10, 240), cfg.fovScaleExp);

    for (const s of stars) {
      // Filter out stars dimmer than the chosen threshold
      if (s.mag > cfg.maxMag) continue;

      const eq = raDecToAltAz(s.raDeg, s.decDeg, latDeg, lngDeg, date);
      const p = projectToScreen(eq.azDeg, eq.altDeg, refAzDeg, viewport.w, viewport.h, refAltDeg, 0, fovXDeg, fovYDeg);
      if (!(p.visibleX && p.visibleY)) continue;

      const highlighted = isSpecialByEq(s.raDeg, s.decDeg);

      // NEW: radius/opacity from preset + tiny FOV adaptation
      let r = cfg.radiusBase - cfg.radiusSlope * s.mag;
      r = clamp(r, cfg.rMin, cfg.rMax);
      r *= fovScale;
      if (highlighted) r = Math.min(r * cfg.highlightScale, cfg.rMax * 1.4);

      const opacity = clamp(cfg.opacityBase - cfg.opacitySlope * s.mag, cfg.oMin, cfg.oMax);

      res.push({
        x: viewport.x + p.x,
        y: viewport.y + p.y,
        r, opacity, visible: true,
        color: highlighted ? "#ff4d4d" : "white",
        glowAlpha: highlighted ? cfg.glowHighlight : cfg.glowNormal,
        name: s.name || undefined,
        raDeg: s.raDeg,
        decDeg: s.decDeg,
        mag: s.mag,
        constellation: s.constellation,
      });
    }

    // In debug, also render any special stars missing from the main list
    if (debugOn) {
      for (const s of debugStars) {
        // Skip if something already rendered at similar RA/Dec
        const already = res.some(d =>
          typeof d.raDeg === "number" && typeof d.decDeg === "number" &&
          Math.abs((d.raDeg as number) - s.raDeg) < 0.1 &&
          Math.abs((d.decDeg as number) - s.decDeg) < 0.1
        );
        if (already) continue;

        const eq = raDecToAltAz(s.raDeg, s.decDeg, latDeg, lngDeg, date);
        const p = projectToScreen(eq.azDeg, eq.altDeg, refAzDeg, viewport.w, viewport.h, refAltDeg, 0, fovXDeg, fovYDeg);
        if (!(p.visibleX && p.visibleY)) continue;

        // Use preset defaults when mag is missing
        const mag = Number.isFinite(s.mag as number) ? (s.mag as number) : 2.5;

        let r = cfg.radiusBase - cfg.radiusSlope * mag;
        r = clamp(r, cfg.rMin, cfg.rMax);
        r *= fovScale;
        r = Math.min(r * cfg.highlightScale, cfg.rMax * 1.4);

        const opacity = clamp(cfg.opacityBase - cfg.opacitySlope * mag, cfg.oMin, cfg.oMax);

        res.push({
          x: viewport.x + p.x,
          y: viewport.y + p.y,
          r, opacity, visible: true,
          color: "#ff4d4d",
          glowAlpha: cfg.glowHighlight,
          name: s.name || undefined,
          raDeg: s.raDeg,
          decDeg: s.decDeg,
          mag: s.mag,
          constellation: s.constellation,
        });
      }
    }

    return res;
  }, [stars, debugStars, debugOn, latDeg, lngDeg, date, refAzDeg, refAltDeg, fovXDeg, fovYDeg, viewport, enlargeObjects, cfg]);

  // NEW: compute a cross marker using opposite stars of the Southern Cross
  const cruxCross = React.useMemo(() => {
    type P = { x: number; y: number; s: Star; altDeg: number; azDeg: number };
    const findByName = (substr: string) =>
      debugStars.find(s => (s.name || "").toLowerCase().includes(substr.toLowerCase()));

    const projectStar = (s?: Star): P | null => {
      if (!s) return null;
      const eq = raDecToAltAz(s.raDeg, s.decDeg, latDeg, lngDeg, date);
      const p = projectToScreen(eq.azDeg, eq.altDeg, refAzDeg, viewport.w, viewport.h, refAltDeg, 0, fovXDeg, fovYDeg);
      if (!(p.visibleX && p.visibleY)) return null;
      return { x: p.x, y: p.y, s, altDeg: eq.altDeg, azDeg: eq.azDeg };
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
  }, [debugStars, latDeg, lngDeg, date, refAzDeg, refAltDeg, viewport, fovXDeg, fovYDeg]);

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

  return (
    <>
      {dots.map((d, i) => (
        <React.Fragment key={i}>
          <div
            style={{
              position: "absolute",
              left: d.x,
              top: d.y,
              width: d.r * 2,
              height: d.r * 2,
              marginLeft: -d.r,
              marginTop: -d.r,
              borderRadius: "9999px",
              background: d.color,
              opacity: d.opacity,
              boxShadow: d.color === "#ff4d4d"
                ? `0 0 ${Math.max(2, d.r * 2)}px ${Math.max(1, d.r)}px rgba(255,77,77,${d.glowAlpha})`
                : `0 0 ${Math.max(2, d.r * 2)}px ${Math.max(1, d.r)}px rgba(255,255,255,${d.glowAlpha})`,
              pointerEvents: "none",
            }}
          />
          {debugOn && d.name && (typeof d.mag === "number" && d.mag <= 2.02) && (
            <div
              style={{
                position: "absolute",
                left: d.x + 6,
                top: d.y - 10,
                color: "#9ee2ff",
                fontSize: 11,
                fontFamily: "system-ui, sans-serif",
                textShadow: "0 1px 2px rgba(0,0,0,0.8)",
                pointerEvents: "none",
                whiteSpace: "nowrap",
                userSelect: "none",
                zIndex: 3,
              }}
              data-star-label
              title={d.name}
            >
              {d.name}
              {d.constellation ? ` · ${d.constellation}` : ""}
              {` · RA ${fmt(d.raDeg, 2)}° · Dec ${fmt(d.decDeg, 2)}° · mag ${fmt(d.mag, 2)}`}
            </div>
          )}
        </React.Fragment>
      ))}

      {/* NEW: Southern Cross marker as two opposite lines */}
      {showMarkers && cruxCross && (
        <div
          style={{
            position: "absolute",
            left: viewport.x,
            top: viewport.y,
            width: viewport.w,
            height: viewport.h,
            pointerEvents: "none",
            zIndex: 3,
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
