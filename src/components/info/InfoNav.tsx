import { NavLink } from 'react-router-dom';

const tabs = [
  { to: '/info', label: 'MoonTracker', end: true },
  { to: '/info/aide', label: 'Aide' },
  { to: '/info/simulations', label: 'Simulations' },
  { to: '/info/flat-earth', label: 'Terre plate ?' },
  { to: '/info/bug', label: 'Déclarer un bug' },
  { to: '/info/contact', label: 'Contact' },
];

export default function InfoNav() {
  return (
    <nav role="tablist" aria-label="Informations" className="flex gap-2 p-2 border-b border-gray-200 overflow-x-auto">
      {tabs.map(t => (
        <NavLink
          key={t.to}
          to={t.to}
          end={t.end as any}
          role="tab"
          className={({ isActive }) =>
            [
              'px-3 py-1.5 rounded-md text-sm border transition-colors',
              isActive
                ? 'border-gray-400 bg-gray-100 text-gray-900'
                : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
            ].join(' ')
          }
        >
          {t.label}
        </NavLink>
      ))}
    </nav>
  );
}