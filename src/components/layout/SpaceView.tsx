import React, { useMemo, useState, useEffect, useCallback, forwardRef } from "react";
import { Canvas } from '@react-three/fiber';

// Astro core
import { getSunAndMoonAltAzDeg, getSunOrientationAngles, sunOnMoon } from "../../astro/aeInterop";
import { getMoonIllumination, getMoonLibration, moonHorizontalParallaxDeg, topocentricMoonDistanceKm } from "../../astro/aeInterop";
import { sunApparentDiameterDeg } from "../../astro/sun";
import { moonApparentDiameterDeg } from "../../astro/moon";
import { getPlanetsEphemerides, getPlanetOrientationAngles, type PlanetId } from "../../astro/planets";
import { altAzFromRaDec } from "../../astro/stars";
import { sepDeg } from "../../astro/eclipse";

import { getMoonOrientationAngles } from "../../astro/aeInterop";

// Math/projection utils
import { toDeg, toRad, norm360, clamp } from "../../utils/math";
import { altAzToVec, normalize3 } from "../../utils/vec3";
import { projectToScreen } from "../../render/projection";
import { localUpAngleOnScreen, correctedSpriteRotationDeg } from "../../render/orientation";

// Render constants & registry
import { Z, MOON_RENDER_DIAMETER } from "../../render/constants";
import { PLANET_REGISTRY, PLANET_DOT_MIN_PX } from "../../render/planetRegistry";
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
import Ground from "../stage/Ground"; // ADD THIS IMPORT
import Ecliptique from "../stage/Ecliptique";

// Local marker colors
const POLARIS_COLOR = "#86efac";
const POLARIS_RA_DEG = 37.952917;
const POLARIS_DEC_DEG = 89.264167;
const CRUX_COLOR = "#a78bfa";
const CRUX_CENTROID_RA_DEG = 187.539271;
const CRUX_CENTROID_DEC_DEG = -59.6625;

// Moon render thresholds (px)
const MOON_DOT_PX = 5;
const MOON_3D_SWITCH_PX = 20;
const PLANET_3D_SWITCH_PX = 20;

export type ProjectionMode = 'recti-panini' | 'stereo-centered' | 'ortho' | 'cylindrical';

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

  showSun: boolean;
  showMoon: boolean;
  showPhase: boolean;
  earthshine: boolean;
  showSunCard: boolean;
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
  longPoseRetainFrames?: number;
  onLongPoseAccumulated?: () => void;
  longPoseClearSeq?: number;
  timeLapseEnabled?: boolean;
  onLongPoseClear?: () => void;
}

