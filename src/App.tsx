import React, { useEffect, useMemo, useRef, useState } from "react";
// Astronomy-Engine wrapper centralisé
import { getSunAltAzDeg, getMoonAltAzDeg, getMoonIllumination, getMoonLibration, moonHorizontalParallaxDeg, topocentricMoonDistanceKm, sunOnMoon, getSunAndMoonAltAzDeg, getSunOrientationAngles } from "./astro/aeInterop";
import { getMoonOrientationAngles } from "./astro/aeInterop";

// Types
import type { FollowMode } from "./types";
import type { Device, ZoomModule } from "./optics/types";
import type { Astro as TelemetryAstro } from "./components/layout/BottomTelemetry";
 
// Données
import { getAllLocations, type LocationOption } from "./data/locations";
import { DEVICES, CUSTOM_DEVICE_ID } from "./optics/devices";

// Constantes d’affichage
import { Z, MOON_RENDER_DIAMETER, ROSE_16 } from "./render/constants";

// Utilitaires & formatage
import { toDeg, toRad, norm360, angularDiff, clamp } from "./utils/math";
import { toDatetimeLocalInputValue, formatTimeInZone, formatDateTimeInZone, formatDeg } from "./utils/format";
import { utcMsToZonedLocalString } from "./utils/tz";

// Optique / FOV
import { fovRect, fovFromF35, f35FromFovBest, FOV_DEG_MIN, FOV_DEG_MAX } from "./optics/fov";


// Astro
import { moonApparentDiameterDeg } from "./astro/moon";
import { sunDistanceAU, sunApparentDiameterDeg } from "./astro/sun";
import { lstDeg } from "./astro/time";
import { altazToRaDec, parallacticAngleDeg } from "./astro/coords";
import { sampleTerminatorLUT } from "./astro/lut";
import { sepDeg, eclipseKind } from "./astro/eclipse";

// Projection
import { projectToScreen } from "./render/projection";
import TopBar from "./components/layout/TopBar";
import BottomTelemetry from "./components/layout/BottomTelemetry";
import HorizonOverlay from "./components/stage/HorizonOverlay";
import CardinalMarkers, { type CardinalItem, type BodyItem } from "./components/stage/CardinalMarkers";
import SunSprite from "./components/stage/SunSprite";
import MoonSprite from "./components/stage/MoonSprite";
import Moon3D from "./components/stage/Moon3D";
import StageCanvas from "./components/stage/StageCanvas";
// Import du logo (Vite)
import SidebarLocations from "./components/layout/SidebarLocations"; // + add
import Stars from "./components/stage/Stars"; // + add
import Markers from "./components/stage/Markers";
import DirectionalKeypad from "./components/stage/DirectionalKeypad";
import Grid from "./components/stage/grid";
import Athmosphere from "./components/stage/Athmosphere"; // + add
import { PLANETS, PLANET_REGISTRY, PLANET_DOT_MIN_PX } from "./render/planetRegistry";
import { getPlanetsEphemerides } from "./astro/planets";
import { getPlanetOrientationAngles, type PlanetId } from "./astro/planets";
import PlanetSprite from "./components/stage/PlanetSprite";
import Planet3D from "./components/stage/Planet3D"; 
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { prewarmModel, MOON_RELIEF_SCALE_DEFAULT, PLANET_RELIEF_SCALE_DEFAULT } from './render/modelPrewarm';
import PhotoFrame from "./components/stage/PhotoFrame"; // + add

// Light-green Polaris marker color + equatorial coordinates
const POLARIS_COLOR = '#86efac';
const POLARIS_RA_DEG = 37.952917;
const POLARIS_DEC_DEG = 89.264167;
// NEW: Southern Cross marker color + centroid equatorial coordinates (avg of Acrux, Mimosa, Gacrux, Imai)
const CRUX_COLOR = '#a78bfa';
const CRUX_CENTROID_RA_DEG = 187.539271;
const CRUX_CENTROID_DEC_DEG = -59.6625;

// Seuils de rendu Lune (pixels)
const MOON_DOT_PX = 5;        // < 5 px => simple point gris
const MOON_3D_SWITCH_PX = 50; // >= 50 px => rendu 3D
const PLANET_3D_SWITCH_PX = 100;

 // --- Main Component ----------------------------------------------------------
