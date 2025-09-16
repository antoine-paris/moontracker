import React, { useEffect, useMemo, useRef, useState } from "react";
// Astronomy-Engine wrapper centralisé
import { getSunAltAzDeg, getMoonAltAzDeg, getMoonIllumination, getMoonLibration, moonHorizontalParallaxDeg, topocentricMoonDistanceKm, sunOnMoon, getSunAndMoonAltAzDeg } from "./astro/aeInterop";

// Types
import type { FollowMode } from "./types";
import type { LocationOption } from "./data/locations";
import type { Device, ZoomModule } from "./optics/types";
import type { Astro as TelemetryAstro } from "./components/layout/BottomTelemetry";

// Données
import { LOCATIONS, loadLocationsFromCsv, getAllLocations } from "./data/locations";
import { DEVICES, CUSTOM_DEVICE_ID } from "./optics/devices";

// Constantes d’affichage
import { Z, MOON_RENDER_DIAMETER, ROSE_16 } from "./render/constants";

// Utilitaires & formatage
import { toDeg, toRad, norm360, angularDiff, clamp } from "./utils/math";
import { toDatetimeLocalInputValue, formatTimeInZone, formatDateTimeInZone, formatDeg } from "./utils/format";
import { utcMsToZonedLocalString } from "./utils/tz";

// Optique / FOV
import { fovRect, fovFromF35, f35FromFov, FOV_DEG_MIN, FOV_DEG_MAX } from "./optics/fov";

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
import CardinalMarkers, { type CardinalItem } from "./components/stage/CardinalMarkers";
import SunSprite from "./components/stage/SunSprite";
import MoonSprite from "./components/stage/MoonSprite";
import Moon3D from "./components/stage/Moon3D";
import StageCanvas from "./components/stage/StageCanvas";
// Import du logo (Vite)
import SidebarLocations from "./components/layout/SidebarLocations"; // + add

