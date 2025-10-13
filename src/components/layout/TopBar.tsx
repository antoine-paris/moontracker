import React, { useMemo } from "react";
import type { FollowMode } from "../../types";
import type { Device, ZoomModule } from "../../optics/types";
import { clamp } from "../../utils/math";
import { degToSlider, sliderToDeg, FOV_DEG_MIN, FOV_DEG_MAX } from "../../optics/fov";
import { zonedLocalToUtcMs } from "../../utils/tz";
// planets registry for UI toggles
import { PLANETS } from "../../render/planetRegistry";
import { PLANET_REGISTRY } from "../../render/planetRegistry";

export type Viewport = { x: number; y: number; w: number; h: number };

type Props = {
  debug: boolean;
  onDebugChange: (value: boolean) => void;

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

  when: string;
  whenInput: string;
  setWhenInput: (v: string) => void;
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
  showMoonCard: boolean;
  setShowMoonCard: (v: boolean) => void;
  debugMask: boolean;
  setDebugMask: (v: boolean) => void;
  timeZone: string;
  enlargeObjects: boolean;
  setEnlargeObjects: (v: boolean) => void;
  currentUtcMs: number;
  cityName: string;

  // Earth toggle
  showEarth: boolean;
  setShowEarth: (v: boolean) => void;

  // Atmosphere toggle
  showAtmosphere: boolean;
  setShowAtmosphere: (v: boolean) => void;

  // Stars toggle
  showStars: boolean;
  setShowStars: (v: boolean) => void;

  // Markers toggle
  showMarkers: boolean;
  setShowMarkers: (v: boolean) => void;

  // Grid toggle
  showGrid: boolean;
  setShowGrid: (v: boolean) => void;

  // Projection mode
  projectionMode: 'recti-panini' | 'stereo-centered' | 'ortho' | 'cylindrical';
  setProjectionMode: (m: 'recti-panini' | 'stereo-centered' | 'ortho' | 'cylindrical') => void;

  // Planets visibility
  showPlanets: Record<string, boolean>;
  setShowPlanets: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
};

