import React, { useMemo } from "react";
import { useTranslation } from 'react-i18next';
import type { FollowMode } from "../../types";
import type { Device, ZoomModule } from "../../optics/types";
import { clamp } from "../../utils/math";
import { FOV_DEG_MIN, FOV_DEG_MAX } from "../../optics/fov";
// planets registry for UI toggles
import { getPlanetRegistry, PLANETS } from "../../render/PlanetRegistry";
// NEW: projection helpers
import { getValidProjectionModes, pickIdealProjection } from "../../render/projection";
import type { ProjectionMode } from "../../render/projection";

export type Viewport = { x: number; y: number; w: number; h: number };

type Props = {
  follow: FollowMode;
  setFollow: (f: FollowMode) => void;

  devices: Device[];
  deviceId: string;
  setDeviceId: (id: string) => void;
  zoomOptions: ZoomModule[];
  zoomId: string;
  setZoomId: (id: string) => void;
  CUSTOM_DEVICE_ID: string;

  fovXDeg: number;
  fovYDeg: number;
  setFovXDeg: (v: number) => void;
  setFovYDeg: (v: number) => void;
  linkFov: boolean;
  setLinkFov: (v: boolean) => void;

  viewport: Viewport;

  onCommitWhenMs: (ms: number) => void;
  setIsAnimating: (v: boolean) => void;
  isAnimating: boolean;
  speedMinPerSec: number;
  setSpeedMinPerSec: (v: number) => void;

  showSun: boolean;
  setShowSun: (v: boolean) => void;
  showMoon: boolean;
  setShowMoon: (v: boolean) => void;
  showPhase: boolean;
  setShowPhase: (v: boolean) => void;
  rotOffsetDegX: number;
  setRotOffsetDegX: (v: number) => void;
  rotOffsetDegY: number;
  setRotOffsetDegY: (v: number) => void;
  rotOffsetDegZ: number;
  setRotOffsetDegZ: (v: number) => void;
  camRotDegX: number;
  setCamRotDegX: (v: number) => void;
  camRotDegY: number;
  setCamRotDegY: (v: number) => void;
  camRotDegZ: number;
  setCamRotDegZ: (v: number) => void;
  earthshine: boolean;
  setEarthshine: (v: boolean) => void;
  showSunCard: boolean;
  setShowSunCard: (v: boolean) => void;
  showEcliptique: boolean;
  setShowEcliptique: (v: boolean) => void;
  showMoonCard: boolean;
  setShowMoonCard: (v: boolean) => void;
  debugMask: boolean;
  setDebugMask: (v: boolean) => void;
  timeZone: string;
  enlargeObjects: boolean;
  setEnlargeObjects: (v: boolean) => void;
  showHorizon: boolean;
  setShowHorizon: (v: boolean) => void;

  lockHorizon: boolean;
  setLockHorizon: (v: boolean) => void;

  currentUtcMs: number;
  cityName: string;

  showEarth: boolean;
  setShowEarth: (v: boolean) => void;

  showAtmosphere: boolean;
  setShowAtmosphere: (v: boolean) => void;

  showRefraction: boolean;
  setShowRefraction: (v: boolean) => void;

  showStars: boolean;
  setShowStars: (v: boolean) => void;

  showMarkers: boolean;
  setShowMarkers: (v: boolean) => void;

  showGrid: boolean;
  setShowGrid: (v: boolean) => void;

  projectionMode: ProjectionMode;
  setProjectionMode: (m: ProjectionMode) => void;
  
  showPlanets: Record<string, boolean>;
  setShowPlanets: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;

  // --- NEW: Time-lapse controls ---
  timeLapseEnabled: boolean;
  setTimeLapseEnabled: (v: boolean) => void;
  timeLapsePeriodMs: number;
  setTimeLapsePeriodMs: (n: number) => void;
  timeLapseStepValue: number;
  setTimeLapseStepValue: (n: number) => void;
  timeLapseStepUnit: 'minute' | 'hour' | 'day' | 'sidereal-day' | 'month' | 'lunar-fraction' | 'synodic-fraction' ;
  setTimeLapseStepUnit: (u: 'minute' | 'hour' | 'day' | 'sidereal-day' | 'month' | 'lunar-fraction' | 'synodic-fraction' ) => void;
  timeLapseLoopAfter: number; // 0 => no loop
  setTimeLapseLoopAfter: (n: number) => void;

  onTimeLapsePrevFrame: () => void;
  onTimeLapseNextFrame: () => void;
  timeLapseStartMs: number;

  longPoseEnabled: boolean;
  setLongPoseEnabled: (v: boolean) => void;
  longPoseRetainFrames: number;
  setLongPoseRetainFrames: (n: number) => void;

  onLongPoseClear: () => void;

  isMobileScreen: boolean;
  isLandscapeMode: boolean;
  isPortraitMode: boolean;
  urlRestoredRef: React.MutableRefObject<boolean>;
  lastOrientationChangeRef: React.MutableRefObject<number>;
  
  // NEW: Close panels callback for mobile
  onClosePanels?: () => void;
};

