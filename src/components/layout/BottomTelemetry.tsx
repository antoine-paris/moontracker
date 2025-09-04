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
  moon: { alt: number; az: number; distKm: number; appDiamDeg: number };
};

type Props = {
  astro: Astro;
  rotationToHorizonDegMoon: number;
  phaseFraction: number;
  brightLimbAngleDeg: number;
};

export default function BottomTelemetry({ astro, rotationToHorizonDegMoon, phaseFraction, brightLimbAngleDeg }: Props) {
  return (
    <div className="mx-2 sm:mx-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
      <div className="rounded-2xl border border-white/10 bg-black/50 backdrop-blur px-4 py-3">
        <div className="flex items-center justify-between"><div className="text-sm font-semibold text-sky-300">Lune</div><div className="text-xs text-white/60">{compass16(astro.moon.az)}</div></div>
        <div className="mt-1 text-sm text-white/85">Altitude : <span className="font-mono">{formatDeg(astro.moon.alt)}</span></div>
        <div className="text-sm text-white/85">Azimut : <span className="font-mono">{formatDeg(astro.moon.az)}</span></div>
        <div className="text-sm text-white/85">Diamètre apparent : <span className="font-mono">{astro.moon.appDiamDeg.toFixed(2)}°</span></div>
        <div className="text-sm text-white/85">Distance : <span className="font-mono">{Math.round(astro.moon.distKm).toLocaleString('fr-FR')} km</span></div>
        <div className="text-xs text-white/55 mt-1">Orientation (parallactique) : <span className="font-mono">{rotationToHorizonDegMoon.toFixed(1)}°</span></div>
        <div className="text-xs text-white/55">Phase : {(phaseFraction * 100).toFixed(1)}% éclairée — Angle du limbe : {brightLimbAngleDeg.toFixed(1)}°</div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-black/50 backdrop-blur px-4 py-3">
        <div className="flex items-center justify-between"><div className="text-sm font-semibold text-amber-300">Soleil</div><div className="text-xs text-white/60">{compass16(astro.sun.az)}</div></div>
        <div className="mt-1 text-sm text-white/85">Altitude : <span className="font-mono">{formatDeg(astro.sun.alt)}</span></div>
        <div className="text-sm text-white/85">Azimut : <span className="font-mono">{formatDeg(astro.sun.az)}</span></div>
        <div className="text-sm text-white/85">Diamètre apparent : <span className="font-mono">{astro.sun.appDiamDeg.toFixed(2)}°</span></div>
        <div className="text-sm text-white/85">Distance : <span className="font-mono">{Math.round(astro.sun.distAU * AU_KM).toLocaleString('fr-FR')} km ({Math.round(astro.sun.distAU * 100)}% UA)</span></div>
      </div>
    </div>
  );
}