export default forwardRef<HTMLDivElement, SpaceViewProps>(function SpaceView(props: SpaceViewProps, ref) {
  const {
    date, utcMs, latDeg, lngDeg,
    viewport, refAzDeg, refAltDeg, fovXDeg, fovYDeg, projectionMode,
    showEarth, showGrid, showAtmosphere, showStars, showMarkers,
    showSun, showMoon, showPhase, earthshine, showSunCard, showMoonCard, debugMask, enlargeObjects,
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
    longPoseEnabled = false,
    longPoseRetainFrames = 30,
    onLongPoseAccumulated, 
    longPoseClearSeq = 0,
    timeLapseEnabled = false,
    onLongPoseClear,
  } = props;

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
    if (typeof window === 'undefined' || !window?.location) return 'MoonTracker';
    const hn = window.location.hostname || '';
    return hn.replace(/^www\./, '') || 'MoonTracker';
  }, []);

  // Sun/Moon + sizes
  const astro = useMemo(() => {
    const both = getSunAndMoonAltAzDeg(date, latDeg, lngDeg);
    const sun = both.sun;
    const moon = both.moon;

    const illum = getMoonIllumination(date);
    const sunDiamDeg = sunApparentDiameterDeg(date, sun.distAU);

    const moonParallaxDeg = moonHorizontalParallaxDeg(moon.distanceKm);
    const moonTopoKm = topocentricMoonDistanceKm(moon.distanceKm, moon.altDeg ?? moon.alt);
    const moonDiamDeg = moonApparentDiameterDeg(moonTopoKm);

    let moonLibrationTopo: { latDeg: number; lonDeg: number; paDeg: number } | undefined;
    try { moonLibrationTopo = getMoonLibration(date, { lat: latDeg, lng: lngDeg }); } catch { /* ignore */ }

    return {
      sun: { alt: sun.altDeg, az: sun.azDeg, distAU: sun.distAU, appDiamDeg: sunDiamDeg },
      moon: {
        alt: moon.altDeg,
        az: moon.azDeg,
        parallacticDeg: moonParallaxDeg,
        distKm: moon.distanceKm,
        topoDistKm: moonTopoKm,
        appDiamDeg: moonDiamDeg,
        librationTopo: moonLibrationTopo,
      },
      illum,
    };
  }, [date, latDeg, lngDeg]);

  // Ecliptic tilt and sprite rotations (projection-aware)
  const sunOrientation = useMemo(
    () => getSunOrientationAngles(date, latDeg, lngDeg),
    [date, latDeg, lngDeg]
  );
  const rotationToHorizonDegSun = sunOrientation.rotationToHorizonDegSolarNorth;

  const moonOrientation = useMemo(
    () => getMoonOrientationAngles(date, latDeg, lngDeg),
    [date, latDeg, lngDeg]
  );
  const rotationToHorizonDegMoon = moonOrientation.rotationToHorizonDegMoonNorth;

  // projection-aware local vertical angles at Sun/Moon
  const localUpAngleSunDeg = useMemo(
    () => localUpAngleOnScreen(astro.sun.az, astro.sun.alt, {
      refAz: refAzDeg, refAlt: refAltDeg,
      viewport: { w: viewport.w, h: viewport.h },
      fovXDeg, fovYDeg, projectionMode
    }),
    [astro.sun.az, astro.sun.alt, refAzDeg, refAltDeg, viewport.w, viewport.h, fovXDeg, fovYDeg, projectionMode]
  );
  const localUpAngleMoonDeg = useMemo(
    () => localUpAngleOnScreen(astro.moon.az, astro.moon.alt, {
      refAz: refAzDeg, refAlt: refAltDeg,
      viewport: { w: viewport.w, h: viewport.h },
      fovXDeg, fovYDeg, projectionMode
    }),
    [astro.moon.az, astro.moon.alt, refAzDeg, refAltDeg, viewport.w, viewport.h, fovXDeg, fovYDeg, projectionMode]
  );

  const rotationDegSunScreen = useMemo(
    () => correctedSpriteRotationDeg(rotationToHorizonDegSun, localUpAngleSunDeg),
    [rotationToHorizonDegSun, localUpAngleSunDeg]
  );
  const rotationDegMoonScreen = useMemo(
    () => correctedSpriteRotationDeg(rotationToHorizonDegMoon, localUpAngleMoonDeg),
    [rotationToHorizonDegMoon, localUpAngleMoonDeg]
  );

  // Sizes at local px/deg scale for Sun/Moon
  const bodySizes = useMemo(() => {
    // Use sizeRadiusPx = 0 when computing px/deg; passing bodySizes.* here causes a 2-pass jump
    const centerSun = projectToScreen(
      astro.sun.az, astro.sun.alt, refAzDeg,
      viewport.w, viewport.h,
      refAltDeg,
      0,                      // FIX: was bodySizes.sun.r
      fovXDeg, fovYDeg, projectionMode
    );
    const centerMoon = projectToScreen(
      astro.moon.az, astro.moon.alt, refAzDeg,
      viewport.w, viewport.h,
      refAltDeg,
      0,                      // FIX: was bodySizes.moon.r
      fovXDeg, fovYDeg, projectionMode
    );
    const pxPerDegXSun = centerSun.pxPerDegX || (viewport.w / Math.max(1e-9, fovXDeg));
    const pxPerDegYSun = centerSun.pxPerDegY || (viewport.h / Math.max(1e-9, fovYDeg));
    const pxPerDegXMoon = centerMoon.pxPerDegX || (viewport.w / Math.max(1e-9, fovXDeg));
    const pxPerDegYMoon = centerMoon.pxPerDegY || (viewport.h / Math.max(1e-9, fovYDeg));

    const sunWCalc = (astro.sun.appDiamDeg ?? 0) * pxPerDegXSun;
    const sunHCalc = (astro.sun.appDiamDeg ?? 0) * pxPerDegYSun;
    const sunW = enlargeObjects ? Math.max(MOON_RENDER_DIAMETER, sunWCalc) : sunWCalc;
    const sunH = enlargeObjects ? Math.max(MOON_RENDER_DIAMETER, sunHCalc) : sunHCalc;

    const moonWCalc = (astro.moon.appDiamDeg ?? 0) * pxPerDegXMoon;
    const moonHCalc = (astro.moon.appDiamDeg ?? 0) * pxPerDegYMoon;
    const moonW = enlargeObjects ? Math.max(MOON_RENDER_DIAMETER, moonWCalc) : moonWCalc;
    const moonH = enlargeObjects ? Math.max(MOON_RENDER_DIAMETER, moonHCalc) : moonHCalc;

    const sunR = Math.max(sunW, sunH) / 2;
    const moonR = Math.max(moonW, moonH) / 2;

    return { sun: { w: sunW, h: sunH, r: sunR }, moon: { w: moonW, h: moonH, r: moonR } };
  }, [viewport, fovXDeg, fovYDeg, astro.sun.az, astro.sun.alt, astro.moon.az, astro.moon.alt, astro.sun.appDiamDeg, astro.moon.appDiamDeg, refAzDeg, refAltDeg, enlargeObjects, projectionMode]);

  // Projected centers (MOVED UP so moonScreen is defined before use)
  const sunScreen = useMemo(() => {
    const s = projectToScreen(astro.sun.az, astro.sun.alt, refAzDeg, viewport.w, viewport.h, refAltDeg, bodySizes.sun.r, fovXDeg, fovYDeg, projectionMode);
    return { ...s, x: viewport.x + s.x, y: viewport.y + s.y };
  }, [astro.sun, refAzDeg, refAltDeg, viewport, fovXDeg, fovYDeg, bodySizes.sun, projectionMode]);

  const moonScreen = useMemo(() => {
    const m = projectToScreen(astro.moon.az, astro.moon.alt, refAzDeg, viewport.w, viewport.h, refAltDeg, bodySizes.moon.r, fovXDeg, fovYDeg, projectionMode);
    return { ...m, x: viewport.x + m.x, y: viewport.y + m.y };
  }, [astro.moon, refAzDeg, refAltDeg, viewport, fovXDeg, fovYDeg, bodySizes.moon, projectionMode]);

  // Apparent Moon size in px decides render mode
  const moonApparentPx = useMemo(() => {
    const p = projectToScreen(astro.moon.az, astro.moon.alt, refAzDeg, viewport.w, viewport.h, refAltDeg, 0, fovXDeg, fovYDeg, projectionMode);
    const pxPerDegX = p.pxPerDegX ?? (viewport.w / Math.max(1e-9, fovXDeg));
    const pxPerDegY = p.pxPerDegY ?? (viewport.h / Math.max(1e-9, fovYDeg));
    const pxPerDeg = (pxPerDegX + pxPerDegY) / 2;
    return (astro.moon.appDiamDeg ?? 0) * pxPerDeg;
  }, [astro.moon.az, astro.moon.alt, astro.moon.appDiamDeg, refAzDeg, refAltDeg, viewport, fovXDeg, fovYDeg, projectionMode]);

  const moonRenderMode = useMemo<'dot' | 'sprite' | '3d'>(() => {
    if (enlargeObjects) return '3d';
    if (!Number.isFinite(moonApparentPx)) return 'sprite';
    if (moonApparentPx < MOON_DOT_PX) return 'dot';
    if (moonApparentPx < MOON_3D_SWITCH_PX) return 'sprite';
    return '3d';
  }, [enlargeObjects, moonApparentPx]);

  const moonRenderModeEffective = glbLoading && moonRenderMode === '3d' ? 'sprite' : moonRenderMode;

  // Track readiness for Moon3D when it's needed/visible in 3D
  const [moon3DReady, setMoon3DReady] = useState<boolean>(true);
  const needMoon3D = useMemo(
    () => !!(showMoon && !glbLoading && moonRenderModeEffective === '3d' && moonScreen.visibleX && moonScreen.visibleY),
    [showMoon, glbLoading, moonRenderModeEffective, moonScreen.visibleX, moonScreen.visibleY]
  );
  useEffect(() => { setMoon3DReady(!needMoon3D); }, [needMoon3D]);

  // NEW: remember if Moon has ever completed its first 3D render (persist for session)
  const [everReadyMoon, setEverReadyMoon] = useState<boolean>(false);

