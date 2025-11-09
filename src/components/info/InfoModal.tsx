import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import InfoTabs from './InfoTabs';
import InfoLogo from './InfoLogo';

type Props = {
  open: boolean;
  initialTab?: string; // 'spaceview' | 'help' | 'simulations' | 'flatearth' | 'bug'
  onClose: () => void;
};

export default function InfoModal({ open, initialTab = 'spaceview', onClose }: Props) {
  const { t } = useTranslation('common');
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
      aria-label="Informations SpaceView.me"
      className="fixed inset-0 z-[2000] bg-black/70 flex items-center justify-center p-0 lg:p-4"
      onMouseDown={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      {/* Light themed info panel, same look-and-feel as /info */}
      <div className="bg-white text-gray-900 w-full h-full lg:rounded-lg lg:border lg:border-gray-200 lg:shadow-2xl lg:w-[90vw] lg:h-[90vh] flex flex-col font-sans">
        {/* Cartouche standard (logo + site + CTA) */}
        <div className="border-b border-gray-200 bg-white">
          <div className="px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <InfoLogo showBackground={false} size={64} />
              <div className="flex flex-col leading-tight">
                <span className="text-base font-semibold">SpaceView.me</span>
                <span className="text-xs text-gray-600">{t('ui:general.information')} {t('ui:general.and')} {t('ui:general.help')}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 shadow-sm"
                aria-label={t('navigation.back')}
                title={t('navigation.back')}
              >
                {t('navigation.back')}
              </button>
            </div>
          </div>
        </div>

        {/* Tabs + content (light style) */}
        <div className="flex-1 min-h-0">
          <InfoTabs initialTab={initialTab} />
        </div>
      </div>
    </div>
  );
  return createPortal(content, document.body);
}