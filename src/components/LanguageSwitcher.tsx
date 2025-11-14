import { useTranslation } from 'react-i18next';

interface LanguageSwitcherProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  variant?: 'dark' | 'light';
}

export default function LanguageSwitcher({ 
  className = '', 
  size = 'sm',
  showLabels = false,
  variant = 'dark'
}: LanguageSwitcherProps) {
  const { i18n } = useTranslation();

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    
    // Update URL path if we're using path-based detection
    const currentPath = window.location.pathname;
    const currentSearch = window.location.search;
    
    // Remove existing language prefix if present
    const pathWithoutLang = currentPath.replace(/^\/(fr|en)\//, '/').replace(/^\/(fr|en)$/, '/');
    
    // Add new language prefix (unless it's the default)
    const newPath = lang === 'fr' 
      ? pathWithoutLang 
      : `/en${pathWithoutLang === '/' ? '' : pathWithoutLang}`;
    
    // Update URL without reloading the page
    window.history.replaceState(null, '', newPath + currentSearch);
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5', 
    lg: 'text-base px-4 py-2'
  };

  const baseButtonClass = `
    rounded transition-all duration-200 font-medium border
    ${sizeClasses[size]}
  `;

  const activeClass = variant === 'dark' 
    ? `bg-indigo-600 text-white border-indigo-600 shadow-sm`
    : `bg-indigo-600 text-white border-indigo-600 shadow-sm`;

  const inactiveClass = variant === 'dark'
    ? `bg-white/10 text-white/80 border-white/20 hover:bg-white/20 hover:border-white/30`
    : `bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 hover:border-gray-300`;

  return (
    <div className={`flex gap-1 ${className}`}>
      <button 
        onTouchEnd={(e) => {
          e.preventDefault();
          handleLanguageChange('fr');
        }}
        onClick={() => handleLanguageChange('fr')}
        className={`${baseButtonClass} ${i18n.language === 'fr' ? activeClass : inactiveClass}`}
        title="Français"
      >
        🇫🇷 {showLabels && 'FR'}
      </button>
      <button 
        onTouchEnd={(e) => {
          e.preventDefault();
          handleLanguageChange('en');
        }}
        onClick={() => handleLanguageChange('en')}
        className={`${baseButtonClass} ${i18n.language === 'en' ? activeClass : inactiveClass}`}
        title="English"
      >
        🇬🇧 {showLabels && 'EN'}
      </button>
    </div>
  );
}