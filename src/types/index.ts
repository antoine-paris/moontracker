export type FollowMode = 'SOLEIL' | 'LUNE' | 'N' | 'E' | 'S' | 'O';

export type LocationOption = {
  id: string;
  label: string; // Pays — Capitale
  lat: number;
  lng: number;
  timeZone: string;
};
