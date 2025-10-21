import React, { useEffect, useMemo, useRef } from "react";
import { altAzFromRaDec } from "../../astro/stars";
import { projectToScreen } from "../../render/projection";
import { toRad, toDeg, norm360 } from "../../utils/math";

type ProjectionMode = 'recti-panini' | 'stereo-centered' | 'ortho' | 'cylindrical';

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
  color?: string;     // couleur du tracé
  opacity?: number;   // 0..1
  lineWidth?: number; // en px (CSS)
  dotPx?: number;     // longueur du "point" (dash) en px
  gapPx?: number;     // espace entre points en px

  // Échantillonnage
  stepDeg?: number;   // pas en degrés le long de l’écliptique
}

function raDecFromEcliptic(lambdaDeg: number) {
  // Obliquité moyenne (assez précise pour un tracé)
  const eps = toRad(23.439291111);
  const lam = toRad(lambdaDeg);
  const sinLam = Math.sin(lam);
  const cosLam = Math.cos(lam);

  // β = 0 -> formules simplifiées
  const alpha = Math.atan2(sinLam * Math.cos(eps), cosLam);      // RA (rad)
  const delta = Math.asin(Math.sin(eps) * sinLam);                // Dec (rad)

  const raDeg = norm360(toDeg(alpha));
  const decDeg = toDeg(delta);
  return { raDeg, decDeg };
}

export default function Ecliptique(props: EcliptiqueProps) {
  const {
    date, latDeg, lngDeg,
    viewport, refAzDeg, refAltDeg, fovXDeg, fovYDeg, projectionMode,
    color = "#fde68a",       // jaune pâle
    opacity = 0.9,
    lineWidth = 2,
    dotPx = 1.2,             // créer un effet "pointillé" (petite pastille)
    gapPx = 7,
    stepDeg = 2,
  } = props;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const points = useMemo(() => {
    const arr: { x: number; y: number; visibleX?: boolean; visibleY?: boolean; ok: boolean }[] = [];
    for (let lam = 0; lam <= 360; lam += stepDeg) {
      const { raDeg, decDeg } = raDecFromEcliptic(lam);
      const h = altAzFromRaDec(date, latDeg, lngDeg, raDeg, decDeg);
      const pr = projectToScreen(
        h.azDeg, h.altDeg,
        refAzDeg,
        viewport.w, viewport.h,
        refAltDeg,
        0,
        fovXDeg, fovYDeg,
        projectionMode
      );
      const ok = Number.isFinite(pr.x) && Number.isFinite(pr.y);
      arr.push({ x: pr.x, y: pr.y, visibleX: pr.visibleX, visibleY: pr.visibleY, ok });
    }
    return arr;
  }, [date, latDeg, lngDeg, refAzDeg, refAltDeg, viewport.w, viewport.h, fovXDeg, fovYDeg, projectionMode, stepDeg]);

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