export default function TopBar({
  follow, setFollow,
  devices, deviceId, setDeviceId, zoomOptions, zoomId, setZoomId, CUSTOM_DEVICE_ID,
  fovXDeg, fovYDeg, setFovXDeg, setFovYDeg, 
  viewport, onCommitWhenMs, setIsAnimating, isAnimating, speedMinPerSec, setSpeedMinPerSec,
  showSun, setShowSun, showMoon, setShowMoon, showPhase, setShowPhase,
  rotOffsetDegX, setRotOffsetDegX, rotOffsetDegY, setRotOffsetDegY, rotOffsetDegZ, setRotOffsetDegZ,
  camRotDegX, setCamRotDegX, camRotDegY, setCamRotDegY, camRotDegZ, setCamRotDegZ,
  earthshine, setEarthshine,
  showEcliptique, setShowEcliptique, showMoonCard, setShowMoonCard, debugMask, setDebugMask,
  timeZone,
  enlargeObjects, setEnlargeObjects,
  showHorizon, setShowHorizon,
  lockHorizon, setLockHorizon,
  currentUtcMs,
  cityName,
  showEarth, setShowEarth,
  showAtmosphere, setShowAtmosphere,
  showRefraction, setShowRefraction,
  showStars, setShowStars,
  showMarkers, setShowMarkers,
  showGrid, setShowGrid,
  projectionMode, setProjectionMode,
  showPlanets, setShowPlanets,

  // --- NEW: Time-lapse controls ---
  timeLapseEnabled, setTimeLapseEnabled,
  timeLapsePeriodMs, setTimeLapsePeriodMs,
  timeLapseStepValue, setTimeLapseStepValue,
  timeLapseStepUnit, setTimeLapseStepUnit,
  timeLapseLoopAfter, setTimeLapseLoopAfter,
  onTimeLapsePrevFrame, onTimeLapseNextFrame,
  timeLapseStartMs,

  longPoseEnabled, setLongPoseEnabled,
  
  onLongPoseClear,

  isMobileScreen,
  isPortraitMode,
  urlRestoredRef,
  lastOrientationChangeRef,
  
  // NEW: Close panels callback for mobile
  onClosePanels,
}: Props) {
  const { t } = useTranslation('ui');
  
  // Tab system state
  const [activeTab, setActiveTab] = React.useState<'datetime' | 'tracking' | 'fov' | 'animation' | 'visibility' | 'assistance'>('datetime');
  
  // Dynamic planet registry that updates with language changes
  const PLANET_REGISTRY = getPlanetRegistry();
  
  // Browser local time and UTC time
  const currentDate = useMemo(() => new Date(currentUtcMs), [currentUtcMs]);
  
  const browserLocalTimeString = useMemo(() => {
    // Format for datetime-local input
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const hours = String(currentDate.getHours()).padStart(2, '0');
    const minutes = String(currentDate.getMinutes()).padStart(2, '0');
    const seconds = String(currentDate.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  }, [currentDate]);

  // Format the timelapse start time in city timezone and UTC
  const tlStartLabel = React.useMemo(() => {
    const d = new Date(timeLapseStartMs);
    onLongPoseClear();
    return d.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
  }, [timeLapseStartMs]);

  

  
  // Build "HH:MM in CityName (HH:MM UTC)"
  const { cityHM, utcHM } = useMemo(() => {
    const hmFmt = new Intl.DateTimeFormat('fr-FR', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const hmParts = hmFmt.formatToParts(currentDate).reduce<Record<string, string>>((acc, p) => {
      if (p.type !== 'literal') acc[p.type] = p.value;
      return acc;
    }, {});
    const cityHM = `${hmParts.hour ?? '00'}:${hmParts.minute ?? '00'}`;
    const utcHM = currentDate.toISOString().slice(11, 16);
    return { cityHM, utcHM };
  }, [currentDate, timeZone]);

  // Local state for datetime input to prevent instability
  const [localDateTimeInput, setLocalDateTimeInput] = React.useState(browserLocalTimeString);
  const [isEditing, setIsEditing] = React.useState(false);
  
  // --- NEW: Local editable strings for Time-lapse integer fields ---
  const [tlPeriodStr, setTlPeriodStr] = React.useState(String(timeLapsePeriodMs));
  const [tlStepValueStr, setTlStepValueStr] = React.useState(String(Math.max(1, Math.round(timeLapseStepValue || 1))));
  const [tlLoopAfterStr, setTlLoopAfterStr] = React.useState(String(timeLapseLoopAfter));

  const [editingTlPeriod, setEditingTlPeriod] = React.useState(false);
  const [editingTlStep, setEditingTlStep] = React.useState(false);
  const [editingTlLoop, setEditingTlLoop] = React.useState(false);

  React.useEffect(() => { if (!editingTlPeriod) setTlPeriodStr(String(timeLapsePeriodMs)); }, [timeLapsePeriodMs, editingTlPeriod]);
  React.useEffect(() => { if (!editingTlStep) setTlStepValueStr(String(Math.max(1, Math.round(timeLapseStepValue || 1)))); }, [timeLapseStepValue, editingTlStep]);
  React.useEffect(() => { if (!editingTlLoop) setTlLoopAfterStr(String(timeLapseLoopAfter)); }, [timeLapseLoopAfter, editingTlLoop]);

  const sanitizeInt = (s: string, min: number, max?: number, fallback?: number) => {
    const n = parseInt(s, 10);
    if (!Number.isFinite(n)) return fallback ?? min;
    let v = n;
    if (max != null) v = Math.min(v, max);
    v = Math.max(v, min);
    return v;
  };

  const commitTlPeriod = () => {
    const v = sanitizeInt(tlPeriodStr, 1, 1000, timeLapsePeriodMs);
    setTimeLapsePeriodMs(v);
    setTlPeriodStr(String(v));
  };
  const commitTlStep = () => {
    const v = sanitizeInt(tlStepValueStr, 1, undefined, Math.max(1, Math.round(timeLapseStepValue || 1)));
    setTimeLapseStepValue(v);
    setTlStepValueStr(String(v));
  };
  const commitTlLoop = () => {
    const v = sanitizeInt(tlLoopAfterStr, 0, undefined, timeLapseLoopAfter);
    setTimeLapseLoopAfter(v);
    setTlLoopAfterStr(String(v));
  };
  // Time-lapse per-frame label (e.g., "2 mois par image")
  const timeLapsePerFrameLabel = React.useMemo(() => {
    if (!timeLapseEnabled) return '';
    const n = Math.max(1, Math.round(timeLapseStepValue || 1));
    const label =
      timeLapseStepUnit === 'minute' ? (n > 1 ? t('time.minutes') : t('time.minute')) :
      timeLapseStepUnit === 'hour' ? (n > 1 ? t('time.heures') : t('time.hour')) :
      timeLapseStepUnit === 'day' ? (n > 1 ? t('time.jours') : t('time.jour')) :
      timeLapseStepUnit === 'sidereal-day' ? (n > 1 ? t('time.sidereal.days') : t('time.sidereal.day')) :
      timeLapseStepUnit === 'month' ? t('time.mois') :
      timeLapseStepUnit === 'synodic-fraction' ? (n > 1 ? t('time.lunar.days') : t('time.lunar.day')) :
      timeLapseStepUnit === 'lunar-fraction' ? (n > 1 ? t('time.lunar.cycles') : t('time.lunar.cycle')) :
      '';
    return `${n} ${label} ${t('time.perFrame')}`;
  }, [timeLapseEnabled, timeLapseStepValue, timeLapseStepUnit, t]);

  // Update local input when UTC time changes externally (e.g., from animation)
  // but only if user is not currently editing
  React.useEffect(() => {
    if (!isEditing) {
      setLocalDateTimeInput(browserLocalTimeString);
    }
  }, [browserLocalTimeString, isEditing]);

  // ADD: focal-length based FOV control (24x36 eq)
  const FF_WIDTH_MM = 36;
  const FF_HEIGHT_MM = 24;
  const FOCAL_MIN_MM = 1; // Changed from 10 to 1
  const FOCAL_MAX_MM = 4100;

  // STATIC slider config (sensibilité). Ajustez ces valeurs au besoin.
  const FOCAL_SLIDER_RES = 1000; // résolution du slider (0..1000)
  const FOCAL_SENSITIVITY = [
    { to: 10,   weight: 0.25, gamma: 0.85 }, // plus de précision sous 10 mm
    { to: 100,  weight: 0.25, gamma: 1.00 }, // standard 10-100 mm
    { to: 1000, weight: 0.25, gamma: 1.10 }, // moins sensible 100-1000 mm
    { to: FOCAL_MAX_MM, weight: 0.25, gamma: 1.20 }, // encore moins sensible au-delà
  ] as const;

  // Pré-calcul des segments de sensibilité
  const focalSliderSegments = useMemo(() => {
    const sumW = FOCAL_SENSITIVITY.reduce((a, s) => a + s.weight, 0) || 1;
    const norm = FOCAL_SENSITIVITY.map(s => ({ ...s, weight: s.weight / sumW }));
    const segs: {
      min: number; max: number; weight: number; gamma: number;
      cumStart: number; cumEnd: number; logMin: number; logMax: number;
    }[] = [];
    let prev = FOCAL_MIN_MM;
    let acc = 0;
    for (const s of norm) {
      const seg = {
        min: prev,
        max: s.to,
        weight: s.weight,
        gamma: s.gamma,
        cumStart: acc,
        cumEnd: acc + s.weight,
        logMin: Math.log(prev),
        logMax: Math.log(s.to),
      };
      segs.push(seg);
      acc += s.weight;
      prev = s.to;
    }
    // Corriger les bordures flottantes
    if (segs.length) segs[segs.length - 1].cumEnd = 1;
    return segs;
  }, []); // statique

  // Mapping slider -> focale (mm)
  const sliderToFocalMm = (sliderVal: number) => {
    const s = clamp(sliderVal / FOCAL_SLIDER_RES, 0, 1);
    const seg = focalSliderSegments.find(x => s <= x.cumEnd) ?? focalSliderSegments[focalSliderSegments.length - 1];
    const local = seg.weight > 0 ? clamp((s - seg.cumStart) / seg.weight, 0, 1) : 0;
    const t = Math.pow(local, seg.gamma);
    const ln = seg.logMin + t * (seg.logMax - seg.logMin);
    const mm = Math.exp(ln);
    return clamp(mm, FOCAL_MIN_MM, FOCAL_MAX_MM);
  };

  // Mapping focale (mm) -> slider
  const focalMmToSlider = (mm: number) => {
    const f = clamp(mm, FOCAL_MIN_MM, FOCAL_MAX_MM);
    const seg = focalSliderSegments.find(x => f <= x.max + 1e-9) ?? focalSliderSegments[focalSliderSegments.length - 1];
    const t = (Math.log(f) - seg.logMin) / Math.max(1e-9, (seg.logMax - seg.logMin));
    const local = Math.pow(clamp(t, 0, 1), 1 / Math.max(1e-9, seg.gamma));
    const s = seg.cumStart + local * seg.weight;
    return Math.round(clamp(s, 0, 1) * FOCAL_SLIDER_RES);
  };

  const currentFocalMm = useMemo(() => {
    // Derive current focal from fovXDeg (horizontal FOV)
    const rad = (Math.PI / 180) * fovXDeg;
    const tanHalf = Math.tan(rad / 2);
    if (tanHalf <= 0) return FOCAL_MAX_MM;
    const f = FF_WIDTH_MM / (2 * tanHalf);
    return clamp(f, FOCAL_MIN_MM, FOCAL_MAX_MM);
  }, [fovXDeg]);

  const setFovFromFocal = (focalMm: number) => {
    if (deviceId !== CUSTOM_DEVICE_ID) { setDeviceId(CUSTOM_DEVICE_ID); setZoomId('custom-theo'); }
    const f = clamp(focalMm, FOCAL_MIN_MM, FOCAL_MAX_MM);
    const fx = 2 * Math.atan(FF_WIDTH_MM / (2 * f)) * 180 / Math.PI;
    const fy = 2 * Math.atan(FF_HEIGHT_MM / (2 * f)) * 180 / Math.PI;
    setFovXDeg(clamp(fx, FOV_DEG_MIN, FOV_DEG_MAX));
    setFovYDeg(clamp(fy, FOV_DEG_MIN, FOV_DEG_MAX));
  };

  // normalize planets to {id,label} for UI
  const uiPlanets = useMemo(() => {
    return PLANETS.map((p: any) => {
      const id = (typeof p === 'string') ? p : (p?.id ?? String(p));
      const label = PLANET_REGISTRY?.[id as keyof typeof PLANET_REGISTRY]?.label ?? p?.label ?? id;
      return { id, label };
    });
  }, [PLANET_REGISTRY]);
  

  // Projections valides pour le FOV courant
  const validProjectionModes = React.useMemo(
    () => getValidProjectionModes(fovXDeg, fovYDeg, viewport.w, viewport.h),
    [fovXDeg, fovYDeg, viewport.w, viewport.h]
  );

  // Auto-switch sur la projection idéale à chaque changement de W/H affichable
  // et changement de focale (donc FOV) — sans écraser un mode valide provenant de l’URL.
  React.useEffect(() => {
    // Sur mobile, ne recalcule la projection idéale que si:
    // 1. On est en mode paysage
    // 2. L'URL a été complètement restaurée (évite d'écraser la projection de l'URL)
    // 3. Au moins 600ms se sont écoulées depuis le dernier changement d'orientation
    const timeSinceOrientationChange = Date.now() - lastOrientationChangeRef.current;
    if (isMobileScreen && (isPortraitMode || !urlRestoredRef.current || timeSinceOrientationChange < 600)) {
      return; // Ne pas recalculer
    }
    
    const next = pickIdealProjection(
      fovXDeg,
      fovYDeg,
      projectionMode,
      viewport.w,
      viewport.h,
      'keep-if-valid' // conserve la projection actuelle si elle reste valide
    );
    if (next !== projectionMode) {
      setProjectionMode(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fovXDeg, fovYDeg, viewport.w, viewport.h, isPortraitMode, isMobileScreen]);



  // Icônes SVG pour les projections
  type ProjectionId = ProjectionMode;
  const ProjectionIcon: React.FC<{ id: ProjectionId; active?: boolean; label?: string }> = ({ id, label }) => {
    const stroke = 'currentColor';
    const strokeWidth = 1.5;
    const common = { fill: 'none', stroke, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
    return (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        role="img"
        aria-hidden={label ? undefined : true}
        className="shrink-0 pointer-events-none select-none" // make SVG fully pass-through for clicks
      >
        {label ? <title>{label}</title> : null}


        {/* Recti/Panini: cadre rectangulaire + grille à lignes droites */}
        {id === 'recti-panini' && (
          <>
            <rect x="3" y="5" width="18" height="14" rx="2" {...common} />
            <path d="M9 5v14M15 5v14M3 10h18M3 14h18" {...common} />
          </>
        )}

        {/* Stéréographique: cercle 'fisheye' + méridiens/parallèles courbés */}
        {id === 'stereo-centered' && (
          <>
            <circle cx="12" cy="12" r="8" {...common} />
            <path d="M4 12c2.5-4 13.5-4 16 0M4 12c2.5 4 13.5 4 16 0" {...common} />
            <path d="M12 4c-4 2.5-4 13.5 0 16M12 4c4 2.5 4 13.5 0 16" {...common} />
          </>
        )}

        {/* Orthographique: cercle inscrit dans un carré */}
        {id === 'ortho' && (
          <>
            <rect x="4" y="4" width="16" height="16" rx="2" {...common} />
            <circle cx="12" cy="12" r="6.5" {...common} />
          </>
        )}

        {/* Cylindrique: rectangle + arcs supérieur/inférieur (section de cylindre) + méridiens verticaux */}
        {id === 'cylindrical' && (
          <>
            <rect x="3" y="5" width="18" height="14" rx="2" {...common} />
            {/* arcs haut/bas */}
            <path d="M5 8c3-3 11-3 14 0" {...common} />
            <path d="M5 16c3 3 11 3 14 0" {...common} />
            {/* méridiens */}
            <path d="M9 5v14M15 5v14" {...common} />
            {/* équateur */}
            <path d="M3 12h18" {...common} />
          </>
        )}
        {/* Cylindrique horizon: horizon plat + méridiens, verrouillé sur le 'up' monde */}
        {id === 'cylindrical-horizon' && (
          <>
            <rect x="3" y="5" width="18" height="14" rx="2" {...common} />
            {/* méridiens */}
            <path d="M9 5v14M15 5v14" {...common} />
            {/* horizon plat */}
            <path d="M3 12h18" {...common} />
            {/* petit indicateur 'up' (flèche vers le haut) */}
            <path d="M12 8V6M12 6l-1.5 1.5M12 6l1.5 1.5" {...common} />
          </>
        )}

        {/* Rectilinéaire (perspective pure): lignes droites et diagonales (vanishing) */}
        {id === 'rectilinear' && (
          <>
            <rect x="3" y="5" width="18" height="14" rx="2" {...common} />
            {/* croix centrale */}
            <path d="M12 5v14M3 12h18" {...common} />
            {/* diagonales */}
            <path d="M3 5l18 14M21 5L3 19" {...common} />
          </>
        )}
      </svg>
    );
  };

   // --- NEW: Generic toggle icon set used by icon-only buttons ---
  type ToggleIconId =
    | 'enlarge' | 'horizon' | 'earth' | 'atmo' | 'phase' | 'earthshine'
    | 'sun' | 'moon' | 'planet' | 'stars'
    | 'grid' | 'markers'
    | 'sunCard' | 'ecliptic' | 'moonCard'
    | 'debug'
    | 'timelapse' | 'longpose'
    | 'clear'
    | 'refraction';

  const ToggleIcon: React.FC<{ id: ToggleIconId; label?: string }> = ({ id,  label }) => {
    const stroke = 'currentColor';
    const fillColor = 'currentColor';
    const strokeWidth = 1.7;
    const s = { fill: 'none', stroke, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
    return (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        role="img"
        aria-hidden={label ? undefined : true}
        className="shrink-0 pointer-events-none select-none"
      >
        {label ? <title>{label}</title> : null}

        {/* Enlarge: loupe + signe plus */}
        {id === 'enlarge' && (
          <>
            <circle cx="10" cy="10" r="5" {...s} />
            <path d="M14.5 14.5L19 19" {...s} />
            <path d="M10 7.5v5M7.5 10h5" {...s} />
          </>
        )}

        {/* Horizon: ligne d'horizon plate */}
        {id === 'horizon' && (
          <>
            <circle cx="12" cy="12" r="8" {...s} strokeDasharray="2 3" />
            <path d="M4 12A8 8 0 0 1 20 12L4 12Z" fill="#000" />
            <path d="M20 12A8 8 0 0 1 4 12L20 12Z" fill="#000" />
            <path d="M3 12h18" {...s} stroke="rgba(243, 76, 196, 1)" />
          </>
        )}

        {/* Earth (ground): demi-disque en bas */}
        {id === 'earth' && (
          <>
            {/* Cercle pointillé */}
            <circle cx="12" cy="12" r="8" {...s} strokeDasharray="2 3" />
            {/* Remplissage de l’hémisphère inférieur */}
            <path d="M4 12A8 8 0 0 1 20 12L4 12Z" fill="#000" />
            <path d="M20 12A8 8 0 0 1 4 12L20 12Z" fill="#479b47ff" />
            {/* Ligne d’horizon pleine */}
            
          </>
        )}

        {/* Atmosphere: arcs concentriques */}
        {id === 'atmo' && (
          <>
            {/* Cercle pointillé */}
            <circle cx="12" cy="12" r="8" {...s} strokeDasharray="2 3" />
            <path d="M4 12A8 8 0 0 1 20 12L4 12Z" fill="#4c57f3ff" />
            <path d="M20 12A8 8 0 0 1 4 12L20 12Z" fill="#000" />
             {/* Ligne d’horizon pleine */}
            
          </>
        )}

        {/* Phase: croissant de Lune */}
        {id === 'phase' && (
          <>
            <circle cx="12" cy="12" r="10" {...s} stroke={stroke} />
            <path d="M4 12A8 8 0 0 1 20 12L4 12Z" fill="hsla(0, 85%, 54%, 1.00)" />
            <path d="M20 12A8 8 0 0 1 4 12L20 12Z" fill="hsla(0, 85%, 54%, 1.00)" />
            <path 
              d="M12 3 A 9 9 0 0 1 12 21 A 3.5 9 0 0 0 12 3 Z"
              {...s} stroke={stroke} fill={stroke} />
          </>
        )}

        {/* Earthshine: croissant + halo */}
        {id === 'earthshine' && (
          <>
            <circle cx="12" cy="12" r="10" {...s} stroke={stroke} />
            <path d="M4 12A8 8 0 0 1 20 12L4 12Z" fill="hsla(240, 70%, 68%, 1.00)" />
            <path d="M20 12A8 8 0 0 1 4 12L20 12Z" fill="hsla(240, 70%, 68%, 1.00)" />
            <path 
              d="M12 3 A 9 9 0 0 1 12 21 A 3.5 9 0 0 0 12 3 Z"
              {...s} stroke={stroke} fill={stroke}/>
          </>
        )}

        {/* Sun: disque + rayons */}
        {id === 'sun' && (
          <>
            <circle cx="12" cy="12" r="4" {...s} fill="#FFD54A" />
            <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" {...s} />
          </>
        )}

        {/* Moon: croissant simple */}
        {id === 'moon' && (
          <>
            <circle cx="12" cy="12" r="10" {...s} stroke={stroke} />
            <path d="M4 12A8 8 0 0 1 20 12L4 12Z" fill="#000" />
            <path d="M20 12A8 8 0 0 1 4 12L20 12Z" fill="#000" />
            <path 
              d="M12 3 A 9 9 0 0 1 12 21 A 3.5 9 0 0 0 12 3 Z"
              {...s} stroke={stroke} fill={stroke} />
          </>
        )}

        {/* Planet: planète à anneau */}
        {id === 'planet' && (
          <>
            <circle cx="12" cy="12" r="3.5" {...s} />
            <ellipse cx="12" cy="12" rx="7" ry="2.8" transform="rotate(-20 12 12)" {...s} />
          </>
        )}

        {/* Stars: étoile + petites étoiles */}
        {id === 'stars' && (
          <g transform="translate(12 12) scale(1.6) translate(-11.5 -10)">
            <path d="M12 6l1.2 2.6 2.8.4-2 2 0.5 2.9L12 13.4 9.5 14.9 10 12 8 9l2.8-.4L12 6z" {...s} stroke={stroke} />
            <path d="M5 7.5h0M18.5 8.5h0M6.5 16.5h0" stroke={stroke} strokeWidth={2} strokeLinecap="round" />
          </g>
        )}

        {/* Grid: grille */}
        {id === 'grid' && (
          <>
            {/* Parallels */}
            <path d="M4 9c3-3 13-3 16 0" {...s} stroke="hsla(29, 85%, 51%, 1.00)"/>
            <path d="M4 15c3 3 13 3 16 0" {...s} stroke="hsla(29, 85%, 51%, 1.00)"/>
            {/* Meridians */}
            <path d="M9 4c-2.5 3.5-2.5 12.5 0 16" {...s} stroke="hsla(29, 85%, 51%, 1.00)"/>
            <path d="M15 4c2.5 3.5 2.5 12.5 0 16" {...s} stroke="hsla(29, 85%, 51%, 1.00)"/>
            {/* Outer circle */}
            <circle cx="12" cy="12" r="11" {...s} />
            
          </>
        )}

        {/* Markers: réticule */}
        {id === 'markers' && (
          <>
            <circle cx="12" cy="12" r="1.4" fill={fillColor} />
            {/* Bras plus éloignés du point central */}
            <path d="M12 4.2v3M12 16.8v3M4.2 12h3M16.8 12h3" {...s} stroke="hsla(186, 85%, 51%, 1.00)"/>
          
          </>
        )}

        {/* Sun cardinals: soleil + N/E/S/O */}
        {id === 'sunCard' && (
          <>
            <circle cx="12" cy="12" r="3.5" {...s} />
            <path d="M12 5v3M12 16v3M5 12h3M16 12h3" {...s} />
          </>
        )}

        {/* Ecliptic: ligne inclinée */}
        {id === 'ecliptic' && (
          <>
            {/* Droite oblique pointillée */}
            <path d="M1 23L23 1" {...s} strokeDasharray="2 3" strokeWidth={2} stroke="rgba(236, 229, 26, 1)" />
            {/* Soleil (point central plus gros) */}
            <circle cx="12" cy="12" r="2" fill={fillColor} />
            {/* Planètes (points de part et d’autre) */}
            <circle cx="1" cy="20" r="0.9" fill={fillColor} />
            <circle cx="4" cy="13" r="0.9" fill={fillColor} />
            <circle cx="18" cy="11" r="0.9" fill={fillColor} />
            <circle cx="8" cy="22" r="0.9" fill={fillColor} />
            <circle cx="18" cy="2" r="0.9" fill={fillColor} />
          </>
        )}

        {/* Moon/planets cardinals: petit disque + croix */}
        {id === 'moonCard' && (
          <>
            <circle cx="12" cy="12" r="4" fill={stroke} stroke="none" />
            <ellipse cx="12" cy="12" rx="11" ry="4.5" {...s} stroke="rgba(24, 236, 38, 1)"/>
            <ellipse cx="12" cy="12" rx="4.5" ry="11" {...s} stroke="hsla(42, 91%, 52%, 1.00)"/>
          
          </>
        )}

        {/* Debug: bug stylisé */}
        {id === 'debug' && (
          <>
            <ellipse cx="12" cy="12" rx="4" ry="5" {...s} />
            <path d="M12 7V5M12 19v-2M8 9L6 7M16 9l2-2M8 15l-2 2M16 15l2 2" {...s} />
          </>
        )}

        {/* Time-lapse: horloge + triangle lecture */}
        {id === 'timelapse' && (
          <>
            <path d="M12 20.75a8.75 8.75 0 1 1 0 -17.5V0.75C5.787 0.75 0.75 5.787 0.75 12S5.787 23.25 12 23.25 23.25 18.213 23.25 12h-2.5A8.75 8.75 0 0 1 12 20.75Zm7.876 -12.568c0.315 0.648 0.552 1.34 0.699 2.066l2.45 -0.497a11.176 11.176 0 0 0 -0.9 -2.662l-2.25 1.093ZM19 6.749A8.809 8.809 0 0 0 17.249 5l1.502 -2c0.851 0.64 1.609 1.397 2.248 2.249L19.001 6.75Zm-5.25 -3.324a8.678 8.678 0 0 1 2.067 0.7l1.092 -2.249a11.178 11.178 0 0 0 -2.661 -0.9l-0.498 2.45ZM11 7v5.414l0.293 0.293 4 4 1.414 -1.414L13 11.586V7h-2Z" fill={fillColor} />
          </>
        )}

        {/* Long pose: empilement de cadres */}
        {id === 'longpose' && (
          <>
            <circle cx="8" cy="8" r="2" {...s}  fill={stroke}  opacity="0.8"/>
            <circle cx="10" cy="10" r="2" {...s}  fill={stroke}  opacity="0.6"/>
            <circle cx="12" cy="12" r="2" {...s}  fill={stroke}  opacity="0.5"/>
            <circle cx="14" cy="14" r="2" {...s}  fill={stroke}  opacity="0.4"/>
            <circle cx="16" cy="16" r="2" {...s}  fill={stroke}  opacity="0.2"/>
            <circle cx="18" cy="18" r="2" {...s}  fill={stroke}  opacity="0.1"/>
            <circle cx="20" cy="20" r="2" {...s}  fill={stroke}  opacity="0.1"/>
            <circle cx="22" cy="22" r="2" {...s}  fill={stroke}  opacity="0.1"/>
            <circle cx="6" cy="6" r="2" {...s}  fill={stroke}  opacity="1"/>

            <circle cx="14" cy="2" r="1" {...s}  fill={stroke}  opacity="0.8"/>
            <circle cx="15" cy="3" r="1" {...s}  fill={stroke}  opacity="0.6"/>
            <circle cx="16" cy="4" r="1" {...s}  fill={stroke}  opacity="0.5"/>
            <circle cx="17" cy="5" r="1" {...s}  fill={stroke}  opacity="0.4"/>
            <circle cx="18" cy="6" r="1" {...s}  fill={stroke}  opacity="0.2"/>
            <circle cx="19" cy="7" r="1" {...s}  fill={stroke}  opacity="0.1"/>
            <circle cx="20" cy="8" r="1" {...s}  fill={stroke}  opacity="0.1"/>
            <circle cx="14" cy="2" r="1" {...s}  fill={stroke}  opacity="1"/>

            <circle cx="2" cy="16" r="1" {...s}  fill={stroke}  opacity="0.8"/>
            <circle cx="3" cy="17" r="1" {...s}  fill={stroke}  opacity="0.6"/>
            <circle cx="4" cy="18" r="1" {...s}  fill={stroke}  opacity="0.5"/>
            <circle cx="5" cy="19" r="1" {...s}  fill={stroke}  opacity="0.4"/>
            <circle cx="6" cy="20" r="1" {...s}  fill={stroke}  opacity="0.2"/>
            <circle cx="7" cy="21" r="1" {...s}  fill={stroke}  opacity="0.1"/>
            <circle cx="8" cy="22" r="1" {...s}  fill={stroke}  opacity="0.1"/>
            <circle cx="2" cy="16" r="1" {...s}  fill={stroke}  opacity="1"/>
          </>
        )}
        
        {/* Clear screen: écran avec un X */}
        {id === 'clear' && (
          <>
            <rect x="3" y="6" width="18" height="12" rx="2" {...s} />
            <path d="M8 9l8 6M16 9l-8 6" {...s} />
          </>
        )}
        {/* Refraction icon (onde + horizon) */}
        {id === 'refraction' && (
          <>
            <circle cx="12" cy="12" r="8" {...s} strokeDasharray="2 3" />
            <path d="M4 12A8 8 0 0 1 20 12L4 12Z" fill="#000" />
            <path d="M20 12A8 8 0 0 1 4 12L20 12Z" fill="#000" />
            
            {/* Horizon (ligne horizontale) */}
            <path d="M3 12h18" {...s} stroke={stroke} strokeWidth={1} />
            {/* Oblique cassée (changement de pente à l’horizon) */}
            <path d="M2 21L12 12L18 2" {...s} strokeDasharray="2 3" strokeWidth={2} stroke="rgba(236, 229, 26, 1)"/>
            
          </>
        )}
      </svg>
    );
  };

  const IconToggleButton: React.FC<{
    active: boolean;
    onClick: () => void;
    onTouchEnd?: (e: React.TouchEvent) => void;
    title: string;
    disabled?: boolean;
    icon?: ToggleIconId;
    children?: React.ReactNode;
  }> = ({ active, onClick, onTouchEnd, title, disabled, icon, children }) => {
    const handleActivate = (e?: React.SyntheticEvent) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (disabled) return;
      onClick();
    };

    return (
      <button
        type="button"
        className={`px-2.5 py-1.5 rounded-lg border text-sm ${active ? 'border-white/50 bg-white/10 text-white' : 'border-white/15 text-white/80 hover:border-white/30'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onTouchEnd={onTouchEnd || ((e) => {
          console.log('onTouchEnd', e);
          e.preventDefault();
          if (!disabled) handleActivate(e);
        })}
        onPointerDown={(e) => {
          // Use onPointerDown instead of onClick for more reliable event handling during animation
          // Only handle left mouse button (button 0) or touch (button -1)
          if (e.button !== 0 && e.button !== -1) return;
          e.preventDefault();
          if (!disabled) handleActivate(e);
        }}
        title={title}
        aria-label={title}
        aria-pressed={active}
        disabled={disabled}
      >
        <span className="inline-flex items-center gap-1">
          {icon && <ToggleIcon id={icon} label={title} />}  
          {children ? <span>{children}</span> : null}
        </span>
      </button>
    );
  };


  return (
    <div className={isMobileScreen ? "fixed inset-0 bg-black/40 z-50 overflow-y-auto" : ""}>
      
      {/* Tab Navigation */}
      <div className={isMobileScreen ? "sticky top-0 z-10 bg-black/80 backdrop-blur border-b border-white/10" : "mx-2 sm:mx-4 mb-4 bg-black/40 backdrop-blur rounded-2xl"}>
        <div className={isMobileScreen ? "flex items-start gap-2 p-2" : ""}>
          <div className={isMobileScreen ? "flex flex-wrap flex-1 min-w-0" : "flex overflow-x-auto scrollbar-hide"}>
            {[
              { id: 'datetime', label: t('ui:tabs.datetime', 'Date & Heure') },
              { id: 'tracking', label: t('ui:tabs.tracking', 'Objet suivi') },
              { id: 'fov', label: t('ui:tabs.fov', 'Champ de vision') },
              { id: 'animation', label: t('ui:tabs.animation', 'Animation') },
              { id: 'visibility', label: t('ui:tabs.visibility', 'Visibilité') },
              { id: 'assistance', label: t('ui:tabs.assistance', 'Assistance visuelle') },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  setActiveTab(tab.id as typeof activeTab);
                }}
                className={`
                  flex-shrink-0 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
                  ${activeTab === tab.id 
                    ? 'border-white text-white' 
                    : 'border-transparent text-white/60 hover:text-white/80 hover:border-white/30'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {isMobileScreen && (
            <button
              onTouchEnd={(e) => {
                e.preventDefault();
                onClosePanels?.();
              }}
              onClick={onClosePanels}
              className="p-2 rounded-lg border border-white/15 text-white/80 hover:border-white/30 hover:text-white shrink-0"
              title={t('ui:settings.close')}
              aria-label={t('ui:settings.close')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
        </div>
      </div>
      
      <div className={isMobileScreen ? "bg-black/40" : "mx-2 sm:mx-4"}>
      
      <div className={isMobileScreen ? "space-y-4" : " flex justify-left"}>
        
        {/* TAB: Date & heure */}
        {activeTab === 'datetime' && (
        <div className={`rounded-2xl border border-white/10 bg-black/40 backdrop-blur px-3 py-3 w-full ${isMobileScreen ? '' : 'max-w-[800px]'}`}>

          <div className="grid grid-cols-1 gap-3">
            <div>

              <div className="mt-1">
                <div className="flex items-center gap-2">
                  <button
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      setIsAnimating(!isAnimating);
                    }}
                    onClick={() => setIsAnimating(!isAnimating)}
                    className={`px-3 py-2 rounded-lg border text-sm ${isAnimating ? "border-emerald-400/60 text-emerald-300" : "border-white/15 text-white/80 hover:border-white/30"}`}
                    title={isAnimating ? t('time.pauseAnimation') : t('time.startAnimation')}
                    aria-label={isAnimating ? t('controls.pause') : t('controls.play')}
                  >
                    <span className="inline-flex items-center gap-2">
                      {isAnimating ? (
                        // Pause icon
                        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
                          <rect x="7" y="5" width="4" height="14" rx="1.5" fill="currentColor" />
                          <rect x="13" y="5" width="4" height="14" rx="1.5" fill="currentColor" />
                        </svg>
                      ) : (
                        // Play icon
                        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
                          <path d="M8 5l12 7-12 7V5z" fill="currentColor" />
                        </svg>
                      )}
                    </span>
                  </button>
                  <input
                    type="datetime-local"
                    step="1"
                    value={localDateTimeInput}
                    onChange={(e) => {
                      setLocalDateTimeInput(e.target.value);
                    }}
                    onFocus={() => {
                      setIsEditing(true);
                    }}
                    onBlur={(e) => {
                      setIsEditing(false);
                      const newDate = new Date(e.target.value);
                      if (!isNaN(newDate.getTime())) {
                        onCommitWhenMs(newDate.getTime());
                      } else {
                        // Reset to current value if invalid
                        setLocalDateTimeInput(browserLocalTimeString);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const newDate = new Date(localDateTimeInput);
                        if (!isNaN(newDate.getTime())) {
                          onCommitWhenMs(newDate.getTime());
                          e.currentTarget.blur();
                        }
                      } else if (e.key === 'Escape') {
                        setLocalDateTimeInput(browserLocalTimeString);
                        e.currentTarget.blur();
                      }
                    }}
                    className="flex-1 bg-white/10 border border-white/20 rounded px-2 py-1 text-sm"
                     title={t('time.enterLocalDateTime')}
                     />
                  
                  {/* Maintenant */}
                  <button
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      const nowMs = Date.now();
                      onCommitWhenMs(nowMs);
                      setIsEditing(false);
                    }}
                    onClick={() => {
                      const nowMs = Date.now();
                      onCommitWhenMs(nowMs);
                      setIsEditing(false);
                    }}
                    className="px-3 py-1 rounded-lg border border-white/15 text-white/80 hover:border-white/30 text-sm"
                    title={t('time.setCurrentTime')}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
                        <circle cx="12" cy="12" r="9" stroke="currentColor" />
                        <path d="M12 7v6l4 4" stroke="currentColor" />
                      </svg>
                      {t('time.now')}
                    </span>
                  </button>
                  
                </div>
                <div className="mt-1 text-xs text-white/50 flex flex-wrap gap-3">
                  <div title={timeZone}>{t('ui:time.cityTimeFormat', { cityTime: cityHM, cityName, utcTime: utcHM })}</div>
                </div>
                
                {/* Time step controls */}
                <div className="mt-3">
                  <div className="grid grid-cols-3 gap-x-8 gap-y-2  pt-2">
                    {[
                      { unit: 'minute', label: t('ui:time.minute'), delta: 60000 },
                      { unit: 'hour', label: t('ui:time.hour'), delta: 3600000 },
                      { unit: 'day', label: t('ui:time.day'), delta: 86400000 },
                      { unit: 'sidereal-day', label: t('ui:time.sidereal.day'), delta: 86164000 },
                      { unit: 'month', label: t('ui:time.month'), delta: null },
                      { unit: 'year', label: t('ui:time.year'), delta: 31557600000 },
                      { unit: 'synodic-fraction', label: t('ui:time.lunar.day'), delta: 29.530588853 * 86400000 },
                      { unit: 'lunar-fraction', label: t('ui:time.lunar.cycle'), delta: 27.321661 * 86400000 },
                    ].map(({ unit, label, delta }) => (
                      <div key={unit} className="flex items-center gap-1">
                        <button
                          onTouchEnd={(e) => {
                            e.preventDefault();
                            if (unit === 'month') {
                              const d = new Date(currentUtcMs);
                              d.setUTCMonth(d.getUTCMonth() - 1);
                              onCommitWhenMs(d.getTime());
                            } else {
                              onCommitWhenMs(currentUtcMs - delta!);
                            }
                            setIsEditing(false);
                          }}
                          onClick={() => {
                            if (unit === 'month') {
                              const d = new Date(currentUtcMs);
                              d.setUTCMonth(d.getUTCMonth() - 1);
                              onCommitWhenMs(d.getTime());
                            } else {
                              onCommitWhenMs(currentUtcMs - delta!);
                            }
                            setIsEditing(false);
                          }}
                          className="px-2 py-1 rounded-lg border border-white/15 text-white/80 hover:border-white/30 text-sm"
                          title={`-1 ${label}`}
                        >
                          &#x21B6;
                        </button>
                        <button
                          onTouchEnd={(e) => {
                            e.preventDefault();
                            if (unit === 'month') {
                              const d = new Date(currentUtcMs);
                              d.setUTCMonth(d.getUTCMonth() + 1);
                              onCommitWhenMs(d.getTime());
                            } else {
                              onCommitWhenMs(currentUtcMs + delta!);
                            }
                            setIsEditing(false);
                          }}
                          onClick={() => {
                            if (unit === 'month') {
                              const d = new Date(currentUtcMs);
                              d.setUTCMonth(d.getUTCMonth() + 1);
                              onCommitWhenMs(d.getTime());
                            } else {
                              onCommitWhenMs(currentUtcMs + delta!);
                            }
                            setIsEditing(false);
                          }}
                          className="px-2 py-1 rounded-lg border border-white/15 text-white/80 hover:border-white/30 text-sm"
                          title={`+1 ${label}`}
                        >
                          &#x21B7;
                        </button>
                        <span className="text-xs text-white/70 flex-1 text-left">{ ` ${label}`}</span>
                        
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
            </div>
          </div>
        </div>
        )}

        {/* TAB: Objet suivi */}
        {activeTab === 'tracking' && (
        <div className={`rounded-2xl border border-white/10 bg-black/40 backdrop-blur px-3 py-3 w-full ${isMobileScreen ? '' : 'max-w-[800px]'}`}>
          <div className="text-xs uppercase tracking-wider text-white/60 mb-2">{t('ui:followModes.title')}</div>
          <div className="flex flex-wrap gap-2 mb-4">
            {([
              'SOLEIL','LUNE',
              'MERCURE','VENUS','MARS','JUPITER','SATURNE','URANUS','NEPTUNE',
              'O', 'N','S','E' 
            ] as FollowMode[]).map(opt => (
              <button key={opt}
                className={`px-3 py-1.5 rounded-lg border text-sm ${follow === opt ? 'border-white/50 bg-white/10' : 'border-white/15 text-white/80 hover:border-white/30'}`}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  setFollow(opt);
                  onLongPoseClear();
                }}
                onClick={() => { setFollow(opt); onLongPoseClear(); }}
                title={
                  opt === 'SOLEIL' ? t('followModes.followSun')
                  : opt === 'LUNE' ? t('followModes.followMoon')
                  : opt === 'MERCURE' ? t('followModes.followMercury')
                  : opt === 'VENUS' ? t('followModes.followVenus')
                  : opt === 'MARS' ? t('followModes.followMars')
                  : opt === 'JUPITER' ? t('followModes.followJupiter')
                  : opt === 'SATURNE' ? t('followModes.followSaturn')
                  : opt === 'URANUS' ? t('followModes.followUranus')
                  : opt === 'NEPTUNE' ? t('followModes.followNeptune')
                  : opt === 'N' ? t('followModes.pointNorth')
                  : opt === 'E' ? 'Pointer vers l’Est'
                  : opt === 'S' ? t('followModes.pointSouth')
                  : opt === 'O' ? 'Pointer vers l’Ouest'
                  : `${t('time.follow')} ${opt}`
                }
              >
                <span className="inline-flex items-center gap-1.5">
                  {opt === 'SOLEIL' ? <><ToggleIcon id='sun' label={t('followModes.followSun')} /> {t('ui:space.sun')}</>
                  : opt === 'LUNE' ? <><ToggleIcon id='moon' label={t('followModes.followMoon')} /> {t('ui:space.moon')}</>
                  : opt === 'MERCURE' ? <><span>&#9791;</span> {t('ui:space.mercury')}</>
                  : opt === 'VENUS' ? <><span>&#9792;</span> {t('ui:space.venus')}</>
                  : opt === 'MARS' ? <><span>&#9794;</span> {t('ui:space.mars')}</>
                  : opt === 'JUPITER' ? <><span>&#9795;</span> {t('ui:space.jupiter')}</>
                  : opt === 'SATURNE' ? <><span>&#9796;</span> {t('ui:space.saturn')}</>
                  : opt === 'URANUS' ? <><span>&#9797;</span> {t('ui:space.uranus')}</>
                  : opt === 'NEPTUNE' ? <><span>&#9798;</span> {t('ui:space.neptune')}</>
                  : opt === 'O' ? <><span style={{ display: 'inline-block', transform: 'rotate(180deg)' }}>&#x27A4;</span> {t('common:directions.west')}</>
                  : opt === 'N' ? <><span style={{ display: 'inline-block', transform: 'rotate(270deg)' }}>&#x27A4;</span> {t('common:directions.north')}</>
                  : opt === 'S' ? <><span style={{ display: 'inline-block', transform: 'rotate(90deg)' }}>&#x27A4;</span> {t('common:directions.south')}</>
                  : opt === 'E' ? <><span>&#x27A4;</span> {t('common:directions.east')}</>
                  : opt}
                </span>
              </button>
            ))}
          </div>
          
          <div className="text-xs uppercase tracking-wider text-white/60 mb-2">{t('ui:alignment.title')}</div>
          <div className="flex flex-wrap gap-2">
            {/* Horizons toggle */}
            <IconToggleButton
              active={lockHorizon}
              onTouchEnd={(e: React.TouchEvent) => {
                e.preventDefault();
                setLockHorizon(!lockHorizon);
              }}
              onClick={() => setLockHorizon(!lockHorizon)}
              title={t('alignment.horizon')}
              icon="horizon"
            >
               <span>{t('alignment.horizontitle')}</span>
            </IconToggleButton>
            {/* Ecliptique */}
            <IconToggleButton
              active={!lockHorizon}
              onTouchEnd={(e: React.TouchEvent) => {
                e.preventDefault();
                setLockHorizon(!lockHorizon);
              }}
              onClick={() => setLockHorizon(!lockHorizon)}
              title={t('alignment.ecliptic')}
              icon="ecliptic"
            >
              <span>{t('alignment.ecliptictitle')}</span>
            </IconToggleButton>
          </div>
        </div>
        )}

        {/* TAB: Champ de vision - moved to separate fov tab above, here for tracking tab context */}
        {activeTab === 'fov' && (
          <div className={`rounded-2xl border border-white/10 bg-black/40 backdrop-blur px-3 py-3 w-full ${isMobileScreen ? '' : 'max-w-[800px]'}`}>
          <div className="mt-3">
            <div className="text-xs uppercase tracking-wider text-white/60">{t('optics.device')}</div>
            {/* Sélection Appareil + Objectif */}
            <div className="mt-1 flex flex-wrap sm:flex-nowrap items-center gap-2 gap-y-2">
              <svg className="w-6 h-6 shrink-0 align-middle text-white/60" viewBox="0 0 24 24" aria-hidden="true">
                {/* Camera icon */}
                <rect
                  x="5" y="4" width="14" height="12" rx="2"
                  fill="none" stroke="currentColor" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round"
                />
                <circle
                  cx="12" cy="10" r="3"
                  fill="none" stroke="currentColor" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round"
                />
              </svg>
              <select
                value={deviceId}
                onTouchEnd={(e) => {
                  e.stopPropagation();
                }}
                onChange={(e) => {
                  const id = e.target.value;
                  setDeviceId(id);
                  if (id === CUSTOM_DEVICE_ID) {
                    setZoomId('custom-theo');
                  } else {
                    const d = devices.find(x => x.id === id);
                    if (d?.zooms?.length) setZoomId(d.zooms[0].id);
                  }
                }}
                className="flex-1 basis-0 min-w-0 h-8 leading-none bg-black/60 border border-white/15 rounded-lg px-2 text-sm"
                title={t('device.select')}
              >
                {devices.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
              </select>
              <svg className="w-6 h-6 shrink-0 align-middle text-white/60" viewBox="0 0 24 24" aria-hidden="true">
                {/* Zoom device (lens barrel) */}
                <g transform="translate(2.75 0)" fill="none" stroke="currentColor" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round">
                    {/* Mount */}
                  <rect x="2.5" y="9" width="3" height="6" rx="1.5" />
                  {/* Barrel */}
                  <rect x="6" y="8" width="10" height="8" rx="2" />
                  {/* Zoom ring ridges */}
                  <path d="M8 8v8M10 8v8M12 8v8" />
                  
                </g>
              </svg>
              {deviceId === CUSTOM_DEVICE_ID ? (
                <div
                  className="flex-1 basis-0 min-w-0 h-8 inline-flex items-center bg-black/60 border border-white/15 rounded-lg px-2 text-sm text-white/80 overflow-hidden text-ellipsis whitespace-nowrap"
                  title={t('device.calculatedFocal', { focal: Math.round(currentFocalMm) })}
                >
                  {`${Math.round(currentFocalMm)} mm (eq. 24x36)`}
                </div>
              ) : (
                <select
                  value={zoomId}
                  onTouchEnd={(e) => {
                    e.stopPropagation();
                  }}
                  onChange={(e) => setZoomId(e.target.value)}
                  className="flex-1 basis-0 min-w-0 h-8 leading-none bg-black/60 border border-white/15 rounded-lg px-2 text-sm"
                  title={t('device.selectLens')}
                >
                  {zoomOptions.map(z => <option key={z.id} value={z.id}>{z.label}</option>)}
                </select>
              )}
            </div>

            <div className="text-xs uppercase tracking-wider text-white/60 mt-4">{t('optics.personalized')}</div>
            
            {/*  FOV sliders + link with a single focal-length slider */}
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm">f</span>
              <div className="flex flex-col items-center flex-1 min-w-0">
                <input
                  type="range"
                  min={0}
                  max={FOCAL_SLIDER_RES}
                  step={1}
                  value={focalMmToSlider(currentFocalMm)}
                  onChange={(e) => setFovFromFocal(sliderToFocalMm(Number(e.target.value)))}
                  className="w-full"
                  title={t('device.calculatedFocal', { focal: Math.round(currentFocalMm) })}
                />
                <div className="mt-0.5 text-[10px] text-white/70 text-center w-full"
                  title={t('device.calculatedFocal')}
                >
                  {`${Math.round(currentFocalMm)} mm (eq. 24x36)`}
                </div>
              </div>
              <div className="flex flex-col items-end flex-shrink-0 gap-0.5">
                <div className="text-[12px] text-white/70"
                  title={t('optics.fieldOfView')}
                >
                  {`${"\u2194"} ${(fovXDeg >= 1 ? fovXDeg.toFixed(1) : fovXDeg.toFixed(2))}°`}&nbsp;&nbsp;
                  {`${"\u2195"} ${(fovYDeg >= 1 ? fovYDeg.toFixed(1) : fovYDeg.toFixed(2))}°`}
                </div>
              </div>
            </div>

            {/* Projection selector */}
            <div className="mt-3">
                <div className="text-xs uppercase tracking-wider text-white/60">{t('ui:projection.title')}:&nbsp;
                  {projectionMode && (
                    
                      [
                        {id: 'recti-panini' as const, label: t('ui:projection.rectiPanini') },
                        { id: 'rectilinear' as const, label: t('ui:projection.rectiPerspective') },
                        { id: 'stereo-centered' as const, label: t('ui:projection.stereocentered') },
                        { id: 'ortho' as const, label: t('ui:projection.orthographic') },
                        { id: 'cylindrical' as const, label: t('ui:projection.cylindrical') },
                        { id: 'cylindrical-horizon' as const, label: t('ui:projection.cylindricalHorizon') },
                      ].find(opt => opt.id === projectionMode)?.label
                    
                  )}
                </div>
                <div className="mt-1 flex flex-wrap gap-2">
                  {[ {id: 'recti-panini' as const, label: t('ui:projection.rectiPanini') },
                    { id: 'rectilinear' as const, label: t('ui:projection.rectiPerspective') },
                    { id: 'stereo-centered' as const, label: t('ui:projection.stereocentered') },
                    { id: 'ortho' as const, label: t('ui:projection.orthographic') },
                    { id: 'cylindrical' as const, label: t('ui:projection.cylindrical') },
                    { id: 'cylindrical-horizon' as const, label: t('ui:projection.cylindricalHorizon') },
                  ].map(opt => {
                    const isAllowed = validProjectionModes.includes(opt.id);
                    const isActive = projectionMode === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button" // ensure it's not a submit button inside forms
                        disabled={!isAllowed}
                        className={`px-3 py-1.5 cursor-pointer rounded-lg border text-sm ${
                          isActive
                            ? 'border-white/50 bg-white/10'
                            : isAllowed
                              ? 'border-white/15 text-white/80 hover:border-white/30'
                              : 'border-white/10 text-white/40 opacity-50 cursor-not-allowed'
                        }`}
                        onTouchEnd={(e) => {
                          e.preventDefault();
                          if (isAllowed) setProjectionMode(opt.id);
                        }}
                        onClick={() => {
                          if (!isAllowed) return;
                          setProjectionMode(opt.id);
                        }}
                        title={opt.label}
                        aria-label={opt.label}
                        aria-disabled={!isAllowed}
                      >
                        <span className="inline-flex items-center">
                          <ProjectionIcon id={opt.id} active={isActive} />
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
          </div>
        </div>
        )}

        {/* TAB: Animation */}
        {activeTab === 'animation' && (
        <div className={`rounded-2xl border border-white/10 bg-black/40 backdrop-blur px-3 py-3 w-full ${isMobileScreen ? '' : 'max-w-[800px]'}`}>
          <div className="grid grid-cols-1 gap-3">
            <div>
              <div className="mt-2 mb-1 flex items-baseline justify-start gap-2">
                <span className="text-xs uppercase tracking-wider text-white/50">{t('ui:animation.title')}  </span>
                <span
                  className="text-xs uppercase text-left text-white/50 tabular-nums normal-case whitespace-nowrap"
                  title={t('time.animationSpeed')}
                >
                  {timeLapseEnabled
                    ? timeLapsePerFrameLabel
                    : (Math.round(speedMinPerSec) == 0 ? t('time.realTime') 
                    : (Math.round(speedMinPerSec) > 0 ? Math.round(speedMinPerSec) + ' min/s' 
                    : t('time.pastDirection') + Math.abs(Math.round(speedMinPerSec)) + ' min/s') )
                  }
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    setIsAnimating(!isAnimating);
                  }}
                  onClick={() => setIsAnimating(!isAnimating)}
                  className={`px-3 py-2 rounded-lg border text-sm ${isAnimating ? "border-emerald-400/60 text-emerald-300" : "border-white/15 text-white/80 hover:border-white/30"}`}
                  title={isAnimating ? t('time.pauseAnimation') : t('time.startAnimation')}
                  aria-label={isAnimating ? t('controls.pause') : t('controls.play')}
                >
                  <span className="inline-flex items-center gap-2">
                    {isAnimating ? (
                      // Pause icon
                      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
                        <rect x="7" y="5" width="4" height="14" rx="1.5" fill="currentColor" />
                        <rect x="13" y="5" width="4" height="14" rx="1.5" fill="currentColor" />
                      </svg>
                    ) : (
                      // Play icon
                      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
                        <path d="M8 5l12 7-12 7V5z" fill="currentColor" />
                      </svg>
                    )}
                  </span>
                </button>

                {/* Slider grows in the middle */}
                <div className="relative flex-1 min-w-0">
                  <input
                    type="range"
                    min={-360}
                    max={360}
                    step={0.001}
                    value={speedMinPerSec}
                    onChange={(e) => {
                      setSpeedMinPerSec(clamp(parseFloat(e.target.value || "0"), -360, 360));
                      onLongPoseClear(); 
                      setTimeLapseEnabled(false);
                    }}
                    className="w-full"
                    title={t('time.animationSpeed')}
                  />
                  {/* Center tick for 0 */}
                  <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="w-px h-3 bg-white/40" />
                  </div>
                </div>

                {/* Step buttons on the right (do not grow) */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* -1 min/s */}
                  <button
                    title={t('time.stepBackward')}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      setSpeedMinPerSec(clamp(speedMinPerSec - 1, -360, 360));
                      onLongPoseClear(); 
                      setTimeLapseEnabled(false);
                    }}
                    onClick={() => {
                      setSpeedMinPerSec(clamp(speedMinPerSec - 1, -360, 360));
                      onLongPoseClear(); 
                      setTimeLapseEnabled(false);
                    }}
                    className="px-3 py-1 rounded-lg border border-white/15 text-white/80 hover:border-white/30 text-sm"
                  >
                    -
                  </button>
                  {/* Temps réel */}
                  <button
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      setSpeedMinPerSec(1/60); 
                      setIsAnimating(true); 
                      onLongPoseClear(); 
                      setTimeLapseEnabled(false);
                    }}
                    onClick={() => { 
                      setSpeedMinPerSec(1/60); 
                      setIsAnimating(true); 
                      onLongPoseClear(); 
                      setTimeLapseEnabled(false);
                    }}
                    title={t('time.animateRealTime')}
                    className="px-3 py-1 rounded-lg border border-white/15 text-white/80 hover:border-white/30 text-sm"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
                        <circle cx="12" cy="12" r="9" stroke="currentColor" />
                        <path d="M12 7v6l4 4" stroke="currentColor" />
                      </svg>
                      {t('time.realTime')}
                    </span>
                  </button>
                  {/* +1 min/s */}
                  <button
                    title={t('time.stepForward')}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      setSpeedMinPerSec(clamp(speedMinPerSec + 1, -360, 360));
                      onLongPoseClear(); 
                      setTimeLapseEnabled(false);
                    }}
                    onClick={() => {
                      setSpeedMinPerSec(clamp(speedMinPerSec + 1, -360, 360));
                      onLongPoseClear(); 
                      setTimeLapseEnabled(false);
                    }}
                    className="px-3 py-1 rounded-lg border border-white/15 text-white/80 hover:border-white/30 text-sm"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* --- Time-lapse section --- */}
              <div className="mt-3">
                <div className="text-xs uppercase tracking-wider text-white/60"> </div>

                {/* Step value (integer) + unit */}
                <div className="mt-1 flex items-center gap-2 w-full">
                  {/* Toggle button replaces checkbox (no label) */}
                  <IconToggleButton
                    active={timeLapseEnabled}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      setTimeLapseEnabled(!timeLapseEnabled);
                      onLongPoseClear();
                    }}
                    onClick={() => { setTimeLapseEnabled(!timeLapseEnabled); onLongPoseClear(); }}
                    title={t('animation.enableTimeLapse', { startLabel: tlStartLabel })}
                    icon="timelapse"
                  >
                    <span>{t('animation.timelapse')}</span>
                  </IconToggleButton>
                  
                  <input
                    type="number"
                    inputMode="numeric"
                    pattern="\d*"
                    min={1}
                    step={1}
                    className="w-16 bg-white/10 border border-white/20 rounded px-2 py-1 text-sm"
                    value={tlStepValueStr}
                    onChange={(e) => { setTlStepValueStr(e.target.value); onLongPoseClear(); }}
                    onFocus={() => { setEditingTlStep(true); onLongPoseClear(); }}
                    onBlur={() => { setEditingTlStep(false); commitTlStep(); onLongPoseClear();}}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { commitTlStep(); (e.target as HTMLInputElement).blur(); }
                      if (e.key === 'Escape') { setTlStepValueStr(String(Math.max(1, Math.round(timeLapseStepValue || 1)))); (e.target as HTMLInputElement).blur(); }
                      onLongPoseClear();
                    }}
                    title={t('animation.stepValueInteger')}
                  />
                  <select
                    className="flex-1 min-w-0 bg-black/60 border border-white/15 rounded-lg px-2 py-1.5 text-sm"
                    value={timeLapseStepUnit}
                    onTouchEnd={(e) => {
                      e.stopPropagation();
                    }}
                    onChange={(e) => { setTimeLapseStepUnit(e.target.value as any); onLongPoseClear(); }}
                    title={t('animation.stepUnitUTC')}
                  >
                    <option value="minute">{t('ui:time.minute')}</option>
                    <option value="hour">{t('ui:time.hour')}</option>
                    <option value="day">{t('ui:time.jours')}</option>
                    <option value="sidereal-day">{t('ui:time.sidereal.day')}</option>
                    <option value="month">{t('ui:time.mois')}</option>
                    <option value="synodic-fraction">{t('ui:time.lunar.day')}</option>
                    <option value="lunar-fraction">{t('ui:time.lunar.cycle')}</option>
                  </select>
                  <span className="text-sm text-white/80">{t('time.every')}</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    pattern="\d*"
                    min={1}
                    max={1000}
                    step={1}
                    className="w-16 bg-white/10 border border-white/20 rounded px-2 py-1 text-sm"
                    value={tlPeriodStr}
                    onChange={(e) => { setTlPeriodStr(e.target.value); onLongPoseClear(); }}
                    onFocus={() => setEditingTlPeriod(true)}
                    onBlur={() => { setEditingTlPeriod(false); commitTlPeriod();  }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { commitTlPeriod(); (e.target as HTMLInputElement).blur(); }
                      if (e.key === 'Escape') { setTlPeriodStr(String(timeLapsePeriodMs)); (e.target as HTMLInputElement).blur(); }
                    }}
                    title={t('animation.periodBetweenFrames')}
                  />
                  <span className="text-sm text-white/80">{t('animation.ms')} </span>
                </div>

                {/* Period per frame (integer, safe while editing) */}
                <div className="mt-1 flex items-center gap-3 flex-wrap">
                  
                  <span className="text-sm text-white/80">{t('animation.during')}</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    pattern="\d*"
                    min={0}
                    step={1}
                    className="w-16 bg-white/10 border border-white/20 rounded px-2 py-1 text-sm"
                    value={tlLoopAfterStr}
                    onChange={(e) => { setTlLoopAfterStr(e.target.value); onLongPoseClear(); }}
                    onFocus={() => setEditingTlLoop(true)}
                    onBlur={() => { setEditingTlLoop(false); commitTlLoop();  }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { commitTlLoop(); (e.target as HTMLInputElement).blur(); }
                      if (e.key === 'Escape') { setTlLoopAfterStr(String(timeLapseLoopAfter)); (e.target as HTMLInputElement).blur(); }
                    }}
                    title={t('animation.numberOfFrames')}
                  />
                  <span className="text-sm text-white/80">{t('animation.images')}</span>
                  <button
                    type="button"
                    className="px-3 py-1 rounded-lg border border-white/15 text-white/80 hover:border-white/30 text-sm"
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      onTimeLapsePrevFrame();
                    }}
                    onClick={onTimeLapsePrevFrame}
                    title={t('animation.previousFrame')}
                  >
                    ↶&nbsp;{t('animation.previousFrame')}
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1 rounded-lg border border-white/15 text-white/80 hover:border-white/30 text-sm"
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      onTimeLapseNextFrame();
                    }}
                    onClick={onTimeLapseNextFrame}
                    title={t('animation.nextFrame')}
                  >
                    {t('animation.nextFrame')}&nbsp;↷
                  </button>
                </div>                  
              </div>
              {/* --- /Time-lapse --- */}
              {/* --- Long Pose --- */}
              {/* --- Long Pose --- */}
              <div className="mt-3">
                
                <div className="mt-1 flex items-center gap-2 w-full">
                  {/* Toggle button replaces checkbox (no label) */}
                  <IconToggleButton
                    active={longPoseEnabled}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      setLongPoseEnabled(!longPoseEnabled);
                    }}
                    onClick={() => setLongPoseEnabled(!longPoseEnabled)}
                    title={t('animation.enableLongExposure')}
                    icon="longpose"
                  >
                    <span>{t('ui:animation.longExposure')}</span>
                  </IconToggleButton>

                  {/* reset persistence button */}
                  <IconToggleButton
                    active={false}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      onLongPoseClear();
                    }}
                    onClick={onLongPoseClear}
                    title={' ⟲' + t('animation.clearPersistence') }
                    icon="clear"
                  >
                    <span>{t('animation.clearPersistence')}</span>
                  </IconToggleButton>
                  
                </div>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* TAB: Visibilité */}
        {activeTab === 'visibility' && (
        <div className={`rounded-2xl border border-white/10 bg-black/40 backdrop-blur px-3 py-3 w-full ${isMobileScreen ? '' : 'max-w-[800px]'}`}>
          <div className="text-xs uppercase tracking-wider text-white/60 mb-2">{t('ui:visibility.title')}</div>
          <div className="mt-1 flex flex-wrap gap-3">
            {/* Earth toggle */}
            <IconToggleButton
              active={showEarth}
              onTouchEnd={(e) => { e.preventDefault(); setShowEarth(!showEarth); }}
              onClick={() => setShowEarth(!showEarth)}
              title={t('visibility.showGround')}
              icon="earth"
            >
              <span>{t('visibility.groundOpaque')}</span>
            </IconToggleButton>
            {/* Atmosphere toggle */}
            <IconToggleButton
              active={showAtmosphere}
              onTouchEnd={(e) => { e.preventDefault(); setShowAtmosphere(!showAtmosphere); }}
              onClick={() => setShowAtmosphere(!showAtmosphere)}
              title={t('visibility.showAtmosphere')}
              icon="atmo"
            >
              <span>{t('visibility.atmosphereEffect')}</span>
            </IconToggleButton>
             {/* NEW: Refraction toggle */}
            <IconToggleButton
              active={showRefraction}
              onTouchEnd={(e) => { e.preventDefault(); setShowRefraction(!showRefraction); }}
              onClick={() => setShowRefraction(!showRefraction)}
              title={t('visibility.applyRefraction')}
              icon="refraction"
            >
              <span>{t('visibility.refraction')}</span>
            </IconToggleButton>
            {/* Moon phase */}
            <IconToggleButton
              active={showPhase}
              onTouchEnd={(e) => { e.preventDefault(); setShowPhase(!showPhase); }}
              onClick={() => setShowPhase(!showPhase)}
              title={t('ui:phase.showPhase')}
              icon="phase"
            >
              <span>{t('visibility.moonphase')}</span>
            </IconToggleButton>
            {/* Earthshine */}
            <IconToggleButton
              active={earthshine}
              onTouchEnd={(e) => { e.preventDefault(); setEarthshine(!earthshine); }}
              onClick={() => setEarthshine(!earthshine)}
              title={showPhase ? t('phase.enableEarthshine') : t('phase.enablePhaseFirst')}
              icon="earthshine"
              disabled={!showPhase}
            >
              <span>{t('visibility.earthshine')}</span>
            </IconToggleButton>
            {/* Sun toggle */}
            <IconToggleButton
              active={showSun}
              onTouchEnd={(e) => { e.preventDefault(); setShowSun(!showSun); }}
              onClick={() => setShowSun(!showSun)}
              title={t('ui:space.showSun')}
              icon="sun"
            >
              <span>{t('ui:space.sun')}</span>
            </IconToggleButton>
            {/* Moon toggle */}
            <IconToggleButton
              active={showMoon}
              onTouchEnd={(e) => { e.preventDefault(); setShowMoon(!showMoon); }}
              onClick={() => setShowMoon(!showMoon)}
              title={t('ui:space.showMoon')}
              icon="moon"
            >
              <span>{t('ui:space.moon')}</span>
            </IconToggleButton>
            {/* Planètes */}
            {uiPlanets.map(({ id, label }) => {
              const active = (showPlanets[id] ?? true);
              return (
                <IconToggleButton
                  key={id}
                  active={active}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    const next = !active;
                    setShowPlanets(prev => ({ ...prev, [id]: next }));
                  }}
                  onClick={() => {
                    const next = !active;
                    setShowPlanets(prev => ({ ...prev, [id]: next }));
                  }}
                  title={t('ui:space.showPlanet', { planet: 
                    id === 'Mercury' ? t('ui:space.mercury')
                    : id === 'Venus' ? t('ui:space.venus')
                    : id === 'Mars' ? t('ui:space.mars')
                    : id === 'Jupiter' ? t('ui:space.jupiter')
                    : id === 'Saturn' ? t('ui:space.saturn')
                    : id === 'Uranus' ? t('ui:space.uranus')
                    : id === 'Neptune' ? t('ui:space.neptune')
                    : label
                  })}
                  
                >
                  { id === 'Mercury' ? <span>&#9791; {t('ui:space.mercury')}</span>
                  : id === 'Venus' ? <span>&#9792; {t('ui:space.venus')}</span>
                  : id === 'Mars' ? <span>&#9794; {t('ui:space.mars')}</span>
                  : id === 'Jupiter' ? <span>&#9795; {t('ui:space.jupiter')}</span>
                  : id === 'Saturn' ? <span>&#9796; {t('ui:space.saturn')}</span>
                  : id === 'Uranus' ? <span>&#9797; {t('ui:space.uranus')}</span>
                  : id === 'Neptune' ? <span>&#9798; {t('ui:space.neptune')}</span>
                  : id }
                </IconToggleButton>
              );
            })}
            {/* Stars toggle */}
            <IconToggleButton
              active={showStars}
              onTouchEnd={(e) => { e.preventDefault(); setShowStars(!showStars); }}
              onClick={() => setShowStars(!showStars)}
              title={t('ui:space.showStars')}
              icon="stars"
            >
              <span>{t('ui:space.stars')}</span>
            </IconToggleButton>
          </div>
        </div>
        )}

        {/* TAB: Assistance visuelle */}
        {activeTab === 'assistance' && (
        <div className={`rounded-2xl border border-white/10 bg-black/40 backdrop-blur px-3 py-3 w-full ${isMobileScreen ? '' : 'max-w-[800px]'}`}>
          <div className="text-xs uppercase tracking-wider text-white/60 mb-2">{t('ui:assistance.title')}</div>
          <div className="mt-1 flex flex-wrap gap-3">
            {/* Enlarge objects */}
            <IconToggleButton
              active={enlargeObjects}
              onTouchEnd={(e) => { e.preventDefault(); setEnlargeObjects(!enlargeObjects); }}
              onClick={() => setEnlargeObjects(!enlargeObjects)}
              title={t('visibility.increaseSize')}
              icon="enlarge"
            >
              <span>{t('ui:assistance.enlarge')}</span>
            </IconToggleButton>
            {/* Horizons toggle */}
            <IconToggleButton
              active={showHorizon}
              onTouchEnd={(e) => { e.preventDefault(); setShowHorizon(!showHorizon); }}
              onClick={() => setShowHorizon(!showHorizon)}
              title={t('visibility.showHorizon')}
              icon="horizon"
            >
              <span>{t('ui:assistance.horizon')}</span>
            </IconToggleButton>
            
            {/* Grid toggle */}
            <IconToggleButton
              active={showGrid}
              onTouchEnd={(e) => { e.preventDefault(); setShowGrid(!showGrid); }}
              onClick={() => setShowGrid(!showGrid)}
              title={t('ui:assistance.showGrid')}
              icon="grid"
            >
              <span>{t('ui:assistance.grid')}</span>
            </IconToggleButton>
            {/* Markers toggle */}
            <IconToggleButton
              active={showMarkers}
              onTouchEnd={(e) => { e.preventDefault(); setShowMarkers(!showMarkers); }}
              onClick={() => setShowMarkers(!showMarkers)}
              title={t('ui:assistance.showMarkers')}
              icon="markers"
            >
              <span>{t('ui:assistance.markers')}</span>
            </IconToggleButton>
            {/* Ecliptique */}
            <IconToggleButton
              active={showEcliptique}
              onTouchEnd={(e) => { e.preventDefault(); setShowEcliptique(!showEcliptique); }}
              onClick={() => setShowEcliptique(!showEcliptique)}
              title={t('ui:assistance.showEcliptic')}
              icon="ecliptic"
            >
              <span>{t('ui:assistance.ecliptic')}</span>
            </IconToggleButton>
            {/* Local cardinal helper */}
            <IconToggleButton
              active={showMoonCard}
              onTouchEnd={(e) => { e.preventDefault(); setShowMoonCard(!showMoonCard); }}
              onClick={() => setShowMoonCard(!showMoonCard)}
              title={t('ui:assistance.showMoonCardinals')}
              icon="moonCard"
            >
              <span>{t('ui:assistance.moonCardinals')}</span>
            </IconToggleButton>
            {/* Debug helper */}
            <IconToggleButton
              active={debugMask}
              onTouchEnd={(e) => { e.preventDefault(); setDebugMask(!debugMask); }}
              onClick={() => setDebugMask(!debugMask)}
              title={t('ui:assistance.enableDebug')}
              icon="debug"
            >
              <span>{t('ui:assistance.debug')}</span>
            </IconToggleButton>
          </div>


          {debugMask && (
            <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-white/70">
              <label className="flex items-center gap-2">
                <span>Rot X</span>
                <input
                  type="number"
                  min={-180}
                  max={180}
                  className="w-16 bg-black/30 border border-white/10 rounded px-1 py-0.5"
                  value={rotOffsetDegX}
                  onChange={e => {
                    const v = Number(e.target.value);
                    if (Number.isFinite(v)) setRotOffsetDegX(clamp(v, -180, 180));
                  }}
                />
              </label>
              <label className="flex items-center gap-2">
                <span>Rot Y</span>
                <input
                  type="number"
                  min={-180}
                  max={180}
                  className="w-16 bg-black/30 border border-white/10 rounded px-1 py-0.5"
                  value={rotOffsetDegY}
                  onChange={e => {
                    const v = Number(e.target.value);
                    if (Number.isFinite(v)) setRotOffsetDegY(clamp(v, -180, 180));
                  }}
                />
              </label>
              <label className="flex items-center gap-2">
                <span>Rot Z</span>
                <input
                  type="number"
                  min={-180}
                  max={180}
                  className="w-16 bg-black/30 border border-white/10 rounded px-1 py-0.5"
                  value={rotOffsetDegZ}
                  onChange={e => {
                    const v = Number(e.target.value);
                    if (Number.isFinite(v)) setRotOffsetDegZ(clamp(v, -180, 180));
                  }}
                />
              </label>
            </div>
          )}
          {debugMask && (
            <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-white/70">
              <label className="flex items-center gap-2">
                <span>Cam X</span>
                <input
                  type="number"
                  min={-180}
                  max={180}
                  className="w-16 bg-black/30 border border-white/10 rounded px-1 py-0.5"
                  value={camRotDegX}
                  onChange={e => {
                    const v = Number(e.target.value);
                    if (Number.isFinite(v)) setCamRotDegX(clamp(v, -180, 180));
                  }}
                />
              </label>
              <label className="flex items-center gap-2">
                <span>Cam Y</span>
                <input
                  type="number"
                  min={-180}
                  max={180}
                  className="w-16 bg-black/30 border border-white/10 rounded px-1 py-0.5"
                  value={camRotDegY}
                  onChange={e => {
                    const v = Number(e.target.value);
                    if (Number.isFinite(v)) setCamRotDegY(clamp(v, -180, 180));
                  }}
                />
              </label>
              <label className="flex items-center gap-2">
                <span>Cam Z</span>
                <input
                  type="number"
                  min={-180}
                  max={180}
                  className="w-16 bg-black/30 border border-white/10 rounded px-1 py-0.5"
                  value={camRotDegZ}
                  onChange={e => {
                    const v = Number(e.target.value);
                    if (Number.isFinite(v)) setCamRotDegZ(clamp(v, -180, 180));
                  }}
                />
              </label>
            </div>
          )}
        </div>
        )}
      </div>
      </div>
     
    </div>
  );
}


