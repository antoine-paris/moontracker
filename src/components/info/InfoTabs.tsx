import React, { useEffect, useMemo, useState } from 'react';
import MoonTrackerTab from './tabs/MoonTrackerTab';
import HelpTab from './tabs/HelpTab';
import SimulationsTab from './tabs/SimulationsTab';
import FlatEarthTab from './tabs/FlatEarthTab';
import BugReportTab from './tabs/BugReportTab';

type TabId = 'moontracker' | 'help' | 'simulations' | 'flatearth' | 'bug';

const TABS: { id: TabId; label: string }[] = [
  { id: 'moontracker', label: 'MoonTracker' },
  { id: 'help',        label: 'Aide' },
  { id: 'simulations', label: 'Simulations' },
  { id: 'flatearth',   label: 'Flat‑earth' },
  { id: 'bug',         label: 'Déclarez un bug' },
];

export default function InfoTabs({ initialTab = 'moontracker' }: { initialTab?: string }) {
  const validInit = (['moontracker','help','simulations','flatearth','bug'].includes(initialTab) ? initialTab : 'moontracker') as TabId;
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
      case 'moontracker': return <MoonTrackerTab />;
      case 'help':        return <HelpTab />;
      case 'simulations': return <SimulationsTab />;
      case 'flatearth':   return <FlatEarthTab />;
      case 'bug':         return <BugReportTab />;
    }
  }, [active]);

  return (
    <div className="w-full h-full flex flex-col">
      <div role="tablist" aria-label="Informations" className="flex gap-2 p-2 border-b border-white/10 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            role="tab"
            aria-selected={active === t.id}
            onClick={() => setActive(t.id)}
            className={`px-3 py-1.5 rounded-md text-sm border ${active === t.id ? 'border-white/40 bg-white/10' : 'border-white/15 text-white/80 hover:border-white/30'}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="flex-1 overflow-y-auto p-4 prose prose-invert max-w-none">
        {renderActive}
      </div>
    </div>
  );
}