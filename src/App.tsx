import React, { useEffect, useMemo, useRef, useState } from "react";
// Astronomy-Engine wrapper centralisé
import { getMoonIllumination, getMoonLibration, moonHorizontalParallaxDeg, topocentricMoonDistanceKm, sunOnMoon, getSunAndMoonAltAzDeg, getSunOrientationAngles } from "./astro/aeInterop";
import { getMoonOrientationAngles } from "./astro/aeInterop";

// Types
import type { FollowMode } from "./types";
import type { Device, ZoomModule } from "./optics/types";
 
// Données
import { getAllLocations, type LocationOption } from "./data/locations";
import { DEVICES, CUSTOM_DEVICE_ID } from "./optics/devices";

// Constantes d’affichage
import { Z } from "./render/constants";

// Utilitaires & formatage
import { norm360, clamp } from "./utils/math";
import { compass16 } from "./utils/compass";
import { toDatetimeLocalInputValue, formatDeg } from "./utils/format";
import { utcMsToZonedLocalString } from "./utils/tz";

// Optique / FOV
import { fovRect, fovFromF35, f35FromFovBest, FOV_DEG_MIN, FOV_DEG_MAX } from "./optics/fov";


// Astro
import { moonApparentDiameterDeg } from "./astro/moon";
import { sunApparentDiameterDeg } from "./astro/sun";
import { lstDeg } from "./astro/time";
import { computeEclipseInfo } from "./astro/eclipseHelpers";import { altazToRaDec, parallacticAngleDeg } from "./astro/coords";
import { sampleTerminatorLUT } from "./astro/lut";

// Projection
import { projectToScreen } from "./render/projection";
import TopBar from "./components/layout/TopBar";
import BottomTelemetry from "./components/layout/BottomTelemetry";

// Import du logo (Vite)
import SidebarLocations from "./components/layout/SidebarLocations"; // + add
import DirectionalKeypad from "./components/stage/DirectionalKeypad";
import { PLANETS, PLANET_REGISTRY } from "./render/planetRegistry";
import { getPlanetsEphemerides } from "./astro/planets";
import { type PlanetId } from "./astro/planets";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { prewarmModel, MOON_RELIEF_SCALE_DEFAULT, PLANET_RELIEF_SCALE_DEFAULT } from './render/modelPrewarm';
import PhotoFrame from "./components/stage/PhotoFrame"; // + add
import SpaceView from "./components/layout/SpaceView";


 // --- Main Component ----------------------------------------------------------
export default function App() {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [stageSize, setStageSize] = useState({ w: 800, h: 500 });

  // dynamic locations loaded from CSV
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [locationsLoading, setLocationsLoading] = useState<boolean>(true);

  // GLB preload (Moon, Earth, planets)
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
  // ground (Sol) toggle
  const [showEarth, setShowEarth] = useState(false);
  // Atmosphere toggle
  const [showAtmosphere, setShowAtmosphere] = useState(false);
  const [showStars, setShowStars] = useState(false); // + add
  const [showMarkers, setShowMarkers] = useState(false); 
  // grid toggle
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

  // map FollowMode -> planet id (registry)
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


  // quick lookup by id
  const planetsById = useMemo(() => {
    const m: Record<string, any> = {};
    for (const p of planetsEphemArr) {
      if (p?.id) m[p.id] = p;
    }
    return m;
  }, [planetsEphemArr]);
  
  // Follow target alt/az (sun/moon direct, planets from cache or one-off ephemeris)
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
      );
      const it = Array.isArray(res) ? res[0] : (res as any)?.[followPlanetId];
      const az = it?.azDeg ?? it?.az;
      const alt = it?.altDeg ?? it?.alt;
      if (Number.isFinite(az) && Number.isFinite(alt)) {
        return { az: Number(az), alt: Number(alt) };
      }
    } catch { /* ignore */ }

    return { az: 0, alt: 0 };
  }, [follow, astro.sun.az, astro.sun.alt, astro.moon.az, astro.moon.alt, followPlanetId, planetsById, date, location.lat, location.lng]);


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

  // view deltas (added by directional keypad)
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

  // city-local time (selected location timezone)
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

    
  const moonOrientation = useMemo(
    () => getMoonOrientationAngles(date, location.lat, location.lng),
    [date, location.lat, location.lng]
  );
  const rotationToHorizonDegMoon = moonOrientation.rotationToHorizonDegMoonNorth;

  const sunOrientation = useMemo(
    () => getSunOrientationAngles(date, location.lat, location.lng),
    [date, location.lat, location.lng]
  );
  
  const sunOnMoonInfo = useMemo(() => sunOnMoon(date), [date]);
  const brightLimbAngleDeg = useMemo(() => sunOnMoonInfo.bearingDeg, [sunOnMoonInfo]);
  const sunDeclinationDeg = useMemo(() => sunOnMoonInfo.declinationDeg, [sunOnMoonInfo]);
  const phaseFraction = astro.illum.fraction ?? 0;

  // eclipse info used by BottomTelemetry
  const eclipse = useMemo(() => {
    return computeEclipseInfo(
      astro.sun.alt, astro.sun.az, astro.sun.appDiamDeg,
      astro.moon.alt, astro.moon.az, astro.moon.appDiamDeg
    );
  }, [astro.sun, astro.moon]);
    
  const eclipticTiltDeg = sunOrientation.eclipticTiltDeg;
  
    
  // Animation loop 
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
              showEarth={showEarth}
              setShowEarth={setShowEarth}
              showAtmosphere={showAtmosphere}
              setShowAtmosphere={setShowAtmosphere}
              showStars={showStars}
              setShowStars={setShowStars}
              showMarkers={showMarkers}
              setShowMarkers={setShowMarkers}
              showGrid={showGrid}
              setShowGrid={setShowGrid}
              cityName={cityName}
              projectionMode={projectionMode}
              setProjectionMode={setProjectionMode}
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

            {/* All sky rendering moved to SpaceView */}
            <SpaceView
              date={date}
              utcMs={whenMs}
              latDeg={location.lat}
              lngDeg={location.lng}
              viewport={viewport}
              refAzDeg={refAz}
              refAltDeg={refAlt}
              fovXDeg={fovXDeg}
              fovYDeg={fovYDeg}
              projectionMode={projectionMode}
              showEarth={showEarth}
              showGrid={showGrid}
              showAtmosphere={showAtmosphere}
              showStars={showStars}
              showMarkers={showMarkers}
              showSun={showSun}
              showMoon={showMoon}
              showPhase={showPhase}
              earthshine={earthshine}
              showSunCard={showSunCard}
              showMoonCard={showMoonCard}
              debugMask={debugMask}
              enlargeObjects={enlargeObjects}
              glbLoading={glbLoading}
              showPlanets={showPlanets}
              rotOffsetDegX={rotOffsetDegX}
              rotOffsetDegY={rotOffsetDegY}
              rotOffsetDegZ={rotOffsetDegZ}
              camRotDegX={camRotDegX}
              camRotDegY={camRotDegY}
              camRotDegZ={camRotDegZ}
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
              // pass eclipse info to the Sun card
              eclipse={eclipse}
              // pass ecliptic tilt vs horizon at Sun
              eclipticTiltDeg={eclipticTiltDeg}
            />
          </div>

          {/* Directional keypad (right side, vertically centered) */}
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

