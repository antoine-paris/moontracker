import React from "react";
import { AU_KM } from "../../astro/sun";
import { formatDeg } from "../../utils/format";
import { norm360 } from "../../utils/math";
import { ROSE_16 } from "../../render/constants";

function compass16(az: number): string {
  const idx = Math.round(norm360(az) / 22.5) % 16;
  return ROSE_16[idx] as string;
}

export type Astro = {
  sun: { alt: number; az: number; distAU: number; appDiamDeg: number };
  moon: {
    alt: number;
    az: number;
    distKm: number;
    topoDistKm?: number;
    parallacticDeg?: number;
    appDiamDeg: number;
    libration?: { latDeg: number; lonDeg: number; paDeg: number };
    librationTopo?: { latDeg: number; lonDeg: number; paDeg: number };
    librationError?: string;
  };
};

type Props = {
  astro: Astro;
  rotationToHorizonDegMoon: number;
  phaseFraction: number;
  brightLimbAngleDeg: number;
  // New: to control display of earthshine percentage
  earthshine: boolean;
  showMoon3D: boolean;
  // New: Sun declination relative to lunar equator
  sunDeclinationDeg: number;
  // New: eclipse info (computed in App)
  eclipse: { sep: number; rS: number; rM: number; kind: string };
};

export default function BottomTelemetry({ astro, rotationToHorizonDegMoon, phaseFraction, brightLimbAngleDeg, earthshine, showMoon3D, sunDeclinationDeg, eclipse }: Props) {
  const libG = astro.moon.libration;
  const libT = astro.moon.librationTopo;
  const libQuadrant = libT ? (() => { const lnorm = ((libT.lonDeg + 180) % 360) - 180; const ns = libT.latDeg >= 0 ? 'N' : 'S'; const ew = lnorm >= 0 ? 'E' : 'O'; return ns + ew; })() : '—';
  const libContentG = libG ? (
    <>
      lat <span className="font-mono">{libG.latDeg.toFixed(1)}°</span>,{' '}
      lon <span className="font-mono">{libG.lonDeg.toFixed(1)}°</span>,{' '}
      PA <span className="font-mono">{libG.paDeg.toFixed(1)}°</span>
    </>
  ) : (
    <span className="italic">Indisponible — {astro.moon.librationError ?? 'calcul indisponible'}</span>
  );
  const libContentT = libT ? (
    <>
      lat <span className="font-mono">{libT.latDeg.toFixed(1)}°</span>,{' '}
      lon <span className="font-mono">{libT.lonDeg.toFixed(1)}°</span>,{' '}
      PA <span className="font-mono">{libT.paDeg.toFixed(1)}°</span>
    </>
  ) : (
    <span className="italic">Indisponible — données non fournies</span>
  );

  // New: Earth illumination seen from the Moon (Earth phase) — show only when earthshine + Moon 3D
  const earthshinePct = Math.round(Math.max(0, Math.min(1, 1 - (phaseFraction ?? 0))) * 100);
  // New: signed formatting for Sun declination on the Moon
  const sunDeclinationSigned = `${sunDeclinationDeg >= 0 ? '+' : ''}${sunDeclinationDeg.toFixed(3)}°`;

  return (
    <div className="mx-2 sm:mx-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
      <div className="rounded-2xl border border-white/10 bg-black/50 backdrop-blur px-4 py-3 sm:col-span-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-sky-300">Lune</div>
          <div className="text-xs text-white/60">{compass16(astro.moon.az)}</div>
        </div>

        {/* New: 3-column layout for Moon info */}
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1">
          <div>
          <div className="text-sm text-white/85">Altitude : <span className="font-mono">{formatDeg(astro.moon.alt)}</span></div>
          <div className="text-sm text-white/85">Azimut : <span className="font-mono">{formatDeg(astro.moon.az)}</span></div>
          <div className="text-sm text-white/85">Diamètre apparent : <span className="font-mono">{astro.moon.appDiamDeg.toFixed(2)}°</span></div>
          <div className="text-sm text-white/85">Distance : <span className="font-mono">{Math.round(astro.moon.distKm).toLocaleString('fr-FR')} km</span></div>
          </div>
          <div>
          {typeof astro.moon.parallacticDeg === 'number' && (
            <div className="text-sm text-white/85">Parallaxe horizontale : <span className="font-mono">{astro.moon.parallacticDeg.toFixed(2)}°</span></div>
          )}
          <div className="text-sm text-white/85">Orientation (parallactique) : <span className="font-mono">{rotationToHorizonDegMoon.toFixed(1)}°</span></div>
          <div className="text-sm text-white/85">Phase : {(phaseFraction * 100).toFixed(1)}% éclairée</div>
          <div className="text-sm text-white/85">Angle du limbe : {brightLimbAngleDeg.toFixed(1)}° </div>
          <div className="text-sm text-white/85">Déc. solaire : <span className="font-mono">{sunDeclinationSigned}</span></div>
          </div>
          <div >
          {libT && (
            <div className="text-sm text-white/85 sm:col-span-3">Libration : {libQuadrant} vers la terre</div>
          )}
          <div className="text-sm text-white/85 sm:col-span-3 mt-1">Géocentr. : {libContentG}</div>
          <div className="text-sm text-white/85 sm:col-span-3">Topocentr. : {libContentT}</div>
          
          {earthshine && showMoon3D && (
            <div className="text-sm text-white/85">Clair de terre : <span className="font-mono">{earthshinePct}%</span></div>
          )}
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-black/50 backdrop-blur px-4 py-3 sm:col-span-1">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-amber-300">Soleil</div>
          <div className="text-xs text-white/60">{compass16(astro.sun.az)}</div>
        </div>
        <div className="mt-1 text-sm text-white/85">Altitude : <span className="font-mono">{formatDeg(astro.sun.alt)}</span></div>
        <div className="text-sm text-white/85">Azimut : <span className="font-mono">{formatDeg(astro.sun.az)}</span></div>
        <div className="text-sm text-white/85">Diamètre apparent : <span className="font-mono">{astro.sun.appDiamDeg.toFixed(2)}°</span></div>
        <div className="text-sm text-white/85">Distance : <span className="font-mono">{Math.round(astro.sun.distAU * AU_KM).toLocaleString('fr-FR')} km ({Math.round(astro.sun.distAU * 100)}% UA)</span></div>

        {/* New: Eclipse info moved here */}
        <div className="mt-1 text-sm text-white/85">Séparation lune : <span className="font-mono">{eclipse.sep.toFixed(2)}°</span> — R☉ : <span className="font-mono">{eclipse.rS.toFixed(2)}°</span> — R☽ : <span className="font-mono">{eclipse.rM.toFixed(2)}°</span></div>
        <div className="text-sm text-white/85">Eclipse : <span className="font-mono">{eclipse.kind}</span></div>
      </div>
    </div>
  );
}
