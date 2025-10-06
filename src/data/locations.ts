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
      .then(text => {
        const parsed = parseCsv(text);
        // Build index immediately
        buildSearchIndex(parsed);
        return parsed;
      })
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

// NEW: Normalisation (minuscules + sans accents)
function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .trim();
}

// NEW: Tokenisation (sépare sur tout ce qui n’est pas lettre ou chiffre)
function tokenize(str: string): string[] {
  return normalize(str)
    .split(/[^a-z0-9]+/i)
    .filter(Boolean);
}

// --- Search Index -----------------------------------------------------------
type LocationSearchIndex = {
  version: number;
  // token -> set (as array) of location indices
  tokenMap: Map<string, number[]>;
  // For prefix enumeration (sorted unique tokens)
  tokensSorted: string[];
  // Cached normalized concatenated strings (label + aliases) per location (for substring fallback)
  concatNorm: string[];
  // Direct reference to the locations array used to build
  locationsRef: LocationOption[];
};

let searchIndex: LocationSearchIndex | null = null;
let searchIndexVersion = 0;

// Build / rebuild index
function buildSearchIndex(locations: LocationOption[]): LocationSearchIndex {
  const tokenMap = new Map<string, Set<number>>();
  const concatNorm: string[] = new Array(locations.length);

  locations.forEach((loc, i) => {
    const labelTokens = tokenize(loc.label);
    const aliasTokens = (loc.searchTerms ?? []).flatMap(tokenize);
    const allTokens = Array.from(new Set([...labelTokens, ...aliasTokens]));

    // Save per-location concatenated normalized string for broad substring fallback
    concatNorm[i] = normalize([loc.label, ...(loc.searchTerms ?? [])].join(' '));

    for (const t of allTokens) {
      if (!tokenMap.has(t)) tokenMap.set(t, new Set<number>());
      tokenMap.get(t)!.add(i);
    }
  });

  // Convert Set -> sorted array for each token
  const tokenMapArray = new Map<string, number[]>();
  for (const [t, set] of tokenMap.entries()) {
    tokenMapArray.set(t, Array.from(set).sort((a, b) => a - b));
  }

  const tokensSorted = Array.from(tokenMapArray.keys()).sort();

  searchIndexVersion++;
  searchIndex = {
    version: searchIndexVersion,
    tokenMap: tokenMapArray,
    tokensSorted,
    concatNorm,
    locationsRef: locations,
  };
  return searchIndex;
}

// Ensure index exists & matches the given locations reference
function ensureSearchIndex(locations: LocationOption[]) {
  if (!searchIndex || searchIndex.locationsRef !== locations) {
    buildSearchIndex(locations);
  }
}

// Internal: prefix candidates (binary search window)
function collectPrefixTokens(tokensSorted: string[], prefix: string, maxTokens = 200): string[] {
  // Simple binary search lower bound
  let lo = 0, hi = tokensSorted.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (tokensSorted[mid] < prefix) lo = mid + 1;
    else hi = mid;
  }
  const out: string[] = [];
  for (let i = lo; i < tokensSorted.length; i++) {
    const tk = tokensSorted[i];
    if (!tk.startsWith(prefix)) break;
    out.push(tk);
    if (out.length >= maxTokens) break;
  }
  return out;
}

// NEW: Recherche avancée
export function searchLocations(
  query: string,
  locations?: LocationOption[],
  opts?: { limit?: number }
): LocationOption[] {
  const limit = opts?.limit ?? 500;
  const q = query.trim();
  if (!q) return [];

  const source = locations ?? searchIndex?.locationsRef ?? [];
  ensureSearchIndex(source);
  if (!searchIndex) return [];

  const qNorm = normalize(q);
  // Early fallback for 1-char searches: simple substring on label for UX
  if (qNorm.length < 2) {
    return source
      .filter(l =>
        normalize(l.label).includes(qNorm) ||
        (l.searchTerms ?? []).some(a => normalize(a).includes(qNorm))
      )
      .slice(0, limit);
  }

  const qTokens = tokenize(qNorm);
  if (!qTokens.length) return [];

  // Scoring map: index -> score
  const scores = new Map<number, number>();

  for (const qt of qTokens) {
    const exactSet = searchIndex.tokenMap.get(qt);
    if (exactSet) {
      for (const idx of exactSet) {
        scores.set(idx, (scores.get(idx) ?? 0) + 10);
      }
    }

    // Prefix (excluding exact already counted)
    const prefTokens = collectPrefixTokens(searchIndex.tokensSorted, qt);
    for (const tk of prefTokens) {
      if (tk === qt) continue; // already exact
      const arr = searchIndex.tokenMap.get(tk);
      if (!arr) continue;
      for (const idx of arr) {
        scores.set(idx, (scores.get(idx) ?? 0) + 6);
      }
    }

    // Substring fallback in concatenated normalized content
    for (let i = 0; i < searchIndex.concatNorm.length; i++) {
      const already = scores.get(i) ?? 0;
      if (already >= 6) continue; // already matched by stronger rule
      if (searchIndex.concatNorm[i].includes(qt)) {
        scores.set(i, already + 3);
      }
    }
  }

  if (!scores.size) return [];

  // Build results + optional tie-breakers
  const results: { loc: LocationOption; score: number }[] = [];
  for (const [idx, score] of scores.entries()) {
    if (score <= 0) continue;
    results.push({
      loc: source[idx],
      score,
    });
  }

  results.sort((a, b) => {
    // Higher score first
    if (b.score !== a.score) return b.score - a.score;
    // Then higher population (if available)
    const pa = a.loc.population ?? 0;
    const pb = b.loc.population ?? 0;
    if (pb !== pa) return pb - pa;
    // Then alphabetical
    return a.loc.label.localeCompare(b.loc.label, 'fr');
  });

  return results.slice(0, limit).map(r => r.loc);
}

// OPTIONAL: Expose a way to rebuild manually (if needed ailleurs)
export function rebuildLocationsSearchIndex(locations: LocationOption[]) {
  buildSearchIndex(locations);
}
