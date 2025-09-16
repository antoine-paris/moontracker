import React, { useMemo } from "react";
import type { FollowMode } from "../../types";
import type { Device, ZoomModule } from "../../optics/types";
import { clamp } from "../../utils/math";
import { degToSlider, sliderToDeg, FOV_DEG_MIN, FOV_DEG_MAX } from "../../optics/fov";
import { zonedLocalToUtcMs } from "../../utils/tz";

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
  showMoon3D: boolean;
  setShowMoon3D: (v: boolean) => void;
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
};

export default function TopBar({
  follow, setFollow,
  devices, deviceId, setDeviceId, zoomOptions, zoomId, setZoomId, CUSTOM_DEVICE_ID,
  fovXDeg, fovYDeg, setFovXDeg, setFovYDeg, linkFov, setLinkFov,
  viewport, when, whenInput, setWhenInput, onCommitWhenMs, setIsAnimating, isAnimating, speedMinPerSec, setSpeedMinPerSec,
  showSun, setShowSun, showMoon, setShowMoon, showPhase, setShowPhase, showMoon3D, setShowMoon3D,
  rotOffsetDegX, setRotOffsetDegX, rotOffsetDegY, setRotOffsetDegY, rotOffsetDegZ, setRotOffsetDegZ,
  camRotDegX, setCamRotDegX, camRotDegY, setCamRotDegY, camRotDegZ, setCamRotDegZ,
  earthshine, setEarthshine,
  showSunCard, setShowSunCard, showMoonCard, setShowMoonCard, debugMask, setDebugMask,
  timeZone,
  enlargeObjects, setEnlargeObjects,
  currentUtcMs,
  cityName,
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

  // New: City-local time based on selected location's time zone
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

  const SLIDER_STEPS = 1000;
  const [sx, setSx] = React.useState(() => degToSlider(fovXDeg, SLIDER_STEPS));
  const [sy, setSy] = React.useState(() => degToSlider(fovYDeg, SLIDER_STEPS));
  React.useEffect(() => { setSx(degToSlider(fovXDeg, SLIDER_STEPS)); }, [fovXDeg]);
  React.useEffect(() => { setSy(degToSlider(fovYDeg, SLIDER_STEPS)); }, [fovYDeg]);

  const updateXFromSlider = (val: number) => {
    setSx(val);
    const deg = clamp(sliderToDeg(val, SLIDER_STEPS), FOV_DEG_MIN, FOV_DEG_MAX);
    if (deviceId !== CUSTOM_DEVICE_ID) { setDeviceId(CUSTOM_DEVICE_ID); setZoomId('custom-theo'); }
    setFovXDeg(deg);
    if (linkFov) {
      const ratio = (viewport.h || 1) / Math.max(1, viewport.w);
      setFovYDeg(clamp(deg * ratio, FOV_DEG_MIN, FOV_DEG_MAX));
    }
  };
  const updateYFromSlider = (val: number) => {
    setSy(val);
    const deg = clamp(sliderToDeg(val, SLIDER_STEPS), FOV_DEG_MIN, FOV_DEG_MAX);
    if (deviceId !== CUSTOM_DEVICE_ID) { setDeviceId(CUSTOM_DEVICE_ID); setZoomId('custom-theo'); }
    setFovYDeg(deg);
    if (linkFov) {
      const ratio = (viewport.h || 1) / Math.max(1, viewport.w);
      setFovXDeg(clamp(deg / Math.max(1e-9, ratio), FOV_DEG_MIN, FOV_DEG_MAX));
    }
  };

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
            {(['SOLEIL','LUNE','N','E','S','O'] as FollowMode[]).map(opt => (
              <button key={opt}
                className={`px-3 py-1.5 rounded-lg border text-sm ${follow === opt ? 'border-white/50 bg-white/10' : 'border-white/15 text-white/80 hover:border-white/30'}`}
                onClick={() => setFollow(opt)}
              >{opt}</button>
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
              >
                {devices.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
              </select>
              <select
                value={zoomId}
                disabled={deviceId === CUSTOM_DEVICE_ID}
                onChange={(e) => setZoomId(e.target.value)}
                className="min-w-[12rem] bg-black/60 border border-white/15 rounded-lg px-2 py-1.5 text-sm disabled:opacity-60"
              >
                {zoomOptions.map(z => <option key={z.id} value={z.id}>{z.label}</option>)}
              </select>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm">{"\u2195"}</span>
              <div className="flex flex-col items-center flex-1 min-w-0">
                <input type="range" min={0} max={SLIDER_STEPS} step={1} value={sy} onChange={(e) => updateYFromSlider(Number(e.target.value))} className="w-full" />
                <div className="mt-0.5 text-[10px] text-white/70 text-center w-full">{`${(fovYDeg >= 1 ? fovYDeg.toFixed(1) : fovYDeg.toFixed(2))}°/${Math.round(viewport.h)}px`}</div>
              </div>
              <span className="text-sm">{"\u2194"}</span>
              <div className="flex flex-col items-center flex-1 min-w-0">
                <input type="range" min={0} max={SLIDER_STEPS} step={1} value={sx} onChange={(e) => updateXFromSlider(Number(e.target.value))} className="w-full" />
                <div className="mt-0.5 text-[10px] text-white/70 text-center w-full">{`${(fovXDeg >= 1 ? fovXDeg.toFixed(1) : fovXDeg.toFixed(2))}°/${Math.round(viewport.w)}px`}</div>
              </div>
               <label className="inline-flex items-center gap-2 text-xs text-white/70 ml-2 flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={linkFov}
                    onChange={(e) => {
                      setLinkFov(e.target.checked);
                      if (e.target.checked) {
                        const ratio = (viewport.h || 1) / Math.max(1, viewport.w);
                        setFovYDeg(clamp(fovXDeg * ratio, FOV_DEG_MIN, FOV_DEG_MAX));
                      }
                    }}
                  />
                  {"\u26AD"}
                </label>
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
                  />
                  <button
                    onClick={() => {
                      const nowMs = Date.now();
                      onCommitWhenMs(nowMs);
                      setIsEditing(false);
                    }}
                    className="px-3 py-1 rounded-lg border border-white/15 text-white/80 hover:border-white/30 text-sm"
                    title="Régler l'heure actuelle"
                  >
                    Maintenant
                  </button>
                </div>
                {/* Replace single UTC line with both UTC and city-local */}
                <div className="mt-1 text-xs text-white/50 flex flex-wrap gap-3">
                  <div>{utcTime}</div>
                  <div title={timeZone}>{`|   ${cityName} ${cityLocalTimeString}`}</div>
                </div>
              </div>
              <div className="mt-2 mb-1 text-xs uppercase tracking-wider text-white/50">Animation</div>
              <div className="flex items-center gap-2">
                <button onClick={() => setIsAnimating(!isAnimating)} className={`px-3 py-2 rounded-lg border text-sm ${isAnimating ? "border-emerald-400/60 text-emerald-300" : "border-white/15 text-white/80 hover:border-white/30"}`}>{isAnimating ? "Pause" : "Lecture"}</button>
                <div className="relative flex-1">
                  <input
                    type="range"
                    min={-360}
                    max={360}
                    step={0.001}
                    value={speedMinPerSec}
                    onChange={(e) => setSpeedMinPerSec(clamp(parseFloat(e.target.value || "0"), -360, 360))}
                     className="w-full"
                  />
                  {/* Center tick for 0 */}
                  <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="w-px h-3 bg-white/40" />
                  </div>
                  <div
                    className="absolute left-1/2 top-full -translate-x-1/2 mt-0.5 text-[10px] text-white/60 hover:text-white cursor-pointer"
                    onClick={() => { setSpeedMinPerSec(1/60); setIsAnimating(true); }}
                  >
                    Temps réel
                  </div>
                  <div
                    className="absolute left-0 top-full mt-0.5 text-[10px] text-white/60 hover:text-white cursor-pointer select-none"
                    title="-1 h"
                    onClick={() => {
                      onCommitWhenMs(currentUtcMs - 3600000);
                      }}
                  >
                    {"\u21B6"}
                  </div>
                  <div
                    className="absolute right-0 top-full mt-0.5 text-[10px] text-white/60 hover:text-white cursor-pointer select-none"
                    title="+1 h"
                    onClick={() => {
                      onCommitWhenMs(currentUtcMs + 3600000);
                      }}
                  >
                    {"\u21B7"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Objets à afficher */}
        <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur px-3 py-3">
          <div className="text-xs uppercase tracking-wider text-white/60 mb-2">Objets à afficher</div>
          <div className="flex flex-wrap gap-3">
            <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={showSun} onChange={(e) => setShowSun(e.target.checked)} /><span className="text-amber-300">Soleil</span></label>
            <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={showMoon} onChange={(e) => setShowMoon(e.target.checked)} /><span className="text-sky-300">Lune 2D</span></label>
            <label className="inline-flex items-center gap-2 text-sm text-sky-300">
              <input type="checkbox" checked={showMoon3D} onChange={e => setShowMoon3D(e.target.checked)} />
              <span>Lune 3D</span>
            </label>
             <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={showPhase} onChange={(e) => setShowPhase(e.target.checked)} /><span>Phase de la Lune</span></label>
             <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={earthshine} disabled={!showPhase} onChange={(e) => setEarthshine(e.target.checked)} /><span>Clair de Terre</span></label>
             <span className="w-px h-5 bg-white/10 mx-1" />
             <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={showSunCard} onChange={(e) => setShowSunCard(e.target.checked)} /><span>Cardinal Soleil</span></label>
             <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={showMoonCard} onChange={(e) => setShowMoonCard(e.target.checked)} /><span>Cardinal Lune</span></label>
             <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={debugMask} onChange={(e) => setDebugMask(e.target.checked)} /><span>Debug</span></label>
             <span className="w-px h-5 bg-white/10 mx-1" />
             <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={enlargeObjects} onChange={(e) => setEnlargeObjects(e.target.checked)} /><span>Agrandir les objets</span></label>
           </div>
          {showMoon3D && debugMask && (
            <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-white/70">
               <label className="flex items-center gap-2">
                 <span>Rot X</span>
                 <input type="number" min={-180} max={180} className="w-16 bg-black/30 border border-white/10 rounded px-1 py-0.5" value={rotOffsetDegX}
                   onChange={e => {
                     const v = Number(e.target.value);
                     if (Number.isFinite(v)) setRotOffsetDegX(clamp(v, -180, 180));
                   }} />
               </label>
               <label className="flex items-center gap-2">
                 <span>Rot Y</span>
                 <input type="number" min={-180} max={180} className="w-16 bg-black/30 border border-white/10 rounded px-1 py-0.5" value={rotOffsetDegY}
                   onChange={e => {
                     const v = Number(e.target.value);
                     if (Number.isFinite(v)) setRotOffsetDegY(clamp(v, -180, 180));
                   }} />
               </label>
               <label className="flex items-center gap-2">
                 <span>Rot Z</span>
                 <input type="number" min={-180} max={180} className="w-16 bg-black/30 border border-white/10 rounded px-1 py-0.5" value={rotOffsetDegZ}
                   onChange={e => {
                     const v = Number(e.target.value);
                     if (Number.isFinite(v)) setRotOffsetDegZ(clamp(v, -180, 180));
                   }} />
               </label>
             </div>
           )}
          {showMoon3D && debugMask && (
             <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-white/70">
               <label className="flex items-center gap-2">
                 <span>Cam X</span>
                 <input type="number" min={-180} max={180} className="w-16 bg-black/30 border border-white/10 rounded px-1 py-0.5" value={camRotDegX}
                   onChange={e => {
                     const v = Number(e.target.value);
                     if (Number.isFinite(v)) setCamRotDegX(clamp(v, -180, 180));
                   }} />
               </label>
               <label className="flex items-center gap-2">
                 <span>Cam Y</span>
                 <input type="number" min={-180} max={180} className="w-16 bg-black/30 border border-white/10 rounded px-1 py-0.5" value={camRotDegY}
                   onChange={e => {
                     const v = Number(e.target.value);
                     if (Number.isFinite(v)) setCamRotDegY(clamp(v, -180, 180));
                   }} />
               </label>
               <label className="flex items-center gap-2">
                 <span>Cam Z</span>
                 <input type="number" min={-180} max={180} className="w-16 bg-black/30 border border-white/10 rounded px-1 py-0.5" value={camRotDegZ}
                   onChange={e => {
                     const v = Number(e.target.value);
                     if (Number.isFinite(v)) setCamRotDegZ(clamp(v, -180, 180));
                   }} />
               </label>
             </div>
           )}
        </div>
      </div>
    </>
  );
}

