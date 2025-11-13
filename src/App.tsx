import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useTranslation } from 'react-i18next';
import { useLanguageFromPath } from './hooks/useLanguageFromPath';

// Mobile hooks et composants
import MobileLayout from './components/mobile/MobileLayout';
import MobileSidebarModal from './components/mobile/MobileSidebarModal';
import MobileTelemetryModal from './components/mobile/MobileTelemetryModal';

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
import { toDatetimeLocalInputValue } from "./utils/format";
import { utcMsToZonedLocalString } from "./utils/tz";

// Optique / FOV
import { fovRect, fovFromF35, f35FromFovBest, FOV_DEG_MIN, FOV_DEG_MAX } from "./optics/fov";

// Astro
import { moonApparentDiameterDeg } from "./astro/moon";
import { sunApparentDiameterDeg } from "./astro/sun";
import { computeEclipseInfo } from "./astro/eclipseHelpers";

// Projection
import TopBar from "./components/layout/TopBar";
import { computeViewport } from "./render/viewport";
import type { ProjectionMode } from "./render/projection";

import BottomTelemetry from "./components/layout/BottomTelemetry";

// Import du logo (Vite)
import SidebarLocations from "./components/layout/SidebarLocations"; // + add
import DirectionalKeypad from "./components/stage/DirectionalKeypad";
import { PLANETS, getPlanetRegistry } from "./render/PlanetRegistry";
import { getPlanetsEphemerides } from "./astro/planets";
import { type PlanetId } from "./astro/planets";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { prewarmModel, MOON_RELIEF_SCALE_DEFAULT, PLANET_RELIEF_SCALE_DEFAULT } from './render/modelPrewarm';
import PhotoFrame from "./components/stage/PhotoFrame"; 
import SpaceView from "./components/layout/SpaceView";
import TopRightBar from "./components/layout/TopRightBar";
import { parseUrlIntoState, buildShareUrl } from "./utils/urlState";
import { normLng as normLngGeo, haversineKm, bearingDeg, dir8AbbrevFr, labelToCity } from "./utils/geo";
import { getFrenchToLocalizedDirMap } from "./utils/directions";
import { copyAndDownloadNodeAsPngAndJpeg } from './utils/capture';
import { unrefractAltitudeDeg } from "./utils/refraction"; 
import InfoModal from "./components/info/InfoModal"; 
import {
  type DomRecorderHandle,
  type CanvasRecorderHandle,
  startDomCfrRecorder,
  type DomCfrRecorderHandle
} from "./utils/record";

// Focal length limits for pinch-to-zoom (same as TopBar slider)
const FOCAL_MIN_MM = 1;
const FOCAL_MAX_MM = 4100;
const FF_WIDTH_MM = 36;  // Full-frame sensor width (24x36 format)
const FF_HEIGHT_MM = 24;

 // --- Main Component ----------------------------------------------------------
