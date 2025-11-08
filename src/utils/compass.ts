import { compass16 as compass16FromDirections } from './directions';
import type { TFunction } from 'i18next';

export function compass16(azDeg: number, t: TFunction): string {
  return compass16FromDirections(azDeg, t);
}