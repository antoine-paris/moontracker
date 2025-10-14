import React from 'react';

type Props = {
  showPanels: boolean;
  onTogglePanels: () => void;
  zIndex?: number;
  shareUrl: string;
  isAnimating: boolean;
  onToggleAnimating: () => void;
  // NEW
  onCopyJpeg: () => void;
};

export default function TopRightBar({ showPanels, onTogglePanels, zIndex = 1000, shareUrl, isAnimating, onToggleAnimating, onCopyJpeg }: Props) {
  const [copied, setCopied] = React.useState(false);
  const [captured, setCaptured] = React.useState(false);
  const [isCapturing, setIsCapturing] = React.useState(false);

  const copyUrl = async () => {
    const url = shareUrl || window.location.href;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        // Fallback for older browsers
        const ta = document.createElement('textarea');
        ta.value = url;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <div
      className="absolute top-2 right-2 flex flex-col gap-2"
      style={{ zIndex }}
      aria-label="Barre d’outils"
    >
      {/* Show/Hide Panels */}
      <button
        onClick={onTogglePanels}
        className="w-10 h-10 rounded-md border border-white/30 bg-black/50 hover:bg-black/70"
        title="Basculer l'interface"
        aria-label="Basculer l'interface"
      >
        {showPanels ? "\u26F6" : "\u2699"}
      </button>

      {/* Copy URL */}
      <button
        onClick={copyUrl}
        className="w-10 h-10 rounded-md border border-white/30 bg-black/50 hover:bg-black/70"
        title={copied ? "Lien copié !" : "Copier l’URL actuelle (avec paramètres)"}
        aria-label="Copier l’URL actuelle"
      >
        {copied ? "✓" : "🔗"}
      </button>

      {/* T1: Capture -> JPG/PNG -> Clipboard */}
      <button
        disabled={isCapturing}
        onPointerDown={async (e) => {
          e.preventDefault();
          if (isCapturing) return;
          setIsCapturing(true);
          try {
            await Promise.resolve(onCopyJpeg());
            setCaptured(true); // show ✓
            setTimeout(() => setCaptured(false), 1500);
          } catch {
            // ignore
          } finally {
            setIsCapturing(false);
          }
        }}
        // Empêche un second déclenchement via click après pointerdown
        onClick={(e) => e.preventDefault()}
        className={`w-10 h-10 rounded-md border border-white/30 bg-black/50 ${isCapturing ? 'cursor-wait' : 'hover:bg-black/70'}`}
        title={captured ? "Image copiée !" : isCapturing ? "Capture en cours…" : "Copier l’image (JPG/PNG) du rendu"}
        aria-label={captured ? "Image copiée" : isCapturing ? "Capture en cours" : "Copier l’image du rendu"}
      >
        {isCapturing ? "⏳" : captured ? "✓" : "📷"}
      </button>

      {/* T2 (placeholder) */}
      <button
        className="w-10 h-10 rounded-md border border-white/30 bg-black/50 opacity-50 cursor-not-allowed"
        title="À venir"
        aria-label="Fonction à venir"
      >
        T2
      </button>

      {/* Play/Pause */}
      <button
        onClick={onToggleAnimating}
        className="w-10 h-10 rounded-md border border-white/30 bg-black/50 hover:bg-black/70"
        title={isAnimating ? "Pause l’animation" : "Lancer l’animation"}
        aria-label={isAnimating ? "Mettre en pause l’animation" : "Lancer l’animation"}
      >
        {isAnimating ? "⏸" : "▶"}
      </button>
    </div>
  );
}