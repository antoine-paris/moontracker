import React from "react";
import { useTranslation } from "react-i18next";
import { clamp } from "../../utils/math";
import type { FollowMode } from "../../types";

type Props = {
  baseRefAlt: number;
  stepAzDeg: number;
  stepAltDeg: number;
  setDeltaAzDeg: React.Dispatch<React.SetStateAction<number>>;
  setDeltaAltDeg: React.Dispatch<React.SetStateAction<number>>;
  zIndex?: number;
  onLongPoseClear?: () => void;
  isMobile?: boolean;
  isLandscape?: boolean;
  follow: FollowMode;
};

export default function DirectionalKeypad({
  baseRefAlt,
  stepAzDeg,
  stepAltDeg,
  setDeltaAzDeg,
  setDeltaAltDeg,
  zIndex,
  onLongPoseClear,
  isMobile = false,
  isLandscape = false,
  follow,
}: Props) {
  const { t: tUi } = useTranslation('ui');

  // Fonction pour obtenir l'icône correspondant au mode de suivi
  const getFollowIcon = (mode: FollowMode) => {
    const stroke = 'currentColor';
    const strokeWidth = 1.7;
    const s = { fill: 'none', stroke, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

    switch (mode) {
      case 'SOLEIL':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" className="shrink-0 pointer-events-none select-none">
            <circle cx="12" cy="12" r="4" {...s} fill="#FFD54A" />
            <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" {...s} />
          </svg>
        );
      case 'LUNE':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" className="shrink-0 pointer-events-none select-none">
            <circle cx="12" cy="12" r="10" {...s} stroke={stroke} />
            <path d="M4 12A8 8 0 0 1 20 12L4 12Z" fill="#000" />
            <path d="M20 12A8 8 0 0 1 4 12L20 12Z" fill="#000" />
            <path d="M12 3 A 9 9 0 0 1 12 21 A 3.5 9 0 0 0 12 3 Z" {...s} stroke={stroke} fill={stroke} />
          </svg>
        );
      case 'MERCURE': return <span>&#9791;</span>;
      case 'VENUS': return <span>&#9792;</span>;
      case 'MARS': return <span>&#9794;</span>;
      case 'JUPITER': return <span>&#9795;</span>;
      case 'SATURNE': return <span>&#9796;</span>;
      case 'URANUS': return <span>&#9797;</span>;
      case 'NEPTUNE': return <span>&#9798;</span>;
      case 'O': return <span style={{ display: 'inline-block', transform: 'rotate(180deg)' }}>&#x27A4;</span>;
      case 'N': return <span style={{ display: 'inline-block', transform: 'rotate(270deg)' }}>&#x27A4;</span>;
      case 'S': return <span style={{ display: 'inline-block', transform: 'rotate(90deg)' }}>&#x27A4;</span>;
      case 'E': return <span>&#x27A4;</span>;
      default: return '•';
    }
  };

  if (isMobile && !isLandscape) {
    // Layout PORTRAIT mobile : boutons verticaux à gauche de l'écran, à 30px du bas
    return (
      <div 
        className="fixed left-4 flex flex-col items-center gap-3"
        style={{ zIndex, bottom: '30px' }}
      >
        {/* Bouton Haut */}
        <button
          className="w-12 h-12 rounded-md cursor-pointer border border-white/30 bg-black/50 hover:bg-black/70 active:bg-black/80 text-white text-lg font-bold transition-all duration-150 active:scale-95"
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

        {/* Bouton Gauche */}
        <button
          className="w-12 h-12 rounded-md cursor-pointer border border-white/30 bg-black/50 hover:bg-black/70 active:bg-black/80 text-white text-lg font-bold transition-all duration-150 active:scale-95"
          title={tUi('directionalKeypad.moveLeft', { degrees: stepAzDeg.toFixed(1) })}
          aria-label={tUi('directionalKeypad.left')}
          onClick={() => {
            setDeltaAzDeg(prev => {
              const nd = prev - stepAzDeg;
              return ((nd + 180) % 360 + 360) % 360 - 180;
            });
            onLongPoseClear?.();
          }}
        >
          ←
        </button>

        {/* Bouton Centre (Recenter) */}
        <button
          className="w-12 h-12 rounded-md cursor-pointer border border-white/30 bg-black/50 hover:bg-black/70 active:bg-black/80 text-white text-xl font-bold transition-all duration-150 active:scale-95 flex items-center justify-center"
          title={tUi('directionalKeypad.recenter')}
          aria-label={tUi('directionalKeypad.recenter')}
          onClick={() => {
            setDeltaAzDeg(0);
            setDeltaAltDeg(0);
            onLongPoseClear?.();
          }}
        >
          {getFollowIcon(follow)}
        </button>

        {/* Bouton Droite */}
        <button
          className="w-12 h-12 rounded-md cursor-pointer border border-white/30 bg-black/50 hover:bg-black/70 active:bg-black/80 text-white text-lg font-bold transition-all duration-150 active:scale-95"
          title={tUi('directionalKeypad.moveRight', { degrees: stepAzDeg.toFixed(1) })}
          aria-label={tUi('directionalKeypad.right')}
          onClick={() => {
            setDeltaAzDeg(prev => {
              const nd = prev + stepAzDeg;
              return ((nd + 180) % 360 + 360) % 360 - 180;
            });
            onLongPoseClear?.();
          }}
        >
          →
        </button>

        {/* Bouton Bas */}
        <button
          className="w-12 h-12 rounded-md cursor-pointer border border-white/30 bg-black/50 hover:bg-black/70 active:bg-black/80 text-white text-lg font-bold transition-all duration-150 active:scale-95"
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

  if (isMobile && isLandscape) {
    // Layout PAYSAGE mobile : croix comme desktop mais à gauche de l'écran, à 30px du bas
    return (
      <div
        className="fixed left-4 flex flex-col items-center gap-2"
        style={{ zIndex, bottom: '30px' }}
      >
        {/* Bouton Haut */}
        <button
          className="w-12 h-12 rounded-md cursor-pointer border border-white/30 bg-black/50 hover:bg-black/70 active:bg-black/80 text-white text-lg font-bold transition-all duration-150 active:scale-95"
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

        {/* Ligne du milieu : Gauche + Centre + Droite */}
        <div className="flex items-center gap-2">
          <button
            className="w-12 h-12 rounded-md cursor-pointer border border-white/30 bg-black/50 hover:bg-black/70 active:bg-black/80 text-white text-lg font-bold transition-all duration-150 active:scale-95"
            title={tUi('directionalKeypad.moveLeft', { degrees: stepAzDeg.toFixed(1) })}
            aria-label={tUi('directionalKeypad.left')}
            onClick={() => {
              setDeltaAzDeg(prev => {
                const nd = prev - stepAzDeg;
                return ((nd + 180) % 360 + 360) % 360 - 180;
              });
              onLongPoseClear?.();
            }}
          >
            ←
          </button>
          <button
            className="w-12 h-12 rounded-md cursor-pointer border border-white/30 bg-black/50 hover:bg-black/70 active:bg-black/80 text-white text-xl font-bold transition-all duration-150 active:scale-95 flex items-center justify-center"
            title={tUi('directionalKeypad.recenter')}
            aria-label={tUi('directionalKeypad.recenter')}
            onClick={() => {
              setDeltaAzDeg(0);
              setDeltaAltDeg(0);
              onLongPoseClear?.();
            }}
          >
            {getFollowIcon(follow)}
          </button>
          <button
            className="w-12 h-12 rounded-md cursor-pointer border border-white/30 bg-black/50 hover:bg-black/70 active:bg-black/80 text-white text-lg font-bold transition-all duration-150 active:scale-95"
            title={tUi('directionalKeypad.moveRight', { degrees: stepAzDeg.toFixed(1) })}
            aria-label={tUi('directionalKeypad.right')}
            onClick={() => {
              setDeltaAzDeg(prev => {
                const nd = prev + stepAzDeg;
                return ((nd + 180) % 360 + 360) % 360 - 180;
              });
              onLongPoseClear?.();
            }}
          >
            →
          </button>
        </div>

        {/* Bouton Bas */}
        <button
          className="w-12 h-12 rounded-md cursor-pointer border border-white/30 bg-black/50 hover:bg-black/70 active:bg-black/80 text-white text-lg font-bold transition-all duration-150 active:scale-95"
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

  // Layout desktop classique
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
          className="w-10 h-10 rounded-md cursor-pointer border border-white/30 bg-black/50 hover:bg-black/70 flex items-center justify-center"
          title={tUi('directionalKeypad.recenter')}
          aria-label={tUi('directionalKeypad.recenter')}
          onClick={() => {
            setDeltaAzDeg(0);
            setDeltaAltDeg(0);
            onLongPoseClear?.();
          }}
        >
          {getFollowIcon(follow)}
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