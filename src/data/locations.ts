export type LocationOption = {
  id: string;
  label: string; // Pays — Capitale ou "Ville - Pays"
  lat: number;
  lng: number;
  timeZone: string;
  /**
   * Mots/alias de recherche (dérivés de la colonne 'search' du CSV, séparés par des virgules)
   */
  searchTerms?: string[];
  /**
   * Population (entier si disponible). Parsing tolérant (espaces, séparateur , ou .)
   */
  population?: number;
};
// Filtre: population minimale requise pour inclure une ville (modifier au besoin)
export const MIN_POPULATION = 100000;

export const LOCATIONS: LocationOption[] = []; // Désormais vide : seules les valeurs du CSV sont utilisées

// New: URL to the CSV asset bundled by Vite
const CITIES_CSV_URL = new URL('../assets/cities1k.csv', import.meta.url).href;

// New: parse helpers
function parseNumber(s: string): number {
  const n = parseFloat(s.trim().replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

// NEW: parse population (tolère " 101 616,00 " → 101616)
function parsePopulation(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const cleaned = raw
    .trim()
    .replace(/\s/g, '')     // retire espaces milliers
    .replace(/\.(?=.*\.)/g, '') // retire points milliers si multiples
    .replace(',', '.');     // virgule décimale → point
  const n = parseFloat(cleaned);
  if (!Number.isFinite(n)) return undefined;
  return Math.round(n);
}

// NEW: split termes de recherche
function parseSearchTerms(raw: string | undefined): string[] | undefined {
  if (!raw) return undefined;
  const arr = raw
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  return arr.length ? Array.from(new Set(arr)) : undefined;
}

// UPDATED: parsing CSV avec en-têtes flexibles
function parseCsv(text: string): LocationOption[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length === 0) return [];
  const first = lines[0];
  const headerCols = first.split(';').map(c => c.trim().toLowerCase());
  const hasHeader = headerCols.includes('id');

  // Indices par nom (fallback ordre ancien si pas d'en-tête)
  let idx = {
    id: 0,
    label: 1,
    lat: 2,
    lng: 3,
    timezone: 4,
    search: 5,
    population: 6,
  };

  if (hasHeader) {
    const mapIndex = (name: string) => headerCols.findIndex(h => h === name);
    const altIndex = (alts: string[]) =>
      headerCols.findIndex(h => alts.includes(h));
    idx = {
      id: mapIndex('id'),
      label: altIndex(['label', 'name']),
      lat: altIndex(['lat', 'latitude']),
      lng: altIndex(['lng', 'lon', 'long', 'longitude']),
      timezone: altIndex(['timezone', 'tz']),
      search: altIndex(['search', 'aliases']),
      population: altIndex(['population', 'pop']),
    };
  }

  const start = hasHeader ? 1 : 0;
  const out: LocationOption[] = [];

  for (let i = start; i < lines.length; i++) {
    const cols = lines[i].split(';');
    const get = (j: number) => (j >= 0 && j < cols.length ? cols[j].trim() : '');

    const id = get(idx.id);
    const label = get(idx.label);
    const lat = parseNumber(get(idx.lat));
    const lng = parseNumber(get(idx.lng));
    const timeZone = get(idx.timezone);
    if (!id || !label || !timeZone) continue;

    const searchTerms = parseSearchTerms(get(idx.search));
    const population = parsePopulation(get(idx.population));

    // Ignorer si pas de population ou en dessous du seuil
    if (population === undefined) continue;
    if (population < MIN_POPULATION) continue;

    out.push({
      id,
      label,
      lat,
      lng,
      timeZone,
      ...(searchTerms ? { searchTerms } : {}),
      population,
    });
  }
  return out;
}

// New: cached async loader for the CSV-backed locations
let csvLocationsPromise: Promise<LocationOption[]> | null = null;

/**
 * Charge les localisations depuis le CSV uniquement.
 * En cas d’échec: retourne un tableau vide (plus de repli vers une liste codée).
 */
export function loadLocationsFromCsv(): Promise<LocationOption[]> {
  if (!csvLocationsPromise) {
    csvLocationsPromise = fetch(CITIES_CSV_URL)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then(text => parseCsv(text))
      .catch(() => []); // plus de fallback
  }
  return csvLocationsPromise;
}

/**
 * Retourne uniquement les entrées issues du CSV (pas de fusion).
 */
export async function getAllLocations(): Promise<LocationOption[]> {
  return loadLocationsFromCsv();
}
