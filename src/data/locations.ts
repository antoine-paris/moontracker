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
  { id: "dz", label: "Algérie — Alger", lat: 36.7538, lng: 3.0588, timeZone: "Africa/Algiers" },
  { id: "ml", label: "Mali — Bamako", lat: 12.6392, lng: -8.0029, timeZone: "Africa/Bamako" },
  { id: "gh", label: "Ghana — Accra", lat: 5.6037, lng: -0.1870, timeZone: "Africa/Accra" },
  { id: "ga", label: "Gabon — Libreville", lat: 0.4162, lng: 9.4673, timeZone: "Africa/Libreville" },
  { id: "za", label: "Afrique du Sud — Pretoria", lat: -25.7479, lng: 28.2293, timeZone: "Africa/Johannesburg" },
  { id: "burgos", label: "Espagne — Burgos", lat: 42.3439, lng: -3.6969, timeZone: "Europe/Madrid" },
  { id: "wellington", label: "Nouvelle-Zélande — Wellington", lat: -41.2866, lng: 174.7756, timeZone: "Pacific/Auckland" },
];
