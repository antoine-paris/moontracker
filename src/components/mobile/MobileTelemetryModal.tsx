import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import { formatDeg } from '../../utils/format';
import { compass16 } from '../../utils/compass';

interface MobileTelemetryModalProps {
  isOpen: boolean;
  onClose: () => void;
  astro: any; // Type from App.tsx
  rotationToHorizonDegMoon: number;
  phaseFraction: number;
  brightLimbAngleDeg: number;
  sunDeclinationDeg: number;
  earthshine: boolean;
  eclipse: any; // Type from App.tsx
  eclipticTiltDeg: number;
  // HUD information from SpaceView
  overlayInfoString?: string;
  refAzDeg: number;
  refAltDeg: number;
  cameraLabel?: string;
  enlargeObjects?: boolean;
  domainFromBrowser?: string;
}

export default function MobileTelemetryModal({
  isOpen,
  onClose,
  astro,
  rotationToHorizonDegMoon,
  phaseFraction,
  brightLimbAngleDeg,
  sunDeclinationDeg,
  earthshine,
  eclipse,
  eclipticTiltDeg,
  overlayInfoString,
  refAzDeg,
  refAltDeg,
  cameraLabel,
  enlargeObjects,
  domainFromBrowser,
}: MobileTelemetryModalProps) {
  const { t } = useTranslation('ui');
  const { t: tCommon } = useTranslation('common');
  
  // Split overlay info into place and date
  const overlaySplit = useMemo(() => {
    const s = overlayInfoString ?? '';
    const i = s.indexOf(',');
    if (i >= 0) {
      return { place: s.slice(0, i).trim(), date: s.slice(i + 1).trim() };
    }
    return { place: s, date: '' };
  }, [overlayInfoString]);

  // Domain from browser (fallback)
  const displayDomain = domainFromBrowser || 'SpaceView';
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-black/90 backdrop-blur border-b border-white/10 p-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">
          {t('mobile.telemetry', 'Télémétrie')}
        </h2>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
          aria-label={t('general.close', 'Fermer')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content scrollable */}
      <div className="flex-1 overflow-y-auto p-4 pb-20 space-y-6">
        
        {/* Section HUD - Informations générales */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <h3 className="text-blue-400 font-medium mb-3 flex items-center">
            <span className="mr-2">📍</span>
            Informations générales
          </h3>
          <div className="space-y-3 text-sm">
            {/* Lieu et date */}
            {overlaySplit.place && (
              <div className="bg-white/5 rounded p-3">
                <div className="text-white font-medium">{overlaySplit.place}</div>
                {overlaySplit.date && (
                  <div className="text-white/70 text-xs mt-1">{overlaySplit.date}</div>
                )}
              </div>
            )}
            
            {/* Simulation et caméra */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-white/70">Simulation:</span>
                <span className="text-white">{displayDomain}</span>
              </div>
              {cameraLabel && (
                <div className="flex justify-between">
                  <span className="text-white/70">Appareil:</span>
                  <span className="text-white">{cameraLabel}</span>
                </div>
              )}
              {enlargeObjects && (
                <div className="text-orange-400 text-xs">
                  ({t('hud.objectSizeExaggerated', 'Taille des objets exagérée')})
                </div>
              )}
            </div>

            {/* Orientation observateur */}
            <div className="bg-white/5 rounded p-3">
              <div className="flex justify-between mb-2">
                <span className="text-white/70">{t('hud.azimuth', 'Azimut')}:</span>
                <span className="text-white">{refAzDeg.toFixed(1)}° - {compass16(refAzDeg, tCommon)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">{t('hud.altitude', 'Altitude')}:</span>
                <span className={`text-white ${refAltDeg < 0 ? 'text-red-400' : ''}`}>
                  {formatDeg(refAltDeg, 0)}
                </span>
              </div>
            </div>

            {/* Status des astres */}
            <div className="bg-white/5 rounded p-3">
              <h4 className="text-white/80 font-medium mb-2">Position des astres</h4>
              <div className="space-y-1 text-xs">
                {/* Soleil */}
                <div className="flex justify-between">
                  <span className="text-yellow-400">☀️ {t('celestialBodies.sun', 'Soleil')}:</span>
                  <span className="text-white">
                    {astro.sun.alt + astro.sun.appDiamDeg / 2 < 0
                      ? t('hud.sunBelowHorizon', 'Sous l\'horizon')
                      : `Alt. ${formatDeg(astro.sun.alt, 0)} Az ${formatDeg(astro.sun.az, 1)} (${compass16(astro.sun.az, tCommon)})`}
                  </span>
                </div>
                
                {/* Lune */}
                <div className="flex justify-between">
                  <span className="text-gray-400">🌙 {t('celestialBodies.moon', 'Lune')}:</span>
                  <span className="text-white">
                    {astro.moon.alt + astro.moon.appDiamDeg / 2 < 0
                      ? t('hud.moonBelowHorizon', 'Sous l\'horizon')
                      : `Alt. ${formatDeg(astro.moon.alt, 0)} Az ${formatDeg(astro.moon.az, 1)} (${compass16(astro.moon.az, tCommon)})`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Soleil */}
        <div className="bg-white/5 rounded-lg p-4">
          <h3 className="text-yellow-400 font-medium mb-3 flex items-center">
            <span className="mr-2">☀️</span>
            {t('celestialBodies.sun', 'Soleil')}
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-white/70">Azimut:</span>
              <span className="text-white">{astro.sun.az.toFixed(1)}°</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/70">Altitude:</span>
              <span className="text-white">{astro.sun.alt.toFixed(1)}°</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/70">Distance:</span>
              <span className="text-white">{astro.sun.distAU.toFixed(3)} AU</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/70">Diamètre apparent:</span>
              <span className="text-white">{(astro.sun.appDiamDeg * 60).toFixed(1)}'</span>
            </div>
          </div>
        </div>

        {/* Lune */}
        <div className="bg-white/5 rounded-lg p-4">
          <h3 className="text-gray-300 font-medium mb-3 flex items-center">
            <span className="mr-2">🌙</span>
            {t('celestialBodies.moon', 'Lune')}
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-white/70">Azimut:</span>
              <span className="text-white">{astro.moon.az.toFixed(1)}°</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/70">Altitude:</span>
              <span className="text-white">{astro.moon.alt.toFixed(1)}°</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/70">Distance:</span>
              <span className="text-white">{Math.round(astro.moon.distKm).toLocaleString()} km</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/70">Diamètre apparent:</span>
              <span className="text-white">{(astro.moon.appDiamDeg * 60).toFixed(1)}'</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/70">Phase:</span>
              <span className="text-white">{(phaseFraction * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/70">Illumination:</span>
              <span className="text-white">{astro.illum.angle ? astro.illum.angle.toFixed(1) + '°' : 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Éclipse */}
        {eclipse.isVisible && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <h3 className="text-red-400 font-medium mb-3 flex items-center">
              <span className="mr-2">🌘</span>
              Éclipse
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/70">Type:</span>
                <span className="text-white">{eclipse.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Magnitude:</span>
                <span className="text-white">{eclipse.magnitude?.toFixed(3) || 'N/A'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Informations techniques */}
        <div className="bg-white/5 rounded-lg p-4">
          <h3 className="text-blue-400 font-medium mb-3">Paramètres techniques</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-white/70">Rotation horizon (Lune):</span>
              <span className="text-white">{rotationToHorizonDegMoon.toFixed(1)}°</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/70">Angle terminateur:</span>
              <span className="text-white">{brightLimbAngleDeg.toFixed(1)}°</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/70">Déclinaison solaire:</span>
              <span className="text-white">{sunDeclinationDeg.toFixed(1)}°</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/70">Inclinaison écliptique:</span>
              <span className="text-white">{eclipticTiltDeg.toFixed(1)}°</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}