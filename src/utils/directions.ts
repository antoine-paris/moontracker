import type { TFunction } from 'i18next';

// 8-point compass direction abbreviations (localized)
export type Dir8Abbrev = string; // Will be 'N', 'NE', 'E', etc. based on locale

// 8-point compass direction full names (localized)  
export type Dir8Full = string; // Will be 'North', 'Nord', etc. based on locale

/**
 * Convert bearing to 8-point compass abbreviation using translations
 * @param bearing Bearing in degrees (0°=North, 90°=East, 180°=South, 270°=West)
 * @param t Translation function from i18next
 * @returns Localized directional abbreviation (e.g., 'N', 'NE', 'E', etc.)
 */
export function dir8Abbrev(bearing: number, t: TFunction): Dir8Abbrev {
  const dirs = [
    t('common:directions.northAbbrev'), // N
    t('common:directions.northAbbrev') + t('common:directions.eastAbbrev'), // NE  
    t('common:directions.eastAbbrev'), // E
    t('common:directions.southAbbrev') + t('common:directions.eastAbbrev'), // SE
    t('common:directions.southAbbrev'), // S
    t('common:directions.southAbbrev') + t('common:directions.westAbbrev'), // SW/SO
    t('common:directions.westAbbrev'), // W/O
    t('common:directions.northAbbrev') + t('common:directions.westAbbrev'), // NW/NO
  ];
  const idx = Math.round(((bearing % 360) / 45)) % 8;
  return dirs[idx];
}

/**
 * Convert bearing to 8-point compass full name using translations
 * @param bearing Bearing in degrees (0°=North, 90°=East, 180°=South, 270°=West)
 * @param t Translation function from i18next
 * @returns Localized directional full name (e.g., 'North', 'Nord-Est', etc.)
 */
export function dir8Full(bearing: number, t: TFunction): Dir8Full {
  const dirs = [
    t('common:directions.north'), // North/Nord
    t('common:directions.north') + '-' + t('common:directions.east'), // North-East/Nord-Est
    t('common:directions.east'), // East/Est
    t('common:directions.south') + '-' + t('common:directions.east'), // South-East/Sud-Est
    t('common:directions.south'), // South/Sud
    t('common:directions.south') + '-' + t('common:directions.west'), // South-West/Sud-Ouest
    t('common:directions.west'), // West/Ouest
    t('common:directions.north') + '-' + t('common:directions.west'), // North-West/Nord-Ouest
  ];
  const idx = Math.round(((bearing % 360) / 45)) % 8;
  return dirs[idx];
}

/**
 * Create a mapping from French directional abbreviations to localized ones
 * @param t Translation function from i18next
 * @returns Mapping object for converting French directions to localized ones
 */
export function getFrenchToLocalizedDirMap(t: TFunction): Record<string, string> {
  return {
    'N': t('common:directions.northAbbrev'),
    'NE': t('common:directions.northAbbrev') + t('common:directions.eastAbbrev'),
    'E': t('common:directions.eastAbbrev'),
    'SE': t('common:directions.southAbbrev') + t('common:directions.eastAbbrev'),
    'S': t('common:directions.southAbbrev'),
    'SO': t('common:directions.southAbbrev') + t('common:directions.westAbbrev'),
    'O': t('common:directions.westAbbrev'),
    'NO': t('common:directions.northAbbrev') + t('common:directions.westAbbrev'),
  };
}

/**
 * Create a mapping from French directional full names to localized ones
 * @param t Translation function from i18next
 * @returns Mapping object for converting French full directions to localized ones
 */
export function getFrenchToLocalizedFullDirMap(t: TFunction): Record<string, string> {
  return {
    'Nord': t('common:directions.north'),
    'Nord-Est': t('common:directions.north') + '-' + t('common:directions.east'),
    'Est': t('common:directions.east'),
    'Sud-Est': t('common:directions.south') + '-' + t('common:directions.east'),
    'Sud': t('common:directions.south'),
    'Sud-Ouest': t('common:directions.south') + '-' + t('common:directions.west'),
    'Ouest': t('common:directions.west'),
    'Nord-Ouest': t('common:directions.north') + '-' + t('common:directions.west'),
  };
}

/**
 * Convert bearing to 16-point compass direction using translations
 * @param bearing Bearing in degrees (0°=North, 90°=East, 180°=South, 270°=West)
 * @param t Translation function from i18next
 * @returns Localized 16-point compass direction
 */
export function compass16(bearing: number, t: TFunction): string {
  const dirs = [
    t('common:directions.northAbbrev'), // N
    t('common:directions.northAbbrev') + t('common:directions.northAbbrev') + t('common:directions.eastAbbrev'), // NNE
    t('common:directions.northAbbrev') + t('common:directions.eastAbbrev'), // NE
    t('common:directions.eastAbbrev') + t('common:directions.northAbbrev') + t('common:directions.eastAbbrev'), // ENE
    t('common:directions.eastAbbrev'), // E
    t('common:directions.eastAbbrev') + t('common:directions.southAbbrev') + t('common:directions.eastAbbrev'), // ESE
    t('common:directions.southAbbrev') + t('common:directions.eastAbbrev'), // SE
    t('common:directions.southAbbrev') + t('common:directions.southAbbrev') + t('common:directions.eastAbbrev'), // SSE
    t('common:directions.southAbbrev'), // S
    t('common:directions.southAbbrev') + t('common:directions.southAbbrev') + t('common:directions.westAbbrev'), // SSW/SSO
    t('common:directions.southAbbrev') + t('common:directions.westAbbrev'), // SW/SO
    t('common:directions.westAbbrev') + t('common:directions.southAbbrev') + t('common:directions.westAbbrev'), // WSW/OSO
    t('common:directions.westAbbrev'), // W/O
    t('common:directions.westAbbrev') + t('common:directions.northAbbrev') + t('common:directions.westAbbrev'), // WNW/ONO
    t('common:directions.northAbbrev') + t('common:directions.westAbbrev'), // NW/NO
    t('common:directions.northAbbrev') + t('common:directions.northAbbrev') + t('common:directions.westAbbrev'), // NNW/NNO
  ];
  const norm360 = (deg: number) => ((deg % 360) + 360) % 360;
  const idx = Math.round(norm360(bearing) / 22.5) % 16;
  return dirs[idx];
}