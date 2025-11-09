import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../LanguageSwitcher';
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

export default function InfoTabs({ initialTab = 'spaceview' }: { initialTab?: string }) {
  const { t } = useTranslation('info');
  const validInit = (['spaceview','help','simulations','flatearth','bug'].includes(initialTab) ? initialTab : 'spaceview') as TabId;
  const [active, setActive] = useState<TabId>(validInit);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isInfoPage = window.location.pathname.endsWith('/info');
    if (!isInfoPage) return;
    const next = `#${active}`;
    if (window.location.hash !== next) history.replaceState(null, '', next);
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
    <div className="w-full h-full flex flex-col">
      {/* Language switcher above tabs */}
      <div className="flex justify-end p-2 pb-0">
        <LanguageSwitcher size="sm" showLabels={true} variant="light" />
      </div>
      
      {/* Light tablist (aligned with InfoNav style) */}
      <div role="tablist" aria-label="Informations" className="flex gap-2 p-2 border-b border-gray-200 flex-wrap">
        {TABS.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={active === tab.id}
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
      {/* Light prose with clear heading hierarchy */}
      <div role="tabpanel" className="flex-1 overflow-y-auto p-4 prose prose-info max-w-none font-sans">
        {renderActive}
      </div>
    </div>
  );
}