import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import InfoTabs from './InfoTabs';

type Props = {
  open: boolean;
  initialTab?: string; // 'moontracker' | 'help' | 'simulations' | 'flatearth' | 'bug'
  onClose: () => void;
};

export default function InfoModal({ open, initialTab = 'moontracker', onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const content = (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label="Informations MoonTracker"
      className="fixed inset-0 z-[2000] bg-black/70 flex items-center justify-center p-4"
      onMouseDown={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="bg-black text-white rounded-lg border border-white/15 shadow-2xl w-[90vw] h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-3 border-b border-white/10">
          <h2 className="text-base font-semibold">Informations</h2>
          <button
            onClick={onClose}
            className="rounded px-2 py-1 text-white/80 hover:text-white hover:bg-white/10"
            aria-label="Fermer"
            title="Fermer"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 min-h-0">
          <InfoTabs initialTab={initialTab} />
        </div>
      </div>
    </div>
  );
  return createPortal(content, document.body);
}