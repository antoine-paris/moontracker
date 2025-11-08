import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation resources
import commonFr from './resources/fr/common.json';
import commonEn from './resources/en/common.json';
import astroFr from './resources/fr/astro.json';
import astroEn from './resources/en/astro.json';
import uiFr from './resources/fr/ui.json';
import uiEn from './resources/en/ui.json';
import infoFr from './resources/fr/info.json';
import infoEn from './resources/en/info.json';
import flatEarthSimulatorFr from './resources/fr/flatEarthSimulator.json';
import flatEarthSimulatorEn from './resources/en/flatEarthSimulator.json';

const resources = {
  fr: {
    common: commonFr,
    astro: astroFr,
    ui: uiFr,
    info: infoFr,
    flatEarthSimulator: flatEarthSimulatorFr,
  },
  en: {
    common: commonEn,
    astro: astroEn,
    ui: uiEn,
    info: infoEn,
    flatEarthSimulator: flatEarthSimulatorEn,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    
    // Language detection configuration
    detection: {
      // Priority order for language detection
      order: ['path', 'localStorage', 'navigator', 'htmlTag'],
      
      // Look for language in URL path (e.g., /fr/ or /en/)
      lookupFromPathIndex: 0,
      
      // Cache language in localStorage
      caches: ['localStorage'],
      
      // Don't use subdomain/query string detection
      lookupQuerystring: undefined,
      lookupFromSubdomainIndex: undefined,
    },
    
    // Fallback language
    fallbackLng: 'fr', // French is current default
    
    // Default namespace
    defaultNS: 'common',
    
    // Namespace separation
    ns: ['common', 'astro', 'ui', 'info', 'flatEarthSimulator'],
    
    // Development settings
    debug: process.env.NODE_ENV === 'development',
    
    // Interpolation settings
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    
    // React-specific settings
    react: {
      // Suspend component while loading translations
      useSuspense: false,
    },
  });

export default i18n;