// --- Planets readiness -----------------------------------------------------
  // Decide if a planet actually needs a 3D canvas (match render branch conditions)
  const planetNeeds3D = useCallback((p: any) => {
    if (!p.visibleX || !p.visibleY) return false;
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) return false;

    const S = Math.max(4, Math.round(p.sizePx));
    const half = S / 2;
    const offscreen =
      p.x + half < viewport.x ||
      p.x - half > viewport.x + viewport.w ||
      p.y + half < viewport.y ||
      p.y - half > viewport.y + viewport.h;
    if (offscreen) return false;

    // Use the same effective mode as the render switch
    const effectiveMode = glbLoading && p.mode === '3d' ? 'sprite' : p.mode;
    return effectiveMode === '3d';
  }, [viewport.x, viewport.y, viewport.w, viewport.h, glbLoading]);



  const [readyPlanetIds, setReadyPlanetIds] = useState<Set<string>>(new Set());

  // NEW: remember planets that have ever completed their first 3D render
  const [everReadyPlanetIds, setEverReadyPlanetIds] = useState<Set<string>>(new Set());
  
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
  const planetsRender = useMemo(() => {
    if (!planetsEphemArr?.length) return [];
    const items: {
      id: string;
      x: number; y: number;
      visibleX?: boolean; visibleY?: boolean;
      sizePx: number;
      color: string;
      phaseFrac: number;
      angleToSunDeg: number;
      mode: 'dot' | 'sprite' | '3d';
      distAU: number;
      rotationDeg: number;
      planetAltDeg: number;
      planetAzDeg: number;
      orientationDegX?: number;
      orientationDegY?: number;
      orientationDegZ?: number;
      localUpAnglePlanetDeg?: number;
      rotationToHorizonDegPlanet?: number;
      rotationDegPlanetScreen?: number;
    }[] = [];

    for (const p of planetsEphemArr) {
      const id = (p as any).id as string;
      if (!id || !showPlanets[id]) continue;

      const reg = PLANET_REGISTRY[id];
      const color = reg?.color ?? '#9ca3af';

      const alt = ((p as any).altDeg ?? (p as any).alt) as number | undefined;
      const az  = ((p as any).azDeg  ?? (p as any).az ) as number | undefined;
      if (alt == null || az == null) continue;

      // Project center (may be outside)
      const proj = projectToScreen(
        az, alt,
        refAzDeg,
        viewport.w, viewport.h,
        refAltDeg,
        0,
        fovXDeg, fovYDeg,
        projectionMode
      );
      if (!Number.isFinite(proj.x) || !Number.isFinite(proj.y)) continue;

      // In orthographic mode, enforce projection front-hemisphere visibility (matches Sun/Moon/Stars)
      const projVisible = !!(proj.visibleX && proj.visibleY);
      if (projectionMode === 'ortho' && !projVisible) continue;

      const screenX = viewport.x + proj.x;
      const screenY = viewport.y + proj.y;

      const pxPerDegX = proj.pxPerDegX ?? (viewport.w / Math.max(1e-9, fovXDeg));
      const pxPerDegY = proj.pxPerDegY ?? (viewport.h / Math.max(1e-9, fovYDeg));
      const pxPerDeg = (pxPerDegX + pxPerDegY) / 2;

      const appDiamDeg = Number((p as any).appDiamDeg ?? 0);
      const computedSize = appDiamDeg > 0 ? appDiamDeg * pxPerDeg : 0;

      let sizePx = enlargeObjects ? Math.max(MOON_RENDER_DIAMETER, computedSize) : computedSize;
      const hasValidSize = Number.isFinite(computedSize) && computedSize > 0;
      if (!hasValidSize && !enlargeObjects) sizePx = PLANET_DOT_MIN_PX;

      const mode: 'dot' | 'sprite' | '3d' =
        enlargeObjects
          ? '3d'
          : (!hasValidSize || sizePx < PLANET_DOT_MIN_PX
              ? 'dot'
              : (sizePx >= PLANET_3D_SWITCH_PX ? '3d' : 'sprite'));

      const distAU = Number((p as any).distAU ?? (p as any).distanceAU ?? NaN);

      // Extended visibility: keep while disk intersects viewport (non-ortho).
      const half = sizePx / 2;
      const intersectsX = !(screenX + half < viewport.x || screenX - half > viewport.x + viewport.w);
      const intersectsY = !(screenY + half < viewport.y || screenY - half > viewport.y + viewport.h);

      // For ortho, use projection visibility (front hemisphere). For others, use intersection.
      const visibleX = projectionMode === 'ortho' ? !!proj.visibleX : intersectsX;
      const visibleY = projectionMode === 'ortho' ? !!proj.visibleY : intersectsY;
      if (!visibleX && !visibleY) continue;

      // Direction of Sun on screen (unchanged)
      let angleToSunDeg: number;
      {
        const u0 = altAzToVec(az, alt);
        const uS = altAzToVec(astro.sun.az, astro.sun.alt);
        const dotUS = u0[0]*uS[0] + u0[1]*uS[1] + u0[2]*uS[2];

        const EPS_RAD = toRad(0.05);
        if (1 - Math.abs(dotUS) < 1e-9) {
          const alpha = Math.atan2(sunScreen.y - screenY, sunScreen.x - screenX);
          angleToSunDeg = norm360(toDeg(alpha) + 90);
        } else {
          const t = normalize3([uS[0] - dotUS*u0[0], uS[1] - dotUS*u0[1], uS[2] - dotUS*u0[2]]);
          const wF = normalize3([
            Math.cos(EPS_RAD)*u0[0] + Math.sin(EPS_RAD)*t[0],
            Math.cos(EPS_RAD)*u0[1] + Math.sin(EPS_RAD)*t[1],
            Math.cos(EPS_RAD)*u0[2] + Math.sin(EPS_RAD)*t[2],
          ]);
          const wB = normalize3([
            Math.cos(EPS_RAD)*u0[0] - Math.sin(EPS_RAD)*t[0],
            Math.cos(EPS_RAD)*u0[1] - Math.sin(EPS_RAD)*t[1],
            Math.cos(EPS_RAD)*u0[2] - Math.sin(EPS_RAD)*t[2],
          ]);

          const altF = toDeg(Math.asin(wF[2]));
          const azF  = norm360(toDeg(Math.atan2(wF[0], wF[1])));
          const altB = toDeg(Math.asin(wB[2]));
          const azB  = norm360(toDeg(Math.atan2(wB[0], wB[1])));

          const pF = projectToScreen(azF, altF, refAzDeg, viewport.w, viewport.h, refAltDeg, 0, fovXDeg, fovYDeg, projectionMode);
          const pB = projectToScreen(azB, altB, refAzDeg, viewport.w, viewport.h, refAltDeg, 0, fovXDeg, fovYDeg, projectionMode);

          const xF = viewport.x + pF.x, yF = viewport.y + pF.y;
          const xB = viewport.x + pB.x, yB = viewport.y + pB.y;

          const dxF = xF - screenX, dyF = yF - screenY;
          const dxB = xB - screenX, dyB = yB - screenY;

          const mF = Math.hypot(dxF, dyF);
          const mB = Math.hypot(dxB, dyB);

          const useBack = mB > mF;
          const alpha = Math.atan2(useBack ? dyB : dyF, useBack ? dxB : dxF);
          let deg = norm360(toDeg(alpha) + 90);
          if (useBack) deg = norm360(deg + 180);
          if (Math.max(mF, mB) < 1e-6) {
            const a = Math.atan2(sunScreen.y - screenY, sunScreen.x - screenX);
            deg = norm360(toDeg(a) + 90);
          }
          angleToSunDeg = deg;
        }
      }

      let phaseFrac = Number((p as any).phaseFraction);
      if (!Number.isFinite(phaseFrac)) {
        const sep = sepDeg(alt, az, astro.sun.alt, astro.sun.az);
        phaseFrac = clamp((1 + Math.cos((sep * Math.PI) / 180)) / 2, 0, 1);
      } else {
        phaseFrac = clamp(phaseFrac, 0, 1);
      }

      const rotationDeg = angleToSunDeg - 90;

      const ori = (p as any).orientationXYZDeg;
      const orientationDegX = Number.isFinite(ori?.x) ? Number(ori.x) : undefined;
      const orientationDegY = Number.isFinite(ori?.y) ? Number(ori.y) : undefined;
      const orientationDegZ = Number.isFinite(ori?.z) ? Number(ori.z) : undefined;

      const localUpAnglePlanetDeg = localUpAngleOnScreen(az, alt, {
        refAz: refAzDeg,
        refAlt: refAltDeg,
        viewport: { w: viewport.w, h: viewport.h },
        fovXDeg,
        fovYDeg,
        projectionMode,
      });

      let rotationToHorizonDegPlanet: number | undefined;
      try {
        const po = getPlanetOrientationAngles(date, latDeg, lngDeg, id as PlanetId);
        //console.log("planet orientation", id, po);
        rotationToHorizonDegPlanet =
          (po as any)?.rotationToHorizonDegPlanetNorth ??
          (po as any)?.rotationToHorizonDegPlanet ??
          (po as any)?.rotationToHorizonDeg ??
          undefined;
      } catch {}

      const rotationDegPlanetScreen =
        Number.isFinite(rotationToHorizonDegPlanet) && Number.isFinite(localUpAnglePlanetDeg)
          ? correctedSpriteRotationDeg(Number(rotationToHorizonDegPlanet), Number(localUpAnglePlanetDeg))
          : 0;

      //console.log("rotationDegPlanetScreen", id, rotationDegPlanetScreen);

      items.push({
        id,
        x: screenX, y: screenY,
        visibleX: intersectsX,
        visibleY: intersectsY,
        sizePx,
        color,
        phaseFrac,
        angleToSunDeg,
        mode,
        distAU,
        rotationDeg,
        planetAltDeg: alt,
        planetAzDeg: az,
        orientationDegX,
        orientationDegY,
        orientationDegZ,
        localUpAnglePlanetDeg,
        rotationToHorizonDegPlanet,
        rotationDegPlanetScreen,
      });
    }

    items.sort((a, b) => b.distAU - a.distAU);
    return items;
  }, [
    planetsEphemArr, showPlanets, refAzDeg, viewport.w, viewport.h, viewport.x, viewport.y,
    refAltDeg, fovXDeg, fovYDeg, projectionMode, enlargeObjects, astro.sun.az, astro.sun.alt,
    sunScreen.x, sunScreen.y, date, latDeg, lngDeg
  ]);

  const neededPlanetIds = useMemo(
    () => planetsRender.filter(planetNeeds3D).map(p => p.id as string),
    [planetsRender, planetNeeds3D]
  );

  // Keep only ready ids that are still needed
  useEffect(() => {
    setReadyPlanetIds(prev => {
      const next = new Set<string>();
      for (const id of neededPlanetIds) if (prev.has(id)) next.add(id);
      return next;
    });
  }, [neededPlanetIds]);

  // only gate on planets that have never been ready before
  const gatingPlanetIds = useMemo(
    () => neededPlanetIds.filter(id => !everReadyPlanetIds.has(id)),
    [neededPlanetIds, everReadyPlanetIds]
  );

  const markPlanetReady = useCallback((id: string) => {
    setReadyPlanetIds(prev => (prev.has(id) ? prev : new Set(prev).add(id)));
    // persist “ever ready”
    setEverReadyPlanetIds(prev => (prev.has(id) ? prev : new Set(prev).add(id)));
  }, []);

  const planetsReady = useMemo(() => {
    if (!gatingPlanetIds.length) return true;
    for (const id of gatingPlanetIds) if (!readyPlanetIds.has(id)) return false;
    return true;
  }, [gatingPlanetIds, readyPlanetIds]);

  // Scene readiness: show overlay only for the first time a body needs 3D and hasn't completed once yet
  const sceneReady = useMemo(
    () =>
      !glbLoading &&
      // Moon gates only until its first 3D render has completed
      ((everReadyMoon || !needMoon3D || moon3DReady) &&
       // Planets gate only for the subset that has never been ready before
       planetsReady),
    [glbLoading, everReadyMoon, needMoon3D, moon3DReady, planetsReady]
  );
  useEffect(() => { onSceneReadyChange?.(sceneReady); }, [sceneReady, onSceneReadyChange]);

  
  // Sun-on-Moon info (phase & limb)
  const sunOnMoonInfo = useMemo(() => sunOnMoon(date), [date]);
  const brightLimbAngleDeg = useMemo(() => sunOnMoonInfo.bearingDeg, [sunOnMoonInfo]);
  const maskAngleBase = useMemo(() => norm360(brightLimbAngleDeg - 90), [brightLimbAngleDeg]);
  const maskAngleDeg = useMemo(() => {
    const litVecAngle = norm360(maskAngleBase + 90);
    let d = norm360(litVecAngle - brightLimbAngleDeg); if (d > 180) d = 360 - d;
    return d > 90 ? norm360(maskAngleBase + 180) : maskAngleBase;
  }, [maskAngleBase, brightLimbAngleDeg]);
  const phaseFraction = astro.illum.fraction ?? 0;

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
    const p = projectToScreen(polarisAltAz.azDeg, polarisAltAz.altDeg, refAzDeg, viewport.w, viewport.h, refAltDeg, 0, fovXDeg, fovYDeg, projectionMode);
    return { ...p, x: viewport.x + p.x, y: viewport.y + p.y };
  }, [polarisAltAz, refAzDeg, refAltDeg, viewport, fovXDeg, fovYDeg, projectionMode]);
  
  const bodyHorizonItems = useMemo(() => {
    const out: BodyItem[] = [];
    if (showSun) {
      const az = astro.sun.az;
      const p = projectToScreen(az, 0, refAzDeg, viewport.w, viewport.h, refAltDeg, 0, fovXDeg, fovYDeg, projectionMode);
      if (p.visibleX) out.push({ x: p.x, az, label: "Soleil", color: "#f59e0b" });
    }
    if (showMoon) {
      const az = astro.moon.az;
      const p = projectToScreen(az, 0, refAzDeg, viewport.w, viewport.h, refAltDeg, 0, fovXDeg, fovYDeg, projectionMode);
      if (p.visibleX) out.push({ x: p.x, az, label: "Lune", color: "#93c5fd" });
    }
    {
      const az = polarisAltAz.azDeg;
      const p = projectToScreen(az, 0, refAzDeg, viewport.w, viewport.h, refAltDeg, 0, fovXDeg, fovYDeg, projectionMode);
      if (p.visibleX) out.push({ x: p.x, az, label: "Polaris", color: POLARIS_COLOR });
    }
    {
      const az = cruxAltAz.azDeg;
      const p = projectToScreen(az, 0, refAzDeg, viewport.w, viewport.h, refAltDeg, 0, fovXDeg, fovYDeg, projectionMode);
      if (p.visibleX) out.push({ x: p.x, az, label: "Croix du Sud", color: CRUX_COLOR });
    }
    for (const pl of planetsEphemArr) {
      const id = (pl as any).id as string;
      if (!showPlanets[id]) continue;
      const az = ((pl as any).azDeg ?? (pl as any).az) as number;
      const reg = PLANET_REGISTRY[id];
      if (az == null || !reg) continue;
      const pr = projectToScreen(az, 0, refAzDeg, viewport.w, viewport.h, refAltDeg, 0, fovXDeg, fovYDeg, projectionMode);
      if (pr.visibleX) out.push({ x: pr.x, az, label: reg.label, color: reg.color });
    }
    return out;
  }, [
    showSun, showMoon, astro.sun.az, astro.moon.az,
    polarisAltAz.azDeg, cruxAltAz.azDeg, planetsEphemArr, showPlanets,
    refAzDeg, refAltDeg, viewport, fovXDeg, fovYDeg, projectionMode
  ]);

  // Planet markers for Markers overlay
  const planetMarkers = useMemo(() => {
    return planetsRender
      .filter(pr => pr.visibleX && pr.visibleY)
      .map(pr => {
        const S = Math.max(1, Math.round(pr.sizePx));
        const reg = PLANET_REGISTRY[pr.id];
        return {
          screen: { x: pr.x, y: pr.y, visibleX: pr.visibleX, visibleY: pr.visibleY },
          label: reg?.label ?? pr.id,
          color: reg?.color ?? pr.color,
          size: { w: S, h: S },
        };
      });
  }, [planetsRender]);

  useEffect(() => {
    if (!longPoseEnabled || enlargeObjects) return;
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
  }, [longPoseEnabled, enlargeObjects, viewport.w, viewport.h]);

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
    longPoseRetainFrames,
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
    const retain = Math.max(1, Math.round(longPoseRetainFrames || 1));

    // Fade previous frames
    ctx.globalCompositeOperation = 'destination-out';
    ctx.globalAlpha = Math.min(1, 1 / retain);
    ctx.fillRect(0, 0, cssW, cssH);

    // Draw current canvases:
    // - Skip our persistence overlay
    // - Skip any canvas inside a [data-3d-layer="1"] wrapper (Moon3D/Planet3D)
    // - Include everything else (2D and Stars, even if WebGL)
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;

    const dstRect = overlay.getBoundingClientRect();
    const canvases = Array.from(root.querySelectorAll('canvas')) as HTMLCanvasElement[];

    const sources = canvases.filter((c) => {
      if (c === overlay) return false;
      const el = c as HTMLElement;
      if (el.closest('[data-3d-layer="1"]')) return false;
      return true;
    });

    for (const src of sources) {
      const srcRect = src.getBoundingClientRect();
      if (srcRect.width <= 0 || srcRect.height <= 0) continue;

      const sxPerCss = src.width / srcRect.width;
      const syPerCss = src.height / srcRect.height;

      const sx = Math.max(0, (dstRect.left - srcRect.left) * sxPerCss);
      const sy = Math.max(0, (dstRect.top  - srcRect.top ) * syPerCss);
      const sWidth  = Math.max(0, Math.min(src.width  - sx, dstRect.width  * sxPerCss));
      const sHeight = Math.max(0, Math.min(src.height - sy, dstRect.height * syPerCss));

      try {
        ctx.drawImage(src, sx, sy, sWidth, sHeight, 0, 0, cssW, cssH);
      } catch {
        // ignore
      }
    }

    // Manual persistence for sprites/dots (Sun, Moon, planets)
    const drawDisk = (x: number, y: number, w: number, h: number, color: string) => {
      const r = Math.max(1, Math.round(Math.max(w, h) / 2));
      const lx = x - viewport.x, ly = y - viewport.y;
      ctx.beginPath();
      ctx.arc(lx, ly, r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    };

    if (showSun && sunScreen.visibleX && sunScreen.visibleY) {
      drawDisk(sunScreen.x, sunScreen.y, bodySizes.sun.w, bodySizes.sun.h, '#f59e0b');
    }

    if (showMoon &&
        (moonRenderModeEffective === 'dot' || moonRenderModeEffective === 'sprite') &&
        moonScreen.visibleX && moonScreen.visibleY) {
      drawDisk(moonScreen.x, moonScreen.y, bodySizes.moon.w, bodySizes.moon.h, '#93c5fd');
    }

    for (const p of planetsRender) {
      if (!p.visibleX || !p.visibleY) continue;
      const S = Math.max(4, Math.round(p.sizePx));
      if (p.mode === 'dot' || p.mode === 'sprite') {
        drawDisk(p.x, p.y, S, S, p.color);
      }
    }
  }, [
    viewport.x, viewport.y, viewport.w, viewport.h,
    longPoseRetainFrames,
    showSun, showMoon,
    sunScreen.x, sunScreen.y, sunScreen.visibleX, sunScreen.visibleY, bodySizes.sun.w, bodySizes.sun.h,
    moonScreen.x, moonScreen.y, moonScreen.visibleX, moonScreen.visibleY, bodySizes.moon.w, bodySizes.moon.h,
    moonRenderModeEffective,
    planetsRender,
  ]);

  // Timelapse mode: accumulate once per utcMs change and ACK
