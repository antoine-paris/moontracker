export type FollowMode = 'SOLEIL' | 'LUNE' | 'N' | 'E' | 'S' | 'O' | 'MERCURE' | 'VENUS' | 'MARS' | 'JUPITER' | 'SATURNE' | 'URANUS' | 'NEPTUNE';

export type LocationOption = {
  id: string;
  label: string; // Pays — Capitale
  lat: number;
  lng: number;
  timeZone: string;
};
