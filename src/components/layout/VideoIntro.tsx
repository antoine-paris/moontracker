import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export interface VideoIntroProps {
  // Afficher l'intro ou non (contrôlé par l'enregistrement)
  show: boolean;
  
  // Informations à afficher
  location: string;
  date: string;
  coordinates: string;
  azimuth: string;
  altitude: string;
  fov: string;
  cameraLabel?: string;
  enlargeObjects?: boolean;
  
  // Style du viewport
  viewport: { x: number; y: number; w: number; h: number };
  
  // Callback quand l'intro est terminée
  onIntroComplete?: () => void;
  
  // Nombre de frames enregistrées (pour synchroniser avec l'enregistrement vidéo)
  recordingFrames?: number;
  
  // FPS de l'enregistrement (pour calculer les durées correctes)
  recordingFps?: number;
  
  // Mode d'enregistrement actif (pour savoir si on doit utiliser le mode frame-based)
  isRecording?: boolean;
}

export default function VideoIntro(props: VideoIntroProps) {
  const { t: tUi } = useTranslation('ui');
  
  const {
    show,
    location,
    date,
    coordinates,
    azimuth,
    altitude,
    fov,
    cameraLabel,
    enlargeObjects,
    viewport,
    onIntroComplete,
    recordingFrames = 0,
    recordingFps = 24,
    isRecording = false,
  } = props;

  const [opacity, setOpacity] = useState(1);
  const [isVisible, setIsVisible] = useState(show);

  // Calculer les seuils de frames basés sur le FPS
  const introDurationSec = 2;      // 2 secondes d'intro
  const fadeOutDurationSec = 0.5;  // 0.5 seconde de fondu
  const totalFrames = Math.round(introDurationSec * recordingFps);
  const fadeStartFrame = Math.round((introDurationSec - fadeOutDurationSec) * recordingFps);

  // Mode enregistrement : contrôle par frames
  useEffect(() => {
    if (!isRecording || !show) return;

    if (recordingFrames >= totalFrames) {
      // Intro terminée
      setIsVisible(false);
      onIntroComplete?.();
    } else if (recordingFrames >= fadeStartFrame) {
      // Phase de fondu : calculer l'opacité basée sur la progression
      const fadeFrames = totalFrames - fadeStartFrame;
      const currentFadeFrame = recordingFrames - fadeStartFrame;
      const fadeProgress = currentFadeFrame / Math.max(1, fadeFrames);
      setOpacity(1 - fadeProgress); // Décroissance linéaire
    } else {
      // Phase visible complète
      setOpacity(1);
      setIsVisible(true);
    }
  }, [isRecording, show, recordingFrames, totalFrames, fadeStartFrame, onIntroComplete]);

  // Mode non-enregistrement : contrôle par temps réel (fallback)
  useEffect(() => {
    if (isRecording) return; // Ignorer si en mode enregistrement

    if (!show) {
      setIsVisible(false);
      setOpacity(1);
      return;
    }

    setIsVisible(true);
    setOpacity(1);

    const introDurationMs = introDurationSec * 1000;
    const fadeOutDurationMs = fadeOutDurationSec * 1000;

    // Démarrer le fondu après (introDurationMs - fadeOutDurationMs)
    const fadeTimer = setTimeout(() => {
      setOpacity(0);
    }, introDurationMs - fadeOutDurationMs);

    // Masquer complètement après introDurationMs
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
      onIntroComplete?.();
    }, introDurationMs);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, [show, onIntroComplete, isRecording, introDurationSec, fadeOutDurationSec]);

  if (!isVisible) return null;

  return (
    <div
      className="absolute"
      style={{
        left: viewport.x+25,
        top: viewport.y,
        width: viewport.w-50,
        height: viewport.h,
        pointerEvents: 'none',
        zIndex: 9999,
        opacity,
        // En mode enregistrement, pas de transition CSS (contrôle frame-by-frame)
        // En mode temps réel, transition CSS pour un fondu fluide
        transition: isRecording ? 'none' : `opacity ${fadeOutDurationSec * 1000}ms ease-out`,
      }}
      aria-hidden="true"
    >
      {/* Conteneur principal avec fond semi-transparent */}
      <div className="w-full h-full flex flex-col items-center justify-center">
        {/* Titre principal */}
        <h1
          className="text-white font-bold mb-2"
          style={{
            fontSize: Math.max(32, viewport.w / 25),
            textShadow: '0 2px 8px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.6)',
          }}
        >
          SpaceView.me
        </h1>

        {/* Sous-titre */}
        <p
          className="text-white/90 font-light mb-8"
          style={{
            fontSize: Math.max(16, viewport.w / 50),
            textShadow: '0 1px 4px rgba(0,0,0,0.8)',
          }}
        >
          {tUi('videoIntro.subtitle')}
        </p>

        {/* Paramètres de simulation */}
        <div
          className="bg-black/40 backdrop-blur-sm rounded-lg px-6 py-4 border border-white/20 absolute bottom-[25px]"
          style={{
            fontSize: Math.max(12, viewport.w / 80),
          }}
        >
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-white/90">
            {/* Colonne gauche */}
            <div className="space-y-1">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-white/60 min-w-[80px] flex-shrink-0">{tUi('videoIntro.location')}:</span>
                <span className="font-medium text-sm min-w-[121px]">{location}</span>
              </div>
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-white/60 min-w-[80px] flex-shrink-0">{tUi('videoIntro.coordinates')}:</span>
                <span className="font-mono text-sm">{coordinates}</span>
              </div>
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-white/60 min-w-[80px] flex-shrink-0">{tUi('videoIntro.date')}:</span>
                <span className="font-mono text-sm">{date}</span>
              </div>
            </div>

            {/* Colonne droite */}
            <div className="space-y-1">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-white/60 min-w-[80px] flex-shrink-0">{tUi('videoIntro.azimut')}:</span>
                <span className="font-mono text-sm">{azimuth}</span>
              </div>
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-white/60 min-w-[80px] flex-shrink-0">{tUi('videoIntro.altitude')}:</span>
                <span className="font-mono text-sm">{altitude}</span>
              </div>
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-white/60 min-w-[80px] flex-shrink-0">{tUi('videoIntro.fov')}:</span>
                <span className="font-mono text-sm">{fov}</span>
              </div>
              {cameraLabel && (
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-white/60 min-w-[80px] flex-shrink-0">{tUi('videoIntro.camera')}:</span>
                  <span className="font-medium text-sm">{cameraLabel}</span>
                </div>
              )}
              {enlargeObjects && (
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-white/60 min-w-[80px] flex-shrink-0 invisible">{tUi('videoIntro.camera')}:</span>
                  <span className="font-medium text-sm">({tUi('videoIntro.exaggerated')})</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
