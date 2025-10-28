import { useEffect, useMemo, useRef } from "react";
import { altAzFromRaDec } from "../../astro/stars";
import { projectToScreen } from "../../render/projection";
import { toRad, toDeg, norm360 } from "../../utils/math";
import { refractAltitudeDeg } from "../../utils/refraction"; // ADD

import type { ProjectionMode } from "../../render/projection";


export interface EcliptiqueProps {
  // Temps & observateur
  date: Date;
  latDeg: number;
  lngDeg: number;

  // Viewport & projection
  viewport: { x: number; y: number; w: number; h: number };
  refAzDeg: number;
  refAltDeg: number;
  fovXDeg: number;
  fovYDeg: number;
  projectionMode: ProjectionMode;

  // Style
  color?: string;
  opacity?: number;
  lineWidth?: number;
  dotPx?: number;
  gapPx?: number;

  // Échantillonnage
  stepDeg?: number;

  // NEW: appliquer la réfraction à la courbe de l'écliptique
  applyRefraction?: boolean;

  // NEW: horizon vs ecliptic alignment
  lockHorizon?: boolean;

  // NEW: optional ecliptic "up" direction (when lockHorizon=false)
  eclipticUpAzDeg?: number;
  eclipticUpAltDeg?: number;
}

function julianDay(date: Date) {
  return date.getTime() / 86400000 + 2440587.5;
}
function centuriesSinceJ2000(date: Date) {
  return (julianDay(date) - 2451545.0) / 36525;
}
function meanObliquityRad(date: Date) {
  const T = centuriesSinceJ2000(date);
  // IAU 2006, en arcsec
  const epsArcsec =
    84381.406 -
    46.836769 * T -
    0.0001831 * T * T +
    0.00200340 * T * T * T -
    0.000000576 * T * T * T * T -
    0.0000000434 * T * T * T * T * T;
  return toRad(epsArcsec / 3600);
}

function raDecFromEcliptic(date: Date, lambdaDeg: number) {
  const eps = meanObliquityRad(date); // obliquité moyenne de date
  const lam = toRad(lambdaDeg);
  const sinLam = Math.sin(lam);
  const cosLam = Math.cos(lam);

  // β = 0
  const alpha = Math.atan2(sinLam * Math.cos(eps), cosLam);
  const delta = Math.asin(Math.sin(eps) * sinLam);

  const raDeg = norm360(toDeg(alpha));
  const decDeg = toDeg(delta);
  return { raDeg, decDeg };
}

export default function Ecliptique(props: EcliptiqueProps) {
  const {
    date, latDeg, lngDeg,
    viewport, refAzDeg, refAltDeg, fovXDeg, fovYDeg, projectionMode,
    color = "#fde68a",
    opacity = 0.9,
    lineWidth = 2,
    dotPx = 1.2,
    gapPx = 7,
    stepDeg = 2,
    applyRefraction = true, // NEW: par défaut apparent
    // NEW
    lockHorizon = true,
    eclipticUpAzDeg,
    eclipticUpAltDeg,
  } = props;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // NEW: Ecliptic North direction (use provided values or compute fallback)
  const eclipticNorthAltAz = useMemo(() => {
    if (Number.isFinite(eclipticUpAzDeg) && Number.isFinite(eclipticUpAltDeg)) {
      return { azDeg: eclipticUpAzDeg as number, altDeg: eclipticUpAltDeg as number };
    }
    // RA=270°, Dec≈66.5607° => Ecliptic North
    return altAzFromRaDec(date, latDeg, lngDeg, 270, 66.5607);
  }, [eclipticUpAzDeg, eclipticUpAltDeg, date, latDeg, lngDeg]);

  const points = useMemo(() => {
    const arr: { x: number; y: number; visibleX?: boolean; visibleY?: boolean; ok: boolean }[] = [];
    for (let lam = 0; lam <= 360; lam += stepDeg) {
      const { raDeg, decDeg } = raDecFromEcliptic(date, lam);
      const h = altAzFromRaDec(date, latDeg, lngDeg, raDeg, decDeg);

      const altForProj = applyRefraction ? refractAltitudeDeg(h.altDeg) : h.altDeg; // NEW

      const pr = projectToScreen(
        h.azDeg, altForProj,
        refAzDeg,
        viewport.w, viewport.h,
        refAltDeg,
        0,
        fovXDeg, fovYDeg,
        projectionMode,
        lockHorizon,
        eclipticNorthAltAz.azDeg, eclipticNorthAltAz.altDeg
      );
      const ok = Number.isFinite(pr.x) && Number.isFinite(pr.y);
      arr.push({ x: pr.x, y: pr.y, visibleX: pr.visibleX, visibleY: pr.visibleY, ok });
    }
    return arr;
  }, [
    date, latDeg, lngDeg, refAzDeg, refAltDeg,
    viewport.w, viewport.h, fovXDeg, fovYDeg, projectionMode,
    stepDeg, applyRefraction, 
    lockHorizon, eclipticNorthAltAz.azDeg, eclipticNorthAltAz.altDeg 
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const cssW = Math.max(1, Math.round(viewport.w));
    const cssH = Math.max(1, Math.round(viewport.h));

    if (canvas.width !== cssW * dpr || canvas.height !== cssH * dpr) {
      canvas.width = cssW * dpr;
      canvas.height = cssH * dpr;
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    ctx.globalAlpha = opacity;
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    // Dash très court + cap arrondi => rendu "pointillé"
    ctx.setLineDash([dotPx, gapPx]);

    const tooBigJump = (dx: number, dy: number) =>
      Math.abs(dx) > cssW * 0.45 || Math.abs(dy) > cssH * 0.45;

    let drawing = false;
    ctx.beginPath();

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const prev = i > 0 ? points[i - 1] : undefined;

      const visible =
        projectionMode === "ortho"
          ? !!(p.visibleX && p.visibleY && p.ok)
          : p.ok;

      const canConnect =
        !!prev &&
        (projectionMode === "ortho"
          ? !!(prev.visibleX && prev.visibleY && prev.ok && visible)
          : !!(prev.ok && visible)) &&
        !tooBigJump(p.x - prev.x, p.y - prev.y);

      if (!drawing) {
        if (visible) {
          ctx.moveTo(p.x, p.y);
          drawing = true;
        }
        continue;
      }

      if (canConnect) {
        ctx.lineTo(p.x, p.y);
      } else {
        // Terminer le segment courant et redémarrer si possible
        ctx.stroke();
        ctx.beginPath();
        drawing = false;
        if (visible) {
          ctx.moveTo(p.x, p.y);
          drawing = true;
        }
      }
    }

    if (drawing) ctx.stroke();
  }, [points, viewport.w, viewport.h, projectionMode, color, opacity, lineWidth, dotPx, gapPx]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute"
      style={{
        left: 0,
        top: 0,
        width: viewport.w,
        height: viewport.h,
        pointerEvents: "none",
      }}
      aria-hidden="true"
    />
  );
}