import React, { useMemo, useState, useEffect, useCallback, forwardRef } from "react";
import { useTranslation } from 'react-i18next';



// Astro core
import { getPlanetsEphemerides, type PlanetId } from "../../astro/planets";
import { altAzFromRaDec } from "../../astro/stars";

// Math/projection utils
import {  clamp } from "../../utils/math";
import { projectToScreen } from "../../render/projection";
import type { ProjectionMode } from "../../render/projection";

// Render constants & registry
import { Z } from "../../render/constants";
import { getPlanetRegistry } from "../../render/PlanetRegistry";
// NEW: imports to format HUD values
import { formatDeg } from "../../utils/format";
import { compass16 } from "../../utils/compass";

// Stage layers
import HorizonOverlay from "../stage/HorizonOverlay";
import CardinalMarkers, { type BodyItem } from "../stage/CardinalMarkers";
import Grid from "../stage/grid";
import Athmosphere from "../stage/Athmosphere";
import Stars from "../stage/Stars";
import SunSprite from "../stage/SunSprite";
import MoonSprite from "../stage/MoonSprite";
import Moon3D from "../stage/Moon3D";
import PlanetSprite from "../stage/PlanetSprite";
import Planet3D from "../stage/Planet3D";
import Markers from "../stage/Markers";
import Ground from "../stage/Ground"; 
import Ecliptique from "../stage/Ecliptique";
import { usePlanetsRender } from "./hooks/usePlanetsRender";
import { useSunMoonModel } from "./hooks/useSunMoonModel";
import { earthShadowAtMoon } from "../../astro/aeInterop";
import { RMOON_KM } from "../../astro/moon";
  
// Local marker colors
const POLARIS_COLOR = "#86efac";
const POLARIS_RA_DEG = 37.952917;
const POLARIS_DEC_DEG = 89.264167;
const CRUX_COLOR = "#a78bfa";
const CRUX_CENTROID_RA_DEG = 187.539271;
const CRUX_CENTROID_DEC_DEG = -59.6625;

// FIXED retain frames for long pose compositor
const LONGPOSE_RETAIN_FRAMES = 400;

export interface SpaceViewProps {
  // Time & observer
  date: Date;
  utcMs: number;
  latDeg: number;
  lngDeg: number;

  // Viewport & projection
  viewport: { x: number; y: number; w: number; h: number };
  refAzDeg: number;
  refAltDeg: number;
  fovXDeg: number;
  fovYDeg: number;
  projectionMode: ProjectionMode;

  // Toggles
  showEarth: boolean;
  showGrid: boolean;
  showAtmosphere: boolean;
  showStars: boolean;
  showMarkers: boolean;

  showHorizon: boolean;
  lockHorizon: boolean;

  showSun: boolean;
  showMoon: boolean;
  showPhase: boolean;
  earthshine: boolean;
  showSunCard: boolean;
  showEcliptique: boolean;
  showMoonCard: boolean;
  debugMask: boolean;
  enlargeObjects: boolean;

  // 3D model loading (downgrade to sprites while loading)
  glbLoading: boolean;

  // Planets toggles map (id -> visible)
  showPlanets: Record<string, boolean>;

  // Orientation offsets / camera
  rotOffsetDegX: number;
  rotOffsetDegY: number;
  rotOffsetDegZ: number;
  camRotDegX: number;
  camRotDegY: number;
  camRotDegZ: number;

  // notify App when scene is ready to play
  onSceneReadyChange?: (ready: boolean) => void;

  // Show the extra HUD (shown when App panels are hidden)
  showHud?: boolean;

  // camera/zoom label to display
  cameraLabel?: string;
  overlayInfoString?: string;

  longPoseEnabled?: boolean;
  onLongPoseAccumulated?: () => void;
  longPoseClearSeq?: number;
  timeLapseEnabled?: boolean;
  onLongPoseClear?: () => void;

  showRefraction?: boolean;
  presentKey?: number;
  onFramePresented?: () => void;

  // Mobile/Landscape props pour contrôler l'affichage HUD
  isMobile?: boolean;
  isLandscape?: boolean;
}