export default function TopBar({
  debug, onDebugChange,
  follow, setFollow,
  devices, deviceId, setDeviceId, zoomOptions, zoomId, setZoomId, CUSTOM_DEVICE_ID,
  fovXDeg, fovYDeg, setFovXDeg, setFovYDeg, linkFov, setLinkFov,
  viewport, when, whenInput, setWhenInput, onCommitWhenMs, setIsAnimating, isAnimating, speedMinPerSec, setSpeedMinPerSec,
  showSun, setShowSun, showMoon, setShowMoon, showPhase, setShowPhase,
  rotOffsetDegX, setRotOffsetDegX, rotOffsetDegY, setRotOffsetDegY, rotOffsetDegZ, setRotOffsetDegZ,
  camRotDegX, setCamRotDegX, camRotDegY, setCamRotDegY, camRotDegZ, setCamRotDegZ,
  earthshine, setEarthshine,
  showSunCard, setShowSunCard, showMoonCard, setShowMoonCard, debugMask, setDebugMask,
  timeZone,
  enlargeObjects, setEnlargeObjects,
  currentUtcMs,
  cityName,
  // NEW
  showEarth, setShowEarth,
  showAtmosphere, setShowAtmosphere,
  showStars, setShowStars,
  // NEW
  showMarkers, setShowMarkers,
  // NEW
  showGrid, setShowGrid,
  // NEW
  projectionMode, setProjectionMode,
  // NEW
  showPlanets, setShowPlanets,
}: Props) {
  const PRESET_SPEEDS = useMemo(() => [
    { label: "1 min/s", value: 1 },
    { label: "30 sec/s", value: 2 },
    { label: "10 sec/s", value: 6 },
    { label: "1 sec/s", value: 60 },
    { label: "Temps réel", value: 1/60 },
  ], []);

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

  const utcTime = useMemo(() => {
    return currentDate.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
  }, [currentDate]);

  // City-local time based on selected location's time zone
  const cityLocalTimeString = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('fr-FR', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZoneName: 'short',
      }).format(currentDate);
    } catch {
      // Fallback: omit timeZoneName if Intl fails
      return new Intl.DateTimeFormat('fr-FR', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(currentDate);
    }
  }, [currentDate, timeZone]);

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

  // Build "CityName HH:MM:SS UTC±HH:MM (HH:MM:SS UTC)"
  const { cityHMS, utcHMS, offsetLabel } = useMemo(() => {
    // City HH:MM:SS in selected time zone
    const hmsFmt = new Intl.DateTimeFormat('fr-FR', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    const hmsParts = hmsFmt.formatToParts(currentDate).reduce<Record<string, string>>((acc, p) => {
      if (p.type !== 'literal') acc[p.type] = p.value;
      return acc;
    }, {});
    const cityHMS = `${hmsParts.hour ?? '00'}:${hmsParts.minute ?? '00'}:${hmsParts.second ?? '00'}`;

    // UTC HH:MM:SS
    const utcHMS = currentDate.toISOString().slice(11, 19);

    // Compute UTC offset for the selected time zone (±HH:MM)
    const fullFmt = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const parts = fullFmt.formatToParts(currentDate).reduce<Record<string, string>>((acc, p) => {
      if (p.type !== 'literal') acc[p.type] = p.value;
      return acc;
    }, {});
    const wallAsUTC = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
      Number(parts.second)
    );
    const offsetMin = Math.round((wallAsUTC - currentDate.getTime()) / 60000);
    const sign = offsetMin >= 0 ? '+' : '-';
    const abs = Math.abs(offsetMin);
    const oh = String(Math.floor(abs / 60)).padStart(2, '0');
    const om = String(abs % 60).padStart(2, '0');
    const offsetLabel = `UTC${sign}${oh}:${om}`;

    return { cityHMS, utcHMS, offsetLabel };
  }, [currentDate, timeZone]);

  // Local state for datetime input to prevent instability
  const [localDateTimeInput, setLocalDateTimeInput] = React.useState(browserLocalTimeString);
  const [isEditing, setIsEditing] = React.useState(false);
  
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
      const label = PLANET_REGISTRY?.[id]?.label ?? p?.label ?? id;
      return { id, label };
    });
  }, []);
  
  return (
    <>
      <div className="mx-2 sm:mx-4">
        {/* Branding supprimé: le logo et le nom sont affichés exclusivement dans la SidebarLocations */}
      </div>
      <div className="mx-2 sm:mx-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {/* SUIVI */}
        <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur px-3 py-3">
          <div className="text-xs uppercase tracking-wider text-white/60 mb-2">SUIVI</div>
          <div className="flex flex-wrap gap-2">
            {([
              'SOLEIL','LUNE',
              'MERCURE','VENUS','MARS','JUPITER','SATURNE','URANUS','NEPTUNE',
              'N','E','S','O'
            ] as FollowMode[]).map(opt => (
              <button key={opt}
                className={`px-3 py-1.5 rounded-lg border text-sm ${follow === opt ? 'border-white/50 bg-white/10' : 'border-white/15 text-white/80 hover:border-white/30'}`}
                onClick={() => setFollow(opt)}
                title={
                  opt === 'SOLEIL' ? 'Suivre le Soleil'
                  : opt === 'LUNE' ? 'Suivre la Lune'
                  : opt === 'MERCURE' ? 'Suivre Mercure'
                  : opt === 'VENUS' ? 'Suivre Vénus'
                  : opt === 'MARS' ? 'Suivre Mars'
                  : opt === 'JUPITER' ? 'Suivre Jupiter'
                  : opt === 'SATURNE' ? 'Suivre Saturne'
                  : opt === 'URANUS' ? 'Suivre Uranus'
                  : opt === 'NEPTUNE' ? 'Suivre Neptune'
                  : opt === 'N' ? 'Suivre le Nord'
                  : opt === 'E' ? 'Suivre l’Est'
                  : opt === 'S' ? 'Suivre le Sud'
                  : opt === 'O' ? 'Suivre l’Ouest'
                  : `Suivre ${opt}`
                }
              >
                {opt === 'SOLEIL' ? <span>&#9728;</span>
                : opt === 'LUNE' ? <span>&#127762;</span>
                : opt === 'MERCURE' ? <span>&#9791;</span>
                : opt === 'VENUS' ? <span>&#9792;</span>
                : opt === 'MARS' ? <span>&#9794;</span>
                : opt === 'JUPITER' ? <span>&#9795;</span>
                : opt === 'SATURNE' ? <span>&#9796;</span>
                : opt === 'URANUS' ? <span>&#9797;</span>
                : opt === 'NEPTUNE' ? <span>&#9798;</span>
                : opt === 'N' ? <span style={{ display: 'inline-block', transform: 'rotate(270deg)' }}>&#x27A4;</span>
                : opt === 'E' ? <span >&#x27A4;</span>
                : opt === 'S' ? <span style={{ display: 'inline-block', transform: 'rotate(90deg)' }}>&#x27A4;</span>
                : opt === 'O' ? <span style={{ display: 'inline-block', transform: 'rotate(180deg)' }}>&#x27A4;</span>
                : opt}
              </button>
            ))}
          </div>
          <div className="mt-3">
            <div className="text-xs uppercase tracking-wider text-white/60">Champ de vision</div>
            {/* Sélection Appareil + Objectif */}
            <div className="mt-1 flex items-center gap-2">
              <select
                value={deviceId}
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
                className="min-w-[10rem] bg-black/60 border border-white/15 rounded-lg px-2 py-1.5 text-sm"
                 title="Sélectionner l’appareil"
              >
                {devices.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
              </select>

              {/* When custom device is selected, replace the zoom select with a clean, live-updating label (no “Focale théorique”) */}
              {deviceId === CUSTOM_DEVICE_ID ? (
                <div className="min-w-[12rem] bg-black/60 border border-white/15 rounded-lg px-2 py-1.5 text-sm text-white/80"
                  title={`${Math.round(currentFocalMm)} mm (équivalent 24x36)`}
                >
                  {`${Math.round(currentFocalMm)} mm (eq. 24x36)`}
                </div>
              ) : (
                <select
                  value={zoomId}
                  onChange={(e) => setZoomId(e.target.value)}
                  className="min-w-[12rem] bg-black/60 border border-white/15 rounded-lg px-2 py-1.5 text-sm"
                  title="Sélectionner l’objectif/zoom"
                >
                  {zoomOptions.map(z => <option key={z.id} value={z.id}>{z.label}</option>)}
                </select>
              )}
            </div>

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
                  title={`Focale: ${Math.round(currentFocalMm)} mm (équivalent 24x36)`}
                />
                <div className="mt-0.5 text-[10px] text-white/70 text-center w-full"
                  title="Focale calculée depuis le champ de vision horizontal"
                >
                  {`${Math.round(currentFocalMm)} mm (eq. 24x36)`}
                </div>
              </div>
              <div className="flex flex-col items-end flex-shrink-0 gap-0.5">
                <div className="text-[12px] text-white/70"
                  title="Champ de vision (horizontal ↔ et vertical ↕)"
                >
                  {`${"\u2194"} ${(fovXDeg >= 1 ? fovXDeg.toFixed(1) : fovXDeg.toFixed(2))}°`}&nbsp;&nbsp;
                  {`${"\u2195"} ${(fovYDeg >= 1 ? fovYDeg.toFixed(1) : fovYDeg.toFixed(2))}°`}
                </div>
              </div>
            </div>

            {/* Projection selector */}
            <div className="mt-3">
              <div className="text-xs uppercase tracking-wider text-white/60">Projection</div>
              <div className="mt-1 flex flex-wrap gap-2">
                {[
                  { id: 'recti-panini' as const, label: 'Rectilinéaire' },
                  { id: 'stereo-centered' as const, label: 'Stéréographique' },
                  { id: 'ortho' as const, label: 'Orthographique' },
                  //{ id: 'cylindrical' as const, label: 'Cylindrique' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    className={`px-3 py-1.5 rounded-lg border text-sm ${
                      projectionMode === opt.id
                        ? 'border-white/50 bg-white/10'
                        : 'border-white/15 text-white/80 hover:border-white/30'
                    }`}
                    onClick={() => setProjectionMode(opt.id)}
                    title={opt.label}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Date & heure + Animation (empilés) */}
        <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur px-3 py-3">
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="text-xs uppercase tracking-wider text-white/60">Date & heure</label>
              <div className="mt-1">
                <div className="flex items-center gap-2">
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
                     title="Saisir la date et l’heure locale à votre navigateur"
                  />
                  {/* -1 heure */}
                  <button
                    onClick={() => {
                      onCommitWhenMs(currentUtcMs - 3600000);
                      setIsEditing(false);
                    }}
                    className="px-3 py-1 rounded-lg border border-white/15 text-white/80 hover:border-white/30 text-sm"
                    title="Aller à -1 heure"
                  >
                    &#x21B6;
                  </button>
                  {/* Maintenant */}
                  <button
                    onClick={() => {
                      const nowMs = Date.now();
                      onCommitWhenMs(nowMs);
                      setIsEditing(false);
                    }}
                    className="px-3 py-1 rounded-lg border border-white/15 text-white/80 hover:border-white/30 text-sm"
                    title="Régler l'heure actuelle"
                  >
                    {/*Maintenant*/}
                    &#128345;	
                  </button>
                  {/* +1 heure */}
                  <button
                    onClick={() => {
                      onCommitWhenMs(currentUtcMs + 3600000);
                      setIsEditing(false);
                    }}
                    className="px-3 py-1 rounded-lg border border-white/15 text-white/80 hover:border-white/30 text-sm"
                    title="Aller à +1 heure"
                  >
                    &#x21B7;
                  </button>
                </div>
                {/* Replace single UTC line with the required format:
                    "HH:MM in CityName (HH:MM UTC)" */}
                <div className="mt-1 text-xs text-white/50 flex flex-wrap gap-3">
                  <div title={timeZone}>{`${cityHM} in ${cityName} (${utcHM} UTC)`}</div>
                </div>
              </div>
              <div className="mt-2 mb-1 text-xs uppercase tracking-wider text-white/50">Animation</div>
              <div className="flex items-center gap-2">
                <button onClick={() => setIsAnimating(!isAnimating)} className={`px-3 py-2 rounded-lg border text-sm ${isAnimating ? "border-emerald-400/60 text-emerald-300" : "border-white/15 text-white/80 hover:border-white/30"}`}
                  title={isAnimating ? "Mettre l’animation en pause" : "Lancer l’animation"}
                  >
                    {isAnimating ? "Pause" : "Lecture"}
                </button>
                <div className="relative flex-1">
                  <input
                    type="range"
                    min={-360}
                    max={360}
                    step={0.001}
                    value={speedMinPerSec}
                    onChange={(e) => setSpeedMinPerSec(clamp(parseFloat(e.target.value || "0"), -360, 360))}
                    className="w-full"
                    title={`Vitesse de l'animation : gauche = rembobiner, droite = avancer`}
                  />
                  {/* Center tick for 0 */}
                  <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="w-px h-3 bg-white/40" />
                  </div>
                  <div
                    className="absolute left-1/2 top-full -translate-x-1/2 mt-0.5 text-[10px] text-white/60 hover:text-white cursor-pointer"
                    onClick={() => { setSpeedMinPerSec(1/60); setIsAnimating(true); }}
                    title="Animer en temps réel"
                  >
                    Temps réel
                  </div>
                  <div
                    className="absolute left-0 top-full mt-0.5 text-[10px] text-white/60 hover:text-white cursor-pointer select-none"
                    title={`-1 min/s`}
                    onClick={() => {
                      setSpeedMinPerSec(prev => clamp(prev - 1, -360, 360));
                      }}
                  >
                    {"\u21B6"}
                  </div>
                  <div
                    className="absolute right-0 top-full mt-0.5 text-[10px] text-white/60 hover:text-white cursor-pointer select-none"
                    title="+1 min/s"
                    onClick={() => {
                      setSpeedMinPerSec(prev => clamp(prev + 1, -360, 360));
                      }}
                  >
                    {"\u21B7"}
                  </div>
                </div>
                {/* Affichage de la vitesse en min/s */}
                <div
                  className="min-w-[3rem] text-[10px] text-right text-sm text-white/70 tabular-nums"
                  title="Vitesse de l’animation (minutes par seconde)"
                >
                  {Math.round(speedMinPerSec)==0 ? 'Temps réel': Math.round(speedMinPerSec) + ' min/s'} 
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Groupe: Visibilité */}
        <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur px-3 py-3">
          <div className="text-xs uppercase tracking-wider text-white/60 mb-2">Visibilité</div>
          <div className="mt-1 flex flex-wrap gap-3">
            {/* Enlarge objects */}
            <label className="inline-flex items-center gap-2 text-sm" title="Augmenter la taille apparente des objets pour une meilleure visibilité">
              <input type="checkbox" checked={enlargeObjects} onChange={(e) => setEnlargeObjects(e.target.checked)} />
              <span>Agrandir les objets</span>
            </label>
            {/* Earth toggle */}
            <label className="inline-flex items-center gap-2 text-sm" title="Afficher le sol (Terre)">
              <input type="checkbox" checked={showEarth} onChange={(e) => setShowEarth(e.target.checked)} />
              <span>Sol opaque</span>
            </label>
            {/* Atmosphere toggle */}
            <label className="inline-flex items-center gap-2 text-sm" title="Afficher l’effet d’atmosphère">
              <input type="checkbox" checked={showAtmosphere} onChange={(e) => setShowAtmosphere(e.target.checked)} />
              <span>Atmosphère</span>
            </label>
            {/* Moon phase */}
            <label className="inline-flex items-center gap-2 text-sm" title="Afficher la phase de la Lune et des planètes">
              <input type="checkbox" checked={showPhase} onChange={(e) => setShowPhase(e.target.checked)} />
              <span>Phases Lune/Planètes</span>
            </label>
            {/* Earthshine */}
            <label
              className="inline-flex items-center gap-2 text-sm"
              title={showPhase ? "Afficher le clair de Terre" : "Activez « Phase de la Lune » pour autoriser le clair de Terre"}
            >
              <input
                type="checkbox"
                checked={earthshine}
                disabled={!showPhase}
                onChange={(e) => setEarthshine(e.target.checked)}
              />
              <span>Clair de Terre</span>
            </label>
          </div>

          {/* Groupe: Espace */}
          <div className="mt-3 text-xs uppercase tracking-wider text-white/60 mb-2">Espace</div>
          <div className="mt-1 flex flex-wrap gap-3">
            {/* Sun toggle */}
            <label className="inline-flex items-center gap-2 text-sm" title="Afficher le Soleil">
              <input type="checkbox" checked={showSun} onChange={(e) => setShowSun(e.target.checked)} />
              <span className="text-amber-300">Soleil</span>
            </label>
            {/* Moon toggle */}
            <label className="inline-flex items-center gap-2 text-sm" title="Afficher la Lune">
              <input type="checkbox" checked={showMoon} onChange={(e) => setShowMoon(e.target.checked)} />
              <span className="text-sky-300">Lune</span>
            </label>
            {/* Planètes */}
            {uiPlanets.map(({ id, label }) => (
              <label key={id} className="inline-flex items-center gap-2 text-sm" title={`Afficher ${label}`}>
                <input
                  type="checkbox"
                  checked={showPlanets[id] ?? true}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setShowPlanets(prev => ({ ...prev, [id]: checked }));
                  }}
                />
                <span>{label}</span>
              </label>
            ))}
            {/* Stars toggle */}
            <label className="inline-flex items-center gap-2 text-sm" title="Afficher le fond d’étoiles">
              <input type="checkbox" checked={showStars} onChange={(e) => setShowStars(e.target.checked)} />
              <span>Étoiles</span>
            </label>
          </div>

          {/* Groupe: Assistance */}
          <div className="mt-3 text-xs uppercase tracking-wider text-white/60 mb-2">Assistance</div>
          <div className="mt-1 flex flex-wrap gap-3">
            {/* Grid toggle */}
            <label className="inline-flex items-center gap-2 text-sm" title="Afficher la grille de référence">
              <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} />
              <span>Grille</span>
            </label>
            {/* Markers toggle */}
            <label className="inline-flex items-center gap-2 text-sm" title="Afficher les marqueurs (repères)">
              <input type="checkbox" checked={showMarkers} onChange={(e) => setShowMarkers(e.target.checked)} />
              <span>Marqueurs</span>
            </label>
            {/* Sun cardinal helper */}
            <label className="inline-flex items-center gap-2 text-sm" title="Afficher les points cardinaux sur le Soleil">
              <input type="checkbox" checked={showSunCard} onChange={(e) => setShowSunCard(e.target.checked)} />
              <span>Cardinaux Soleil</span>
            </label>
            {/* Local cardinal helper */}
            <label className="inline-flex items-center gap-2 text-sm" title="Afficher les points cardinaux de la lune et des planètes">
              <input type="checkbox" checked={showMoonCard} onChange={(e) => setShowMoonCard(e.target.checked)} />
              <span>Cardinaux lune/planètes</span>
            </label>
            {/* Debug helper */}
            <label className="inline-flex items-center gap-2 text-sm" title="Activer les éléments de débogage visuel">
              <input type="checkbox" checked={debugMask} onChange={(e) => setDebugMask(e.target.checked)} />
              <span>Debug</span>
            </label>
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
      </div>
     
    </>
  );
}