export default function App() {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [stageSize, setStageSize] = useState({ w: 800, h: 500 });

  // New: dynamic locations loaded from CSV
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [locationsLoading, setLocationsLoading] = useState<boolean>(true);

  // NEW: GLB preload (Moon, Earth, planets)
  const [glbLoading, setGlbLoading] = useState<boolean>(false);
  const [glbProgress, setGlbProgress] = useState<{ loaded: number; total: number }>({ loaded: 0, total: 0 });

  useEffect(() => {
    let cancelled = false;
    const urls = new Set<string>();
    const modelKindByUrl = new Map<string, 'moon' | 'planet'>();

    // Moon
    try {
      const moonUrl = new URL('./assets/moon-nasa-gov-4720-1k.glb', import.meta.url).href;
      urls.add(moonUrl);
      modelKindByUrl.set(moonUrl, 'moon');
    } catch {}

    // Earth (treat as planet)
    try {
      const earthUrl = new URL('./assets/Earth_1_12756.glb', import.meta.url).href;
      urls.add(earthUrl);
      modelKindByUrl.set(earthUrl, 'planet');
    } catch {}

    // Planets
    Object.values(PLANET_REGISTRY).forEach((entry: any) => {
      const u = entry?.modelUrl;
      if (!u) return;
      let resolved = u;
      try { resolved = new URL(u, import.meta.url).href; } catch {}
      urls.add(resolved);
      modelKindByUrl.set(resolved, 'planet');
    });

    const list = Array.from(urls);
    if (!list.length) return;
    setGlbLoading(true);
    setGlbProgress({ loaded: 0, total: list.length });

    const loader = new GLTFLoader();
    let loaded = 0;

    // Dynamically require drei (works in Vite) to call useGLTF.preload
    let useGLTFPreload: ((u: string) => void) | undefined;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { useGLTF } = require('@react-three/drei');
      if (useGLTF?.preload) useGLTFPreload = useGLTF.preload;
    } catch { /* ignore */ }

    Promise.all(
      list.map(
        url =>
          new Promise<void>(resolve => {
            loader.load(
              url,
              gltf => {
                if (!cancelled) {
                  // Prime drei cache (so Suspense won't flash)
                  try { useGLTFPreload && useGLTFPreload(url); } catch {}
                  // Pre-process & cache geometry (relief)
                  const kind = modelKindByUrl.get(url) ?? 'planet';
                  const defaultRelief = kind === 'moon' ? MOON_RELIEF_SCALE_DEFAULT : PLANET_RELIEF_SCALE_DEFAULT;
                  try { prewarmModel(url, gltf.scene, defaultRelief, kind); } catch {}
                  loaded += 1;
                  setGlbProgress({ loaded, total: list.length });
                }
                resolve();
              },
              undefined,
              () => {
                if (!cancelled) {
                  // Even on error, count it to avoid stuck loader
                  loaded += 1;
                  setGlbProgress({ loaded, total: list.length });
                }
                resolve();
              }
            );
          })
      )
    ).finally(() => {
      if (!cancelled) setGlbLoading(false);
    });

    return () => { cancelled = true; };
  }, []);

  // Placeholder location to avoid undefined access before async load
  const PLACEHOLDER_LOCATION: LocationOption = {
    id: 'loading',
    label: 'Loading…',
    lat: 0,
    lng: 0,
    timeZone: 'UTC'
  };

  // Current selected location (starts with placeholder)
  const [location, setLocation] = useState<LocationOption>(PLACEHOLDER_LOCATION);

  useEffect(() => {
    let cancelled = false;
    getAllLocations()
      .then(list => {
        if (cancelled) return;
        setLocations(list);
        // If still placeholder and we have real data, pick first
        if (list.length && location.id === 'loading') {
          setLocation(list[0]);
        }
      })
      .catch(() => {
        // keep placeholder if failure
      })
      .finally(() => {
        if (!cancelled) setLocationsLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  // If user deletes current city externally (rare), auto-fix
  useEffect(() => {
    if (location.id === 'loading') return;
    if (location.id.startsWith('np@') || location.id.startsWith('sp@')) return;
    if (locations.length && !locations.find(l => l.id === location.id)) {
      setLocation(locations[0]);
    }
  }, [locations, location.id]);

  // Controls
  const [when, setWhen] = useState<string>(() => toDatetimeLocalInputValue(new Date()));
  const [whenMs, setWhenMs] = useState<number>(() => Date.parse(when));
  const [follow, setFollow] = useState<FollowMode>('LUNE');
  const [fovXDeg, setFovXDeg] = useState<number>(220);
  const [fovYDeg, setFovYDeg] = useState<number>(220);
  const [linkFov, setLinkFov] = useState<boolean>(true);
  // Appareil/Zoom sélection
  const [deviceId, setDeviceId] = useState<string>('nikon-p1000');
  const devices = useMemo(() => [{ id: CUSTOM_DEVICE_ID, label: 'Personalisé', type: 'phone', aspect: 4/3, zooms: [] } as Device, ...DEVICES], []);
  const device = useMemo(() => devices.find(d => d.id === deviceId)!, [devices, deviceId]);
  const [zoomId, setZoomId] = useState<string>('p1000-2000eq');
  const zoom = useMemo(() => device.zooms.find(z => z.id === zoomId) ?? device.zooms[0], [device, zoomId]);
  // Zooms visibles (si custom, afficher une focale théorique calculée depuis les sliders)

  // Parsed date
  const date = useMemo(() => new Date(whenMs), [whenMs]);

// Astronomical positions
  const astro = useMemo(() => {
     const { lat, lng } = location || PLACEHOLDER_LOCATION;
     // Use combined alt/az fetch to reuse MakeTime/Observer
     const both = getSunAndMoonAltAzDeg(date, lat, lng);
     const sun = both.sun;
     const moon = both.moon;
     const illum = getMoonIllumination(date);
     const sunDistAU = sun.distAU; // meilleur via AE
     const sunDiamDeg = sunApparentDiameterDeg(date, sunDistAU);
     // Parallaxe horizontale et distance topocentrique
     const moonParallaxDeg = moonHorizontalParallaxDeg(moon.distanceKm);
     const moonTopoKm = topocentricMoonDistanceKm(moon.distanceKm, moon.altDeg ?? moon.alt);
     const moonDiamDeg = moonApparentDiameterDeg(moonTopoKm);
     // Libration (Meeus): géocentrique + topocentrique (apparente)
     let moonLibrationGeo: { latDeg: number; lonDeg: number; paDeg: number } | undefined;
     let moonLibrationTopo: { latDeg: number; lonDeg: number; paDeg: number } | undefined;
     let moonLibrationError: string | undefined;
     try { moonLibrationGeo = getMoonLibration(date); } catch (e) { moonLibrationError = (e as Error)?.message ?? 'calcul non disponible'; }
     try { moonLibrationTopo = getMoonLibration(date, { lat, lng }); } catch { /* ignore */ }
     return {
       sun: { alt: sun.altDeg, az: sun.azDeg, distAU: sunDistAU, appDiamDeg: sunDiamDeg },
       moon: {
        alt: moon.altDeg,
        az: moon.azDeg,
        parallacticDeg: moonParallaxDeg,
        distKm: moon.distanceKm,
        topoDistKm: moonTopoKm,
        appDiamDeg: moonDiamDeg,
        libration: moonLibrationGeo,
        librationTopo: moonLibrationTopo,
        librationError: moonLibrationError,
      },
       illum
     };
   }, [date, location]);


 const zoomOptions = useMemo(() => {
    if (deviceId === CUSTOM_DEVICE_ID) {
      // Use full-frame (24x36) aspect for 35mm-equivalent
      const FULL_FRAME_ASPECT = 36 / 24; // 3:2
      const f35eq = f35FromFovBest(fovXDeg, fovYDeg, FULL_FRAME_ASPECT);
      const mmStr = f35eq < 10 ? f35eq.toFixed(1) : String(Math.round(f35eq));
      const label = `Focale théorique ${mmStr}mm eq 24/36`;
      return [{ id: 'custom-theo', label, kind: 'module', f35: f35eq } as ZoomModule];
    }
    return device.zooms;
  }, [deviceId, device, fovXDeg, fovYDeg]);

  useEffect(() => { if (deviceId === CUSTOM_DEVICE_ID) setZoomId('custom-theo'); }, [deviceId]);
  const [showSun, setShowSun] = useState(true);
  const [showMoon, setShowMoon] = useState(true);
  const [showPhase, setShowPhase] = useState(true);
  const [earthshine, setEarthshine] = useState(false);
  const [rotOffsetDegX, setRotOffsetDegX] = useState(0);
  const [rotOffsetDegY, setRotOffsetDegY] = useState(0);
  const [rotOffsetDegZ, setRotOffsetDegZ] = useState(0);
  const [camRotDegX, setCamRotDegX] = useState(0);
  const [camRotDegY, setCamRotDegY] = useState(0);
  const [camRotDegZ, setCamRotDegZ] = useState(0);
  // Overlays N/E/S/O sur les corps
  const [showSunCard, setShowSunCard] = useState(false);
  const [showMoonCard, setShowMoonCard] = useState(false);
  const [debugMask, setDebugMask] = useState(false);
  const [enlargeObjects, setEnlargeObjects] = useState(false);
  // NEW: ground (Sol) toggle
  const [showEarth, setShowEarth] = useState(false);
  // NEW: Atmosphere toggle
  const [showAtmosphere, setShowAtmosphere] = useState(false);
  const [showStars, setShowStars] = useState(false); // + add
  const [showMarkers, setShowMarkers] = useState(false); 
  // NEW: grid toggle
  const [showGrid, setShowGrid] = useState(false);

  const [showPlanets, setShowPlanets] = useState<Record<string, boolean>>(
    () => {
      const ids = PLANETS.map(p => (typeof p === 'string' ? p : (p as any)?.id ?? String(p)));
      return Object.fromEntries(ids.map(id => [id, true]));
    }
  );

  // IDs actually selected in the TopBar
  const selectedPlanetIds = useMemo(
    () => Object.entries(showPlanets).filter(([, v]) => v).map(([id]) => id),
    [showPlanets]
  );

  // NEW: map FollowMode -> planet id (registry)
  const followPlanetId = useMemo<PlanetId | null>(() => {
    switch (follow) {
      case 'MERCURE': return 'Mercury';
      case 'VENUS': return 'Venus';
      case 'MARS': return 'Mars';
      case 'JUPITER': return 'Jupiter';
      case 'SATURNE': return 'Saturn';
      case 'URANUS': return 'Uranus';
      case 'NEPTUNE': return 'Neptune';
      default: return null;
    }
  }, [follow]);

  // REPLACED: do not union follow target into requested render ids
  const selectedAnyPlanets = useMemo(() => selectedPlanetIds.length > 0, [selectedPlanetIds]);

  // Compute ephemerides ONLY for selected (rendering), independent from follow target
  const planetsEphemArr = useMemo(() => {
    if (!selectedAnyPlanets) return [];
    try {
      const res = getPlanetsEphemerides(
        date,
        location.lat,
        location.lng,
        0,
        undefined,
        selectedPlanetIds as any // PlanetId[]
      );
      const arr = Array.isArray(res)
        ? res
        : (res && typeof res === 'object' ? Object.values(res as any) : []);
      return arr.filter((p: any) => selectedPlanetIds.includes(p?.id));
    } catch {
      return [];
    }
  }, [selectedAnyPlanets, selectedPlanetIds, date, location.lat, location.lng]);


  // NEW: quick lookup by id
  const planetsById = useMemo(() => {
    const m: Record<string, any> = {};
    for (const p of planetsEphemArr) {
      if (p?.id) m[p.id] = p;
    }
    return m;
  }, [planetsEphemArr]);
  
  // NEW: Follow target alt/az (sun/moon direct, planets from cache or one-off ephemeris)
  const followAltAz = useMemo(() => {
    switch (follow) {
      case 'SOLEIL': return { az: astro.sun.az,  alt: astro.sun.alt };
      case 'LUNE':   return { az: astro.moon.az, alt: astro.moon.alt };
      case 'N':      return { az: 0,   alt: 0 };
      case 'E':      return { az: 90,  alt: 0 };
      case 'S':      return { az: 180, alt: 0 };
      case 'O':      return { az: 270, alt: 0 };
    }
    if (!followPlanetId) return { az: 0, alt: 0 };

    // Try cached (if selected)
    const cached = planetsById[followPlanetId];
    const azC = cached?.azDeg ?? cached?.az;
    const altC = cached?.altDeg ?? cached?.alt;
    if (Number.isFinite(azC) && Number.isFinite(altC)) {
      return { az: Number(azC), alt: Number(altC) };
    }

    // Fallback: compute just this planet
    try {
      const res = getPlanetsEphemerides(
        date,
        location.lat,
        location.lng,
        0,
        undefined,
        [followPlanetId] as any
      );0
      const it = Array.isArray(res) ? res[0] : (res as any)?.[followPlanetId];
      const az = it?.azDeg ?? it?.az;
      const alt = it?.altDeg ?? it?.alt;
      if (Number.isFinite(az) && Number.isFinite(alt)) {
        return { az: Number(az), alt: Number(alt) };
      }
    } catch { /* ignore */ }

    return { az: 0, alt: 0 };
  }, [follow, astro.sun.az, astro.sun.alt, astro.moon.az, astro.moon.alt, followPlanetId, planetsById, date, location.lat, location.lng]);



  // NEW: Projection mode (Step 1 - selection only)
  /*
  - "Rectilinear + Panini" (for Photographic simulation) : rectilinear + Panini for ultra-wide, plus fisheye variants when the selected module is fisheye.
  - "Stereographic centered" (for Educational sky): stereographic centered on the reference direction to keep intuition for angular distances and directions.
  - "Orthographic" (for All-sky context) : orthographic (hemisphere) 
  */
  const [projectionMode, setProjectionMode] = useState<'recti-panini' | 'stereo-centered' | 'ortho' | 'cylindrical'>('recti-panini');
  

  // Cadre appareil photo automatique: actif si un appareil/zoom est sélectionné (non "Personnalisé")
  const showCameraFrame = deviceId !== CUSTOM_DEVICE_ID;
  // Toggle for locations sidebar
  // const [showLocations, setShowLocations] = useState(true); // - remove
  // Toggle UI tool/info panels (top and bottom)
  const [showPanels, setShowPanels] = useState(true);
  // City label derived from location label (format "Pays — Ville")
  const cityName = useMemo(() => {
    const parts = (location?.label ?? '').split('—');
    return (parts[1] ?? parts[0]).trim();
  }, [location]);

  // NEW: view deltas (added by directional keypad)
  const [deltaAzDeg, setDeltaAzDeg] = useState(0);
  const [deltaAltDeg, setDeltaAltDeg] = useState(0);
  const stepAzDeg = useMemo(() => 0.05 * fovXDeg, [fovXDeg]);
  const stepAltDeg = useMemo(() => 0.05 * fovYDeg, [fovYDeg]);

  // Reset keypad deltas whenever follow target changes
  useEffect(() => {
    setDeltaAzDeg(0);
    setDeltaAltDeg(0);
  }, [follow]);

  // Animation
  const [isAnimating, setIsAnimating] = useState(true);
  const [speedMinPerSec, setSpeedMinPerSec] = useState<number>(1/60); // Temps réel par défaut (1 s/s)
  const rafIdRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const whenMsRef = useRef<number>(whenMs);
  const runningRef = useRef<boolean>(false);

  // handleWhenChange supprimé: la saisie est gérée via whenInput + validation au blur

  // Resize (use ResizeObserver so stage fills space during sidebar animation)
  useEffect(() => {
    const update = () => {
      if (!stageRef.current) return;
      const rect = stageRef.current.getBoundingClientRect();
      setStageSize({ w: rect.width, h: rect.height });
    };
    update();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && stageRef.current) {
      ro = new ResizeObserver(() => update());
      ro.observe(stageRef.current);
    }
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
      if (ro) ro.disconnect();
    };
  }, []);

  // Synchroniser la ref hors animation et garder l'UI en phase avec whenMs
  useEffect(() => { if (!isAnimating) { whenMsRef.current = whenMs; } }, [whenMs, isAnimating]);
  useEffect(() => {
    const s = utcMsToZonedLocalString(whenMs, location.timeZone);
    setWhen(s);
  }, [whenMs, location.timeZone]);

  // Assurer qu'un zoom valide est sélectionné quand l'appareil change
  useEffect(() => {
    if (!device.zooms.find(z => z.id === zoomId)) {
      const first = device.zooms[0]?.id;
      if (first) setZoomId(first);
    }
  }, [device, zoomId]);

  // Appliquer le FOV de l'appareil/module sélectionné (hors mode Personnalisé)
  useEffect(() => {
    if (!device || deviceId === CUSTOM_DEVICE_ID || !zoom) return;
    let fov: { h: number; v: number } | null = null;
    if (zoom.focalMm && device.sensorW && device.sensorH) {
      fov = fovRect(device.sensorW, device.sensorH, zoom.focalMm);
    } else if (zoom.f35) {
      fov = fovFromF35(zoom.f35, device.aspect ?? 4 / 3);
    }
    if (fov) {
      const h = clamp(fov.h, FOV_DEG_MIN, FOV_DEG_MAX);
      const v = clamp(fov.v, FOV_DEG_MIN, FOV_DEG_MAX);
      setFovXDeg(h);
      if (linkFov) {
        // Ratio basé sur le viewport cible sans le référencer directement
        const ar = showCameraFrame
          ? (device.sensorW && device.sensorH
              ? device.sensorW / device.sensorH
              : (device.aspect ?? (stageSize.w / Math.max(1, stageSize.h))))
          : (stageSize.w / Math.max(1, stageSize.h));
        const ratio = 1 / Math.max(1e-9, ar);
        setFovYDeg(clamp(h * ratio, FOV_DEG_MIN, FOV_DEG_MAX));
      } else {
        setFovYDeg(v);
      }
    }
  }, [deviceId, device, zoom, linkFov, showCameraFrame, stageSize]);

  // Aspect de l'appareil sélectionné
  const deviceAspect = useMemo(() => {
    if (device.sensorW && device.sensorH) return device.sensorW / device.sensorH;
    if (device.aspect) return device.aspect;
    return stageSize.w / stageSize.h;
  }, [device, stageSize]);

  // Viewport centré au ratio de l'appareil avec marge noire minimale de 20 px
  const viewport = useMemo(() => {
    if (!showCameraFrame) return { x: 0, y: 0, w: stageSize.w, h: stageSize.h };
    const minMargin = 20;
    const availW = Math.max(0, stageSize.w - 2 * minMargin);
    const availH = Math.max(0, stageSize.h - 2 * minMargin);
    if (availW <= 0 || availH <= 0) return { x: 0, y: 0, w: stageSize.w, h: stageSize.h };
    const ar = Math.max(0.1, deviceAspect || (stageSize.w / stageSize.h));
    let w = availW;
    let h = Math.round(w / ar);
    if (h > availH) { h = availH; w = Math.round(h * ar); }
    const x = Math.round((stageSize.w - w) / 2);
    const y = Math.round((stageSize.h - h) / 2);
    return { x, y, w, h };
  }, [showCameraFrame, stageSize, deviceAspect]);

  // Maintenir FOVY aligné au ratio du viewport quand ⚭ est actif (init + resize + modif FOVX)
  useEffect(() => {
    if (!linkFov) return;
    const ratio = (viewport.h || 1) / Math.max(1, viewport.w);
    const targetY = clamp(fovXDeg * ratio, FOV_DEG_MIN, FOV_DEG_MAX);
    if (Math.abs(targetY - fovYDeg) > 0.1) setFovYDeg(targetY);
  }, [linkFov, viewport, fovXDeg, fovYDeg]);

  

  // Browser local time and UTC time strings
  const browserLocalTime = useMemo(() => {
    return date.toLocaleString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  }, [date]);

  const utcTime = useMemo(() => {
    try {
      return (
        new Intl.DateTimeFormat(undefined, {
          timeZone: 'UTC',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }).format(date) + ' UTC'
      );
    } catch {
      const iso = date.toISOString(); // e.g., 2025-10-09T18:35:42.123Z
      const hhmm = iso.slice(11, 16); // "18:35"
      return `${hhmm} UTC`;
    }
  }, [date]);

  // New: city-local time (selected location timezone)
   const cityLocalTimeString = useMemo(() => {
    try {
      // Use user’s locale and preferences; only fix the time zone
      return date.toLocaleString(undefined, { timeZone: location.timeZone });
    } catch {
      return new Intl.DateTimeFormat(undefined, { timeZone: location.timeZone }).format(date);
    }
  }, [date, location.timeZone]);

  

  

  

  // Reference azimuth & altitude (follow mode)
  const baseRefAz = useMemo(() => followAltAz.az,  [followAltAz]);
  const baseRefAlt = useMemo(() => followAltAz.alt, [followAltAz]);


  // Final ref with keypad deltas applied
  const refAz = useMemo(() => norm360(baseRefAz + deltaAzDeg), [baseRefAz, deltaAzDeg]);
  const refAlt = useMemo(() => clamp(baseRefAlt + deltaAltDeg, -89.9, 89.9), [baseRefAlt, deltaAltDeg]);

  // Screen positions
  const bodySizes = useMemo(() => {
    // Obtenir l’échelle locale px/deg au centre (rayon nul, pour ne pas influencer la visibilite)
    const centerSun = projectToScreen(astro.sun.az, astro.sun.alt, refAz, viewport.w, viewport.h, refAlt, 0, fovXDeg, fovYDeg, projectionMode);
    const centerMoon = projectToScreen(astro.moon.az, astro.moon.alt, refAz, viewport.w, viewport.h, refAlt, 0, fovXDeg, fovYDeg, projectionMode);
    const pxPerDegXSun = centerSun.pxPerDegX || (viewport.w / Math.max(1e-9, fovXDeg));
    const pxPerDegYSun = centerSun.pxPerDegY || (viewport.h / Math.max(1e-9, fovYDeg));
    const pxPerDegXMoon = centerMoon.pxPerDegX || (viewport.w / Math.max(1e-9, fovXDeg));
    const pxPerDegYMoon = centerMoon.pxPerDegY || (viewport.h / Math.max(1e-9, fovYDeg));
    const sunW = enlargeObjects ? MOON_RENDER_DIAMETER : astro.sun.appDiamDeg * pxPerDegXSun;
    const sunH = enlargeObjects ? MOON_RENDER_DIAMETER : astro.sun.appDiamDeg * pxPerDegYSun;
    const moonW = enlargeObjects ? MOON_RENDER_DIAMETER : astro.moon.appDiamDeg * pxPerDegXMoon;
    const moonH = enlargeObjects ? MOON_RENDER_DIAMETER : astro.moon.appDiamDeg * pxPerDegYMoon;
    const sunR = (enlargeObjects ? MOON_RENDER_DIAMETER : Math.max(sunW, sunH)) / 2;
    const moonR = (enlargeObjects ? MOON_RENDER_DIAMETER : Math.max(moonW, moonH)) / 2;
    return { sun: { w: sunW, h: sunH, r: sunR }, moon: { w: moonW, h: moonH, r: moonR } };
  }, [viewport, fovXDeg, fovYDeg, astro.sun.az, astro.sun.alt, astro.moon.az, astro.moon.alt, astro.sun.appDiamDeg, astro.moon.appDiamDeg, refAz, refAlt, enlargeObjects, projectionMode]);

  // Diamètre apparent de la Lune en pixels (indépendant de enlargeObjects)
  const moonApparentPx = useMemo(() => {
    const p = projectToScreen(astro.moon.az, astro.moon.alt, refAz, viewport.w, viewport.h, refAlt, 0, fovXDeg, fovYDeg, projectionMode);
    const pxPerDegX = p.pxPerDegX ?? (viewport.w / Math.max(1e-9, fovXDeg));
    const pxPerDegY = p.pxPerDegY ?? (viewport.h / Math.max(1e-9, fovYDeg));
    const pxPerDeg = (pxPerDegX + pxPerDegY) / 2;
    return (astro.moon.appDiamDeg ?? 0) * pxPerDeg;
  }, [astro.moon.az, astro.moon.alt, astro.moon.appDiamDeg, refAz, refAlt, viewport, fovXDeg, fovYDeg, projectionMode]);

  // Sélection du mode de rendu de la Lune
  const moonRenderMode = useMemo<'dot' | 'sprite' | '3d'>(() => {
    if (enlargeObjects) return '3d';
    if (!Number.isFinite(moonApparentPx)) return 'sprite';
    if (moonApparentPx < MOON_DOT_PX) return 'dot';
    if (moonApparentPx < MOON_3D_SWITCH_PX) return 'sprite';
    return '3d';
  }, [moonApparentPx]);

  const moonRenderModeEffective = glbLoading && moonRenderMode === '3d' ? 'sprite' : moonRenderMode;

  const sunScreen = useMemo(() => {
    const s = projectToScreen(astro.sun.az, astro.sun.alt, refAz, viewport.w, viewport.h, refAlt, bodySizes.sun.r, fovXDeg, fovYDeg, projectionMode);
    return { ...s, x: viewport.x + s.x, y: viewport.y + s.y };
  }, [astro.sun, refAz, refAlt, viewport, fovXDeg, fovYDeg, bodySizes.sun, projectionMode]);
  const moonScreen = useMemo(() => {
    const m = projectToScreen(astro.moon.az, astro.moon.alt, refAz, viewport.w, viewport.h, refAlt, bodySizes.moon.r, fovXDeg, fovYDeg, projectionMode);
    return { ...m, x: viewport.x + m.x, y: viewport.y + m.y };
  }, [astro.moon, refAz, refAlt, viewport, fovXDeg, fovYDeg, bodySizes.moon, projectionMode]);

  // NEW: Per-planet render info (screen position, size px, phase fraction, angle to Sun)
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

    // Helper ENU <-> (az,alt)
    const altAzToVec = (azDeg: number, altDeg: number) => {
      const az = toRad(azDeg);
      const alt = toRad(altDeg);
      const E = Math.cos(alt) * Math.sin(az); // East
      const N = Math.cos(alt) * Math.cos(az); // North
      const U = Math.sin(alt);                // Up
      return [E, N, U] as const;
    };
    const norm3 = (v: readonly number[]) => {
      const L = Math.hypot(v[0], v[1], v[2]) || 1;
      return [v[0]/L, v[1]/L, v[2]/L] as const;
    };

    for (const p of planetsEphemArr) {
      const id = (p as any).id as string;
      if (!id || !showPlanets[id]) continue;

      const reg = PLANET_REGISTRY[id];
      const color = reg?.color ?? '#9ca3af';

      const alt = ((p as any).altDeg ?? (p as any).alt) as number | undefined;
      const az  = ((p as any).azDeg  ?? (p as any).az ) as number | undefined;
      if (alt == null || az == null) continue;

      // Projection au centre de la planète
      const proj = projectToScreen(
        az, alt,
        refAz,
        viewport.w, viewport.h,
        refAlt,
        0,
        fovXDeg, fovYDeg,
        projectionMode
      );

      if (!proj.visibleX || !proj.visibleY) continue;
      if (!Number.isFinite(proj.x) || !Number.isFinite(proj.y)) continue;

      const screen = {
        x: viewport.x + proj.x,
        y: viewport.y + proj.y,
        visibleX: proj.visibleX,
        visibleY: proj.visibleY,
      };

      // Echelle locale px/deg
      const pxPerDegX = proj.pxPerDegX ?? (viewport.w / Math.max(1e-9, fovXDeg));
      const pxPerDegY = proj.pxPerDegY ?? (viewport.h / Math.max(1e-9, fovYDeg));
      const pxPerDeg = (pxPerDegX + pxPerDegY) / 2;

      // Diamètre apparent (si fourni)
      const appDiamDeg = Number((p as any).appDiamDeg ?? 0);

      // Taille à l’écran
      let sizePx = enlargeObjects ? MOON_RENDER_DIAMETER : (Number(appDiamDeg) > 0 ? appDiamDeg * pxPerDeg : 0);
      const hasValidSize = Number.isFinite(sizePx) && sizePx > 0;
      if (!hasValidSize && !enlargeObjects) sizePx = PLANET_DOT_MIN_PX;

      // Mode rendu
      const mode: 'dot' | 'sprite' | '3d' =
        enlargeObjects
          ? '3d'
          : (!hasValidSize || sizePx < PLANET_DOT_MIN_PX
              ? 'dot'
              : (sizePx >= PLANET_3D_SWITCH_PX ? '3d' : 'sprite'));

      // Distance (AU) si dispo
      const distAU = Number((p as any).distAU ?? (p as any).distanceAU ?? NaN);

      // --- Projection-aware: choisir le pas (±EPS) qui bouge le plus à l'écran ---
      let angleToSunDeg: number;
      {
        const u0 = altAzToVec(az, alt);
        const uS = altAzToVec(astro.sun.az, astro.sun.alt);
        const dotUS = u0[0]*uS[0] + u0[1]*uS[1] + u0[2]*uS[2];

        const EPS_RAD = toRad(0.05); // ~0.05°
        if (1 - Math.abs(dotUS) < 1e-9) {
          // Quasi colinéaire: repli direct écran→écran
          const alpha = Math.atan2(sunScreen.y - screen.y, sunScreen.x - screen.x); // 0=→, 90=↓
          angleToSunDeg = norm360(toDeg(alpha) + 90);                                // 0=N, 90=E
        } else {
          // Tangente locale vers le Soleil
          const t = norm3([uS[0] - dotUS*u0[0], uS[1] - dotUS*u0[1], uS[2] - dotUS*u0[2]]);

          // Pas avant (vers Soleil) et arrière (opposé)
          const wF = norm3([
            Math.cos(EPS_RAD)*u0[0] + Math.sin(EPS_RAD)*t[0],
            Math.cos(EPS_RAD)*u0[1] + Math.sin(EPS_RAD)*t[1],
            Math.cos(EPS_RAD)*u0[2] + Math.sin(EPS_RAD)*t[2],
          ]);
          const wB = norm3([
            Math.cos(EPS_RAD)*u0[0] - Math.sin(EPS_RAD)*t[0],
            Math.cos(EPS_RAD)*u0[1] - Math.sin(EPS_RAD)*t[1],
            Math.cos(EPS_RAD)*u0[2] - Math.sin(EPS_RAD)*t[2],
          ]);

          const altF = toDeg(Math.asin(wF[2]));
          const azF  = norm360(toDeg(Math.atan2(wF[0], wF[1])));
          const altB = toDeg(Math.asin(wB[2]));
          const azB  = norm360(toDeg(Math.atan2(wB[0], wB[1])));

          const pF = projectToScreen(azF, altF, refAz, viewport.w, viewport.h, refAlt, 0, fovXDeg, fovYDeg, projectionMode);
          const pB = projectToScreen(azB, altB, refAz, viewport.w, viewport.h, refAlt, 0, fovXDeg, fovYDeg, projectionMode);

          const xF = viewport.x + pF.x, yF = viewport.y + pF.y;
          const xB = viewport.x + pB.x, yB = viewport.y + pB.y;

          const dxF = xF - screen.x, dyF = yF - screen.y;
          const dxB = xB - screen.x, dyB = yB - screen.y;

          const mF = Math.hypot(dxF, dyF);
          const mB = Math.hypot(dxB, dyB);

          // Choisir le pas qui “décroche” du bord
          const useBack = mB > mF;
          let alpha = Math.atan2(useBack ? dyB : dyF, useBack ? dxB : dxF); // 0=→, 90=↓
          let deg = norm360(toDeg(alpha) + 90);                              // 0=N, 90=E

          // Si on a dû prendre le pas arrière, corriger de 180° pour retrouver la direction “vers le Soleil”
          if (useBack) deg = norm360(deg + 180);

          // Repli si les deux déplacements sont quasi nuls (clamp aux bords)
          if (Math.max(mF, mB) < 1e-6) {
            const a = Math.atan2(sunScreen.y - screen.y, sunScreen.x - screen.x);
            deg = norm360(toDeg(a) + 90);
          }

          angleToSunDeg = deg;
        }
      }

      // Fraction éclairée (approx) via séparation apparente
      const sep = sepDeg(alt, az, astro.sun.alt, astro.sun.az);
      let phaseFrac = Number((p as any).phaseFraction);
      if (!Number.isFinite(phaseFrac)) {
        const sep = sepDeg(alt, az, astro.sun.alt, astro.sun.az);
        phaseFrac = clamp((1 + Math.cos((sep * Math.PI) / 180)) / 2, 0, 1);
      } else {
        phaseFrac = clamp(phaseFrac, 0, 1);
      }
      // Rotation du sprite: 0=→, donc -90 depuis 0=N
      const rotationDeg = angleToSunDeg - 90;
      const ori = (p as any).orientationXYZDeg;
      const orientationDegX = Number.isFinite(ori?.x) ? Number(ori.x) : undefined;
      const orientationDegY = Number.isFinite(ori?.y) ? Number(ori.y) : undefined;
      const orientationDegZ = Number.isFinite(ori?.z) ? Number(ori.z) : undefined;

      let localUpAnglePlanetDeg: number | undefined;
      {
        const eps = 0.01;
        const p0 = projectToScreen(az, alt, refAz, viewport.w, viewport.h, refAlt, 0, fovXDeg, fovYDeg, projectionMode);
        const pU = projectToScreen(az, alt + eps, refAz, viewport.w, viewport.h, refAlt, 0, fovXDeg, fovYDeg, projectionMode);
        const pD = projectToScreen(az, alt - eps, refAz, viewport.w, viewport.h, refAlt, 0, fovXDeg, fovYDeg, projectionMode);
        const dxU = pU.x - p0.x, dyU = pU.y - p0.y;
        const dxD = pD.x - p0.x, dyD = pD.y - p0.y;
        const mU = Math.hypot(dxU, dyU);
        const mD = Math.hypot(dxD, dyD);
        const useDown = mD > mU;
        let ang = Math.atan2(useDown ? dyD : dyU, useDown ? dxD : dxU) * 180 / Math.PI; // 0=→, 90=↓
        if (useDown) ang = norm360(ang + 180); // restore “toward +alt”
        localUpAnglePlanetDeg = ang;
      }

      let rotationToHorizonDegPlanet: number | undefined;
      try {
        const po = getPlanetOrientationAngles(date, location.lat, location.lng, id as PlanetId);
        rotationToHorizonDegPlanet =
          (po as any)?.rotationToHorizonDegPlanetNorth ??
          (po as any)?.rotationToHorizonDegPlanet ??
          (po as any)?.rotationToHorizonDeg ??
          undefined;
      } catch {
        // ignore if unavailable
      }

      // corrected on-screen rotation for planet (like rotationDegSunScreen)
      const rotationDegPlanetScreen =
        Number.isFinite(rotationToHorizonDegPlanet) && Number.isFinite(localUpAnglePlanetDeg)
          ? norm360(-(-Number(rotationToHorizonDegPlanet) + (-90 - Number(localUpAnglePlanetDeg))))
          : 0 ;


      items.push({
        id,
        x: screen.x, y: screen.y,
        visibleX: screen.visibleX, visibleY: screen.visibleY,
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
   }, [planetsEphemArr, showPlanets, refAz, viewport.w, viewport.h, viewport.x, viewport.y, refAlt, fovXDeg, fovYDeg, projectionMode, enlargeObjects, astro.sun.alt, astro.sun.az, sunScreen.y, sunScreen.x]);

  const moonOrientation = useMemo(
    () => getMoonOrientationAngles(date, location.lat, location.lng),
    [date, location.lat, location.lng]
  );
  const rotationToHorizonDegMoon = moonOrientation.rotationToHorizonDegMoonNorth;

  // NEW: projection-aware local vertical angle (screen) at Moon
  const localUpAngleMoonDeg = useMemo(() => {
    const eps = 0.01; // deg
    const p0 = projectToScreen(astro.moon.az, astro.moon.alt, refAz, viewport.w, viewport.h, refAlt, 0, fovXDeg, fovYDeg, projectionMode);
    const pU = projectToScreen(astro.moon.az, astro.moon.alt + eps, refAz, viewport.w, viewport.h, refAlt, 0, fovXDeg, fovYDeg, projectionMode);
    const pD = projectToScreen(astro.moon.az, astro.moon.alt - eps, refAz, viewport.w, viewport.h, refAlt, 0, fovXDeg, fovYDeg, projectionMode);
    const x0 = p0.x, y0 = p0.y;
    const dxU = pU.x - x0, dyU = pU.y - y0;
    const dxD = pD.x - x0, dyD = pD.y - y0;
    const mU = Math.hypot(dxU, dyU);
    const mD = Math.hypot(dxD, dyD);
    const useDown = mD > mU;
    let ang = Math.atan2(useDown ? dyD : dyU, useDown ? dxD : dxU) * 180 / Math.PI; // 0=→, 90=↓
    if (useDown) ang = norm360(ang + 180); // rétablir la direction “vers +alt”
    return ang;
  }, [astro.moon.az, astro.moon.alt, refAz, refAlt, viewport.w, viewport.h, fovXDeg, fovYDeg, projectionMode]);

  // NEW: corrected on-screen rotation for Moon (align local vertical with screen vertical)
  const rotationDegMoonScreen = useMemo(
    () => -(-rotationToHorizonDegMoon + (-90 - localUpAngleMoonDeg)),
    [rotationToHorizonDegMoon, localUpAngleMoonDeg]
  );

  const sunOrientation = useMemo(
    () => getSunOrientationAngles(date, location.lat, location.lng),
    [date, location.lat, location.lng]
  );
  
  const rotationToHorizonDegSun = sunOrientation.rotationToHorizonDegSolarNorth;

  // NEW: projection-aware local vertical angle (screen) at Sun
  const localUpAngleSunDeg = useMemo(() => {
    const eps = 0.01;
    const p0 = projectToScreen(astro.sun.az, astro.sun.alt, refAz, viewport.w, viewport.h, refAlt, 0, fovXDeg, fovYDeg, projectionMode);
    const pU = projectToScreen(astro.sun.az, astro.sun.alt + eps, refAz, viewport.w, viewport.h, refAlt, 0, fovXDeg, fovYDeg, projectionMode);
    const pD = projectToScreen(astro.sun.az, astro.sun.alt - eps, refAz, viewport.w, viewport.h, refAlt, 0, fovXDeg, fovYDeg, projectionMode);
    const x0 = p0.x, y0 = p0.y;
    const dxU = pU.x - x0, dyU = pU.y - y0;
    const dxD = pD.x - x0, dyD = pD.y - y0;
    const mU = Math.hypot(dxU, dyU);
    const mD = Math.hypot(dxD, dyD);
    const useDown = mD > mU;
    let ang = Math.atan2(useDown ? dyD : dyU, useDown ? dxD : dxU) * 180 / Math.PI;
    if (useDown) ang = norm360(ang + 180);
    return ang;
  }, [astro.sun.az, astro.sun.alt, refAz, refAlt, viewport.w, viewport.h, fovXDeg, fovYDeg, projectionMode]);

  // NEW: corrected on-screen rotation for Sun
  const rotationDegSunScreen = useMemo(
    () => -(-rotationToHorizonDegSun + (-90 - localUpAngleSunDeg)),
    [rotationToHorizonDegSun, localUpAngleSunDeg]
  );

  const sunOnMoonInfo = useMemo(() => sunOnMoon(date), [date]);
  const brightLimbAngleDeg = useMemo(() => sunOnMoonInfo.bearingDeg, [sunOnMoonInfo]);
  const sunDeclinationDeg = useMemo(() => sunOnMoonInfo.declinationDeg, [sunOnMoonInfo]);
  const maskAngleBase = useMemo(() => norm360(brightLimbAngleDeg - 90), [brightLimbAngleDeg]);
  const maskAngleDeg = useMemo(() => {
    const litVecAngle = norm360(maskAngleBase + 90);
    let d = norm360(litVecAngle - brightLimbAngleDeg); if (d > 180) d = 360 - d;
    return d > 90 ? norm360(maskAngleBase + 180) : maskAngleBase;
  }, [maskAngleBase, brightLimbAngleDeg]);
  const phaseFraction = astro.illum.fraction ?? 0;

  // ADD: eclipse info used by BottomTelemetry
  const eclipse = useMemo(() => {
    const sep = sepDeg(astro.sun.alt, astro.sun.az, astro.moon.alt, astro.moon.az);
    const rS = (astro.sun.appDiamDeg ?? 0) / 2;
    const rM = (astro.moon.appDiamDeg ?? 0) / 2;
    const kind = eclipseKind(sep, rS, rM);
    return { sep, rS, rM, kind } as const;
  }, [astro.sun, astro.moon]);
    
  const eclipticTiltDeg = sunOrientation.eclipticTiltDeg;
  
  // ADD: Horizon flat Y (used by Markers baseline)
  const horizonYFlat = useMemo(
    () => viewport.y + projectToScreen(refAz, 0, refAz, viewport.w, viewport.h, refAlt, 0, fovXDeg, fovYDeg, projectionMode).y,
    [refAz, refAlt, viewport, fovXDeg, fovYDeg, projectionMode]
  );

  // ADD: Simple horizon markers (Moon only by default)
  const horizonMarkers = useMemo(() => {
    const items: { x: number; label: string; color: string }[] = [];
    if (showMoon) {
      const { x, visibleX } = projectToScreen(astro.moon.az, 0, refAz, viewport.w, viewport.h, refAlt, 0, fovXDeg, fovYDeg, projectionMode);
      if (visibleX) items.push({ x: viewport.x + x, label: "Lune", color: "#93c5fd" });
    }
    return items;
  }, [showMoon, astro.moon.az, refAz, refAlt, viewport, fovXDeg, fovYDeg, projectionMode]);

  // ADD: 4 main cardinals visible on horizon
  const visibleCardinals = useMemo(() => {
    const base = [
      { label: 'N' as const, az: 0 },
      { label: 'E' as const, az: 90 },
      { label: 'S' as const, az: 180 },
      { label: 'O' as const, az: 270 },
    ];
    const projected = base
      .map(c => {
        const p = projectToScreen(c.az, 0, refAz, viewport.w, viewport.h, refAlt, 0, fovXDeg, fovYDeg, projectionMode);
        const x = p.x; // local, PAS de + viewport.x
        const delta = Math.abs(angularDiff(c.az, refAz));
        return { ...c, x, visible: p.visibleX, delta };
      })
      .filter(c => c.visible);

    const EPS = 1;
    const dedup: typeof projected = [];
    for (const it of projected) {
      const idx = dedup.findIndex(d => Math.abs(d.x - it.x) <= EPS);
      if (idx === -1) dedup.push(it);
      else if (it.delta < dedup[idx].delta) dedup[idx] = it;
    }

    return dedup
      .sort((a, b) => a.x - b.x)
      .map(({ label, az, x }) => ({ label, az, x }));
  }, [refAz, refAlt, viewport, fovXDeg, fovYDeg, projectionMode]);

  const visibleSecondaryCardinals = useMemo(() => {
    const primaries = new Set(['N', 'E', 'S', 'O']);
    const items: { label: string; az: number; x: number; delta: number }[] = [];
    for (let i = 0; i < 16; i++) {
      const az = i * 22.5;
      const label = compass16(az);
      if (primaries.has(label)) continue;
      const p = projectToScreen(az, 0, refAz, viewport.w, viewport.h, refAlt, 0, fovXDeg, fovYDeg, projectionMode);
      if (!p.visibleX) continue;
      const x = p.x; // local, PAS de + viewport.x
      const delta = Math.abs(angularDiff(az, refAz));
      items.push({ label, az, x, delta });
    }
    const EPS = 6;
    const dedup: typeof items = [];
    for (const it of items) {
      const idx = dedup.findIndex(d => Math.abs(d.x - it.x) <= EPS);
      if (idx === -1) dedup.push(it);
      else if (it.delta < dedup[idx].delta) dedup[idx] = it;
    }
    return dedup.sort((a, b) => a.x - b.x).map(({ label, az, x }) => ({ label, az, x }));
  }, [refAz, refAlt, viewport, fovXDeg, fovYDeg, projectionMode]);

  // ADD: Polaris and Southern Cross alt/az + screen positions
  const polarisAltAz = useMemo(() => {
    const LST = lstDeg(date, location.lng);
    let H = LST - POLARIS_RA_DEG;
    H = ((H + 180) % 360 + 360) % 360 - 180;
    const φ = toRad(location.lat);
    const δ = toRad(POLARIS_DEC_DEG);
    const Hr = toRad(H);
    const sinAlt = Math.sin(φ) * Math.sin(δ) + Math.cos(φ) * Math.cos(δ) * Math.cos(Hr);
    const alt = Math.asin(clamp(sinAlt, -1, 1));
    const cosAlt = Math.cos(alt);
    const sinA = -Math.cos(δ) * Math.sin(Hr) / Math.max(1e-9, cosAlt);
    const cosA = (Math.sin(δ) - Math.sin(alt) * Math.sin(φ)) / Math.max(1e-9, (cosAlt * Math.cos(φ)));
    const A = Math.atan2(sinA, cosA);
    return { altDeg: toDeg(alt), azDeg: norm360(toDeg(A)) };
  }, [date, location.lat, location.lng]);
  const cruxAltAz = useMemo(() => {
    const LST = lstDeg(date, location.lng);
    let H = LST - CRUX_CENTROID_RA_DEG;
    H = ((H + 180) % 360 + 360) % 360 - 180;
    const φ = toRad(location.lat);
    const δ = toRad(CRUX_CENTROID_DEC_DEG);
    const Hr = toRad(H);
    const sinAlt = Math.sin(φ) * Math.sin(δ) + Math.cos(φ) * Math.cos(δ) * Math.cos(Hr);
    const alt = Math.asin(clamp(sinAlt, -1, 1));
    const cosAlt = Math.cos(alt);
    const sinA = -Math.cos(δ) * Math.sin(Hr) / Math.max(1e-9, cosAlt);
    const cosA = (Math.sin(δ) - Math.sin(alt) * Math.sin(φ)) / Math.max(1e-9, (cosAlt * Math.cos(φ)));
    const A = Math.atan2(sinA, cosA);
    return { altDeg: toDeg(alt), azDeg: norm360(toDeg(A)) };
  }, [date, location.lat, location.lng]);

  const polarisScreen = useMemo(() => {
    const p = projectToScreen(polarisAltAz.azDeg, polarisAltAz.altDeg, refAz, viewport.w, viewport.h, refAlt, 0, fovXDeg, fovYDeg, projectionMode);
    return { ...p, x: viewport.x + p.x, y: viewport.y + p.y };
  }, [polarisAltAz, refAz, refAlt, viewport, fovXDeg, fovYDeg, projectionMode]);
  const cruxScreen = useMemo(() => {
    const p = projectToScreen(cruxAltAz.azDeg, cruxAltAz.altDeg, refAz, viewport.w, viewport.h, refAlt, 0, fovXDeg, fovYDeg, projectionMode);
    return { ...p, x: viewport.x + p.x, y: viewport.y + p.y };
  }, [cruxAltAz, refAz, refAlt, viewport, fovXDeg, fovYDeg, projectionMode]);

  const bodyHorizonItems = useMemo(() => {
    const out: BodyItem[] = [];
    if (showSun) {
      const az = astro.sun.az;
      const p = projectToScreen(az, 0, refAz, viewport.w, viewport.h, refAlt, 0, fovXDeg, fovYDeg, projectionMode);
      if (p.visibleX) out.push({ x: p.x, az, label: "Soleil", color: "#f59e0b" }); // local
    }
    if (showMoon) {
      const az = astro.moon.az;
      const p = projectToScreen(az, 0, refAz, viewport.w, viewport.h, refAlt, 0, fovXDeg, fovYDeg, projectionMode);
      if (p.visibleX) out.push({ x: p.x, az, label: "Lune", color: "#93c5fd" }); // local
    }
    {
      const az = polarisAltAz.azDeg;
      const p = projectToScreen(az, 0, refAz, viewport.w, viewport.h, refAlt, 0, fovXDeg, fovYDeg, projectionMode);
      if (p.visibleX) out.push({ x: p.x, az, label: "Polaris", color: POLARIS_COLOR }); // local
    }
    {
      const az = cruxAltAz.azDeg;
      const p = projectToScreen(az, 0, refAz, viewport.w, viewport.h, refAlt, 0, fovXDeg, fovYDeg, projectionMode);
      if (p.visibleX) out.push({ x: p.x, az, label: "Croix du Sud", color: CRUX_COLOR }); // local
    }
    for (const pl of planetsEphemArr) {
      const id = (pl as any).id as string;
      if (!showPlanets[id]) continue;
      const az = ((pl as any).azDeg ?? (pl as any).az) as number;
      const reg = PLANET_REGISTRY[id];
      if (az == null || !reg) continue;
      const pr = projectToScreen(az, 0, refAz, viewport.w, viewport.h, refAlt, 0, fovXDeg, fovYDeg, projectionMode);
      if (pr.visibleX) out.push({ x: pr.x, az, label: reg.label, color: reg.color }); // local
    }
    return out;
  }, [
    showSun, showMoon,
    astro.sun.az, astro.moon.az,
    polarisAltAz.azDeg, cruxAltAz.azDeg,
    planetsEphemArr, showPlanets,
    refAz, refAlt, viewport, fovXDeg, fovYDeg, projectionMode
  ]);

  // ADD: planets screen markers for Markers overlay
  const planetMarkers = useMemo(() => {
    // Use planetsRender so sizePx matches the on-screen rendered size
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

  // --- Animation Loop (RESTORED) ---------------------------------------------------
  // Animation loop (restore)
  useEffect(() => {
    if (!isAnimating) {
      if (rafIdRef.current != null) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
      lastTsRef.current = null;
      runningRef.current = false;
      return;
    }
    // Continue from current whenMsRef (do not reset here)
    lastTsRef.current = null;
    runningRef.current = true;
    const tick = (ts: number) => {
      if (!runningRef.current) return;
      if (lastTsRef.current == null) {
        lastTsRef.current = ts;
      } else {
        const dtSec = (ts - lastTsRef.current) / 1000;
        lastTsRef.current = ts;
        const rate = clamp(speedMinPerSec, -360, 360);
        whenMsRef.current += dtSec * rate * 60 * 1000;
        setWhenMs(whenMsRef.current);
      }
      if (runningRef.current) rafIdRef.current = requestAnimationFrame(tick);
    };
    rafIdRef.current = requestAnimationFrame(tick);
    return () => {
      runningRef.current = false;
      if (rafIdRef.current != null) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
      lastTsRef.current = null;
    };
  }, [isAnimating, speedMinPerSec]);

  // --- Dev-time test cases ---------------------------------------------------
  useEffect(() => {
    function approx(a: number, b: number, eps = 1e-6) { return Math.abs(a - b) <= eps; }
    const W = 1000, H = 1000, REF = 0;
    const c0 = projectToScreen(0, 0, REF, W, H);
    console.assert(approx(c0.x, 500) && approx(c0.y, 500), "Center should map to center");
    const rightEdge = projectToScreen(+110, 0, REF, W, H);
    console.assert(Math.round(rightEdge.x) === 1000, "+110° → right edge");
    const leftEdge = projectToScreen(-110, 0, REF, W, H);
    console.assert(Math.round(leftEdge.x) === 0, "-110° → left edge");
    const topEdge = projectToScreen(REF, +110, REF, W, H);
    console.assert(Math.round(topEdge.y) === 0, "+110° alt → top edge");
    const bottomEdge = projectToScreen(REF, -110, REF, W, H);
    console.assert(Math.round(bottomEdge.y) === 1000, "-110° alt → bottom edge");

    console.assert(compass16(0) === "N", "N label");
    console.assert(compass16(90) === "E", "E label");
    console.assert(compass16(180) === "S", "S label");
    console.assert(compass16(270) === "O", "O label");

    const rate = 60, dt = 2; const expectedMs = rate * dt * 60 * 1000;
    console.assert(expectedMs === 7200000, "2s @60 min/s = 2h");

    const f1 = getMoonIllumination(new Date('2024-04-22T20:00:00Z')).fraction;
    const f2 = getMoonIllumination(new Date('2024-04-23T20:00:00Z')).fraction;
    console.assert(Math.abs(f2 - f1) > 0, "Illumination fraction should change day-to-day");

    const isChord = (f: number) => f >= 0.495 && f <= 0.505;
    console.assert(isChord(0.495) && isChord(0.505), "Chord includes 49.5%..50.5%");
    console.assert(!isChord(0.494) && !isChord(0.506), "Chord excludes outside window");

    const qMoon = parallacticAngleDeg(120, 30, 48.85);
    const qSun = parallacticAngleDeg(200, 10, 48.85);
    console.assert(Number.isFinite(qMoon) && Number.isFinite(qSun), "Parallactic angles finite");

    // LUT sanity
    const st = sampleTerminatorLUT(0.3);
    console.assert(Number.isFinite(st.rR) && Number.isFinite(st.dR), "LUT returns finite numbers");

    // Alt/Az -> RA/Dec sanity: returns finite values
    {
      const LST = lstDeg(new Date('2025-01-01T00:00:00Z'), 2.35); // ~Paris
      const eq = altazToRaDec(120, 30, 48.85, LST);
      console.assert(Number.isFinite(eq.raDeg) && Number.isFinite(eq.decDeg), 'altazToRaDec finite');
    }

    // Known identities checks for altaz<->equatorial relations
    // 1) Zenith case: h=90° ⇒ δ≈φ, H≈0
    {
      const LST = lstDeg(new Date('2025-01-01T00:00:00Z'), 2.35);
      const eq = altazToRaDec(0, 90, 48.85, LST);
      console.assert(Math.abs(eq.decDeg - 48.85) < 0.1, 'Zenith: dec≈lat');
      console.assert(Math.abs(eq.Hdeg) < 1e-6, 'Zenith: H≈0');
    }
    // 2) Equator east-horizon case: φ=0°, h=0°, A=90° ⇒ H≈−90°
    {
      const LST = 0; // arbitrary
      const eq = altazToRaDec(90, 0, 0, LST);
      console.assert(Math.abs(eq.Hdeg + 90) < 1e-6, 'Equator east horizon: H≈−90°');
    }
  }, []);

  // --- JSX -------------------------------------------------------------------
  return (
    <div className="w-full h-screen bg-black text-white overflow-hidden">
      <div className="flex h-full">
        {/* Left column: locations */}
        <aside className="shrink-0 relative" style={{ zIndex: Z.ui }}>
          <SidebarLocations
            locations={locations}
            selectedLocation={location}
            onSelectLocation={setLocation}
            utcMs={whenMs}
            // Include deltas in active pointing
            activeAzDeg={refAz}
            activeAltDeg={refAlt}
          />
        </aside>
        {/* Main stage */}
        <main className="relative flex-1">
          {(locationsLoading || glbLoading) && (
            <div className="absolute inset-0 flex flex-col gap-2 items-center justify-center text-white/70 text-sm pointer-events-none">
              {locationsLoading && location.id === 'loading' && <div>Chargement des localisations…</div>}
              {glbLoading && (
                <div>
                  Chargement des modèles 3D… {glbProgress.total > 0 ? Math.round(glbProgress.loaded / glbProgress.total * 100) : 0}%
                </div>
              )}
            </div>
          )}
          {/* Global toggle button (top-right) */}
          <button
            onClick={() => setShowPanels(v => !v)}
            className="absolute top-2 right-2 px-4 py-2 rounded-lg border border-white/20 text-white/80 hover:border-white/40 text-2xl leading-none"
            style={{ zIndex: Z.ui + 20 }}
            aria-label="Basculer l'interface"
            title="Basculer l'interface"
          >
             {showPanels ? "\u26F6" : "\u2699"}
          </button>
          {/* Top UI bar */}
          <div
            className="absolute top-0 left-0 right-0 p-2 sm:p-3 transition-opacity duration-500"
            style={{ zIndex: Z.ui, opacity: showPanels ? 1 : 0, pointerEvents: showPanels ? 'auto' : 'none' }}
          >
            <TopBar
              follow={follow}
              setFollow={setFollow}
              devices={devices}
              deviceId={deviceId}
              setDeviceId={setDeviceId}
              zoomOptions={zoomOptions}
              zoomId={zoomId}
              setZoomId={setZoomId}
              CUSTOM_DEVICE_ID={CUSTOM_DEVICE_ID}
              fovXDeg={fovXDeg}
              fovYDeg={fovYDeg}
              setFovXDeg={setFovXDeg}
              setFovYDeg={setFovYDeg}
              linkFov={linkFov}
              setLinkFov={setLinkFov}
              viewport={viewport}
              when={when}
              onCommitWhenMs={(ms) => { whenMsRef.current = ms; setWhenMs(ms); }}
              setIsAnimating={setIsAnimating}
              isAnimating={isAnimating}
              speedMinPerSec={speedMinPerSec}
              setSpeedMinPerSec={setSpeedMinPerSec}
              showSun={showSun}
              setShowSun={setShowSun}
              showMoon={showMoon}
              setShowMoon={setShowMoon}
              showPhase={showPhase}
              setShowPhase={setShowPhase}
              rotOffsetDegX={rotOffsetDegX}
              setRotOffsetDegX={setRotOffsetDegX}
              rotOffsetDegY={rotOffsetDegY}
              setRotOffsetDegY={setRotOffsetDegY}
              rotOffsetDegZ={rotOffsetDegZ}
              setRotOffsetDegZ={setRotOffsetDegZ}
              camRotDegX={camRotDegX}
              setCamRotDegX={setCamRotDegX}
              camRotDegY={camRotDegY}
              setCamRotDegY={setCamRotDegY}
              camRotDegZ={camRotDegZ}
              setCamRotDegZ={setCamRotDegZ}
              earthshine={earthshine}
              setEarthshine={setEarthshine}
              showSunCard={showSunCard}
              setShowSunCard={setShowSunCard}
              showMoonCard={showMoonCard}
              setShowMoonCard={setShowMoonCard}
              debugMask={debugMask}
              setDebugMask={setDebugMask}
              timeZone={location.timeZone}

              enlargeObjects={enlargeObjects}
              setEnlargeObjects={setEnlargeObjects}
              currentUtcMs={whenMs}
              // NEW: pass the ground toggle to TopBar
              showEarth={showEarth}
              setShowEarth={setShowEarth}
              // NEW: pass atmosphere toggle
              showAtmosphere={showAtmosphere}
              setShowAtmosphere={setShowAtmosphere}
              // NEW: pass stars toggle
              showStars={showStars}
              setShowStars={setShowStars}
              // NEW: pass markers toggle
              showMarkers={showMarkers}
              setShowMarkers={setShowMarkers}
              // NEW: pass grid toggle
              showGrid={showGrid}
              setShowGrid={setShowGrid}
              // New: pass selected city name for label
              cityName={cityName}
              // NEW: pass projection mode
              projectionMode={projectionMode}
              setProjectionMode={setProjectionMode}
              // NEW: planets toggles
              showPlanets={showPlanets}
              setShowPlanets={setShowPlanets}
            />
          </div>

          {/* Stage canvas */}
          <div ref={stageRef} className="absolute inset-0">
            {/* Overlay info when tools are hidden */}
            {!showPanels && (
              <div
                className="absolute left-1/2 top-2 -translate-x-1/2 text-sm text-white/60 bg-black/30 px-2 py-1 rounded border border-white/10"
                style={{ zIndex: Z.ui }}
              >
                {`${cityName}, ${cityLocalTimeString} heure locale (${utcTime})`}
              </div>
            )}
            {/* Overlays additionnels en mode interface cachée */}
            {!showPanels && (
              <>
                {/* Bas centré: Azimut observateur (refAz) */}
                <div
                  className="absolute left-1/2 bottom-2 -translate-x-1/2 text-sm text-white/60 bg-black/30 px-2 py-1 rounded border border-white/10"
                  style={{ zIndex: Z.ui }}
                >
                  {`Azimut : ${Number(refAz).toFixed(1)}° - ${compass16(refAz)}`}
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
                  {deviceId === CUSTOM_DEVICE_ID
                    ? (zoomOptions[0]?.label ?? '')
                    : `${device.label} — ${zoom?.label ?? ''}`}
                </div>

                {/* Droite centrée: Altitude observateur (refAlt) */}
                <div
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-white/60 bg-black/30 px-2 py-1 rounded border border-white/10"
                  style={{ zIndex: Z.ui }}
                >
                  {`Altitude : ${formatDeg(refAlt, 0)}`}
                </div>
              </>
            )}

            <div
              className="absolute"
              style={{
                zIndex: Z.horizon,           // above Sun/Moon (-2/-1), below markers (=Z.horizon)
                left: viewport.x,
                top: viewport.y,
                width: viewport.w,
                height: viewport.h,
                pointerEvents: 'none',
              }}
            >
              <HorizonOverlay
                viewport={viewport}
                // projection context
                refAzDeg={refAz}
                refAltDeg={refAlt}
                fovXDeg={fovXDeg}
                fovYDeg={fovYDeg}
                projectionMode={projectionMode}
                // visual toggles
                showEarth={showEarth}
                // NEW: debug mask passthrough
                debugMask={debugMask}
              />
               {/* Cardinal markers on horizon (now projected) */}
              {(
                <CardinalMarkers
                  viewport={viewport}
                  refAzDeg={refAz}
                  refAltDeg={refAlt}
                  fovXDeg={fovXDeg}
                  fovYDeg={fovYDeg}
                  projectionMode={projectionMode}
                  items={visibleCardinals as CardinalItem[]}
                  secondaryItems={visibleSecondaryCardinals}
                  bodyItems={bodyHorizonItems}
                />
              )}
            </div>

            {/* NEW: Grid overlay (above atmosphere/stars, below Sun/Moon) */}
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
                  refAzDeg={refAz}
                  refAltDeg={refAlt}
                  fovXDeg={fovXDeg}
                  fovYDeg={fovYDeg}
                  // NEW
                  projectionMode={projectionMode}
                />
              </div>
            )}

            {showAtmosphere && (
              <div
                className="absolute"
                style={{
                  zIndex: Z.horizon - 20, // was Z.horizon - 8, keep it below stars and everything else
                  left: viewport.x,
                  top: viewport.y,
                  width: viewport.w,
                  height: viewport.h,
                  pointerEvents: 'none',
                }}
              >
                <Athmosphere
                  viewport={viewport}
                  // Le composant calcule désormais son dégradé en interne
                  sunAltDeg={astro.sun.alt}
                />
              </div>
            )}

            {/* NEW: Stars layer (above atmosphere, below Sun/Moon) */}
            {showStars && (
              <div className="absolute inset-0" style={{ zIndex: Z.horizon - 5, pointerEvents: 'none' }}>
                <Stars
                  utcMs={whenMs}
                  latDeg={location.lat}
                  lngDeg={location.lng}
                  refAzDeg={refAz}
                  refAltDeg={refAlt}
                  fovXDeg={fovXDeg}
                  fovYDeg={fovYDeg}
                  viewport={viewport}
                  debug={debugMask}
                  enlargeObjects={enlargeObjects}
                  showMarkers={showMarkers}
                  // NEW
                  projectionMode={projectionMode}
                />
              </div>
            )}

            {/* Ensure bodies are above the atmosphere */}
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

            {/* Moon auto: dot (<5px), 2D sprite (5–50px), 3D (>=50px) */}
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
              <div className="absolute inset-0" style={{ zIndex: Z.horizon - 1 }}>
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
                />
              </div>
            )}

            {/* NEW: Planets rendering (dot or sprite) */}
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

              // Downgrade 3D planets to sprite while GLBs still loading
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
                    angleToSunDeg={p.rotationDegPlanetScreen}
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

              // effectiveMode === '3d' (only when glbLoading === false)
              return (
                <div key={p.id} className="absolute inset-0" style={{ zIndex: z, pointerEvents: 'none' }}>
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
                  />
                </div>
              );
            })}

            {/* Markers (horizon ticks, body extents, labels, Polaris/Crux) */}
            <Markers
              showMarkers={showMarkers}
              showStars={showStars}
              zIndexHorizon={Z.horizon}
              horizonY={horizonYFlat}
              horizonMarkers={horizonMarkers}
              //polarisHorizon={polarisHorizon}
              //cruxHorizon={cruxHorizon}
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
              // NEW: planets markers
              planets={planetMarkers}
            />
          </div>

          {/* Photo frame masks (over objects, just below UI) */}
          <PhotoFrame
            viewport={viewport}
            containerW={stageSize.w}
            containerH={stageSize.h}
            zIndex={Z.ui - 1}
          />
          {/* Bottom telemetry cards */}
          <div
            className="absolute bottom-0 left-0 right-0 p-2 sm:p-3 transition-opacity duration-500"
            style={{ zIndex: Z.ui, opacity: showPanels ? 1 : 0, pointerEvents: showPanels ? 'auto' : 'none' }}
          >
            <BottomTelemetry
              astro={astro}
              rotationToHorizonDegMoon={rotationToHorizonDegMoon}
              phaseFraction={phaseFraction}
              brightLimbAngleDeg={brightLimbAngleDeg}
              sunDeclinationDeg={sunDeclinationDeg}
              earthshine={earthshine}
              showMoon3D={true}
              // New: pass eclipse info to the Sun card
              eclipse={eclipse}
              // NEW: pass ecliptic tilt vs horizon at Sun
              eclipticTiltDeg={eclipticTiltDeg}
            />
          </div>

          {/* NEW: Directional keypad (right side, vertically centered) */}
          {(
            <DirectionalKeypad
              baseRefAlt={baseRefAlt}
              stepAzDeg={stepAzDeg}
              stepAltDeg={stepAltDeg}
              setDeltaAzDeg={setDeltaAzDeg}
              setDeltaAltDeg={setDeltaAltDeg}
              zIndex={Z.ui + 20}
            />
          )}
        </main>
      </div>
    </div>
  );
}


function compass16(az: number): string { const idx = Math.round(norm360(az) / 22.5) % 16; return ROSE_16[idx] as string; }