export default forwardRef<HTMLDivElement, SpaceViewProps>(function SpaceView(props: SpaceViewProps, ref) {
  const { t: tUi } = useTranslation('ui');
  const { t } = useTranslation('common');
  
  // Dynamic planet registry that updates with language changes
  const PLANET_REGISTRY = getPlanetRegistry();
  
  const {
    date, utcMs, latDeg, lngDeg,
    viewport, refAzDeg, refAltDeg, fovXDeg, fovYDeg, projectionMode,
    showEarth, showGrid, showAtmosphere, showStars, showMarkers,
    showSun, showMoon, showPhase, earthshine, showSunCard, showMoonCard, showEcliptique, debugMask, enlargeObjects,
    glbLoading,
    showPlanets,
    rotOffsetDegX, rotOffsetDegY, rotOffsetDegZ,
    camRotDegX, camRotDegY, camRotDegZ,
    onSceneReadyChange,
    // NEW
    showHud,
    cameraLabel,
    overlayInfoString,
    showHorizon,
    lockHorizon,
    longPoseEnabled = false,
    onLongPoseAccumulated, 
    longPoseClearSeq = 0,
    timeLapseEnabled = false,
    showRefraction = true,
    presentKey,
    onFramePresented,
    // Mobile/Landscape props
    isMobile = false,
    isLandscape = false,
  } = props;

  React.useEffect(() => {
    let cancelled = false;
    // Wait two RAFs to ensure canvases/DOM are presented
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!cancelled) onFramePresented?.();
      });
    });
    return () => { cancelled = true; };
  }, [presentKey, onFramePresented]);

  // Capture root for querying child canvases
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const setRootRef = React.useCallback((node: HTMLDivElement | null) => {
    rootRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref && 'current' in (ref as any)) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
  }, [ref]);
  // Long pose overlay canvas
  const lpCanvasRef = React.useRef<HTMLCanvasElement | null>(null);

  // Split "Place, Date..." into two lines
  const overlaySplit = useMemo(() => {
    const s = overlayInfoString ?? '';
    const i = s.indexOf(',');
    if (i >= 0) {
      return { place: s.slice(0, i).trim(), date: s.slice(i + 1).trim() };
    }
    return { place: s, date: '' };
  }, [overlayInfoString]);

  const domainFromBrowser = useMemo(() => {
    if (typeof window === 'undefined' || !window?.location) return 'SpaceView';
    const hn = window.location.hostname || '';
    return hn.replace(/^www\./, '') || 'SpaceView';
  }, []);

  // Sun/Moon model (astro, projections, sizes, rotations, phase/mask)
  const {
    astro,
    eclipticNorthAltAz,
    sunAltForProj,
    sunScreen,
    moonScreen,
    bodySizes,
    rotationDegSunScreen,
    rotationDegMoonScreen,
    phaseFraction,
    brightLimbAngleDeg,
    maskAngleDeg,
    moonRenderModeEffective,
  } = useSunMoonModel({
    date, latDeg, lngDeg,
    viewport, refAzDeg, refAltDeg, fovXDeg, fovYDeg, projectionMode,
    lockHorizon,
    showRefraction,
    enlargeObjects,
    glbLoading,
  });

  // Physique de l’éclipse (géocentrique)
  const eclipsePhys = useMemo(() => {
    const g = earthShadowAtMoon(date);
    const umbraRel     = g.umbraRadiusKm    / RMOON_KM;            // en rayons lunaires
    const penumbraRel  = g.penumbraRadiusKm / RMOON_KM;
    const offsetRel    = g.axisOffsetKm     / RMOON_KM;

    // Intensité: 1 en ombre, décroît linéairement jusqu'au bord de la pénombre, 0 au-delà
    let strength = 0;
    if (offsetRel <= umbraRel) {
      strength = 1;
    } else if (offsetRel < penumbraRel) {
      strength = (penumbraRel - offsetRel) / Math.max(1e-6, penumbraRel - umbraRel);
    } else {
      strength = 0;
    }
    strength = Math.max(0, Math.min(1, strength));

    // Rougeoiement: proportionnel à la profondeur dans l’ombre
    const deep = Math.max(0, Math.min(1, (umbraRel - offsetRel) / Math.max(umbraRel, 1e-6)));
    const red = Math.max(0, Math.min(1, 0.25 + 0.9 * Math.pow(deep, 0.7)));

    return {
      umbraRel: Math.max(0, umbraRel),
      penumbraRel: Math.max(umbraRel, penumbraRel),
      strength,
      redGlow: red,
      offsetRel,
      axisPADeg: g.axisPADeg, // NEW: PA (Est depuis Nord) au centre lunaire
    };
  }, [date]);

  // NEW: remember if Moon has ever completed its first 3D render (persist for session)
  const [everReadyMoon, setEverReadyMoon] = useState<boolean>(false);

  // Apparent Moon 3D readiness gate
  const [moon3DReady, setMoon3DReady] = useState<boolean>(true);
  const needMoon3D = useMemo(
    () => !!(showMoon && !glbLoading && moonRenderModeEffective === '3d' && moonScreen.visibleX && moonScreen.visibleY),
    [showMoon, glbLoading, moonRenderModeEffective, moonScreen.visibleX, moonScreen.visibleY]
  );
  useEffect(() => { setMoon3DReady(!needMoon3D); }, [needMoon3D]);

  // Planets ephemerides (for selected ids)
  const selectedPlanetIds = useMemo(
    () => Object.entries(showPlanets).filter(([, v]) => v).map(([id]) => id) as PlanetId[],
    [showPlanets]
  );

  const planetsEphemArr = useMemo(() => {
    if (!selectedPlanetIds.length) return [];
    try {
      const res = getPlanetsEphemerides(date, latDeg, lngDeg, 0, undefined, selectedPlanetIds as any);
      const arr = Array.isArray(res) ? res : (res && typeof res === 'object' ? Object.values(res as any) : []);
      return arr.filter((p: any) => selectedPlanetIds.includes(p?.id));
    } catch {
      return [];
    }
  }, [selectedPlanetIds, date, latDeg, lngDeg]);

  // Per-planet render bundle
  const { planetsRender, planetsReady, markPlanetReady } = usePlanetsRender({
    planetsEphemArr,
    showPlanets,
    refAzDeg,
    refAltDeg,
    viewport,
    fovXDeg,
    fovYDeg,
    projectionMode,
    enlargeObjects,
    astroSun: { alt: astro.sun.alt, az: astro.sun.az, distAU: astro.sun.distAU },
    sunAltForProj,
    showRefraction,
    sunScreen: { x: sunScreen.x, y: sunScreen.y },
    date,
    latDeg,
    lngDeg,
    lockHorizon,
    eclipticNorthAltAz: { azDeg: eclipticNorthAltAz.azDeg, altDeg: eclipticNorthAltAz.altDeg },
    glbLoading,
  });

  // Scene readiness
  const sceneReady = useMemo(
    () =>
      !glbLoading &&
      ((everReadyMoon || !needMoon3D || moon3DReady) &&
       planetsReady),
    [glbLoading, everReadyMoon, needMoon3D, moon3DReady, planetsReady]
  );
  useEffect(() => { onSceneReadyChange?.(sceneReady); }, [sceneReady, onSceneReadyChange]);

  // Polaris / Crux + horizon body ticks
  const polarisAltAz = useMemo(
    () => altAzFromRaDec(date, latDeg, lngDeg, POLARIS_RA_DEG, POLARIS_DEC_DEG),
    [date, latDeg, lngDeg]
  );
  const cruxAltAz = useMemo(
    () => altAzFromRaDec(date, latDeg, lngDeg, CRUX_CENTROID_RA_DEG, CRUX_CENTROID_DEC_DEG),
    [date, latDeg, lngDeg]
  );

  const polarisScreen = useMemo(() => {
    const p = projectToScreen(
      polarisAltAz.azDeg, polarisAltAz.altDeg, 
      refAzDeg, 
      viewport.w, viewport.h, refAltDeg, 0, fovXDeg, fovYDeg, projectionMode,
      lockHorizon,
      eclipticNorthAltAz.azDeg, eclipticNorthAltAz.altDeg
    );
    return { ...p, x: viewport.x + p.x, y: viewport.y + p.y };
  }, [polarisAltAz, refAzDeg, refAltDeg, viewport, fovXDeg, fovYDeg, projectionMode,
    lockHorizon, eclipticNorthAltAz.azDeg, eclipticNorthAltAz.altDeg
  ]);
  
  const bodyHorizonItems = useMemo(() => {
    const out: BodyItem[] = [];
    if (showSun) {
      const az = astro.sun.az;
      const p = projectToScreen(
        az, 0, refAzDeg, viewport.w, viewport.h, refAltDeg, 0, fovXDeg, fovYDeg, projectionMode,
        lockHorizon,
        eclipticNorthAltAz.azDeg, eclipticNorthAltAz.altDeg
      );
      if (p.visibleX) out.push({ x: p.x, az, label: tUi('celestialBodies.sun'), color: "#f59e0b" });
    }
    if (showMoon) {
      const az = astro.moon.az;
      const p = projectToScreen(az, 0, refAzDeg, viewport.w, viewport.h, refAltDeg, 0, fovXDeg, fovYDeg, projectionMode,
        lockHorizon,
        eclipticNorthAltAz.azDeg, eclipticNorthAltAz.altDeg
      );
      if (p.visibleX) out.push({ x: p.x, az, label: tUi('celestialBodies.moon'), color: "#93c5fd" });
    }
    {
      const az = polarisAltAz.azDeg;
      const p = projectToScreen(az, 0, refAzDeg, viewport.w, viewport.h, refAltDeg, 0, fovXDeg, fovYDeg, projectionMode,
        lockHorizon,
        eclipticNorthAltAz.azDeg, eclipticNorthAltAz.altDeg
      );
      if (p.visibleX) out.push({ x: p.x, az, label: "Polaris", color: POLARIS_COLOR });
    }
    {
      const az = cruxAltAz.azDeg;
      const p = projectToScreen(az, 0, refAzDeg, viewport.w, viewport.h, refAltDeg, 0, fovXDeg, fovYDeg, projectionMode,
        lockHorizon,
        eclipticNorthAltAz.azDeg, eclipticNorthAltAz.altDeg
      );
      if (p.visibleX && showStars) out.push({ x: p.x, az, label: tUi('celestialBodies.southernCross'), color: CRUX_COLOR });
    }
    for (const pl of planetsEphemArr) {
      const id = (pl as any).id as string;
      if (!showPlanets[id]) continue;
      const az = ((pl as any).azDeg ?? (pl as any).az) as number;
      const reg = PLANET_REGISTRY[id as keyof typeof PLANET_REGISTRY];
      if (az == null || !reg) continue;
      const pr = projectToScreen(az, 0, refAzDeg, viewport.w, viewport.h, refAltDeg, 0, fovXDeg, fovYDeg, projectionMode,
        lockHorizon,
        eclipticNorthAltAz.azDeg, eclipticNorthAltAz.altDeg
      );
      if (pr.visibleX) out.push({ x: pr.x, az, label: reg.label, color: reg.color });
    }
    return out;
  }, [
    showSun, showMoon, astro.sun.az, astro.moon.az,
    polarisAltAz.azDeg, cruxAltAz.azDeg, planetsEphemArr, showPlanets,
    refAzDeg, refAltDeg, viewport, fovXDeg, fovYDeg, projectionMode, lockHorizon,
      eclipticNorthAltAz.azDeg, eclipticNorthAltAz.altDeg, tUi, PLANET_REGISTRY
  ]);

  // Planet markers for Markers overlay
  const planetMarkers = useMemo(() => {
    return planetsRender
      .filter(pr => pr.visibleX && pr.visibleY)
      .map(pr => {
        const S = Math.max(1, Math.round(pr.sizePx));
        const reg = PLANET_REGISTRY[pr.id as keyof typeof PLANET_REGISTRY];
        return {
          screen: { x: pr.x, y: pr.y, visibleX: pr.visibleX, visibleY: pr.visibleY },
          label: reg?.label ?? pr.id,
          color: reg?.color ?? pr.color,
          size: { w: S, h: S },
        };
      });
  }, [planetsRender, PLANET_REGISTRY]);

  useEffect(() => {
    if (!longPoseEnabled) return;
    const canvas = lpCanvasRef.current;
    if (!canvas) return;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const cssW = Math.max(1, Math.round(viewport.w));
    const cssH = Math.max(1, Math.round(viewport.h));
    const w = cssW * dpr, h = cssH * dpr;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
    }
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // draw using CSS pixels
      ctx.clearRect(0, 0, cssW, cssH);
    }
  }, [longPoseEnabled, viewport.w, viewport.h]);

  // Clear overlay when toggles/settings change
  useEffect(() => {
    const c = lpCanvasRef.current;
    const ctx = c?.getContext('2d');
    if (c && ctx) {
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, viewport.w, viewport.h);
    }
  }, [
    longPoseEnabled,
    enlargeObjects,
    projectionMode,
    fovXDeg,
    fovYDeg,
    viewport.x, viewport.y, viewport.w, viewport.h, 
    showStars, showSun, showMoon,
  ]);

  // Shared compositor: copy 2D canvases and draw disks for sprites/dots
  const compositeLongPose = useCallback(() => {
    const overlay = lpCanvasRef.current;
    const root = rootRef.current;
    if (!overlay || !root) return;

    const ctx = overlay.getContext('2d');
    if (!ctx) return;

    const cssW = viewport.w;
    const cssH = viewport.h;
    const retain = Math.max(1, Math.round(LONGPOSE_RETAIN_FRAMES || 1));

    const DECAY_GAIN = 10;

    // Fade previous frames
    ctx.globalCompositeOperation = 'destination-out';
    ctx.globalAlpha = Math.min(1, 1 / (retain * DECAY_GAIN));
    ctx.fillRect(0, 0, cssW, cssH);

    // Draw current canvases (excluding 3D layers and our overlay)
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;

    const dstRect = overlay.getBoundingClientRect();
    const canvases = Array.from(root.querySelectorAll('canvas')) as HTMLCanvasElement[];

    const sources = canvases.filter((c) => {
      if (c === overlay) return false;
      const el = c as HTMLElement;
      if (el.closest('[data-3d-layer="1"]')) return false;
      if (el.hasAttribute('data-longpose-exclude') || el.closest('[data-longpose-exclude="1"]')) return false;
      return true;
    });

    for (const src of sources) {
      const srcRect = src.getBoundingClientRect();
      if (srcRect.width <= 0 || srcRect.height <= 0) continue;

      const isStars = !!(src as HTMLElement).closest('[data-stars-layer="1"]');

      const STAR_TRAIL_GAIN = 10.5;
      const STAR_DECAY_GAIN  = DECAY_GAIN;

      if (isStars) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = Math.min(1, (STAR_TRAIL_GAIN * STAR_DECAY_GAIN) / (retain * DECAY_GAIN));
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
      }

      const sxPerCss = src.width / srcRect.width;
      const syPerCss = src.height / srcRect.height;

      const sx = Math.max(0, (dstRect.left - srcRect.left) * sxPerCss);
      const sy = Math.max(0, (dstRect.top  - srcRect.top ) * syPerCss);
      const sWidth  = Math.max(0, Math.min(src.width  - sx, dstRect.width  * sxPerCss));
      const sHeight = Math.max(0, Math.min(src.height - sy, dstRect.height * syPerCss));

      try {
        ctx.drawImage(src, sx, sy, sWidth, sHeight, 0, 0, cssW, cssH);
      } catch {}
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;

    // Trail gains/decays
    const SUN_TRAIL_GAIN    = 1000.5;
    const SUN_DECAY_GAIN    = DECAY_GAIN;

    const MOON_TRAIL_GAIN   = 100 + 400 * clamp(phaseFraction ?? 0, 0, 1);
    const MOON_DECAY_GAIN   = DECAY_GAIN;

    const PLANET_DECAY_GAIN = DECAY_GAIN;

    const darkenByIllum = (color: string, illum: number) => {
      const k = Math.max(0.3, Math.min(1, illum));
      let s = (color || '').trim();
      if (s.startsWith('#')) s = s.slice(1);
      if (s.length === 3) s = s.split('').map(ch => ch + ch).join('');
      if (/^[0-9a-fA-F]{6}$/.test(s)) {
        const r = Math.max(0, Math.min(255, Math.round(parseInt(s.slice(0, 2), 16) * k)));
        const g = Math.max(0, Math.min(255, Math.round(parseInt(s.slice(2, 4), 16) * k)));
        const b = Math.max(0, Math.min(255, Math.round(parseInt(s.slice(4, 6), 16) * k)));
        return `rgb(${r}, ${g}, ${b})`;
      }
      return color;
    };

    const drawDisk = (
      x: number,
      y: number,
      w: number,
      h: number,
      color: string,
      gain: number = 1,
      decay: number = DECAY_GAIN
    ) => {
      const r = Math.max(1, Math.round(Math.max(w, h) / 2));
      const lx = x - viewport.x, ly = y - viewport.y;

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = Math.min(1, Math.max(0, (gain * decay) / (retain * DECAY_GAIN)));

      ctx.beginPath();
      ctx.arc(lx, ly, r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.restore();
    };

    const drawDiskWithStroke = (
      x: number,
      y: number,
      w: number,
      h: number,
      color: string,
      fillGain: number,
      strokeGain: number,
      decay: number = DECAY_GAIN
    ) => {
      const r = Math.max(1, Math.round(Math.max(w, h) / 2));
      const lx = x - viewport.x, ly = y - viewport.y;
      const alphaFor = (g: number) => Math.min(1, Math.max(0, (g * decay) / (retain * DECAY_GAIN)));

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      ctx.beginPath();
      ctx.arc(lx, ly, r, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.globalAlpha = alphaFor(strokeGain);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(lx, ly, r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.globalAlpha = alphaFor(fillGain);
      ctx.fill();

      ctx.restore();
    };

    // Sun (sprite/dot only)
    if (showSun && sunScreen.visibleX && sunScreen.visibleY && !enlargeObjects) {
      drawDisk(sunScreen.x, sunScreen.y, bodySizes.sun.w, bodySizes.sun.h, '#f59e0b', SUN_TRAIL_GAIN, SUN_DECAY_GAIN);
    }

    // Moon (sprite/dot only)
    if (showMoon && !enlargeObjects && moonScreen.visibleX && moonScreen.visibleY) {
      drawDiskWithStroke(
        moonScreen.x, moonScreen.y,
        bodySizes.moon.w, bodySizes.moon.h,
        'hsla(180, 1%, 38%, 1.00)',
        MOON_TRAIL_GAIN,
        MOON_TRAIL_GAIN * 2,
        MOON_DECAY_GAIN
      );
    }

    // Planets (dot/sprite only)
    for (const p of planetsRender) {
      if (!p.visibleX || !p.visibleY) continue;
      const S = Math.max(4, Math.round(p.sizePx));
      const illum = clamp(p.phaseFrac ?? 0, 0, 1);
      const planetGain = 10 + 20 * illum;
      const trailColor = darkenByIllum(p.color, illum);

      drawDiskWithStroke(
        p.x, p.y,
        S, S,
        trailColor,
        planetGain,
        planetGain * 4,
        PLANET_DECAY_GAIN
      );
    }
  }, [
    viewport.x, viewport.y, viewport.w, viewport.h,
    showSun, showMoon,
    sunScreen.x, sunScreen.y, sunScreen.visibleX, sunScreen.visibleY, bodySizes.sun.w, bodySizes.sun.h,
    moonScreen.x, moonScreen.y, moonScreen.visibleX, moonScreen.visibleY, bodySizes.moon.w, bodySizes.moon.h,
    planetsRender, enlargeObjects, phaseFraction,
  ]);

  // Timelapse mode: accumulate once per utcMs change and ACK
  useEffect(() => {
    if (!longPoseEnabled || !timeLapseEnabled) return;
    let cancelled = false;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (cancelled) return;
        compositeLongPose();
        onLongPoseAccumulated?.();
      });
    });
    return () => { cancelled = true; };
  }, [
    utcMs,
    longPoseEnabled,
    timeLapseEnabled,
    compositeLongPose,
    onLongPoseAccumulated,
  ]);

  // Burst composite after toggling Stars ON (works in TL and smooth modes)
  useEffect(() => {
    if (!longPoseEnabled ) return;
    if (!showStars) return;

    let raf: number | null = null;
    let frames = 0;
    let cancelled = false;

    const step = () => {
      if (cancelled) return;
      frames += 1;
      compositeLongPose();

      const root = rootRef.current;
      const starsCanvas = root?.querySelector('[data-stars-layer="1"] canvas') as HTMLCanvasElement | null;
      const ready = !!starsCanvas && starsCanvas.width > 0 && starsCanvas.height > 0;

      if (frames < 30 && !ready) {
        raf = requestAnimationFrame(step);
      }
    };

    raf = requestAnimationFrame(step);
    return () => { cancelled = true; if (raf != null) cancelAnimationFrame(raf); };
  }, [showStars, longPoseEnabled, compositeLongPose]);

  // Smooth mode: continuous RAF compositor (no ACK)
  useEffect(() => {
    if (!longPoseEnabled || timeLapseEnabled) return;
    let raf: number | null = null;
    let running = true;
    const loop = () => {
      if (!running) return;
      compositeLongPose();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      running = false;
      if (raf != null) cancelAnimationFrame(raf);
    };
  }, [longPoseEnabled, timeLapseEnabled, compositeLongPose]);

  // Clear overlay when toggles/settings or observer/camera change
  useEffect(() => {
    const c = lpCanvasRef.current;
    const ctx = c?.getContext('2d');
    if (c && ctx) {
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, viewport.w, viewport.h);
    }
  }, [
    // Long pose settings
    longPoseEnabled,
    
    // Observer/location
    latDeg, lngDeg,
    // Camera orientation
    // refAzDeg, refAltDeg,

    // Projection/scale/viewport
    projectionMode, fovXDeg, fovYDeg,
    viewport.x, viewport.y, viewport.w, viewport.h,

    // Rendering toggles that affect content
    showEarth, showAtmosphere, showGrid, showHorizon, lockHorizon, showMarkers,
    showStars, showSun, showMoon, showPhase, earthshine,
    enlargeObjects,

    // Planets visibility map
    showPlanets,
  ]);

  // NEW: explicit clear when requested from UI
  React.useEffect(() => {
    const c = lpCanvasRef.current;
    const ctx = c?.getContext('2d');
    if (c && ctx) {
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, viewport.w, viewport.h);
    }
  }, [longPoseClearSeq, viewport.w, viewport.h]);

  return (
    <div ref={setRootRef} className="absolute inset-0">
      {/* Earth - render before horizon */}
      {showEarth && (
        <div className="absolute inset-0" 
          data-longpose-exclude="1" // exclure du long pose
          style={{ zIndex: Z.horizon - 0, pointerEvents: 'none' }}
        >
          <Ground
            viewport={viewport}
            refAzDeg={refAzDeg}
            refAltDeg={refAltDeg}
            fovXDeg={fovXDeg}
            fovYDeg={fovYDeg}
            projectionMode={projectionMode}
            showEarth={showEarth}
            debugMask={debugMask}
            lockHorizon={lockHorizon}
            eclipticUpAzDeg={eclipticNorthAltAz.azDeg}
            eclipticUpAltDeg={eclipticNorthAltAz.altDeg}
          />
        </div>
      )}

      {/* Horizon & Cardinal markers */}
      {showHorizon && (
        <div
          className="absolute"
          data-longpose-exclude="1" // exclure du long pose
          style={{
            zIndex: Z.horizon,
            left: viewport.x,
            top: viewport.y,
            width: viewport.w,
            height: viewport.h,
            pointerEvents: 'none',
          }}
        >
          <HorizonOverlay
            viewport={viewport}
            refAzDeg={refAzDeg}
            refAltDeg={refAltDeg}
            fovXDeg={fovXDeg}
            fovYDeg={fovYDeg}
            projectionMode={projectionMode}
            showEarth={showEarth}
            debugMask={false}
            lockHorizon={lockHorizon}
            eclipticUpAzDeg={eclipticNorthAltAz.azDeg}
            eclipticUpAltDeg={eclipticNorthAltAz.altDeg}
          />
          <CardinalMarkers
            viewport={viewport}
            refAzDeg={refAzDeg}
            refAltDeg={refAltDeg}
            fovXDeg={fovXDeg}
            fovYDeg={fovYDeg}
            projectionMode={projectionMode}
            bodyItems={bodyHorizonItems}
            lockHorizon={lockHorizon}
            eclipticUpAzDeg={eclipticNorthAltAz.azDeg}
            eclipticUpAltDeg={eclipticNorthAltAz.altDeg}
          />
        </div>
      )}

      {/* Grid */}
      {showGrid && (
        <div
          className="absolute"
          data-longpose-exclude="1" // exclure du long pose
          style={{
            zIndex: Z.horizon - 3,
            left: viewport.x,
            top: viewport.y,
            width: viewport.w,
            height: viewport.h,
            pointerEvents: 'none',
          }}
        >
          <Grid
            viewport={viewport}
            refAzDeg={refAzDeg}
            refAltDeg={refAltDeg}
            fovXDeg={fovXDeg}
            fovYDeg={fovYDeg}
            projectionMode={projectionMode}
            lockHorizon={lockHorizon}
            eclipticUpAzDeg={eclipticNorthAltAz.azDeg}
            eclipticUpAltDeg={eclipticNorthAltAz.altDeg}
          />
        </div>
      )}

      {/* Ecliptique (pointillé) */}
      {showEcliptique && (
      <div
        className="absolute"
        data-longpose-exclude="1" // exclure Grid du long pose
        style={{
          zIndex: Z.horizon - 3, // même niveau que la grille, rendu après -> au-dessus
          left: viewport.x,
          top: viewport.y,
          width: viewport.w,
          height: viewport.h,
          pointerEvents: 'none',
        }}
      >
        <Ecliptique
          date={date}
          latDeg={latDeg}
          lngDeg={lngDeg}
          viewport={viewport}
          refAzDeg={refAzDeg}
          refAltDeg={refAltDeg}
          fovXDeg={fovXDeg}
          fovYDeg={fovYDeg}
          projectionMode={projectionMode}
          color="#fde68a"
          opacity={0.95}
          lineWidth={2}
          dotPx={1.2}
          gapPx={7}
          stepDeg={2}
          applyRefraction={showRefraction} 
          lockHorizon={lockHorizon}
          eclipticUpAzDeg={eclipticNorthAltAz.azDeg}
          eclipticUpAltDeg={eclipticNorthAltAz.altDeg}
        />
      </div>
    )}

      {/* Atmosphere */}
      {showAtmosphere && (
        <div
          className="absolute"
          data-longpose-exclude="1" // exclure du long pose
          style={{
            zIndex: Z.horizon - 20,
            left: viewport.x,
            top: viewport.y,
            width: viewport.w,
            height: viewport.h,
            pointerEvents: 'none',
          }}
        >
          <Athmosphere
            viewport={viewport}
            sunAltDeg={astro.sun.alt}
          />
        </div>
      )}

      {/* Stars */}
      {showStars && (
        <div
          className="absolute inset-0"
          // Tag the stars layer so the compositor can include its canvas even if it's WebGL
          data-stars-layer="1"
          style={{ zIndex: Z.horizon - 5, pointerEvents: 'none' }}
        >
          <Stars
            utcMs={utcMs}
            latDeg={latDeg}
            lngDeg={lngDeg}
            refAzDeg={refAzDeg}
            refAltDeg={refAltDeg}
            fovXDeg={fovXDeg}
            fovYDeg={fovYDeg}
            viewport={viewport}
            debug={debugMask}
            enlargeObjects={false}
            showMarkers={showMarkers}
            projectionMode={projectionMode}
            showRefraction={showRefraction} 
            lockHorizon={lockHorizon}
            eclipticUpAzDeg={eclipticNorthAltAz.azDeg}
            eclipticUpAltDeg={eclipticNorthAltAz.altDeg}
          />
        </div>
      )}

      {/* Sun */}
      {showSun && (
        <div className="absolute inset-0" 
          style={{ zIndex: Z.horizon - 2, pointerEvents: 'none' }}
        >
          <SunSprite
            x={sunScreen.x}
            y={sunScreen.y}
            visibleX={sunScreen.visibleX}
            visibleY={sunScreen.visibleY}
            rotationDeg={rotationDegSunScreen}
            showCard={showSunCard}
            wPx={bodySizes.sun.w}
            hPx={bodySizes.sun.h}
          />
        </div>
      )}

      {/* Moon dot */}
      {showMoon && !glbLoading && moonRenderModeEffective === 'dot' && moonScreen.visibleX && moonScreen.visibleY && (
        <div
          className="absolute"
          style={{
            zIndex: Z.horizon - 2,
            left: moonScreen.x - 2,
            top: moonScreen.y - 2,
            width: 4,
            height: 4,
            borderRadius: '9999px',
            background: '#9ca3af',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Moon sprite */}
      {showMoon && !glbLoading && moonRenderModeEffective === 'sprite' && (
        <div className="absolute inset-0" style={{ zIndex: Z.horizon - 2, pointerEvents: 'none' }}>
          <MoonSprite
            x={moonScreen.x} y={moonScreen.y}
            visibleX={moonScreen.visibleX} visibleY={moonScreen.visibleY}
            rotationDeg={rotationDegMoonScreen}
            showPhase={showPhase}
            earthshine={earthshine}
            debugMask={debugMask}
            showCard={showMoonCard}
            phaseFraction={phaseFraction}
            brightLimbAngleDeg={brightLimbAngleDeg}
            maskAngleDeg={maskAngleDeg}
            wPx={bodySizes.moon.w}
            hPx={bodySizes.moon.h}
          />
        </div>
      )}

      {/* Moon 3D */}
      {showMoon && !glbLoading && moonRenderModeEffective === '3d' && (
         <div className="absolute inset-0" 
          data-longpose-exclude="1" // exclure du long pose
          style={{ zIndex: Z.horizon - 1 }} data-3d-layer="1"
        >
          <Moon3D
            x={moonScreen.x}
            y={moonScreen.y}
            wPx={bodySizes.moon.w}
            hPx={bodySizes.moon.h}
            moonAltDeg={astro.moon.alt}
            moonAzDeg={astro.moon.az}
            sunAltDeg={astro.sun.alt}
            sunAzDeg={astro.sun.az}
            limbAngleDeg={rotationDegMoonScreen * -1}
            librationTopo={astro.moon.librationTopo}
            debugMask={debugMask}
            rotOffsetDegX={rotOffsetDegX}
            rotOffsetDegY={rotOffsetDegY}
            rotOffsetDegZ={rotOffsetDegZ}
            camRotDegX={camRotDegX}
            camRotDegY={camRotDegY}
            camRotDegZ={camRotDegZ}
            showPhase={showPhase}
            showMoonCard={showMoonCard}
            illumFraction={phaseFraction}
            brightLimbAngleDeg={brightLimbAngleDeg}
            earthshine={earthshine}
            onReady={() => { setMoon3DReady(true); setEverReadyMoon(true); }}
            // Params physiques d’éclipse
            eclipseStrength={eclipsePhys.strength}
            umbraRadiusRel={eclipsePhys.umbraRel}
            penumbraOuterRel={eclipsePhys.penumbraRel}
            redGlowStrength={eclipsePhys.redGlow}
            eclipseOffsetRel={eclipsePhys.offsetRel} 
            eclipseAxisPADeg={eclipsePhys.axisPADeg} 
          />
        </div>
      )}

      {/* Planets */}
      {planetsRender.map(p => {
        if (!p.visibleX || !p.visibleY) return null;
        if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) return null;

        const S = Math.max(4, Math.round(p.sizePx));
        const half = S / 2;
        const offscreen =
          p.x + half < viewport.x ||
          p.x - half > viewport.x + viewport.w ||
          p.y + half < viewport.y ||
          p.y - half > viewport.y + viewport.h;
        if (offscreen) return null;

        const isFartherThanSun =
          Number.isFinite(astro.sun.distAU) && Number.isFinite(p.distAU)
            ? (p.distAU as number) > (astro.sun.distAU as number)
            : true;
        const z = isFartherThanSun ? Z.horizon - 3 : Z.horizon - 2;

        const effectiveMode = glbLoading && p.mode === '3d' ? 'sprite' : p.mode;

        if (effectiveMode === 'dot') {
          return (
            <div
              key={p.id}
              className="absolute"
              style={{
                zIndex: z,
                left: p.x - half,
                top: p.y - half,
                width: S,
                height: S,
                borderRadius: '9999px',
                background: p.color,
                pointerEvents: 'none',
              }}
            />
          );
        }

        if (effectiveMode === 'sprite') {
          return (
            <PlanetSprite
              key={p.id}
              planetId={p.id}
              x={p.x}
              y={p.y}
              visibleX={true}
              visibleY={true}
              rotationDeg={p.rotationDegPlanetScreen ?? 0}
              angleToSunDeg={p.angleToSunDeg} 
              phaseFraction={p.phaseFrac}
              wPx={S}
              hPx={S}
              color={p.color}
              debugMask={debugMask}
              brightLimbAngleDeg={p.angleToSunDeg}
              zIndex={z}
              orientationDegX={p.orientationDegX}
          />
          );
        }

        return (
          <div key={p.id} 
            data-longpose-exclude="1"
            className="absolute inset-0" style={{ zIndex: z, pointerEvents: 'none' }} data-3d-layer="1"
          >
            <Planet3D
              id={p.id as PlanetId}
              x={p.x}
              y={p.y}
              wPx={S}
              hPx={S}
              planetAltDeg={p.planetAltDeg}
              planetAzDeg={p.planetAzDeg}
              sunAltDeg={astro.sun.alt}
              sunAzDeg={astro.sun.az}
              limbAngleDeg={-p.rotationDeg}
              rotationDeg={p.rotationDegPlanetScreen ?? 0}
              brightLimbAngleDeg={p.angleToSunDeg}
              orientationDegX={p.orientationDegX}
              orientationDegY={p.orientationDegY}
              orientationDegZ={p.orientationDegZ}
              debugMask={debugMask}
              rotOffsetDegX={rotOffsetDegX}
              rotOffsetDegY={rotOffsetDegY}
              rotOffsetDegZ={rotOffsetDegZ}
              camRotDegX={camRotDegX}
              camRotDegY={camRotDegY}
              camRotDegZ={camRotDegZ}
              showPhase={showPhase}
              showPlanetCard={showMoonCard}
              illumFraction={p.phaseFrac}
              showSubsolarCone={true}
              onReady={() => markPlanetReady(p.id as string)}
            />
          </div>
        );
      })}

      {/* Markers overlay */}
      <Markers
        showMarkers={showMarkers}
        showStars={showStars}
        zIndexHorizon={Z.horizon}
        showSun={showSun}
        sunScreen={sunScreen}
        sunSize={{ w: bodySizes.sun.w, h: bodySizes.sun.h }}
        showMoon={showMoon}
        moonScreen={moonScreen}
        moonSize={{ w: bodySizes.moon.w, h: bodySizes.moon.h }}
        polarisScreen={polarisScreen}
        sunColor="#f59e0b"
        moonColor="#93c5fd"
        polarisColor={POLARIS_COLOR}
        cruxColor={CRUX_COLOR}
        planets={planetMarkers}
      />

      {/* Long pose overlay inside SpaceView (above sky layers, below UI) */}
      {longPoseEnabled && (
        <canvas
          ref={lpCanvasRef}
          className="absolute"
          // Align to viewport so local coords are simple
          style={{
            // Optional: put ghosts below live sprites but above stars/grid
            zIndex: Z.horizon - 3, // was Z.horizon + 1
            left: viewport.x,
            top: viewport.y,
            width: viewport.w,
            height: viewport.h,
            pointerEvents: 'none',
          }}
          aria-hidden="true"
        />
      )}

      {/* Additional overlays when App panels are hidden (HUD) */}
      {showHud && !isMobile && (
        <>
          {/* HUD DESKTOP COMPLET */}
          {/* Top right: location/time */}
          <div
            className="absolute right-2 top-2 text-sm text-white/60 bg-black/30 px-2 py-1 rounded border border-white/10"
            style={{ zIndex: Z.ui }}
          >
            <div className="flex flex-col leading-tight items-end text-right">
              <div>{overlaySplit.place}</div>
              {overlaySplit.date ? <div>{overlaySplit.date}</div> : null}
            </div>
          </div>
          {/* Bas centré: Azimut observateur (refAzDeg) */}
          <div
            className="absolute left-1/2 bottom-2 -translate-x-1/2 text-sm text-white/60 bg-black/30 px-2 py-1 rounded border border-white/10"
            style={{ zIndex: Z.ui }}
          >
            {`${tUi('hud.azimuth')} ${Number(refAzDeg).toFixed(1)}° - ${compass16(refAzDeg, t)}`}
          </div>

          {/* Bas droite: Lune ou sous l'horizon (marge demi-diamètre) */}
          <div
            className="absolute right-2 bottom-2 text-sm text-white/60 bg-black/30 px-2 py-1 rounded border border-white/10"
            style={{ zIndex: Z.ui }}
          >
            {astro.moon.alt + astro.moon.appDiamDeg / 2 < 0
              ? tUi('hud.moonBelowHorizon')
              : `${tUi('celestialBodies.moon')} Alt. ${formatDeg(astro.moon.alt, 0)} Az ${formatDeg(astro.moon.az, 1)} (${compass16(astro.moon.az, t)})`}
          </div>

          {/* Bas gauche: Soleil ou sous l'horizon (marge demi-diamètre) */}
          <div
            className="absolute left-2 bottom-2 text-sm text-white/60 bg-black/30 px-2 py-1 rounded border border-white/10"
            style={{ zIndex: Z.ui }}
          >
            {astro.sun.alt + astro.sun.appDiamDeg / 2 < 0
              ? tUi('hud.sunBelowHorizon')
              : `${tUi('celestialBodies.sun')} Alt. ${formatDeg(astro.sun.alt, 0)} Az ${formatDeg(astro.sun.az, 1)} (${compass16(astro.sun.az, t)})`}
          </div>

          {/* Haut gauche: Appareil et zoom */}
          <div
            className="absolute top-2 left-2 text-sm text-white/60 bg-black/30 px-2 py-1 rounded border border-white/10"
            style={{ zIndex: Z.ui }}
          >
            <div className="flex flex-col leading-tight">
              <div>{tUi('hud.simulation')} {domainFromBrowser}</div>
              {cameraLabel ? <div>{cameraLabel}</div> : null}
              {enlargeObjects ? <div>({tUi('hud.objectSizeExaggerated')})</div> : null}
            </div>
          </div>

          {/* Gauche centrée: Altitude observateur (refAltDeg) */}
          <div
            className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-white/60 bg-black/30 px-2 py-1 rounded border border-white/10"
            style={{ zIndex: Z.ui }}
          >
             {tUi('hud.altitude')} <span className={refAltDeg < 0 ? 'text-red-400' : undefined}>{formatDeg(refAltDeg, 0)}</span>
          </div>
        </>
      )}

      {/* HUD MOBILE PAYSAGE ALLÉGÉ */}
      {showHud && isMobile && isLandscape && (
        <>
          {/* Haut droite: Lieu + Heure locale */}
          <div
            className="absolute right-2 top-2 text-xs text-white/70 bg-black/40 px-2 py-1 rounded border border-white/15"
            style={{ zIndex: Z.ui }}
          >
            <div className="flex flex-col leading-tight items-end text-right">
              <div>{overlaySplit.place}</div>
              {overlaySplit.date ? <div>{overlaySplit.date}</div> : null}
            </div>
          </div>

          {/* Haut gauche: Simulation domaine */}
          <div
            className="absolute top-2 left-2 text-xs text-white/70 bg-black/40 px-2 py-1 rounded border border-white/15"
            style={{ zIndex: Z.ui }}
          >
            {tUi('hud.simulation')} {domainFromBrowser}
          </div>

          {/* Gauche centré: Altitude observateur */}
          <div
            className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-white/70 bg-black/40 px-2 py-1 rounded border border-white/15"
            style={{ zIndex: Z.ui }}
          >
             {tUi('hud.altitude')} <span className={refAltDeg < 0 ? 'text-red-400' : undefined}>{formatDeg(refAltDeg, 0)}</span>
          </div>

          {/* Bas centré: Azimut observateur + Direction */}
          <div
            className="absolute left-1/2 bottom-2 -translate-x-1/2 text-xs text-white/70 bg-black/40 px-2 py-1 rounded border border-white/15"
            style={{ zIndex: Z.ui }}
          >
            {`${tUi('hud.azimuth')} ${Number(refAzDeg).toFixed(1)}° - ${compass16(refAzDeg, t)}`}
          </div>

          {/* Bas gauche: Soleil (Alt + Direction) */}
          <div
            className="absolute left-2 bottom-2 text-xs text-white/70 bg-black/40 px-2 py-1 rounded border border-white/15"
            style={{ zIndex: Z.ui }}
          >
            {astro.sun.alt + astro.sun.appDiamDeg / 2 < 0
              ? tUi('hud.sunBelowHorizon')
              : `${tUi('celestialBodies.sun')} Alt. ${formatDeg(astro.sun.alt, 0)} (${compass16(astro.sun.az, t)})`}
          </div>

          {/* Bas droite: Lune (Alt + Direction) */}
          <div
            className="absolute right-2 bottom-2 text-xs text-white/70 bg-black/40 px-2 py-1 rounded border border-white/15"
            style={{ zIndex: Z.ui }}
          >
            {astro.moon.alt + astro.moon.appDiamDeg / 2 < 0
              ? tUi('hud.moonBelowHorizon')
              : `${tUi('celestialBodies.moon')} Alt. ${formatDeg(astro.moon.alt, 0)} (${compass16(astro.moon.az, t)})`}
          </div>
        </>
      )}


    </div>
  );
});