useEffect(() => {
  if (!longPoseEnabled || enlargeObjects || !timeLapseEnabled) return;
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
  enlargeObjects,
  timeLapseEnabled,
  compositeLongPose,
  onLongPoseAccumulated,
]);

// Burst composite after toggling Stars ON (works in TL and smooth modes)
useEffect(() => {
  if (!longPoseEnabled || enlargeObjects) return;
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
}, [showStars, longPoseEnabled, enlargeObjects, compositeLongPose]);

// Smooth mode: continuous RAF compositor (no ACK)
useEffect(() => {
  if (!longPoseEnabled || enlargeObjects || timeLapseEnabled) return;
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
}, [longPoseEnabled, enlargeObjects, timeLapseEnabled, compositeLongPose]);



  

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
    longPoseRetainFrames,

    // Observer/location
    latDeg, lngDeg,
    // Camera orientation
    // refAzDeg, refAltDeg,

    // Projection/scale/viewport
    projectionMode, fovXDeg, fovYDeg,
    viewport.x, viewport.y, viewport.w, viewport.h,

    // Rendering toggles that affect content
    showEarth, showAtmosphere, showGrid, showHorizon, showMarkers,
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
        <div className="absolute inset-0" style={{ zIndex: Z.horizon - 0, pointerEvents: 'none' }}>
          <Ground
            viewport={viewport}
            refAzDeg={refAzDeg}
            refAltDeg={refAltDeg}
            fovXDeg={fovXDeg}
            fovYDeg={fovYDeg}
            projectionMode={projectionMode}
            date={date}
            latDeg={latDeg}
            lngDeg={lngDeg}
            showEarth={showEarth}
            debugMask={debugMask}
          />
        </div>
      )}

      {/* Horizon & Cardinal markers */}
      {showHorizon && (
        <div
          className="absolute"
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
          />
          <CardinalMarkers
            viewport={viewport}
            refAzDeg={refAzDeg}
            refAltDeg={refAltDeg}
            fovXDeg={fovXDeg}
            fovYDeg={fovYDeg}
            projectionMode={projectionMode}
            bodyItems={bodyHorizonItems}
          />
        </div>
      )}

      {/* Grid */}
      {showGrid && (
        <div
          className="absolute"
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
          />
        </div>
      )}

      {/* Ecliptique (pointillé) */}
      <div
        className="absolute"
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
        />
      </div>

      {/* Atmosphere */}
      {showAtmosphere && (
        <div
          className="absolute"
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
          />
        </div>
      )}

      {/* Sun */}
      {showSun && (
        <div className="absolute inset-0" style={{ zIndex: Z.horizon - 2, pointerEvents: 'none' }}>
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

      {/* Moon */}
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

      {showMoon && !glbLoading && moonRenderModeEffective === '3d' && moonScreen.visibleX && moonScreen.visibleY && (
         <div className="absolute inset-0" style={{ zIndex: Z.horizon - 1 }} data-3d-layer="1">
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
            // NEW: mark first-time readiness and persist it
            onReady={() => { setMoon3DReady(true); setEverReadyMoon(true); }}
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
              rotationDeg={p.rotationDegPlanetScreen}
              angleToSunDeg={p.angleToSunDeg} // FIX: was rotationDegPlanetScreen
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

        // effectiveMode === '3d'
        return (
          <div key={p.id} className="absolute inset-0" style={{ zIndex: z, pointerEvents: 'none' }} data-3d-layer="1">
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
              rotationDeg={p.rotationDegPlanetScreen}
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
      {longPoseEnabled && !enlargeObjects && (
        <canvas
          ref={lpCanvasRef}
          className="absolute"
          gl={{ preserveDrawingBuffer: true }}
            onCreated={({ gl }) => {
            gl.domElement.setAttribute('data-stars-canvas', '1');
          }}
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
      {showHud && (
        <>
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
            {`Azimut : ${Number(refAzDeg).toFixed(1)}° - ${compass16(refAzDeg)}`}
          </div>

          {/* Bas droite: Lune ou sous l'horizon (marge demi-diamètre) */}
          <div
            className="absolute right-2 bottom-2 text-sm text-white/60 bg-black/30 px-2 py-1 rounded border border-white/10"
            style={{ zIndex: Z.ui }}
          >
            {astro.moon.alt + astro.moon.appDiamDeg / 2 < 0
              ? "Lune sous l'horizon"
              : `Lune Alt. ${formatDeg(astro.moon.alt, 0)} Az ${formatDeg(astro.moon.az, 1)} (${compass16(astro.moon.az)})`}
          </div>

          {/* Bas gauche: Soleil ou sous l'horizon (marge demi-diamètre) */}
          <div
            className="absolute left-2 bottom-2 text-sm text-white/60 bg-black/30 px-2 py-1 rounded border border-white/10"
            style={{ zIndex: Z.ui }}
          >
            {astro.sun.alt + astro.sun.appDiamDeg / 2 < 0
              ? "Soleil sous l'horizon"
              : `Soleil Alt. ${formatDeg(astro.sun.alt, 0)} Az ${formatDeg(astro.sun.az, 1)} (${compass16(astro.sun.az)})`}
          </div>

          {/* Haut gauche: Appareil et zoom */}
          <div
            className="absolute top-2 left-2 text-sm text-white/60 bg-black/30 px-2 py-1 rounded border border-white/10"
            style={{ zIndex: Z.ui }}
          >
            <div className="flex flex-col leading-tight">
              <div>Simulation {domainFromBrowser}</div>
              {cameraLabel ? <div>{cameraLabel}</div> : null}
              {enlargeObjects ? <div>(Taille des objets exagérée artificiellement)</div> : null}
            </div>
          </div>

          {/* Gauche centrée: Altitude observateur (refAltDeg) */}
          <div
            className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-white/60 bg-black/30 px-2 py-1 rounded border border-white/10"
            style={{ zIndex: Z.ui }}
          >
             Altitude : <span className={refAltDeg < 0 ? 'text-red-400' : undefined}>{formatDeg(refAltDeg, 0)}</span>
          </div>
        </>
      )}
    </div>
  );
});