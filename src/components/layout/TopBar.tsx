import React from "react";
import type { FollowMode } from "../../types";
import type { Device, ZoomModule } from "../../optics/types";
import { clamp } from "../../utils/math";

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
  setWhen: (v: string) => void;
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
  earthshine: boolean;
  setEarthshine: (v: boolean) => void;
  showSunCard: boolean;
  setShowSunCard: (v: boolean) => void;
  showMoonCard: boolean;
  setShowMoonCard: (v: boolean) => void;
  debugMask: boolean;
  setDebugMask: (v: boolean) => void;
};

export default function TopBar(props: Props) {
  const {
    follow, setFollow,
    devices, deviceId, setDeviceId, zoomOptions, zoomId, setZoomId, CUSTOM_DEVICE_ID,
    fovXDeg, fovYDeg, setFovXDeg, setFovYDeg, linkFov, setLinkFov,
    viewport,
    when, whenInput, setWhenInput, setWhen, onCommitWhenMs, setIsAnimating, isAnimating, speedMinPerSec, setSpeedMinPerSec,
    showSun, setShowSun, showMoon, setShowMoon, showPhase, setShowPhase, earthshine, setEarthshine,
    showSunCard, setShowSunCard, showMoonCard, setShowMoonCard, debugMask, setDebugMask,
  } = props;

  return (
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
              <input
                type="range"
                min={10}
                max={220}
                step={1}
                value={fovYDeg}
                onChange={(e) => {
                  const v = clamp(parseFloat(e.target.value || '220'), 10, 220);
                  if (deviceId !== CUSTOM_DEVICE_ID) { setDeviceId(CUSTOM_DEVICE_ID); setZoomId('custom-theo'); }
                  setFovYDeg(v);
                  if (linkFov) {
                    const ratio = (viewport.h || 1) / Math.max(1, viewport.w);
                    setFovXDeg(clamp(v / Math.max(1e-9, ratio), 10, 220));
                  }
                }}
                className="w-full"
              />
              <div className="mt-0.5 text-[10px] text-white/70 text-center w-full">{`${Math.round(fovYDeg)}°/${Math.round(viewport.h)}px`}</div>
            </div>
            <span className="text-sm">{"\u2194"}</span>
            <div className="flex flex-col items-center flex-1 min-w-0">
              <input
                type="range"
                min={10}
                max={220}
                step={1}
                value={fovXDeg}
                onChange={(e) => {
                  const v = clamp(parseFloat(e.target.value || '220'), 10, 220);
                  if (deviceId !== CUSTOM_DEVICE_ID) { setDeviceId(CUSTOM_DEVICE_ID); setZoomId('custom-theo'); }
                  setFovXDeg(v);
                  if (linkFov) {
                    const ratio = (viewport.h || 1) / Math.max(1, viewport.w);
                    setFovYDeg(clamp(v * ratio, 10, 220));
                  }
                }}
                className="w-full"
              />
              <div className="mt-0.5 text-[10px] text-white/70 text-center w-full">{`${Math.round(fovXDeg)}°/${Math.round(viewport.w)}px`}</div>
            </div>
             <label className="inline-flex items-center gap-2 text-xs text-white/70 ml-2 flex-shrink-0">
                <input
                  type="checkbox"
                  checked={linkFov}
                  onChange={(e) => {
                    setLinkFov(e.target.checked);
                    if (e.target.checked) {
                      const ratio = (viewport.h || 1) / Math.max(1, viewport.w);
                      setFovYDeg(clamp(fovXDeg * ratio, 10, 220));
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
            <div className="mt-1 flex items-center gap-2">
              <input
                type="datetime-local"
                step={1}
                value={whenInput}
                onChange={(e) => { setIsAnimating(false); setWhenInput(e.target.value); }}
                onBlur={() => {
                  const ms = Date.parse(whenInput);
                  if (Number.isFinite(ms)) {
                    const d = new Date(ms);
                    const pad = (n: number) => String(n).padStart(2, "0");
                    const yyyy = d.getFullYear();
                    const mm = pad(d.getMonth() + 1);
                    const dd = pad(d.getDate());
                    const hh = pad(d.getHours());
                    const mi = pad(d.getMinutes());
                    const ss = pad(d.getSeconds());
                    const norm = `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}`;
                    setWhen(norm);
                    onCommitWhenMs(ms);
                  } else {
                    setWhenInput(when);
                  }
                }}
                className="flex-1 bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-white/40"
              />
              <button
                onClick={() => {
                  const nowStr = (() => { const d = new Date(); const pad = (n: number) => String(n).padStart(2, "0"); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; })();
                  setWhen(nowStr);
                  setWhenInput(nowStr);
                  onCommitWhenMs(Date.parse(nowStr));
                  setSpeedMinPerSec(1/60);
                  setIsAnimating(true);
                }}
                className="px-3 py-2 rounded-lg border border-white/15 text-sm text-white/80 hover:border-white/30"
              >
                Maintenant
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-white/60">
              {Math.abs(speedMinPerSec - 1/60) < 1e-6
                ? "ANIMATION (Temps réel)"
                : `ANIMATION (${Math.round(speedMinPerSec).toLocaleString('fr-FR')} min/s)`}
            </label>
            <div className="mt-1 flex items-center gap-2">
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
                    const next = Date.parse(when) - 3600000;
                    const d = new Date(next); const pad = (n: number) => String(n).padStart(2, "0");
                    const nextStr = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
                    setWhen(nextStr);
                    setWhenInput(nextStr);
                    onCommitWhenMs(next);
                   }}
                >
                  {"\u21B6"}
                </div>
                <div
                  className="absolute right-0 top-full mt-0.5 text-[10px] text-white/60 hover:text-white cursor-pointer select-none"
                  title="+1 h"
                  onClick={() => {
                    const next = Date.parse(when) + 3600000;
                    const d = new Date(next); const pad = (n: number) => String(n).padStart(2, "0");
                    const nextStr = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
                    setWhen(nextStr);
                    setWhenInput(nextStr);
                    onCommitWhenMs(next);
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
          <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={showMoon} onChange={(e) => setShowMoon(e.target.checked)} /><span className="text-sky-300">Lune</span></label>
          <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={showPhase} onChange={(e) => setShowPhase(e.target.checked)} /><span>Phase de la Lune</span></label>
          <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={earthshine} disabled={!showPhase} onChange={(e) => setEarthshine(e.target.checked)} /><span>Clair de Terre</span></label>
          <span className="w-px h-5 bg-white/10 mx-1" />
          <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={showSunCard} onChange={(e) => setShowSunCard(e.target.checked)} /><span>Cardinal Soleil</span></label>
          <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={showMoonCard} onChange={(e) => setShowMoonCard(e.target.checked)} /><span>Cardinal Lune</span></label>
          <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={debugMask} onChange={(e) => setDebugMask(e.target.checked)} /><span>Debug masque</span></label>
        </div>
      </div>
    </div>
  );
}
