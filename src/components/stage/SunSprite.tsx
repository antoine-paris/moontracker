
import { useTranslation } from 'react-i18next';
import { Z } from "../../render/constants";

type Props = {
  x: number;
  y: number;
  visibleX: boolean;
  visibleY: boolean;
  rotationDeg: number;
  showCard: boolean;
  wPx: number;
  hPx: number;
};

export default function SunSprite({ x, y, visibleX, visibleY, rotationDeg, showCard, wPx, hPx }: Props) {
  const { t } = useTranslation('common');
  
  // Ne pas rendre si hors champ pour éviter un affichage en (0,0)
  if (!visibleX || !visibleY) return null;

  // Force un carré pour conserver un cercle à l'écran
  const sizePx = Math.round(Math.min(wPx, hPx));

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, -50%) rotate(${rotationDeg}deg)`,
        zIndex: Z.sun,
        width: sizePx,
        height: sizePx,
      }}
    >
      <div
        className="rounded-full"
        style={{
          width: "100%",
          height: "100%",
          background:
            "radial-gradient(circle at 30% 30%, rgba(255,255,200,1) 0%, rgba(255,200,80,1) 35%, rgba(255,160,30,1) 55%, rgba(255,120,10,1) 75%, rgba(255,100,0,1) 100%)",
          boxShadow:
            "0 0 40px 10px rgba(255,180,40,0.35), 0 0 80px 20px rgba(255,180,40,0.15)",
          borderRadius: "50%",
        }}
      />
      {showCard && (
        <svg
          width={sizePx}
          height={sizePx}
          viewBox="0 0 624 624"
          style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        >
          <g>
            <line x1="312" y1="36" x2="312" y2="86" stroke="white" strokeOpacity="0.9" strokeWidth="2" />
            <text x="312" y="60" textAnchor="middle" fontSize="64" fill="white" stroke="black" strokeWidth="4">
              {t('directions.northAbbrev')}
            </text>
            <line x1="538" y1="312" x2="588" y2="312" stroke="white" strokeOpacity="0.9" strokeWidth="2" />
            <text x="564" y="318" textAnchor="start" fontSize="64" fill="white" stroke="black" strokeWidth="4">
              {t('directions.eastAbbrev')}
            </text>
            <line x1="312" y1="538" x2="312" y2="588" stroke="white" strokeOpacity="0.9" strokeWidth="2" />
            <text x="312" y="572" textAnchor="middle" fontSize="64" fill="white" stroke="black" strokeWidth="4">
              {t('directions.southAbbrev')}
            </text>
            <line x1="36" y1="312" x2="86" y2="312" stroke="white" strokeOpacity="0.9" strokeWidth="2" />
            <text x="60" y="318" textAnchor="end" fontSize="64" fill="white" stroke="black" strokeWidth="4">
              {t('directions.westAbbrev')}
            </text>
          </g>
        </svg>
      )}
    </div>
  );
}
