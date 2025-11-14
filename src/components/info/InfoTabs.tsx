import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../LanguageSwitcher';
import InfoLogo from './InfoLogo';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import SpaceViewTab from './tabs/SpaceViewTab/index';
import HelpTab from './tabs/HelpTab/index';
import SimulationsTab from './tabs/SimulationsTab/index';
import FlatEarthTab from './tabs/FlatEarthTab/index';
import BugReportTab from './tabs/BugReportTab/index';
import ContactTab from './tabs/ContactTab/index';

type TabId = 'spaceview' | 'help' | 'simulations' | 'flatearth' | 'bug' | 'contact';

const TABS: { id: TabId; key: string }[] = [
  { id: 'spaceview', key: 'spaceview' },
  { id: 'help', key: 'help' },
  { id: 'simulations', key: 'simulations' },
  { id: 'flatearth', key: 'flatearth' },
  { id: 'bug', key: 'bug' },
  { id: 'contact', key: 'contact' },
];

interface InfoTabsProps {
  initialTab?: string;
  onClose?: () => void;
}

export default function InfoTabs({ initialTab = 'spaceview', onClose }: InfoTabsProps) {
  const { t } = useTranslation('info');
  const { t: tCommon } = useTranslation('common');
  const { isInstallable, isInstalled, installApp } = usePWAInstall();
  const validInit = (['spaceview','help','simulations','flatearth','bug'].includes(initialTab) ? initialTab : 'spaceview') as TabId;
  const [active, setActive] = useState<TabId>(validInit);
  const tabPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isInfoPage = window.location.pathname.endsWith('/info');
    if (!isInfoPage) return;
    const next = `#${active}`;
    if (window.location.hash !== next) history.replaceState(null, '', next);
  }, [active]);

  // Reset scroll position when switching tabs
  useEffect(() => {
    if (tabPanelRef.current) {
      tabPanelRef.current.scrollTop = 0;
    }
  }, [active]);

  const renderActive = useMemo(() => {
    switch (active) {
      case 'spaceview': return <SpaceViewTab />;
      case 'help':        return <HelpTab />;
      case 'simulations': return <SimulationsTab />;
      case 'flatearth':   return <FlatEarthTab />;
      case 'bug':         return <BugReportTab />;
      case 'contact':     return <ContactTab />;
    }
  }, [active]);

  return (
    <>
      {/* Mobile: Left sidebar with logo, language switcher, and menu items */}
      <div className="lg:hidden w-32 h-full border-r border-gray-200 flex flex-col bg-white">
        {/* Logo section */}
        <div className="flex flex-col items-center gap-2 p-3 border-b border-gray-200">
          <InfoLogo showBackground={false} size={48} />
          
          {/* PWA Install buttons */}
          {isInstallable && (
            <button
              onTouchEnd={(e) => {
                e.preventDefault();
                installApp();
              }}
              onClick={installApp}
              className="w-full px-2 py-1 rounded-md bg-green-600 text-white text-xs font-medium hover:bg-green-700 shadow-sm flex items-center justify-center gap-1"
              aria-label={tCommon('navigation.installApp')}
              title={tCommon('navigation.installApp')}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span className="truncate">{tCommon('navigation.installApp')}</span>
            </button>
          )}
          {isInstalled && (
            <div className="w-full px-2 py-1 text-xs text-green-700 flex items-center justify-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="truncate">{tCommon('navigation.appInstalled')}</span>
            </div>
          )}
          
          {onClose && (
            <button
              onTouchEnd={(e) => {
                e.preventDefault();
                onClose();
              }}
              onClick={onClose}
              className="w-full px-2 py-1 rounded-md bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 shadow-sm"
              aria-label={tCommon('navigation.back')}
              title={tCommon('navigation.back')}
            >
              {tCommon('navigation.back')}
            </button>
          )}
        </div>

        {/* Language switcher */}
        <div className="flex justify-center p-2 border-b border-gray-200">
          <LanguageSwitcher size="sm" showLabels={false} variant="light" />
        </div>

        {/* Scrollable menu items */}
        <div role="tablist" aria-label="Informations" className="flex-1 overflow-y-auto flex flex-col gap-1 p-2">
          {TABS.map(tab => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={active === tab.id}
              onTouchEnd={(e) => {
                e.preventDefault();
                setActive(tab.id);
              }}
              onClick={() => setActive(tab.id)}
              className={[
                'px-2 py-2 rounded-md text-xs border transition-colors text-center leading-tight',
                active === tab.id
                  ? 'border-gray-400 bg-gray-100 text-gray-900 font-semibold'
                  : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              ].join(' ')}
            >
              {t(`tabs.${tab.key}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop: Original horizontal layout */}
      <div className="hidden lg:flex w-full h-full flex-col">
        {/* Tabs and language switcher on the same line */}
        <div className="flex items-center justify-between p-2 border-b border-gray-200 gap-4">
          {/* Light tablist (aligned with InfoNav style) */}
          <div role="tablist" aria-label="Informations" className="flex gap-2 flex-wrap">
            {TABS.map(tab => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={active === tab.id}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  setActive(tab.id);
                }}
                onClick={() => setActive(tab.id)}
                className={[
                  'px-3 py-1.5 rounded-md text-sm border transition-colors whitespace-nowrap',
                  active === tab.id
                    ? 'border-gray-400 bg-gray-100 text-gray-900'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                ].join(' ')}
              >
                {t(`tabs.${tab.key}`)}
              </button>
            ))}
          </div>
          
          {/* Language switcher on the right */}
          <div className="flex-shrink-0">
            <LanguageSwitcher size="sm" showLabels={true} variant="light" />
          </div>
        </div>

        {/* Desktop content panel */}
        <div ref={tabPanelRef} role="tabpanel" className="flex-1 overflow-y-auto p-4 prose prose-info max-w-none font-sans">
          {renderActive}
        </div>
      </div>

      {/* Mobile content panel */}
      <div className="lg:hidden flex-1 overflow-y-auto p-4 prose prose-info max-w-none font-sans">
        {renderActive}
      </div>
    </>
  );
}