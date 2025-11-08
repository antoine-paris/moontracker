import React from "react";
import { useTranslation } from "react-i18next";
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
  const { t: tUi } = useTranslation('ui');
  return (
    <div
      className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2"
      style={{ zIndex, marginTop: '3.5em', marginRight: '3px' }}
    >
      <button
        className="w-10 h-10 rounded-md cursor-pointer border border-white/30 bg-black/50 hover:bg-black/70"
        title={tUi('directionalKeypad.moveUp', { degrees: stepAltDeg.toFixed(1) })}
        aria-label={tUi('directionalKeypad.up')}
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
          className="w-10 h-10 rounded-md cursor-pointer border border-white/30 bg-black/50 hover:bg-black/70"
          title={tUi('directionalKeypad.moveLeft', { degrees: stepAzDeg.toFixed(1) })}
          aria-label={tUi('directionalKeypad.left')}
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
          className="w-10 h-10 rounded-md cursor-pointer border border-white/30 bg-black/50 hover:bg-black/70"
          title={tUi('directionalKeypad.recenter')}
          aria-label={tUi('directionalKeypad.recenter')}
          onClick={() => {
            setDeltaAzDeg(0);
            setDeltaAltDeg(0);
            onLongPoseClear?.();
          }}
        >
          •
        </button>
        <button
          className="w-10 h-10 rounded-md cursor-pointer border border-white/30 bg-black/50 hover:bg-black/70"
          title={tUi('directionalKeypad.moveRight', { degrees: stepAzDeg.toFixed(1) })}
          aria-label={tUi('directionalKeypad.right')}
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
        className="w-10 h-10 rounded-md cursor-pointer border border-white/30 bg-black/50 hover:bg-black/70"
        title={tUi('directionalKeypad.moveDown', { degrees: stepAltDeg.toFixed(1) })}
        aria-label={tUi('directionalKeypad.down')}
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