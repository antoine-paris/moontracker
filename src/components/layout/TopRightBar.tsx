import React from 'react';
import { useTranslation } from 'react-i18next';


type Props = {
  showPanels: boolean;
  onTogglePanels: () => void;
  zIndex?: number;
  shareUrl: string;
  isAnimating: boolean;
  onToggleAnimating: () => void;
  onCopyJpeg: () => void;
  onOpenInfo: () => void;
  // NEW
  isRecordingVideo: boolean;
  onToggleRecording: () => void;
  // MOBILE
  isMobile?: boolean;
  isLandscape?: boolean;
  showSidebar?: boolean;
  onToggleSidebar?: () => void;
  showTelemetry?: boolean;
  onToggleTelemetry?: () => void;
  showTopBar?: boolean;
};

export default function TopRightBar({
  showPanels,
  onTogglePanels,
  zIndex = 1000,
  shareUrl,
  isAnimating,
  onToggleAnimating,
  onCopyJpeg,
  onOpenInfo,
  // NEW
  isRecordingVideo,
  onToggleRecording,
  // MOBILE
  isMobile = false,
  isLandscape = false,
  showSidebar = false,
  onToggleSidebar,
  showTelemetry = false,
  onToggleTelemetry,
  showTopBar = false,
}: Props) {
  const { t } = useTranslation('ui');
  const [copied, setCopied] = React.useState(false);
  const [captured, setCaptured] = React.useState(false);
  const [isCapturing, setIsCapturing] = React.useState(false);

  const copyUrl = async () => {
    const url = shareUrl || window.location.href;
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Silently handle clipboard errors
    }
  };

  // Fonction pour définir la classe des boutons selon le contexte
  const getButtonClass = (isActive = false, activeColor = 'emerald') => {
    const baseSize = isMobile ? 'w-12 h-12' : 'w-10 h-10';
    const baseClass = `${baseSize} rounded-md border bg-black/50 hover:bg-black/70 flex items-center justify-center cursor-pointer`;
    
    if (isActive) {
      const colorMap = {
        emerald: 'border-emerald-400/60 text-emerald-300',
        rose: 'border-rose-400/60 text-rose-300',
        blue: 'border-blue-400/60 text-blue-300',
        amber: 'border-amber-400/60 text-amber-300',
      };
      return `${baseClass} ${colorMap[activeColor as keyof typeof colorMap] || colorMap.emerald}`;
    }
    
    return `${baseClass} border-white/15 text-white/80 hover:border-white/30`;
  };

  // Tous les boutons individuels pour réutilisation
  const buttons = {
    settings: (
      <button
        key="settings"
        onClick={onTogglePanels}
        className={getButtonClass(isMobile ? showTopBar : showPanels)}
        title={t('controls.settings')}
        aria-label={t('controls.settings')}
      >
        {showPanels ? "\u26F6" : (
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
            <g transform="translate(12 12)">
              <rect x="-1" y="-10.8" width="2" height="3.2" rx="0.6" fill="currentColor" />
              <g transform="rotate(45)"><rect x="-1" y="-10.8" width="2" height="3.2" rx="0.6" fill="currentColor" /></g>
              <g transform="rotate(90)"><rect x="-1" y="-10.8" width="2" height="3.2" rx="0.6" fill="currentColor" /></g>
              <g transform="rotate(135)"><rect x="-1" y="-10.8" width="2" height="3.2" rx="0.6" fill="currentColor" /></g>
              <g transform="rotate(180)"><rect x="-1" y="-10.8" width="2" height="3.2" rx="0.6" fill="currentColor" /></g>
              <g transform="rotate(225)"><rect x="-1" y="-10.8" width="2" height="3.2" rx="0.6" fill="currentColor" /></g>
              <g transform="rotate(270)"><rect x="-1" y="-10.8" width="2" height="3.2" rx="0.6" fill="currentColor" /></g>
              <g transform="rotate(315)"><rect x="-1" y="-10.8" width="2" height="3.2" rx="0.6" fill="currentColor" /></g>
              <path d="M0 -3.4v-2.2M0 3.4v2.2M-3.4 0h-2.2M3.4 0h2.2" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
            </g>
            <circle cx="12" cy="12" r="6.4" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="12" r="2.6" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
    ),
    
    playPause: (
      <button
        key="playPause"
        onClick={onToggleAnimating}
        className={getButtonClass(isAnimating, 'emerald')}
        title={isAnimating ? t('controls.pause') : t('controls.play')}
        aria-label={isAnimating ? t('controls.pause') : t('controls.play')}
      >
        {isAnimating ? (
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
            <rect x="7" y="5" width="4" height="14" rx="1.5" fill="currentColor" />
            <rect x="13" y="5" width="4" height="14" rx="1.5" fill="currentColor" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
            <path d="M8 5l12 7-12 7V5z" fill="currentColor" />
          </svg>
        )}
      </button>
    ),
    
    record: (
      <button
        key="record"
        onClick={onToggleRecording}
        className={getButtonClass(isRecordingVideo, 'rose')}
        title={isRecordingVideo ? t('controls.stopRecording') : t('controls.startRecordingWithPlay')}
        aria-label={isRecordingVideo ? t('controls.stopRecording') : t('controls.startRecording')}
      >
        {isRecordingVideo ? (
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
            <rect x="6.5" y="6.5" width="11" height="11" rx="2" fill="currentColor" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
            <circle cx="12" cy="12" r="7" fill="currentColor" />
          </svg>
        )}
      </button>
    ),
    
    copyUrl: (
      <button
        key="copyUrl"
        onClick={copyUrl}
        className={getButtonClass(copied)}
        title={copied ? t('controls.linkCopied') : t('controls.copyUrlWithParams')}
        aria-label={t('controls.copyUrl')}
      >
        {copied ? "✓" : (
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="6" cy="12" r="3" fill="currentColor" />
            <circle cx="18" cy="6" r="3" fill="currentColor" />
            <circle cx="18" cy="18" r="3" fill="currentColor" />
            <path d="M8 12L16 8" stroke="currentColor" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M8 12L16 16" stroke="currentColor" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
    ),
    
    capture: (
      <button
        key="capture"
        title={t('controls.capture')}
        disabled={isCapturing || showPanels}
        onPointerDown={async (e) => {
          e.preventDefault();
          if (isCapturing || showPanels) return;
          setIsCapturing(true);
          try {
            await Promise.resolve(onCopyJpeg());
            setCaptured(true);
            setTimeout(() => setCaptured(false), 1500);
          } catch {
            // Silently handle capture errors
          } finally {
            setIsCapturing(false);
          }
        }}
        onClick={(e) => e.preventDefault()}
        className={`${getButtonClass()} ${
          (isCapturing || showPanels)
            ? 'opacity-40 cursor-not-allowed'
            : (isCapturing ? 'cursor-wait' : 'hover:bg-black/70')
        }`}
      >
        {isCapturing ? "⏳" : captured ? "✓" : (
          <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>
    ),
    
    sidebar: isMobile && onToggleSidebar ? (
      <button
        key="sidebar"
        onClick={onToggleSidebar}
        className={getButtonClass(showSidebar, 'blue')}
        title={t('mobile.toggleSidebar', 'Localisation')}
        aria-label={t('mobile.toggleSidebar', 'Localisation')}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2L22 7L12 12L2 7L12 2Z" fill="currentColor" />
          <path d="M2 17L12 22L22 17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M2 12L12 17L22 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    ) : null,
    
    telemetry: isMobile && onToggleTelemetry ? (
      <button
        key="telemetry"
        onClick={onToggleTelemetry}
        className={getButtonClass(showTelemetry, 'amber')}
        title={t('mobile.toggleTelemetry', 'Télémétrie')}
        aria-label={t('mobile.toggleTelemetry', 'Télémétrie')}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 3v18h18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 9l1.5-1.5L16 13l4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    ) : null,
    
    info: (
      <button
        key="info"
        onClick={onOpenInfo}
        className={getButtonClass()}
        title={t('controls.info')}
        aria-label={t('controls.info')}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
          <rect x="11" y="10" width="2" height="6" rx="1" fill="currentColor" />
          <circle cx="12" cy="7.5" r="1.2" fill="currentColor" />
        </svg>
      </button>
    ),
  };

  // Liste des boutons dans l'ordre
  const allButtons = [
    buttons.settings,
    buttons.playPause,
    buttons.record,
    buttons.copyUrl,
    buttons.capture,
    buttons.sidebar,
    buttons.telemetry,
    buttons.info,
  ].filter(Boolean);

  // Mobile Paysage : 2 colonnes de 4 boutons, centré verticalement
  if (isMobile && isLandscape) {
    const firstColumn = allButtons.slice(0, 4);
    const secondColumn = allButtons.slice(4, 8);
    
    return (
      <div
        className="fixed right-4 top-1/2 -translate-y-1/2 flex flex-row gap-3"
        style={{ zIndex }}
        aria-label={t('controls.toolbar')}
      >
        {/* Première colonne */}
        <div className="flex flex-col gap-2">
          {firstColumn}
        </div>
        
        {/* Deuxième colonne */}
        <div className="flex flex-col gap-2">
          {secondColumn}
        </div>
      </div>
    );
  }

  // Mobile Portrait : Centré verticalement à droite, une seule colonne
  if (isMobile && !isLandscape) {
    return (
      <div
        className="fixed right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2"
        style={{ zIndex }}
        aria-label={t('controls.toolbar')}
      >
        {allButtons}
      </div>
    );
  }

  // Desktop : Layout original
  return (
    <div
      className="absolute top-2 right-2 flex flex-col gap-2"
      style={{ 
        zIndex, 
        marginTop: '3em', 
        marginRight: '3px'
      }}
      aria-label={t('controls.toolbar')}
    >
      {allButtons}
    </div>
  );
}