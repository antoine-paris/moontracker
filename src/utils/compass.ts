import { ROSE_16 } from '../render/constants';
import { norm360 } from '../utils/math';

export function compass16(azDeg: number): string {
  const idx = Math.round(norm360(azDeg) / 22.5) % 16;
  return ROSE_16[idx] as string;
}