export default function App() {
  const { t, i18n } = useTranslation('common');
  const { t: tUi } = useTranslation('ui');
  
  // Handle language detection from URL
  useLanguageFromPath();
  
  // Add structured data for SEO
  useEffect(() => {
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "SpaceView.me",
      "alternateName": "SpaceView",
      "description": "Interactive 3D astronomical simulator and astrophotography planner for observing Moon phases, Sun position, planets and stars from any location with real-time calculations.",
      "url": "https://spaceview.me",
      "applicationCategory": "EducationalApplication",
      "applicationSubCategory": "Astronomy simulator, Astrophotography planner",
      "operatingSystem": "Web Browser",
      "browserRequirements": "Requires JavaScript. Modern browser with WebGL support recommended.",
      "softwareVersion": "1.0",
      "inLanguage": ["en", "fr"],
      "author": {
        "@type": "Organization",
        "name": "SpaceView",
        "url": "https://spaceview.me"
      },
      "publisher": {
        "@type": "Organization", 
        "name": "SpaceView",
        "url": "https://spaceview.me"
      },
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      },
      "potentialAction": {
        "@type": "UseAction",
        "target": "https://spaceview.me"
      },
      "featureList": [
        "Real-time Moon phase calculation",
        "Sun position tracking", 
        "Planetary position computation",
        "Eclipse prediction",
        "Astrophotography planning",
        "Wide-angle sky projections",
        "Libration visualization",
        "Time-lapse animation",
        "Location-based observations"
      ],
      "screenshot": "https://spaceview.me/og-image.jpg",
      "image": "https://spaceview.me/og-image.jpg"
    };

    let script = document.getElementById('app-jsonld') as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script') as HTMLScriptElement;
      script.id = 'app-jsonld';
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(jsonLd);

    return () => {
      // Keep the script for navigation performance
    };
  }, []);
  
  // Nouvelle logique de détection mobile/desktop (W >= 1280 = desktop, sinon mobile)
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  //const isDesktopScreen = screenWidth >= 1280;
  const isMobileScreen = screenWidth < 1280;
  const isLandscapeMode = screenWidth > screenHeight;
  
  // États pour les modals mobiles
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showMobileTelemetry, setShowMobileTelemetry] = useState(false);
  
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [stageSize, setStageSize] = useState({ w: 800, h: 500 });

  // ref to SpaceView root
  const spaceViewRef = useRef<HTMLDivElement | null>(null);

  // wrapper that contains SpaceView + long-pose overlay
  const renderStackRef = useRef<HTMLDivElement | null>(null);

  const [showRefraction, setShowRefraction] = React.useState(true);

  // dynamic locations loaded from CSV
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [locationsLoading, setLocationsLoading] = useState<boolean>(true);

  // GLB preload (Moon, Earth, planets)
  const [glbLoading, setGlbLoading] = useState<boolean>(false);
  const [glbProgress, setGlbProgress] = useState<{ loaded: number; total: number }>({ loaded: 0, total: 0 });

  // preselected cities (by id), persisted via URL
  const [preselectedCityIds, setPreselectedCityIds] = useState<string[]>([]);

  // Scene readiness state
  const [sceneReady, setSceneReady] = useState<boolean>(false);

  

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
    Object.values(getPlanetRegistry()).forEach((entry: any) => {
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
    // keep custom/ephemeral IDs as-is
    if (
      location.id === 'loading' ||
      location.id.startsWith('np@') ||
      location.id.startsWith('sp@') ||
      location.id.startsWith('g@') ||
      location.id.startsWith('url@')
    ) {
      return;
    }
    if (locations.length && !locations.find(l => l.id === location.id)) {
      // fallback to first known location (or any policy you prefer)
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
  const devices = useMemo(() => [{ id: CUSTOM_DEVICE_ID, label: t('ui:device.custom'), type: 'phone', aspect: 4/3, zooms: [] } as Device, ...DEVICES], [t]);
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
     const moonTopoKm = topocentricMoonDistanceKm(moon.distanceKm, moon.altDeg );
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
      const label = t('ui:device.theoreticalFocal', { focal: mmStr });
      return [{ id: 'custom-theo', label, kind: 'module', f35: f35eq } as ZoomModule];
    }
    return device.zooms;
  }, [deviceId, device, fovXDeg, fovYDeg, t]);

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
  const [showEcliptique, setShowEcliptique] = useState(false);
  const [showMoonCard, setShowMoonCard] = useState(false);
  const [debugMask, setDebugMask] = useState(false);
  const [enlargeObjects, setEnlargeObjects] = useState(false);
  // ground (Sol) toggle
  const [showEarth, setShowEarth] = useState(false);
  // Atmosphere toggle
  const [showAtmosphere, setShowAtmosphere] = useState(false);
  const [showStars, setShowStars] = useState(false); 
  const [showMarkers, setShowMarkers] = useState(false); 
  // grid toggle
  const [showGrid, setShowGrid] = useState(false);

  const [showHorizon, setShowHorizon] = useState(true);

  const [lockHorizon, setLockHorizon] = useState(true);

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
    const altForMode = (alt: number | undefined) =>
      (typeof alt === 'number')
        ? (showRefraction ? alt : unrefractAltitudeDeg(alt))
        : 0;
    switch (follow) {
      case 'SOLEIL': return { az: astro.sun.az,  alt: altForMode(astro.sun.alt) };
      case 'LUNE':   return { az: astro.moon.az, alt: altForMode(astro.moon.alt) };
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
      return { az: Number(azC), alt: altForMode(Number(altC)) };
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
        return { az: Number(az), alt: altForMode(Number(alt)) };
      }
    } catch { /* ignore */ }

    return { az: 0, alt: 0 };
  }, [
    follow,
    astro.sun.az, astro.sun.alt,
    astro.moon.az, astro.moon.alt,
    followPlanetId, planetsById,
    date, location.lat, location.lng,
    showRefraction 
  ]);
  /*
  - "Rectilinear + Panini" (for Photographic simulation) : rectilinear + Panini for ultra-wide, plus fisheye variants when the selected module is fisheye.
  - "Stereographic centered" (for Educational sky): stereographic centered on the reference direction to keep intuition for angular distances and directions.
  - "Orthographic" (for All-sky context) : orthographic (hemisphere) 
  */
  const [projectionMode, setProjectionMode] = useState<ProjectionMode>('recti-panini');

  // Cadre appareil photo automatique: actif si un appareil/zoom est sélectionné (non "Personnalisé")
  const showCameraFrame = deviceId !== CUSTOM_DEVICE_ID;
  // Toggle for locations sidebar
  // const [showLocations, setShowLocations] = useState(true); // - remove
  // Toggle UI tool/info panels (top and bottom)
  const [showPanels, setShowPanels] = useState(false);
  // NEW: Info modal visibility (set immediately based on URL state)
  const [showInfo, setShowInfo] = useState(() => {
    // Check URL parameters immediately at startup
    if (typeof window === 'undefined') return false;
    const search = window.location.search ?? '';
    const hasQuery = !!search && 
                    search !== '?' && 
                    new URLSearchParams(search).toString().length > 0;
    // Show info modal if there are NO URL parameters (user starts fresh)
    return !hasQuery;
  });

  // City label derived from location label (format "Pays — Ville")
  const cityName = useMemo(() => {
    const parts = (location?.label ?? '').split('—');
    return (parts[1] ?? parts[0]).trim();
  }, [location]);

  // Build overlay location string:
  // - If current lat/lng match the canonical city coords → "City"
  // - Else → "Lat: X.XXX Lng: X.XXX (123 km SO de City)"
  const getOverlayPlaceString = () => {
    const EPS = 1e-9;

    // Poles special case: show distance to the pole
    if (location.lat >= 80) {
      const km = Math.round(haversineKm(location.lat, location.lng, 90, 0));
      if (km==0)
        return i18n.t('common:location.nearNorthPole');
      else
        return i18n.t('common:location.kmFromNorthPole', { km });
    }
    if (location.lat <= -60) {
      const km = Math.round(haversineKm(location.lat, location.lng, -90, 0));
      if (km==0)
        return i18n.t('common:location.nearSouthPole');
      else
        return i18n.t('common:location.kmFromSouthPole', { km });
    }

    const canonical = locations.find(l => l.id === location.id);
    const coordsMatch =
      !!canonical &&
      Math.abs(location.lat - canonical.lat) <= EPS &&
      Math.abs(normLngGeo(location.lng) - normLngGeo(canonical.lng)) <= EPS;

    if (canonical && coordsMatch) {
      return cityName;
    }

    if (!locations.length) {
      return i18n.t('common:location.coordinates', { lat: location.lat.toFixed(3), lng: location.lng.toFixed(3) });
    }

    let best = locations[0];
    let bestD = Number.POSITIVE_INFINITY;
    for (const c of locations) {
      const d = haversineKm(location.lat, location.lng, c.lat, c.lng);
      if (d < bestD) { bestD = d; best = c; }
    }
    const km = Math.round(bestD);
    const bearing = bearingDeg(best.lat, best.lng, location.lat, location.lng);
    const dirFr = dir8AbbrevFr(bearing);
    // Convert French direction to localized direction
    const dirMap = getFrenchToLocalizedDirMap(i18n.t);
    const dir = dirMap[dirFr] || dirFr;
    const nearestCityName = labelToCity(best.label);

    // Use manual interpolation to avoid i18next caching/fallback issues
    const currentLang = i18n.language;
    const template = i18n.getResource(currentLang, 'common', 'location.coordNearestCity');
    
    // Manual interpolation
    let result: string;
    if (template && typeof template === 'string') {
      result = template
        .replace('{{lat}}', location.lat.toFixed(3))
        .replace('{{lng}}', location.lng.toFixed(3))
        .replace('{{km}}', km.toString())
        .replace('{{dir}}', dir)
        .replace('{{nearestCityName}}', nearestCityName);
    } else {
      // Fallback to i18next if template not found
      result = i18n.t('common:location.coordNearestCity', { 
        lat: location.lat.toFixed(3), 
        lng: location.lng.toFixed(3), 
        km, 
        dir, 
        nearestCityName 
      });
    }
    
    return result;
  };

  const overlayPlaceString = getOverlayPlaceString();



  // view deltas (added by directional keypad)
  const [deltaAzDeg, setDeltaAzDeg] = useState(0);
  const [deltaAltDeg, setDeltaAltDeg] = useState(0);
  const stepAzDeg = useMemo(() => 0.05 * fovXDeg, [fovXDeg]);
  const stepAltDeg = useMemo(() => 0.05 * fovYDeg, [fovYDeg]);

  // Reset keypad deltas whenever follow target changes
  useEffect(() => {
    if (suppressNextDeltaResetRef.current) { 
      suppressNextDeltaResetRef.current = false;
      return;
    }
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

  // --- Time-lapse state (UNCOMMENTED) ---
  const [timeLapseEnabled, setTimeLapseEnabled] = useState<boolean>(false);
  const [timeLapsePeriodMs, setTimeLapsePeriodMs] = useState<number>(200); // 1..1000
  const [timeLapseStepValue, setTimeLapseStepValue] = useState<number>(1);  // integer step value
  const [timeLapseStepUnit, setTimeLapseStepUnit] =
    useState<'minute' | 'hour' | 'day' | 'sidereal-day' | 'month' | 'lunar-fraction' | 'synodic-fraction'>('hour');
  const [timeLapseLoopAfter, setTimeLapseLoopAfter] = useState<number>(0); // 0 => no loop

  // Pinch render trigger for smooth zoom
  const [pinchRenderTrigger, setPinchRenderTrigger] = useState<number>(0);

  // --- Long pose state ---
  const [longPoseEnabled, setLongPoseEnabled] = useState<boolean>(false);
  const [longPoseRetainFrames, setLongPoseRetainFrames] = useState<number>(30);
  const lpPendingRef = useRef(false);
  // Replace handler to also push a frame to recorder in frame-locked mode
  const recorderRef = useRef<CanvasRecorderHandle | DomRecorderHandle | DomCfrRecorderHandle | null>(null);
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [recordingFrames, setRecordingFrames] = useState(0);
  // format HH;MM;SS from frames and fps
  const formatTimecode = (frames: number, fps: number) => {
    const total = Math.floor(frames / Math.max(1, fps));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };

  const handleLongPoseAccumulated = React.useCallback(() => {
    lpPendingRef.current = false;
    const r = recorderRef.current;
    if (!r) return;
    if ((r as any).kind === 'dom-cfr') {
     // CFR: capture one frame and ACK
     (r as DomCfrRecorderHandle).captureNext()
       .then(() => { setRecordingFrames(n => n + 1); })
       .finally(() => { recPendingRef.current = false; });
   } else if (r.kind === 'dom-snapshot' && r.mode === 'frame-locked') {

      // Snapshot the DOM subtree and ACK when done
      Promise.resolve(r.renderOnce())
       .then(() => { setRecordingFrames(n => n + 1); })
       .finally(() => { recPendingRef.current = false; });
    } else if (r.kind === 'canvas' && r.mode === 'frame-locked') {
      try {
        r.requestFrame();
        setRecordingFrames(n => n + 1);
      } finally {
        recPendingRef.current = false;
      }
    }
  }, []);
  const [longPoseClearSeq, setLongPoseClearSeq] = useState(0);
  const handleLongPoseClear = useCallback(() => setLongPoseClearSeq(s => s + 1), []);
  const recPendingRef = useRef(false);
  const recFpsRef = useRef(20);
  

  // Track source of time changes to detect user commits
  const lastChangeSourceRef = useRef<'user' | 'anim' | 'manual' | null>(null);

  // When user commits a new date/time from TopBar (also update ref)
  const handleCommitWhenMs = React.useCallback((ms: number) => {
    lastChangeSourceRef.current = 'user';
    whenMsRef.current = ms;
    setWhenMs(ms);
  }, []);

  // Refs for Time-lapse engine
  const tlAccumRef = useRef<number>(0);
  const tlStartWhenMsRef = useRef<number>(whenMs);
  const tlFramesRef = useRef<number>(0);
  const tlInitializedRef = useRef<boolean>(false); // Track if TL was initialized (e.g., from URL)

  // Reset TL counters when enabled (set start ONCE when enabling)
  useEffect(() => {
    if (timeLapseEnabled) {
      tlAccumRef.current = 0;
      // Only set tlStartWhenMsRef if not already initialized (e.g., from URL)
      if (!tlInitializedRef.current) {
        tlStartWhenMsRef.current = whenMs; // capture current time as TL start
      }
      tlInitializedRef.current = true;
      tlFramesRef.current = 0;
    } else {
      tlInitializedRef.current = false; // Reset flag when disabled
    }
  }, [timeLapseEnabled, whenMs]); // Added whenMs back to deps for proper initialization

  // Reset counters when loop size or step parameters change
  useEffect(() => {
    tlAccumRef.current = 0;
    tlFramesRef.current = 0;
    // keep tlStartWhenMsRef as the recorded start of run
  }, [timeLapseLoopAfter, timeLapseStepValue, timeLapseStepUnit]);

  // Also reset TL run cadence when pressing Play in TL mode (do not change start time)
  useEffect(() => {
    if (isAnimating && timeLapseEnabled) {
      tlAccumRef.current = 0;
      // keep tlStartWhenMsRef.current unchanged
      // keep tlFramesRef.current unchanged
    }
  }, [isAnimating, timeLapseEnabled]);


  // If user committed a new date/time, reset TL run start (only for TL mode)
  useEffect(() => {
    if (!timeLapseEnabled) { lastChangeSourceRef.current = null; return; }
    if (lastChangeSourceRef.current === 'user') {
      tlStartWhenMsRef.current = whenMs;
      tlAccumRef.current = 0;
      tlFramesRef.current = 0;
    }
    lastChangeSourceRef.current = null;
  }, [whenMs, timeLapseEnabled]);

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

  // Viewport centré au ratio de l'appareil avec marge adaptative (moins sur mobile)
  const viewport = useMemo(() => {
    const minMargin = isMobileScreen ? 10 : 20; // Marge réduite sur mobile
    return computeViewport(showCameraFrame, stageSize, deviceAspect, minMargin);
  }, [showCameraFrame, stageSize, deviceAspect, isMobileScreen]);


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
      const localTimeStr = date.toLocaleString(undefined, { timeZone: location.timeZone });
      return `${localTimeStr} ${t('location.localTime')}`;
    } catch {
      const localTimeStr = new Intl.DateTimeFormat(undefined, { timeZone: location.timeZone }).format(date);
      return `${localTimeStr} ${t('location.localTime')}`;
    }
  }, [date, location.timeZone, t]);

  
  // Reference azimuth & altitude (follow mode)
  const baseRefAz = useMemo(() => followAltAz.az,  [followAltAz]);
  const baseRefAlt = useMemo(() => followAltAz.alt, [followAltAz]);

  // Final ref with keypad deltas applied
  const refAz = useMemo(() => norm360(baseRefAz + deltaAzDeg), [baseRefAz, deltaAzDeg]);
  const refAlt = useMemo(() => clamp(baseRefAlt + deltaAltDeg, -89.9, 89.9), [baseRefAlt, deltaAltDeg]);

  // Drag to adjust deltaAz/deltaAlt
  const dragStartRef = useRef<{ x: number; y: number; startAz: number; startAlt: number } | null>(null);
  const activeTouchCountRef = useRef<number>(0);
  
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    // Only start drag with primary button (left click or touch)
    if (e.button !== 0) return;
    
    // Don't start drag if we're in a pinch gesture or if multiple touches are active
    if (pinchStateRef.current || activeTouchCountRef.current >= 2) return;
    
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startAz: deltaAzDeg,
      startAlt: deltaAltDeg,
    };
    
    // Capture pointer to receive events even if cursor leaves element
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [deltaAzDeg, deltaAltDeg]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    // Don't drag if we're in a pinch gesture
    if (pinchStateRef.current) return;
    if (!dragStartRef.current) return;
    
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    
    // Calculate altitude at current mouse position
    // Get relative Y position in viewport (0 = top, 1 = bottom)
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const relY = (e.clientY - rect.top) / rect.height;
    
    // In equirectangular projection, altitude varies linearly with Y
    // Top of screen = refAlt + fovYDeg/2, bottom = refAlt - fovYDeg/2
    const mouseAlt = refAlt + (0.5 - relY) * fovYDeg;
    
    // Adjust azimuth sensitivity based on altitude at mouse position
    let azSensitivity = 1.0;
    
    // In spherical projections (non-cylindrical), near the poles the projection stretches
    // horizontally, so pixels represent more degrees of azimuth
    // Sensitivity should increase as 1/cos(altitude) near ±90°
    if (projectionMode !== 'cylindrical' && projectionMode !== 'cylindrical-horizon') {
      const altRad = (mouseAlt * Math.PI) / 180;
      const cosAlt = Math.abs(Math.cos(altRad));
      // Avoid division by zero at exactly ±90°, clamp cos to minimum 0.1
      azSensitivity = 1.0 / Math.max(0.1, cosAlt);
      // Cap maximum sensitivity at 10x to avoid extreme values
      azSensitivity = Math.min(10, azSensitivity);
    }
    // In cylindrical projections, azimuth is linear: no sensitivity adjustment needed
    
    // Determine azimuth direction: invert when looking "over the pole"
    // Above 90° (past zenith) or below -90° (past nadir), the view is "upside down"
    let azDirection = -1; // normal: drag right -> view right
    if (mouseAlt > 90 || mouseAlt < -90) {
      azDirection = 1; // inverted when looking over the pole
    }
    
    // Convert pixel movement to degrees based on FOV
    // Movement sensitivity: 1 screen width = 1 FOV
    const azChange = azDirection * (dx / viewport.w) * fovXDeg * azSensitivity;
    const altChange = (dy / viewport.h) * fovYDeg;
    
    const newAzDeg = dragStartRef.current.startAz + azChange;
    const newAltDeg = dragStartRef.current.startAlt + altChange;
    
    // Wrap azimuth to [-180, 180]
    const wrappedAz = ((newAzDeg + 180) % 360 + 360) % 360 - 180;
    
    // Clamp altitude relative to baseRefAlt to stay within valid range
    const targetAlt = baseRefAlt + newAltDeg;
    const clampedTargetAlt = clamp(targetAlt, -89.9, 89.9);
    const clampedDeltaAlt = clampedTargetAlt - baseRefAlt;
    
    setDeltaAzDeg(wrappedAz);
    setDeltaAltDeg(clampedDeltaAlt);
    
    // Clear long pose accumulation during drag (like DirectionalKeypad does on each click)
    handleLongPoseClear();
  }, [viewport.w, viewport.h, fovXDeg, fovYDeg, baseRefAlt, refAlt, projectionMode, handleLongPoseClear]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartRef.current) {
      dragStartRef.current = null;
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      
      // Clear long pose accumulation when releasing the drag
      handleLongPoseClear();
    }
  }, [handleLongPoseClear]);

  // Pinch-to-zoom for touch devices
  const pinchStateRef = useRef<{ 
    distance: number; 
    focalMm: number; 
    startFovX: number; 
    startFovY: number;
    targetFovX: number;
    targetFovY: number;
  } | null>(null);
  const pinchUpdateFrameRef = useRef<number | null>(null);

  // Effective FOV: use targetFov from pinch ref during gesture, otherwise use state
  const effectiveFovXDeg = useMemo(() => {
    return pinchStateRef.current?.targetFovX ?? fovXDeg;
  }, [fovXDeg, pinchRenderTrigger]); // pinchRenderTrigger forces update during pinch
  
  const effectiveFovYDeg = useMemo(() => {
    return pinchStateRef.current?.targetFovY ?? fovYDeg;
  }, [fovYDeg, pinchRenderTrigger]);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    // Update active touch count
    activeTouchCountRef.current = e.touches.length;
    
    if (e.touches.length === 2) {
      // Two fingers detected: start pinch gesture
      // Cancel any ongoing drag
      dragStartRef.current = null;
      
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dx = touch2.clientX - touch1.clientX;
      const dy = touch2.clientY - touch1.clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Calculate current focal length from FOV
      const rad = (Math.PI / 180) * fovXDeg;
      const tanHalf = Math.tan(rad / 2);
      const currentFocalMm = tanHalf > 0 ? FF_WIDTH_MM / (2 * tanHalf) : FOCAL_MAX_MM;
      
      pinchStateRef.current = {
        distance,
        focalMm: clamp(currentFocalMm, FOCAL_MIN_MM, FOCAL_MAX_MM),
        startFovX: fovXDeg,
        startFovY: fovYDeg,
        targetFovX: fovXDeg,
        targetFovY: fovYDeg,
      };
      
      // Prevent default to avoid page zoom
      e.preventDefault();
    } else if (e.touches.length === 1) {
      // Single touch: allow drag to start (will be handled by pointer events)
      pinchStateRef.current = null;
    }
  }, [fovXDeg, fovYDeg]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && pinchStateRef.current) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dx = touch2.clientX - touch1.clientX;
      const dy = touch2.clientY - touch1.clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Calculate zoom factor (distance ratio)
      // Pinch in (distance decreases) -> zoom in (increase focal)
      // Pinch out (distance increases) -> zoom out (decrease focal)
      const scale = distance / pinchStateRef.current.distance;
      
      // Apply zoom to focal length (direct relationship)
      const newFocalMm = clamp(
        pinchStateRef.current.focalMm * scale,
        FOCAL_MIN_MM,
        FOCAL_MAX_MM
      );
      
      // Convert focal length back to FOV (like TopBar's setFovFromFocal)
      const newFovX = (2 * Math.atan(FF_WIDTH_MM / (2 * newFocalMm)) * 180) / Math.PI;
      const newFovY = (2 * Math.atan(FF_HEIGHT_MM / (2 * newFocalMm)) * 180) / Math.PI;
      
      // Update pinch state for next move (incremental zoom)
      // Store target FOV in ref but DON'T update state during gesture
      pinchStateRef.current = {
        distance,
        focalMm: newFocalMm,
        startFovX: pinchStateRef.current.startFovX,
        startFovY: pinchStateRef.current.startFovY,
        targetFovX: clamp(newFovX, FOV_DEG_MIN, FOV_DEG_MAX),
        targetFovY: clamp(newFovY, FOV_DEG_MIN, FOV_DEG_MAX),
      };
      
      // Force re-render to use updated targetFov from ref
      setPinchRenderTrigger(t => t + 1);
      
      // Clear long pose accumulation
      handleLongPoseClear();
      
      // Prevent default to avoid page zoom
      e.preventDefault();
    }
  }, [handleLongPoseClear]);

  const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    // Update active touch count
    activeTouchCountRef.current = e.touches.length;
    
    if (e.touches.length < 2 && pinchStateRef.current) {
      // Less than 2 fingers: end pinch gesture
      // NOW apply the final FOV to state
      const finalFovX = pinchStateRef.current.targetFovX;
      const finalFovY = pinchStateRef.current.targetFovY;
      
      pinchStateRef.current = null;
      
      // Cancel any pending frame update
      if (pinchUpdateFrameRef.current !== null) {
        cancelAnimationFrame(pinchUpdateFrameRef.current);
        pinchUpdateFrameRef.current = null;
      }
      
      // Apply final FOV
      setFovXDeg(finalFovX);
      setFovYDeg(finalFovY);
      
      // Switch to custom device
      setDeviceId(CUSTOM_DEVICE_ID);
      setZoomId('custom-theo');
    }
  }, [setFovXDeg, setFovYDeg, setDeviceId, setZoomId]);
    
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
  
  const stepTimeLapseOnce = React.useCallback((sign: 1 | -1) => {
    const SYNODIC_DAYS = 29.530588853;
    const SIDEREAL_DAYS = 27.321661;   // sidereal orbit
    const SIDEREAL_DAY_MS = 86164000;  // 23h 56m 4s
    const AVG_MONTH_DAYS = 30.436875;
    const DAY_MS = 86400000;
    const addUTCMonthsMs = (ms: number, months: number) => {
      const nInt = months < 0 ? Math.ceil(months) : Math.trunc(months);
      const frac = months - nInt;
      const d = new Date(ms);
      const y = d.getUTCFullYear();
      const m = d.getUTCMonth();
      const dom = d.getUTCDate();
      const hh = d.getUTCHours(), mm = d.getUTCMinutes(), ss = d.getUTCSeconds(), msu = d.getUTCMilliseconds();
      const targetMonth = m + nInt;
      const lastDom = new Date(Date.UTC(y, targetMonth + 1, 0)).getUTCDate();
      const safeDom = Math.min(dom, lastDom);
      const intMs = Date.UTC(y, targetMonth, safeDom, hh, mm, ss, msu);
      const fracMs = frac * AVG_MONTH_DAYS * DAY_MS;
      return intMs + fracMs;
    };
    const applyStep = (ms: number, s: 1 | -1) => {
      const v = Math.max(1, Math.round(timeLapseStepValue || 1));
      switch (timeLapseStepUnit) {
        case 'minute': return ms + s * v * 60000;
        case 'hour':  return ms + s * v * 3600000;
        case 'day':   return ms + s * v * DAY_MS;
        case 'sidereal-day': return ms + s * v * SIDEREAL_DAY_MS; 
        case 'month': return addUTCMonthsMs(ms, s * v);
        case 'lunar-fraction': {
          const deltaMs = (SIDEREAL_DAYS * DAY_MS) / v;
          return ms + s * deltaMs;
        }
        case 'synodic-fraction': {
          const deltaMs = (SYNODIC_DAYS * DAY_MS) / v;
          return ms + s * deltaMs;
        }
      }
    };

    // Clamp with no loop on manual stepping
    const loopCount = Math.max(0, Math.trunc(timeLapseLoopAfter || 0));
    const maxIndex = loopCount > 0 ? loopCount - 1 : Number.POSITIVE_INFINITY;

    // Current frame index since tlStartWhenMsRef
    let idx = tlFramesRef.current ?? 0;

    // If loop is defined, stop at ends
    if (loopCount > 0) {
      if (sign > 0 && idx >= maxIndex) {
        // stay on last frame
        return;
      }
      if (sign < 0 && idx <= 0) {
        // stay on first frame
        return;
      }
    }

    let next = whenMsRef.current;
    if (sign > 0) {
      next = applyStep(next, +1);
      idx = idx + 1;
    } else {
      next = applyStep(next, -1);
      idx = idx - 1;
    }

    tlFramesRef.current = idx;
    whenMsRef.current = next;
    lastChangeSourceRef.current = 'manual';
    setWhenMs(next);
  }, [timeLapseStepUnit, timeLapseStepValue, timeLapseLoopAfter]);
 
    
  // Animation loop 
  useEffect(() => {
    if (!isAnimating || !sceneReady) {
      if (rafIdRef.current != null) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
      lastTsRef.current = null;
      runningRef.current = false;
      return;
    }
    lastTsRef.current = null;
    runningRef.current = true;

    const SYNODIC_DAYS = 29.530588853; // phase-to-phase
    const SIDEREAL_DAYS = 27.321661;   // sidereal orbit
    const SIDEREAL_DAY_MS = 86164000;  
    const AVG_MONTH_DAYS = 30.436875;
    const DAY_MS = 86400000;

    const addUTCMonthsMs = (ms: number, months: number) => {
      const nInt = months < 0 ? Math.ceil(months) : Math.trunc(months);
      const frac = months - nInt;
      const d = new Date(ms);
      const y = d.getUTCFullYear();
      const m = d.getUTCMonth();
      const dom = d.getUTCDate();
      const hh = d.getUTCHours(), mm = d.getUTCMinutes(), ss = d.getUTCSeconds(), msu = d.getUTCMilliseconds();
      const targetMonth = m + nInt;
      const lastDom = new Date(Date.UTC(y, targetMonth + 1, 0)).getUTCDate();
      const safeDom = Math.min(dom, lastDom);
      const intMs = Date.UTC(y, targetMonth, safeDom, hh, mm, ss, msu);
      const fracMs = frac * AVG_MONTH_DAYS * DAY_MS;
      return intMs + fracMs;
    };

    // apply one TL step
    const stepOnce = (ms: number): number => {
      const v = Math.max(1, Math.round(timeLapseStepValue || 1));
      switch (timeLapseStepUnit) {
        case 'minute': return ms + v * 60000;
        case 'hour':  return ms + v * 3600000;
        case 'day':   return ms + v * DAY_MS;
        case 'sidereal-day': return ms + v * SIDEREAL_DAY_MS;
        case 'month': return addUTCMonthsMs(ms, v);
        case 'lunar-fraction': {
          const deltaMs = (SIDEREAL_DAYS * DAY_MS) / v;
          return ms + deltaMs;
        }
        case 'synodic-fraction': {
          const deltaMs = (SYNODIC_DAYS * DAY_MS) / v;
          return ms + deltaMs;
        }
      }
    };

    const tick = (ts: number) => {
      if (!runningRef.current) return;
      if (lastTsRef.current == null) {
        lastTsRef.current = ts;
      } else {
        const dtSec = (ts - lastTsRef.current) / 1000;
        lastTsRef.current = ts;

         if (timeLapseEnabled) {
          tlAccumRef.current += dtSec * 1000;
          let didSet = false;

          const needsAckRecording =
           !!(isRecordingVideo &&
              recorderRef.current &&
              ( (recorderRef.current as any).kind === 'dom-cfr' ||
                (recorderRef.current as any).mode === 'frame-locked'));

          // Gate stepping on: long-pose ACK, recorder ACK, and period elapsed
          const canStep =
            (!longPoseEnabled || !lpPendingRef.current) &&
            (!needsAckRecording || !recPendingRef.current) &&
            tlAccumRef.current >= timeLapsePeriodMs;

          if (canStep) {
            tlAccumRef.current -= timeLapsePeriodMs;

            whenMsRef.current = stepOnce(whenMsRef.current);
            tlFramesRef.current += 1;
            didSet = true;

            if (timeLapseLoopAfter > 0 && tlFramesRef.current >= timeLapseLoopAfter) {
              whenMsRef.current = tlStartWhenMsRef.current;
              tlFramesRef.current = 0;
              tlAccumRef.current = 0;
            }

            // Wait for ACKs when features are active
            if (longPoseEnabled) lpPendingRef.current = true;
            if (needsAckRecording) recPendingRef.current = true; // wait until capture completes
          }

          if (didSet) {
            lastChangeSourceRef.current = 'anim';
            setWhenMs(whenMsRef.current);
          }
        } else {
          // Smooth mode
          const needsAckRecording =
           !!(isRecordingVideo &&
              recorderRef.current &&
              ( (recorderRef.current as any).kind === 'dom-cfr' ||
                (recorderRef.current as any).mode === 'frame-locked'));

          if (needsAckRecording) {
            // Advance exactly one recorded frame at the recorder fps, gate on ACK
            if (!recPendingRef.current) {
              const fps = Math.max(1, recFpsRef.current || 20);
              const deltaMsPerFrame = clamp(speedMinPerSec, -360, 360) * 60000 / fps;
              whenMsRef.current += deltaMsPerFrame;
              lastChangeSourceRef.current = 'anim';
              setWhenMs(whenMsRef.current);
              recPendingRef.current = true; // will be cleared when renderOnce() resolves
            }
          } else {
            // Original realtime progression
            whenMsRef.current += dtSec * clamp(speedMinPerSec, -360, 360) * 60 * 1000;
            lastChangeSourceRef.current = 'anim';
            setWhenMs(whenMsRef.current);
          }
        }
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
  }, [
    isAnimating,
    sceneReady,
    speedMinPerSec,
    timeLapseEnabled,
    timeLapsePeriodMs,
    timeLapseStepValue,
    timeLapseStepUnit,
    timeLapseLoopAfter,
    longPoseEnabled,
    isRecordingVideo, 
  ]);

  const TOP_RIGHT_BAR_W = 56; // px

  // --- URL state: parse once on load, then keep URL in sync -------------------
  const urlInitedRef = useRef(false);
  const suppressNextDeltaResetRef = useRef(false); // <— NEW

  // Compute once: list of all planet ids (for URL parse/build utilities)
  const allPlanetIds = useMemo(
    () => PLANETS.map(id => String(typeof id === 'string' ? id : (id as any)?.id ?? id)),
    []
  );

  // init from URL once, after locations loaded (so we can map loc ids)
  useEffect(() => {
    if (urlInitedRef.current) return;
    if (locationsLoading) return; // wait for locations list
    
    const search = typeof window !== 'undefined' ? (window.location.search ?? '') : '';
    const hasQuery =
      !!search &&
      search !== '?' &&
      new URLSearchParams(search).toString().length > 0;

    // Mark as initialized even if no query, so startup defaults stay untouched
    urlInitedRef.current = true;
    
    if (!hasQuery) return;

    const q = new URLSearchParams(search);

    // Ignore the next follow→delta reset triggered by URL parsing
    suppressNextDeltaResetRef.current = true; // <— NEW

    parseUrlIntoState(q, {
      whenMsRef,
      setWhenMs,
      locations,
      location,
      setLocation,
      devices,
      CUSTOM_DEVICE_ID,
      setDeviceId,
      setZoomId,
      setFovXDeg,
      setFovYDeg,
      linkFov,
      setLinkFov,
      setFollow,
      setProjectionMode,
      setShowSun,
      setShowMoon,
      setShowPhase,
      setEarthshine,
      setShowEarth,
      setShowAtmosphere,
      setShowStars,
      setShowMarkers,
      setShowGrid,
      setShowHorizon,
      setShowSunCard,
      setShowEcliptique,
      setShowMoonCard,
      setEnlargeObjects,
      setDebugMask,
      setShowPanels,
      allPlanetIds,
      setShowPlanets,
      isAnimating,
      setIsAnimating,
      speedMinPerSec,
      setSpeedMinPerSec,
      setDeltaAzDeg,
      setDeltaAltDeg,
      setTimeLapseEnabled,
      setTimeLapsePeriodMs,
      setTimeLapseStepValue,
      setTimeLapseStepUnit,
      setTimeLapseLoopAfter,
      timeLapseStartMsRef: tlStartWhenMsRef,
      tlInitializedRef,
      setLongPoseEnabled,
      setLongPoseRetainFrames,
      setPreselectedCityIds,
      setShowRefraction,
      setLockHorizon,
    });

    // Force showPanels to false on mobile screens regardless of URL params
    if (isMobileScreen) {
      setShowPanels(false);
    }
  }, [locationsLoading, locations, isMobileScreen]);
  // Note: Other dependencies (allPlanetIds, devices, etc.) are intentionally omitted
  // as this effect should only run once for initial URL parsing after locations load

 

  // keep URL updated (shareable links)

  // Build share URL string (does NOT touch the browser URL)
  const shareUrl = useMemo(() => {
    return buildShareUrl({
      whenMs,
      location,
      locations,
      follow,
      projectionMode,
      deviceId,
      zoomId,
      fovXDeg,
      fovYDeg,
      linkFov,
      CUSTOM_DEVICE_ID,
      toggles: {
        showSun,
        showMoon,
        showPhase,
        earthshine,
        showEarth,
        showAtmosphere,
        showStars,
        showMarkers,
        showGrid,
        showHorizon,
        showSunCard,
        showEcliptique,
        showMoonCard,
        enlargeObjects,
        debugMask,
        showRefraction,
        lockHorizon,
      },
      showPanels,
      showPlanets,
      allPlanetIds,
      isAnimating,
      speedMinPerSec,
      deltaAzDeg,
      deltaAltDeg,
      timeLapseEnabled,
      timeLapsePeriodMs,
      timeLapseStepValue,
      timeLapseStepUnit,
      timeLapseLoopAfter,
      timeLapseStartMs: tlStartWhenMsRef.current,
      longPoseEnabled,
      longPoseRetainFrames,
      preselectedCityIds,
    });
  }, [
    locations, location, whenMs,
    follow, projectionMode,
    deviceId, zoomId, fovXDeg, fovYDeg, linkFov,
    showSun, showMoon, showPhase, earthshine, showEarth, showAtmosphere, showStars, showMarkers, showGrid, showHorizon,
    showSunCard, showEcliptique, showMoonCard, enlargeObjects, debugMask,
    showPanels,
    showRefraction,
    lockHorizon,
    showPlanets,
    isAnimating, speedMinPerSec, allPlanetIds,
    deltaAzDeg, deltaAltDeg,
    timeLapseEnabled, timeLapsePeriodMs, timeLapseStepValue, timeLapseStepUnit, timeLapseLoopAfter,
    longPoseEnabled, longPoseRetainFrames,
    preselectedCityIds,
  ]);

  useEffect(() => {
    if (!longPoseEnabled) lpPendingRef.current = false;
  }, [longPoseEnabled]);
  
  const handleCopyJpeg = React.useCallback(async () => {
      const node = renderStackRef.current;
      if (!node) return;
      try {
        const deviceLabel =
          deviceId === CUSTOM_DEVICE_ID
            ? (zoomOptions[0]?.label ?? '')
            : `${device.label} — ${zoom?.label ?? ''}`;

        await copyAndDownloadNodeAsPngAndJpeg(node, {
          filenameBase: 'spaceview',
          meta: {
            siteUrl: window.location.origin,
            city: cityName,
            lat: location.lat,
            lng: location.lng,
            altDeg: refAlt,
            azDeg: refAz,
            whenMs: whenMs,
            deviceLabel,
            projection: projectionMode,
            fovXDeg,
            fovYDeg,
            // NEW: pass full share/export URL
            exportUrl: shareUrl,
          },
          backgroundColor: '#000',
          jpegQuality: 0.92,
        });
      } catch (e) {
        console.error('Capture/Clipboard error:', e);
      }
    }, [
      renderStackRef,
      cityName,
      location.lat,
      location.lng,
      refAlt,
      refAz,
      whenMs,
      deviceId,
      device,
      zoom,
      zoomOptions,
      projectionMode,
      fovXDeg,
      fovYDeg,
      shareUrl,
    ]);


  // hook called by SpaceView right after the new frame is drawn
const handleFramePresented = React.useCallback(() => {
  const r = recorderRef.current;
  if (!r) return;
  if (longPoseEnabled || !isRecordingVideo) return;

  if ((r as any).kind === 'dom-cfr') {
    if (recPendingRef.current) {
      (r as DomCfrRecorderHandle).captureNext()
        .then(() => { setRecordingFrames(n => n + 1); })
        .finally(() => { recPendingRef.current = false; });
    }
  } else if (r.kind === 'dom-snapshot' && r.mode === 'frame-locked') {
    if (recPendingRef.current) {
      (r as DomRecorderHandle).renderOnce()
        .then(() => { setRecordingFrames(n => n + 1); })
        .finally(() => { recPendingRef.current = false; });
    }
  } else if (r.kind === 'canvas' && r.mode === 'frame-locked') {
    if (recPendingRef.current) {
      try {
        (r as CanvasRecorderHandle).requestFrame();
        setRecordingFrames(n => n + 1);
      } finally {
        recPendingRef.current = false;
      }
    }
  }
}, [isRecordingVideo, longPoseEnabled]);

 

  // Start/stop WebM recording, auto play on start, auto pause on stop
  const handleToggleRecording = useCallback(async () => {
    if (!isRecordingVideo) {
      const node = renderStackRef.current as HTMLDivElement | null;
      if (!node) { console.warn('No node to record.'); return; }
      setRecordingFrames(0);

      // If paused and in timelapse, record from the beginning
      if (!isAnimating && timeLapseEnabled) {
        whenMsRef.current = tlStartWhenMsRef.current;
        setWhenMs(whenMsRef.current);
        tlAccumRef.current = 0;
        tlFramesRef.current = 0;
      }

      // Ensure playback starts
      setIsAnimating(true);

      // Choose playback fps:
      // - timelapse: fps = round(1000 / periodMs), clamped 1..60
      // - smooth: 24 fps
      const fps = timeLapseEnabled
        ? Math.max(1, Math.min(60, Math.round(1000 / Math.max(1, timeLapsePeriodMs))))
        : 24;

      recFpsRef.current = fps;

      // CFR encoder: constant playback speed, no frame drops
      recorderRef.current = await startDomCfrRecorder(node, {
        fps,
        pixelRatio: Math.min(2, window.devicePixelRatio || 1),
        backgroundColor: '#000',
        quality: 0.95,
      });
      setIsRecordingVideo(true);
      recPendingRef.current = false;
    } else {
      try {
        const blob = await recorderRef.current?.stop();
        recorderRef.current = null;
        setIsRecordingVideo(false);
        // Auto-pause on stop
        setIsAnimating(false);
        if (blob && blob.size) {
          const url = URL.createObjectURL(blob);
          const stamp = new Date().toISOString().replace(/[:.]/g, '-');
          const a = document.createElement('a');
          a.href = url;
          a.download = `spaceview-${stamp}.webm`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
        }
      } catch (e) {
        console.error('Recording stop failed:', e);
        setIsRecordingVideo(false);
        setIsAnimating(false);
      }
    }
  }, [isRecordingVideo, isAnimating, timeLapseEnabled, timeLapsePeriodMs]);


  


  // --- JSX -------------------------------------------------------------------
  return (
    <MobileLayout showOrientationPrompt={isMobileScreen}>
      <div className="w-full h-screen bg-black text-white overflow-hidden">
      <div className="flex h-full">
        {/* Left column: locations (caché sur mobile) */}
        {!isMobileScreen && (
          <aside className="shrink-0 relative" style={{ zIndex: Z.ui }}>
            <SidebarLocations
              locations={locations}
              selectedLocation={location}
              onSelectLocation={setLocation}
              utcMs={whenMs}
              // Include deltas in active pointing
              activeAzDeg={refAz}
              activeAltDeg={refAlt}
              preselectedCityIds={preselectedCityIds}
              setPreselectedCityIds={setPreselectedCityIds}
            />
          </aside>
        )}
        {/* Main stage */}
        <main className={`relative flex-1 ${isMobileScreen ? 'stage' : ''}`}>
          {(locationsLoading || glbLoading) && (
            <div className="absolute inset-0 flex flex-col gap-2 items-center justify-center text-white/70 text-sm pointer-events-none">
              {locationsLoading && location.id === 'loading' && <div>{t('loading.locations')}</div>}
              {glbLoading && (
                <div>
                  {t('loading.models', { percent: glbProgress.total > 0 ? Math.round(glbProgress.loaded / glbProgress.total * 100) : 0 })}
                </div>
              )}
            </div>
          )}
          {/* Modal while the first 3D frame(s) are rendering */}
          {!locationsLoading && !glbLoading && !sceneReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white/80 text-sm pointer-events-none"
                 style={{ zIndex: Z.ui + 40 }}>
              {t('loading.sceneRendering')}
            </div>
          )}

          {/* Top-right vertical toolbar (always above SpaceView & UI) */}
          {!(isMobileScreen && showPanels) && (
            <TopRightBar
              showPanels={showPanels}
              onTogglePanels={() => setShowPanels(v => !v)}
              zIndex={Z.ui + 30}
              shareUrl={shareUrl}
              isAnimating={isAnimating}
              onToggleAnimating={() => setIsAnimating(v => !v)}
              onCopyJpeg={handleCopyJpeg}
              onOpenInfo={() => setShowInfo(true)} 
              isRecordingVideo={isRecordingVideo}
              onToggleRecording={handleToggleRecording}
              isMobile={isMobileScreen}
              isLandscape={isLandscapeMode}
              showSidebar={showMobileSidebar}
              onToggleSidebar={() => setShowMobileSidebar(v => !v)}
              showTelemetry={showMobileTelemetry}
              onToggleTelemetry={() => setShowMobileTelemetry(v => !v)}
              
            />
          )}

          {/* Recording status (UI-only, not included in video since we capture renderStackRef) */}
          {isRecordingVideo && (
            <div
              className="absolute top-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-md bg-black/70 border text-xs pointer-events-none"
              style={{ zIndex: Z.ui + 40, borderColor: 'rgba(244, 63, 94, 0.6)', color: 'rgba(252, 165, 165, 0.95)' }}
            >
              {`${t('recording.inProgress')} — ${t('recording.frame')} ${recordingFrames} — ${formatTimecode(recordingFrames, Math.max(1, recFpsRef.current || 24))}`}
            </div>
          )}


          {/* Top UI bar */}
          <div
            className={`${isMobileScreen ? '' : 'absolute top-0 left-0 right-0 p-2 sm:p-3'} transition-opacity duration-500 topbar`}
            style={{
              zIndex: Z.ui + (isMobileScreen ? 50 : 10),
              opacity:  (showPanels ? 1 : 0),
              pointerEvents:  (showPanels ? 'auto' : 'none'),
              paddingRight: isMobileScreen ? 0 : TOP_RIGHT_BAR_W + 8,
            }}
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
              fovXDeg={effectiveFovXDeg}
              fovYDeg={effectiveFovYDeg}
              setFovXDeg={setFovXDeg}
              setFovYDeg={setFovYDeg}
              linkFov={linkFov}
              setLinkFov={setLinkFov}
              viewport={viewport}
              onCommitWhenMs={handleCommitWhenMs}
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
              showEcliptique={showEcliptique}
              setShowEcliptique={setShowEcliptique}
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
              showHorizon={showHorizon}
              setShowHorizon={setShowHorizon}
              lockHorizon={lockHorizon}
              setLockHorizon={setLockHorizon}
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
              timeLapseEnabled={timeLapseEnabled}
              setTimeLapseEnabled={setTimeLapseEnabled}
              timeLapsePeriodMs={timeLapsePeriodMs}
              setTimeLapsePeriodMs={setTimeLapsePeriodMs}
              timeLapseStepValue={timeLapseStepValue}
              setTimeLapseStepValue={setTimeLapseStepValue}
              timeLapseStepUnit={timeLapseStepUnit}
              setTimeLapseStepUnit={setTimeLapseStepUnit}
              timeLapseLoopAfter={timeLapseLoopAfter}
              setTimeLapseLoopAfter={setTimeLapseLoopAfter}
              onTimeLapsePrevFrame={() => stepTimeLapseOnce(-1)}
              onTimeLapseNextFrame={() => stepTimeLapseOnce(+1)}
              timeLapseStartMs={tlStartWhenMsRef.current}
              longPoseEnabled={longPoseEnabled}
              setLongPoseEnabled={setLongPoseEnabled}
              longPoseRetainFrames={longPoseRetainFrames}
              setLongPoseRetainFrames={setLongPoseRetainFrames}
              onLongPoseClear={handleLongPoseClear}
              showRefraction={showRefraction}
              setShowRefraction={setShowRefraction}
              isMobileScreen={isMobileScreen}
              isLandscapeMode={isLandscapeMode}
              onClosePanels={() => setShowPanels(false)}
          />
          </div>

          {/* Stage canvas */}
          <div ref={stageRef} className="absolute inset-0">

            {/* All sky rendering moved to SpaceView */}
            <div ref={stageRef} className="absolute inset-0">
              {/* SpaceView clipped to PhotoFrame viewport */}
              <div
                className="absolute"
                style={{
                  left: viewport.x,
                  top: viewport.y,
                  width: viewport.w,
                  height: viewport.h,
                  overflow: 'hidden',
                  cursor: dragStartRef.current ? 'grabbing' : 'grab',
                  touchAction: 'none', // Prevent default touch behaviors like scrolling
                }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <div ref={renderStackRef} className="relative w-full h-full">
                <SpaceView
                  ref={spaceViewRef}
                  date={date}
                  utcMs={whenMs}
                  latDeg={location.lat}
                  lngDeg={location.lng}
                  viewport={{ x: 0, y: 0, w: viewport.w, h: viewport.h }}
                  refAzDeg={refAz}
                  refAltDeg={refAlt}
                  fovXDeg={effectiveFovXDeg}
                  fovYDeg={effectiveFovYDeg}
                  projectionMode={projectionMode}
                  showEarth={showEarth}
                  showGrid={showGrid}
                  showAtmosphere={showAtmosphere}
                  showStars={showStars}
                  showMarkers={showMarkers}
                  showHorizon={showHorizon}
                  lockHorizon={lockHorizon}
                  showSun={showSun}
                  showMoon={showMoon}
                  showPhase={showPhase}
                  earthshine={earthshine}
                  showSunCard={showSunCard}
                  showEcliptique={showEcliptique}
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
                  onSceneReadyChange={setSceneReady}
                  showHud={!showPanels}
                  cameraLabel={deviceId === CUSTOM_DEVICE_ID
                    ? (zoomOptions[0]?.label ?? '') 
                    : `${device.label} — ${zoom?.label ?? ''}`}
                  overlayInfoString={tUi('time.overlayFormat', { place: overlayPlaceString, localTime: cityLocalTimeString, utcTime })}
                  longPoseEnabled={longPoseEnabled}
                  onLongPoseAccumulated={handleLongPoseAccumulated}
                  longPoseClearSeq={longPoseClearSeq}
                  timeLapseEnabled={timeLapseEnabled}
                  onLongPoseClear={handleLongPoseClear}
                  showRefraction={showRefraction}
                  presentKey={whenMs}
                  onFramePresented={handleFramePresented}
                  isMobile={isMobileScreen}
                  isLandscape={isLandscapeMode}
                />
                </div>
              </div>
            </div>
          </div>

          {/* Photo frame masks (over objects, just below UI) */}
          <PhotoFrame
            viewport={viewport}
            containerW={stageSize.w}
            containerH={stageSize.h}
            zIndex={Z.ui - 1}
          />
          {/* Bottom telemetry cards (masqué sur mobile) */}
          {!isMobileScreen && (
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
                eclipse={eclipse}
                eclipticTiltDeg={eclipticTiltDeg}
              />
            </div>
          )}

          {/* Directional keypad (adaptatif mobile/desktop) */}
          {!(isMobileScreen && showPanels) && (
            <DirectionalKeypad
              baseRefAlt={baseRefAlt}
              stepAzDeg={stepAzDeg}
              stepAltDeg={stepAltDeg}
              setDeltaAzDeg={setDeltaAzDeg}
              setDeltaAltDeg={setDeltaAltDeg}
              zIndex={Z.ui + 20}
              onLongPoseClear={handleLongPoseClear}
              isMobile={isMobileScreen}
              isLandscape={isLandscapeMode}
            />
          )}
        </main>
      </div>

      {/* Info modal (top layer) */}
      <InfoModal open={showInfo} onClose={() => setShowInfo(false)} />

      {/* Mobile modals */}
      {isMobileScreen && (
        <>
          <MobileSidebarModal
            isOpen={showMobileSidebar}
            onClose={() => setShowMobileSidebar(false)}
            locations={locations}
            selectedLocation={location}
            onSelectLocation={setLocation}
            utcMs={whenMs}
            activeAzDeg={refAz}
            activeAltDeg={refAlt}
            preselectedCityIds={preselectedCityIds}
            setPreselectedCityIds={setPreselectedCityIds}
          />
          
          <MobileTelemetryModal
            isOpen={showMobileTelemetry}
            onClose={() => setShowMobileTelemetry(false)}
            astro={astro}
            rotationToHorizonDegMoon={rotationToHorizonDegMoon}
            phaseFraction={phaseFraction}
            brightLimbAngleDeg={brightLimbAngleDeg}
            sunDeclinationDeg={sunDeclinationDeg}
            earthshine={earthshine}
            eclipse={eclipse}
            eclipticTiltDeg={eclipticTiltDeg}
            overlayInfoString={tUi('time.overlayFormat', { place: overlayPlaceString, localTime: cityLocalTimeString, utcTime })}
            refAzDeg={refAz}
            refAltDeg={refAlt}
            cameraLabel={deviceId === CUSTOM_DEVICE_ID
              ? (zoomOptions[0]?.label ?? '') 
              : `${device.label} — ${zoom?.label ?? ''}`}
            enlargeObjects={enlargeObjects}
            domainFromBrowser={typeof window !== 'undefined' ? window.location.hostname?.replace(/^www\./, '') || 'SpaceView' : 'SpaceView'}
          />
          
        </>
      )}
    </div>
    </MobileLayout>
  );

}