// --- Main Component ----------------------------------------------------------
export default function App() {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [stageSize, setStageSize] = useState({ w: 800, h: 500 });

  // New: dynamic locations loaded from CSV
  const [locations, setLocations] = useState<LocationOption[]>(LOCATIONS);

  // Add this useEffect to load locations from CSV
  useEffect(() => {
    getAllLocations().then(setLocations);
  }, []);

  // Controls
  const [location, setLocation] = useState<LocationOption>(LOCATIONS[2]); // default Paris
  const [when, setWhen] = useState<string>(() => toDatetimeLocalInputValue(new Date()));
  const [whenMs, setWhenMs] = useState<number>(() => Date.parse(when));
  const [follow, setFollow] = useState<FollowMode>('LUNE');
  const [fovXDeg, setFovXDeg] = useState<number>(220);
  const [fovYDeg, setFovYDeg] = useState<number>(220);
  const [linkFov, setLinkFov] = useState<boolean>(true);
  // Appareil/Zoom sélection
  const [deviceId, setDeviceId] = useState<string>(() => DEVICES[0].id);
  const devices = useMemo(() => [{ id: CUSTOM_DEVICE_ID, label: 'Personalisé', type: 'phone', aspect: 4/3, zooms: [] } as Device, ...DEVICES], []);
  const device = useMemo(() => devices.find(d => d.id === deviceId)!, [devices, deviceId]);
  const [zoomId, setZoomId] = useState<string>(() => DEVICES[0].zooms[0].id);
  const zoom = useMemo(() => device.zooms.find(z => z.id === zoomId) ?? device.zooms[0], [device, zoomId]);
  // Zooms visibles (si custom, afficher une focale théorique calculée depuis les sliders)
  const zoomOptions = useMemo(() => {
    if (deviceId === CUSTOM_DEVICE_ID) {
      const ar = stageSize.w > 0 && stageSize.h > 0 ? (stageSize.w / stageSize.h) : 4 / 3;
      const f35eq = f35FromFov(fovXDeg, fovYDeg, ar);
      const label = `Focale théorique (~${Math.round(f35eq)} mm eq 35mm)`;
      return [{ id: 'custom-theo', label, kind: 'module', f35: f35eq } as ZoomModule];
    }
    return device.zooms;
  }, [deviceId, device, fovXDeg, fovYDeg, stageSize]);
  useEffect(() => { if (deviceId === CUSTOM_DEVICE_ID) setZoomId('custom-theo'); }, [deviceId]);
  const [showSun, setShowSun] = useState(true);
  const [showMoon, setShowMoon] = useState(true);
  const [showPhase, setShowPhase] = useState(true);
  const [earthshine, setEarthshine] = useState(false);
  const [showMoon3D, setShowMoon3D] = useState(false);
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
  const [enlargeObjects, setEnlargeObjects] = useState(true);
  // NEW: ground (Sol) toggle
  const [showEarth, setShowEarth] = useState(false);
  // Cadre appareil photo automatique: actif si un appareil/zoom est sélectionné (non "Personnalisé")
  const showCameraFrame = deviceId !== CUSTOM_DEVICE_ID;
  // Toggle for locations sidebar
  // const [showLocations, setShowLocations] = useState(true); // - remove
  // Toggle UI tool/info panels (top and bottom)
  const [showPanels, setShowPanels] = useState(true);
  // City label derived from location label (format "Pays — Ville")
  const cityName = useMemo(() => {
    const parts = location.label.split('—');
    return (parts[1] ?? parts[0]).trim();
  }, [location]);

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

  // Parsed date
  const date = useMemo(() => new Date(whenMs), [whenMs]);

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
    return date.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
  }, [date]);

  // New: city-local time (selected location timezone)
  const cityLocalTimeString = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('fr-FR', {
        timeZone: location.timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZoneName: 'short',
      }).format(date);
    } catch {
      return new Intl.DateTimeFormat('fr-FR', {
        timeZone: location.timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(date);
    }
  }, [date, location.timeZone]);

  // Astronomical positions
  const astro = useMemo(() => {
     const { lat, lng } = location;
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

  // Reference azimuth & altitude (follow mode)
  const refAz = useMemo(() => {
    switch (follow) {
      case 'SOLEIL': return astro.sun.az;
      case 'LUNE': return astro.moon.az;
      case 'N': return 0;
      case 'E': return 90;
      case 'S': return 180;
      case 'O': return 270;
    }
  }, [follow, astro]);
  const refAlt = useMemo(() => (follow === 'SOLEIL' ? astro.sun.alt : follow === 'LUNE' ? astro.moon.alt : 0), [follow, astro]);

  // Screen positions
  const bodySizes = useMemo(() => {
    // Obtenir l’échelle locale px/deg au centre (rayon nul, pour ne pas influencer la visibilite)
    const centerSun = projectToScreen(astro.sun.az, astro.sun.alt, refAz, viewport.w, viewport.h, refAlt, 0, fovXDeg, fovYDeg);
    const centerMoon = projectToScreen(astro.moon.az, astro.moon.alt, refAz, viewport.w, viewport.h, refAlt, 0, fovXDeg, fovYDeg);
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
  }, [viewport, fovXDeg, fovYDeg, astro.sun.az, astro.sun.alt, astro.moon.az, astro.moon.alt, astro.sun.appDiamDeg, astro.moon.appDiamDeg, refAz, refAlt, enlargeObjects]);

  const sunScreen = useMemo(() => {
    const s = projectToScreen(astro.sun.az, astro.sun.alt, refAz, viewport.w, viewport.h, refAlt, bodySizes.sun.r, fovXDeg, fovYDeg);
    return { ...s, x: viewport.x + s.x, y: viewport.y + s.y };
  }, [astro.sun, refAz, refAlt, viewport, fovXDeg, fovYDeg, bodySizes.sun]);
  const moonScreen = useMemo(() => {
    const m = projectToScreen(astro.moon.az, astro.moon.alt, refAz, viewport.w, viewport.h, refAlt, bodySizes.moon.r, fovXDeg, fovYDeg);
    return { ...m, x: viewport.x + m.x, y: viewport.y + m.y };
  }, [astro.moon, refAz, refAlt, viewport, fovXDeg, fovYDeg, bodySizes.moon]);

  // Orientation & phase
  const rotationToHorizonDegMoon = useMemo(() => -parallacticAngleDeg(astro.moon.az, astro.moon.alt, location.lat), [astro.moon, location.lat]);
  const rotationToHorizonDegSun = useMemo(() => -parallacticAngleDeg(astro.sun.az, astro.sun.alt, location.lat), [astro.sun, location.lat]);

  // Compute Sun direction on Moon once, reuse both bearing and declination
  const sunOnMoonInfo = useMemo(() => sunOnMoon(date), [date]);

  // Angle du limbe éclairé
  const brightLimbAngleDeg = useMemo(() => sunOnMoonInfo.bearingDeg, [sunOnMoonInfo]);

  // New: Sun declination relative to the lunar equator (deg, signed)
  const sunDeclinationDeg = useMemo(() => sunOnMoonInfo.declinationDeg, [sunOnMoonInfo]);

  // Auto-polarity to ensure lit side points toward the Sun
  const maskAngleBase = useMemo(() => norm360(brightLimbAngleDeg - 90), [brightLimbAngleDeg]);
  const maskAngleDeg = useMemo(() => {
    const litVecAngle = norm360(maskAngleBase + 90);
    let d = norm360(litVecAngle - brightLimbAngleDeg); if (d > 180) d = 360 - d;
    return d > 90 ? norm360(maskAngleBase + 180) : maskAngleBase;
  }, [maskAngleBase, brightLimbAngleDeg]);

  const phaseFraction = astro.illum.fraction ?? 0; // [0..1]

  // Diagnostic d’éclipse locale
  const eclipse = useMemo(() => {
    const sep = sepDeg(astro.sun.alt, astro.sun.az, astro.moon.alt, astro.moon.az);
    const rS = (astro.sun.appDiamDeg ?? 0) / 2;
    const rM = (astro.moon.appDiamDeg ?? 0) / 2;
    const kind = eclipseKind(sep, rS, rM);
    return { sep, rS, rM, kind } as const;
  }, [astro.sun, astro.moon]);

  // Phase/mask geometry désormais gérée par MoonSprite

  // Horizon & helper lines
  const topLineY = useMemo(() => viewport.y + projectToScreen(refAz, 90, refAz, viewport.w, viewport.h, refAlt, 0, fovXDeg, fovYDeg).y, [refAz, refAlt, viewport, fovXDeg, fovYDeg]);
  const bottomLineY = useMemo(() => viewport.y + projectToScreen(refAz, -90, refAz, viewport.w, viewport.h, refAlt, 0, fovXDeg, fovYDeg).y, [refAz, refAlt, viewport, fovXDeg, fovYDeg]);
  const horizonY = useMemo(() => viewport.y + projectToScreen(refAz, 0, refAz, viewport.w, viewport.h, refAlt, 0, fovXDeg, fovYDeg).y, [refAz, refAlt, viewport, fovXDeg, fovYDeg]);

  // Markers on horizon for bodies
  const horizonMarkers = useMemo(() => {
    const items: { x: number; label: string; color: string }[] = [];
    if (showSun) {
      const { x, visibleX } = projectToScreen(astro.sun.az, 0, refAz, viewport.w, viewport.h, refAlt, 0, fovXDeg, fovYDeg);
      if (visibleX) items.push({ x: viewport.x + x, label: "Soleil", color: "#f59e0b" });
    }
    if (showMoon) {
      const { x, visibleX } = projectToScreen(astro.moon.az, 0, refAz, viewport.w, viewport.h, refAlt, 0, fovXDeg, fovYDeg);
      if (visibleX) items.push({ x: viewport.x + x, label: "Lune", color: "#93c5fd" });
    }
    return items;
  }, [showSun, showMoon, astro, refAz, refAlt, viewport, fovXDeg, fovYDeg]);

  // Visible cardinal points on horizon (global N/E/S/O)
  const visibleCardinals = useMemo(() => {
    const base = [
      { label: 'N' as const, az: 0 },
      { label: 'E' as const, az: 90 },
      { label: 'S' as const, az: 180 },
      { label: 'O' as const, az: 270 },
    ];

    // Project and keep only those horizontally visible
    const projected = base
      .map(c => {
        const p = projectToScreen(c.az, 0, refAz, viewport.w, viewport.h, refAlt, 0, fovXDeg, fovYDeg);
        const x = viewport.x + p.x;
        const delta = Math.abs(angularDiff(c.az, refAz)); // proximity to center
        return { ...c, x, visible: p.visibleX, delta };
      })
      .filter(c => c.visible);

    // Deduplicate cardinals that collapse to the same column (e.g., 0° vs 180°)
    const EPS = 1; // px tolerance
    const dedup: typeof projected = [];
    for (const it of projected) {
      const idx = dedup.findIndex(d => Math.abs(d.x - it.x) <= EPS);
      if (idx === -1) {
        dedup.push(it);
      } else if (it.delta < dedup[idx].delta) {
        dedup[idx] = it; // keep the one closer to center
      }
    }

    return dedup
      .sort((a, b) => a.x - b.x)
      .map(({ label, az, x }) => ({ label, az, x, visible: true }));
  }, [refAz, refAlt, viewport, fovXDeg, fovYDeg]);


  // Animation loop
  useEffect(() => {
    if (!isAnimating) {
      if (rafIdRef.current != null) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null; lastTsRef.current = null; 
      runningRef.current = false;
      return;
    }
    // Ne pas réinitialiser whenMsRef ici, on continue depuis la valeur courante
    lastTsRef.current = null;
    runningRef.current = true;
    const tick = (ts: number) => {
      if (!runningRef.current) return;
      if (lastTsRef.current == null) { lastTsRef.current = ts; }
      else {
        const dtSec = (ts - lastTsRef.current) / 1000; lastTsRef.current = ts;
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
        {/* - remove the legacy aside, replace with SidebarLocations */}
        <aside className="shrink-0 relative" style={{ zIndex: Z.ui }}>
          <SidebarLocations
            locations={locations}
            selectedLocation={location}
            onSelectLocation={setLocation}
            utcMs={whenMs} // + pass current UTC
            // NEW: pass active azimuth/altitude (from follow mode)
            activeAzDeg={refAz}
            activeAltDeg={refAlt}
          />
        </aside>

        {/* Main stage */}
        <main className="relative flex-1">
          {/* Global toggle button (top-right) */}
          <button
            onClick={() => setShowPanels(v => !v)}
            className="absolute top-2 right-2 px-4 py-2 rounded-lg border border-white/20 text-white/80 hover:border-white/40 text-2xl leading-none"
            style={{ zIndex: Z.ui + 20 }}
            aria-label="Basculer l'interface"
            title="Basculer l'interface"
          >
            {"\u2922"}
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
              showMoon3D={showMoon3D}
              setShowMoon3D={setShowMoon3D}
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
              // New: pass selected city name for label
              cityName={cityName}
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
                {`${cityName}, ${cityLocalTimeString} (${utcTime})`}
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
                  {`${device.label} — ${(deviceId === CUSTOM_DEVICE_ID ? (zoomOptions[0]?.label ?? '') : (zoom?.label ?? ''))}`}
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

            <HorizonOverlay viewport={viewport} horizonY={horizonY} topLineY={topLineY} bottomLineY={bottomLineY} />

            <StageCanvas viewport={viewport} stageSize={stageSize} showCameraFrame={showCameraFrame} />

            <CardinalMarkers horizonY={horizonY} items={visibleCardinals as CardinalItem[]} />

            {horizonMarkers.map((m, i) => (
              <div key={i} style={{ position: "absolute", left: m.x, top: horizonY, zIndex: Z.horizon }}>
                <div className="-translate-x-1/2 -translate-y-1/2"><div className="h-6 w-0.5" style={{ background: m.color, opacity: 0.9 }} /></div>
              </div>
            ))}

            {showSun && (
              <SunSprite x={sunScreen.x} y={sunScreen.y} visibleX={sunScreen.visibleX} visibleY={sunScreen.visibleY} rotationDeg={rotationToHorizonDegSun} showCard={showSunCard} wPx={bodySizes.sun.w} hPx={bodySizes.sun.h} />
            )}

            {showMoon && !showMoon3D && (
              <MoonSprite
                x={moonScreen.x} y={moonScreen.y}
                visibleX={moonScreen.visibleX} visibleY={moonScreen.visibleY}
                rotationDeg={rotationToHorizonDegMoon}
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
            )}

            {showMoon && showMoon3D && moonScreen.visibleX && moonScreen.visibleY && (
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
                  limbAngleDeg={rotationToHorizonDegMoon * -1}
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
                  // New: drive light from Moon card data
                  illumFraction={phaseFraction}
                  brightLimbAngleDeg={brightLimbAngleDeg}
                  // New: enable earthshine-based fill light (camera source)
                  earthshine={earthshine}
                />
              </div>
            )}

            {/* NEW: Ground layer (opaque), clipped from horizon to bottom.
                Z: above Sun/Moon(+3D) and below horizon/cardinals */}
            {showEarth && (
              <div
                className="absolute"
                style={{
                  zIndex: Z.horizon - 1,
                  left: viewport.x,
                  width: viewport.w,
                  top: Math.max(viewport.y, horizonY),
                  height: Math.max(0, viewport.y + viewport.h - Math.max(viewport.y, horizonY)),
                  background: 'linear-gradient(to bottom, rgba(48,48,48,0.98), rgba(16,16,16,1))',
                  pointerEvents: 'none',
                }}
              />
            )}
          </div>

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
               // New: pass Sun declination on Moon
               sunDeclinationDeg={sunDeclinationDeg}
               // New: show earthshine percent only when both toggles are active
               earthshine={earthshine}
               showMoon3D={showMoon3D}
             />
            <div className="mt-2 text-xs text-white/70 flex flex-wrap gap-3">
              <div>Séparation: {eclipse.sep.toFixed(2)}°</div>
              <div>R☉: {eclipse.rS.toFixed(2)}°</div>
              <div>R☽: {eclipse.rM.toFixed(2)}°</div>
              <div>Type local: {eclipse.kind}</div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}




function compass16(az: number): string { const idx = Math.round(norm360(az) / 22.5) % 16; return ROSE_16[idx] as string; }
