import { norm360 } from './common';
import { ROSE_16 } from '../constants';

export function compass16(az: number): string {
  const idx = Math.round(norm360(az) / 22.5) % 16;
  return ROSE_16[idx] as string;
}