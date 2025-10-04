export type LocationOption = {
  id: string;
  label: string; // Pays — Capitale
  lat: number;
  lng: number;
  timeZone: string;
};

export const LOCATIONS: LocationOption[] = [
  { id: "no", label: "Norvège — Oslo", lat: 59.9139, lng: 10.7522, timeZone: "Europe/Oslo" },
  { id: "dk", label: "Danemark — Copenhague", lat: 55.6761, lng: 12.5683, timeZone: "Europe/Copenhagen" },
  { id: "fr", label: "France — Paris", lat: 48.8566, lng: 2.3522, timeZone: "Europe/Paris" },
  { id: "burgos", label: "Espagne — Burgos", lat: 42.3439, lng: -3.6969, timeZone: "Europe/Madrid" },
  { id: "dz", label: "Algérie — Alger", lat: 36.7538, lng: 3.0588, timeZone: "Africa/Algiers" },
  { id: "ml", label: "Mali — Bamako", lat: 12.6392, lng: -8.0029, timeZone: "Africa/Bamako" },
  { id: "gh", label: "Ghana — Accra", lat: 5.6037, lng: -0.1870, timeZone: "Africa/Accra" },
  { id: "ga", label: "Gabon — Libreville", lat: 0.4162, lng: 9.4673, timeZone: "Africa/Libreville" },
  { id: "za", label: "Afrique du Sud — Pretoria", lat: -25.7479, lng: 28.2293, timeZone: "Africa/Johannesburg" },
  { id: "wellington", label: "Nouvelle-Zélande — Wellington", lat: -41.2866, lng: 174.7756, timeZone: "Pacific/Auckland" },
];

// New: URL to the CSV asset bundled by Vite
const CITIES_CSV_URL = new URL('../assets/cities1k.csv', import.meta.url).href;

// New: parse helpers
function parseNumber(s: string): number {
  const n = parseFloat(s.trim().replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

function parseCsv(text: string): LocationOption[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  const hasHeader = lines[0]?.toLowerCase().startsWith('id;');
  const start = hasHeader ? 1 : 0;
  
  const out: LocationOption[] = [];
  for (let i = start; i < lines.length; i++) {
    const cols = lines[i].split(';');
    if (cols.length < 5) continue;
    const id = cols[0].trim();
    const label = cols[1]?.trim() ?? '';
    const lat = parseNumber(cols[2] ?? '0');
    const lng = parseNumber(cols[3] ?? '0');
    const timeZone = (cols[4] ?? '').trim();
    if (!id || !label || !timeZone) continue;
    out.push({ id, label, lat, lng, timeZone });
  }
  return out;
}

// New: cached async loader for the CSV-backed locations
let csvLocationsPromise: Promise<LocationOption[]> | null = null;

/**
 * Load all locations from the CSV file (cached).
 * Falls back to the curated LOCATIONS if the CSV cannot be loaded.
 */
export function loadLocationsFromCsv(): Promise<LocationOption[]> {
   if (!csvLocationsPromise) {
    csvLocationsPromise = fetch(CITIES_CSV_URL)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then(text => parseCsv(text))
      .catch(() => LOCATIONS);
  }
  return csvLocationsPromise;
}

/**
 * Convenience: get curated + CSV merged (CSV wins on id conflicts).
 */
export async function getAllLocations(): Promise<LocationOption[]> {
  const csv = await loadLocationsFromCsv();
  const map = new Map<string, LocationOption>();
  for (const l of LOCATIONS) map.set(l.id, l);
  for (const l of csv) map.set(l.id, l);
  return Array.from(map.values());
}
