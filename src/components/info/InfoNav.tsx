import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../LanguageSwitcher';
import { getPathWithLanguage } from '../../hooks/useLanguageFromPath';

const baseTabs = [
  { path: '/info', key: 'spaceview', end: true },
  { path: '/info/help', key: 'help' },
  { path: '/info/simulations', key: 'simulations' },
  { path: '/info/flat-earth', key: 'flatearth' },
  { path: '/info/bug', key: 'bug' },
  { path: '/info/contact', key: 'contact' },
];

export default function InfoNav() {
  const { t, i18n } = useTranslation('info');
  
  // Generate language-aware URLs
  const tabs = baseTabs.map(tab => ({
    ...tab,
    to: getPathWithLanguage(tab.path, i18n.language)
  }));

  return (
    <nav role="tablist" aria-label="Informations" className="flex justify-between items-center gap-2 p-2 border-b border-gray-200">
      <div className="flex gap-2 overflow-x-auto">
        {tabs.map(tab => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            role="tab"
            className={({ isActive }) =>
              [
                'px-3 py-1.5 rounded-md text-sm border transition-colors whitespace-nowrap',
                isActive
                  ? 'border-gray-400 bg-gray-100 text-gray-900'
                  : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              ].join(' ')
            }
          >
            {t(`tabs.${tab.key}`)}
          </NavLink>
        ))}
      </div>
      <div className="flex-shrink-0 ml-4">
        <LanguageSwitcher size="sm" showLabels={true} variant="light" />
      </div>
    </nav>
  );
}