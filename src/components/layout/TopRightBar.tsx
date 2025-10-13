import React from 'react';

type Props = {
  showPanels: boolean;
  onTogglePanels: () => void;
  zIndex?: number;
  shareUrl: string; // added
};

export default function TopRightBar({ showPanels, onTogglePanels, zIndex = 1000, shareUrl }: Props) {
  const [copied, setCopied] = React.useState(false);

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
        className="w-10 h-10 flex items-center justify-center rounded-lg border border-white/20 text-white/80 hover:border-white/40 hover:text-white transition text-xl leading-none"
        title="Basculer l'interface"
        aria-label="Basculer l'interface"
      >
        {showPanels ? "\u26F6" : "\u2699"}
      </button>

      {/* Copy URL */}
      <button
        onClick={copyUrl}
        className="w-10 h-10 flex items-center justify-center rounded-lg border border-white/20 text-white/80 hover:border-white/40 hover:text-white transition text-base leading-none"
        title={copied ? "Lien copié !" : "Copier l’URL actuelle (avec paramètres)"}
        aria-label="Copier l’URL actuelle"
      >
        {copied ? "✓" : "🔗"}
      </button>

      {/* TBD buttons (placeholders) */}
      <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-white/20 text-white/50 opacity-50 cursor-not-allowed" title="À venir" aria-label="Fonction à venir">T1</button>
      <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-white/20 text-white/50 opacity-50 cursor-not-allowed" title="À venir" aria-label="Fonction à venir">T2</button>
      <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-white/20 text-white/50 opacity-50 cursor-not-allowed" title="À venir" aria-label="Fonction à venir">T3</button>
    </div>
  );
}