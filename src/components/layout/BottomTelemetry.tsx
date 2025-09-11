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
};

export default function BottomTelemetry({ astro, rotationToHorizonDegMoon, phaseFraction, brightLimbAngleDeg }: Props) {
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
  return (
    <div className="mx-2 sm:mx-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
      <div className="rounded-2xl border border-white/10 bg-black/50 backdrop-blur px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-sky-300">Lune</div>
          <div className="text-xs text-white/60">{compass16(astro.moon.az)}</div>
        </div>
        <div className="mt-1 text-sm text-white/85">Altitude : <span className="font-mono">{formatDeg(astro.moon.alt)}</span></div>
        <div className="text-sm text-white/85">Azimut : <span className="font-mono">{formatDeg(astro.moon.az)}</span></div>
        <div className="text-sm text-white/85">Diamètre apparent : <span className="font-mono">{astro.moon.appDiamDeg.toFixed(2)}°</span></div>
        <div className="text-sm text-white/85">Distance : <span className="font-mono">{Math.round(astro.moon.distKm).toLocaleString('fr-FR')} km</span></div>
        {/* Distance topocentrique masquée */}
        {typeof astro.moon.parallacticDeg === 'number' && (
          <div className="text-sm text-white/85">Parallaxe horizontale : <span className="font-mono">{astro.moon.parallacticDeg.toFixed(2)}°</span></div>
        )}
        <div className="text-sm text-white/85 mt-1">Libration géocentrique : {libContentG}</div>
        <div className="text-sm text-white/85">Libration topocentrique (apparente) : {libContentT}</div>
        {libT && (
          <div className="text-sm text-white/85 mt-0.5">Libration : {libQuadrant} vers la terre</div>
        )}
        <div className="text-sm text-white/85 mt-1">Orientation (parallactique) : <span className="font-mono">{rotationToHorizonDegMoon.toFixed(1)}°</span></div>
        <div className="text-sm text-white/85">Phase : {(phaseFraction * 100).toFixed(1)}% éclairée — Angle du limbe : {brightLimbAngleDeg.toFixed(1)}°</div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-black/50 backdrop-blur px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-amber-300">Soleil</div>
          <div className="text-xs text-white/60">{compass16(astro.sun.az)}</div>
        </div>
        <div className="mt-1 text-sm text-white/85">Altitude : <span className="font-mono">{formatDeg(astro.sun.alt)}</span></div>
        <div className="text-sm text-white/85">Azimut : <span className="font-mono">{formatDeg(astro.sun.az)}</span></div>
        <div className="text-sm text-white/85">Diamètre apparent : <span className="font-mono">{astro.sun.appDiamDeg.toFixed(2)}°</span></div>
        <div className="text-sm text-white/85">Distance : <span className="font-mono">{Math.round(astro.sun.distAU * AU_KM).toLocaleString('fr-FR')} km ({Math.round(astro.sun.distAU * 100)}% UA)</span></div>
      </div>
    </div>
  );
}
