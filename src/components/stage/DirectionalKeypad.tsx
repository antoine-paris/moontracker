import React from "react";
import { clamp } from "../../utils/math";

type Props = {
  baseRefAlt: number;
  stepAzDeg: number;
  stepAltDeg: number;
  setDeltaAzDeg: React.Dispatch<React.SetStateAction<number>>;
  setDeltaAltDeg: React.Dispatch<React.SetStateAction<number>>;
  zIndex?: number;
  onLongPoseClear?: () => void;
};

export default function DirectionalKeypad({
  baseRefAlt,
  stepAzDeg,
  stepAltDeg,
  setDeltaAzDeg,
  setDeltaAltDeg,
  zIndex,
  onLongPoseClear,
}: Props) {
  return (
    <div
      className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2"
      style={{ zIndex }}
    >
      <button
        className="w-10 h-10 rounded-md border border-white/30 bg-black/50 hover:bg-black/70"
        title={`Monter de ${stepAltDeg.toFixed(1)}°`}
        aria-label="Monter"
        onClick={() => {
          setDeltaAltDeg(prev => {
            const tgt = clamp(baseRefAlt + prev + stepAltDeg, -89.9, 89.9);
            return tgt - baseRefAlt;
          });
          onLongPoseClear?.();
        }}
      >
        ↑
      </button>
      <div className="flex items-center gap-2">
        <button
          className="w-10 h-10 rounded-md border border-white/30 bg-black/50 hover:bg-black/70"
          title={`Gauche de ${stepAzDeg.toFixed(1)}°`}
          aria-label="Gauche"
          onClick={() => {
            setDeltaAzDeg(prev => {
              const nd = prev - stepAzDeg;
              return ((nd + 180) % 360 + 360) % 360 - 180; // wrap [-180,180]
            });
            onLongPoseClear?.();
          }}
        >
          ←
        </button>
        <button
          className="w-10 h-10 rounded-md border border-white/30 bg-black/50 hover:bg-black/70"
          title="Recentrer"
          aria-label="Recentrer"
          onClick={() => {
            setDeltaAzDeg(0);
            setDeltaAltDeg(0);
            onLongPoseClear?.();
          }}
        >
          •
        </button>
        <button
          className="w-10 h-10 rounded-md border border-white/30 bg-black/50 hover:bg-black/70"
          title={`Droite de ${stepAzDeg.toFixed(1)}°`}
          aria-label="Droite"
          onClick={() => {
            setDeltaAzDeg(prev => {
              const nd = prev + stepAzDeg;
              return ((nd + 180) % 360 + 360) % 360 - 180; // wrap [-180,180]
            });
            onLongPoseClear?.();
          }}
        >
          →
        </button>
      </div>
      <button
        className="w-10 h-10 rounded-md border border-white/30 bg-black/50 hover:bg-black/70"
        title={`Descendre de ${stepAltDeg.toFixed(1)}°`}
        aria-label="Descendre"
        onClick={() => {
          setDeltaAltDeg(prev => {
            const tgt = clamp(baseRefAlt + prev - stepAltDeg, -89.9, 89.9);
            return tgt - baseRefAlt;
          });
          onLongPoseClear?.();
        }}
      >
        ↓
      </button>
    </div>
  );
}