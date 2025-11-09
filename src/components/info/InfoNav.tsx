import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../LanguageSwitcher';

// Use relative paths within the /info route context
const baseTabs = [
  { path: '', key: 'spaceview', end: true },
  { path: 'help', key: 'help' },
  { path: 'simulations', key: 'simulations' },
  { path: 'flat-earth', key: 'flatearth' },
  { path: 'bug', key: 'bug' },
  { path: 'contact', key: 'contact' },
];

export default function InfoNav() {
  const { t, i18n } = useTranslation('info');
  
  // Determine the current base path for info routes based on the current i18n language
  // This ensures the navigation updates when language changes
  const currentLanguage = i18n.language;
  let infoBasePath = '/info';
  
  if (currentLanguage === 'en') {
    infoBasePath = '/en/info';
  } else if (currentLanguage === 'fr') {
    infoBasePath = '/info'; // French is default, no prefix
  } else {
    infoBasePath = '/info'; // Default fallback
  }
  
  // Generate URLs based on the current context
  const tabs = baseTabs.map(tab => {
    const targetPath = tab.path === '' ? infoBasePath : `${infoBasePath}/${tab.path}`;
    return {
      ...tab,
      to: targetPath
    };
  });

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