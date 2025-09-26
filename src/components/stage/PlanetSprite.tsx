import React from 'react';
import { Z } from '../../render/constants';

type Props = {
  x: number;
  y: number;
  visibleX: boolean;
  visibleY: boolean;
  rotationDeg: number; // keep same prop shape as Moon/Sun
  wPx: number;
  hPx: number;
  color: string;
  label?: string;
};

export default function PlanetSprite({ x, y, visibleX, visibleY, rotationDeg, wPx, hPx, color }: Props) {
  if (!visibleX || !visibleY) return null;
  const d = Math.max(2, Math.min(wPx, hPx));
  return (
    <div
      className="absolute"
      style={{
        zIndex: Z.horizon - 2,
        left: x - d / 2,
        top: y - d / 2,
        width: d,
        height: d,
        borderRadius: '9999px',
        background: color,
        transform: `rotate(${rotationDeg}deg)`,
        pointerEvents: 'none',
      }}
    />
  );
}