import { useTranslation } from 'react-i18next';
import { AU_KM } from "../../astro/sun";
import { formatDeg } from "../../utils/format";
import { norm360 } from "../../utils/math";

function compass16(az: number, t: (key: string) => string): string {
  const dirs = [
    t('common:directions.northAbbrev'), // N
    t('common:directions.northAbbrev') + t('common:directions.northAbbrev') + t('common:directions.eastAbbrev'), // NNE
    t('common:directions.northAbbrev') + t('common:directions.eastAbbrev'), // NE
    t('common:directions.eastAbbrev') + t('common:directions.northAbbrev') + t('common:directions.eastAbbrev'), // ENE
    t('common:directions.eastAbbrev'), // E
    t('common:directions.eastAbbrev') + t('common:directions.southAbbrev') + t('common:directions.eastAbbrev'), // ESE
    t('common:directions.southAbbrev') + t('common:directions.eastAbbrev'), // SE
    t('common:directions.southAbbrev') + t('common:directions.southAbbrev') + t('common:directions.eastAbbrev'), // SSE
    t('common:directions.southAbbrev'), // S
    t('common:directions.southAbbrev') + t('common:directions.southAbbrev') + t('common:directions.westAbbrev'), // SSW/SSO
    t('common:directions.southAbbrev') + t('common:directions.westAbbrev'), // SW/SO
    t('common:directions.westAbbrev') + t('common:directions.southAbbrev') + t('common:directions.westAbbrev'), // WSW/OSO
    t('common:directions.westAbbrev'), // W/O
    t('common:directions.westAbbrev') + t('common:directions.northAbbrev') + t('common:directions.westAbbrev'), // WNW/ONO
    t('common:directions.northAbbrev') + t('common:directions.westAbbrev'), // NW/NO
    t('common:directions.northAbbrev') + t('common:directions.northAbbrev') + t('common:directions.westAbbrev'), // NNW/NNO
  ];
  const idx = Math.round(norm360(az) / 22.5) % 16;
  return dirs[idx];
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
  eclipticTiltDeg: number;
};

export default function BottomTelemetry({ astro, rotationToHorizonDegMoon, phaseFraction, brightLimbAngleDeg, earthshine, showMoon3D, sunDeclinationDeg, eclipse, eclipticTiltDeg }: Props) {
  const { t } = useTranslation('astro');
  const libG = astro.moon.libration;
  const libT = astro.moon.librationTopo;
  const libQuadrant = libT ? (() => { 
    const lnorm = ((libT.lonDeg + 180) % 360) - 180; 
    const ns = libT.latDeg >= 0 ? t('directions.northAbbrev') : t('directions.southAbbrev'); 
    const ew = lnorm >= 0 ? t('directions.eastAbbrev') : t('directions.westAbbrev'); 
    return ns + ew; 
  })() : '—';
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
          <div className="text-sm font-semibold text-sky-300">{t('moon.title')}</div>
          <div className="text-xs text-white/60">{compass16(astro.moon.az, t)}</div>
        </div>

        {/* New: 3-column layout for Moon info */}
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1">
          <div>
          <div className="text-sm text-white/85">{t('moon.altitude')} : <span className="font-mono">{formatDeg(astro.moon.alt)}</span></div>
          <div className="text-sm text-white/85">{t('moon.azimuth')} : <span className="font-mono">{formatDeg(astro.moon.az)}</span></div>
          <div className="text-sm text-white/85">{t('moon.apparentDiameter')} : <span className="font-mono">{astro.moon.appDiamDeg.toFixed(2)}°</span></div>
          <div className="text-sm text-white/85">{t('moon.distance')} : <span className="font-mono">{Math.round(astro.moon.distKm).toLocaleString('fr-FR')} km</span></div>
          </div>
          <div>
          {typeof astro.moon.parallacticDeg === 'number' && (
            <div className="text-sm text-white/85">{t('moon.horizontalParallax')} : <span className="font-mono">{astro.moon.parallacticDeg.toFixed(2)}°</span></div>
          )}
          <div className="text-sm text-white/85">{t('moon.orientation')} : <span className="font-mono">{rotationToHorizonDegMoon.toFixed(1)}°</span></div>
          <div className="text-sm text-white/85">{t('moon.phase')} : {t('moon.phaseIlluminated', { percent: (phaseFraction * 100).toFixed(1) })}</div>
          <div className="text-sm text-white/85">{t('moon.parallaticAngle')} : {brightLimbAngleDeg.toFixed(1)}° </div>
          <div className="text-sm text-white/85">{t('moon.solarDeclination')} : <span className="font-mono">{sunDeclinationSigned}</span></div>
          </div>
          <div >
          {libT && (
            <div className="text-sm text-white/85 sm:col-span-3">{t('moon.libration')} : {t('moon.librationToEarth', { quadrant: libQuadrant })}</div>
          )}
          <div className="text-sm text-white/85 sm:col-span-3 mt-1">{t('moon.geocentric')} : {libContentG}</div>
          <div className="text-sm text-white/85 sm:col-span-3">{t('moon.topocentric')} : {libContentT}</div>
          
          {earthshine && showMoon3D && (
            <div className="text-sm text-white/85">{t('moon.earthshine')} : <span className="font-mono">{earthshinePct}%</span></div>
          )}
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-black/50 backdrop-blur px-4 py-3 sm:col-span-1">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-amber-300">{t('sun.title')}</div>
          <div className="text-xs text-white/60">{compass16(astro.sun.az, t)}</div>
        </div>
        <div className="mt-1 text-sm text-white/85">{t('sun.altitude')} : <span className="font-mono">{formatDeg(astro.sun.alt)}</span></div>
        <div className="text-sm text-white/85">{t('sun.azimuth')} : <span className="font-mono">{formatDeg(astro.sun.az)}</span></div>
        <div className="text-sm text-white/85">{t('sun.apparentDiameter')} : <span className="font-mono">{astro.sun.appDiamDeg.toFixed(2)}°</span></div>
        <div className="text-sm text-white/85">{t('sun.distance')} : <span className="font-mono">{Math.round(astro.sun.distAU * AU_KM).toLocaleString('fr-FR')} km ({Math.round(astro.sun.distAU * 100)}% {t('units.astronomicalUnit')})</span></div>

        {/* NEW: ecliptic tilt vs horizon */}
        <div className="text-sm text-white/85">{t('sun.eclipticTilt')} : <span className="font-mono">{eclipticTiltDeg.toFixed(1)}°</span></div>

        {/* New: Eclipse info moved here */}
        <div className="mt-1 text-sm text-white/85">Séparation lune : <span className="font-mono">{eclipse.sep.toFixed(2)}°</span> — R☉ : <span className="font-mono">{eclipse.rS.toFixed(2)}°</span> — R☽ : <span className="font-mono">{eclipse.rM.toFixed(2)}°</span></div>
        <div className="text-sm text-white/85">Eclipse : <span className="font-mono">{eclipse.kind}</span></div>
      </div>
    </div>
  );
}
