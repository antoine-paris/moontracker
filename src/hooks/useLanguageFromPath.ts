import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/**
 * Hook to handle language detection and switching based on URL path
 */
export function useLanguageFromPath() {
  const { pathname } = useLocation();
  const { i18n } = useTranslation();

  useEffect(() => {
    // Extract language from URL path
    const pathParts = pathname.split('/').filter(Boolean);
    const potentialLang = pathParts[0];
    
    // Check if the first path segment is a valid language code
    if (potentialLang === 'en' || potentialLang === 'fr') {
      // Only change language if it's different from current
      if (i18n.language !== potentialLang) {
        i18n.changeLanguage(potentialLang);
      }
    } else {
      // No language prefix, use French as default (or keep current if already set)
      if (!i18n.language || i18n.language === 'cimode') {
        i18n.changeLanguage('fr');
      }
    }
  }, [pathname, i18n]);

  // Update the HTML lang attribute whenever the language changes
  useEffect(() => {
    if (i18n.language && i18n.language !== 'cimode') {
      document.documentElement.lang = i18n.language;
    }
  }, [i18n.language]);

  // Return current language and path info
  return {
    currentLanguage: i18n.language,
    hasLanguagePrefix: pathname.startsWith('/en/') || pathname.startsWith('/fr/'),
    pathLanguage: pathname.startsWith('/en/') ? 'en' : pathname.startsWith('/fr/') ? 'fr' : null,
  };
}

/**
 * Get the current path without language prefix
 */
export function getPathWithoutLanguage(pathname: string): string {
  if (pathname.startsWith('/en/')) {
    return pathname.slice(3) || '/';
  }
  if (pathname.startsWith('/fr/')) {
    return pathname.slice(3) || '/';
  }
  return pathname;
}

/**
 * Get path with language prefix
 */
export function getPathWithLanguage(pathname: string, language: string): string {
  // Ensure we always work with absolute paths
  const absolutePath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const cleanPath = getPathWithoutLanguage(absolutePath);
  
  // More comprehensive safeguard: prevent any path segment duplication
  // This handles cases like /info/info/help -> /info/help
  let safePath = cleanPath;
  const segments = cleanPath.split('/').filter(Boolean);
  
  // Remove consecutive duplicate segments
  const deduplicatedSegments = [];
  for (let i = 0; i < segments.length; i++) {
    if (i === 0 || segments[i] !== segments[i - 1]) {
      deduplicatedSegments.push(segments[i]);
    }
  }
  
  safePath = deduplicatedSegments.length > 0 ? `/${deduplicatedSegments.join('/')}` : '/';
  
  if (language === 'fr') {
    // French is default, no prefix needed
    return safePath;
  }
  
  return `/${language}${safePath === '/' ? '' : safePath}`;
}