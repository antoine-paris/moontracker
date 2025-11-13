import { useMemo } from "react";
import { useTranslation } from 'react-i18next';
import { Z } from "../../render/constants";
import { sampleTerminatorLUT } from "../../astro/lut";
import moonImg from "../../assets/moon.2709.jpg";

type Props = {
  x: number; y: number;
  visibleX: boolean; visibleY: boolean;
  rotationDeg: number;
  showPhase: boolean;
  earthshine: boolean;
  debugMask: boolean;
  showCard: boolean;
  phaseFraction: number;
  brightLimbAngleDeg: number;
  maskAngleDeg: number;
  wPx: number;
  hPx: number;
};

export default function MoonSprite(props: Props) {
  const { t } = useTranslation('common');
  const { x, y, visibleX, visibleY, rotationDeg, showPhase, earthshine, debugMask, showCard, phaseFraction, brightLimbAngleDeg, maskAngleDeg, wPx, hPx } = props;

  const R_SVG = 312;
  const k = 2 * phaseFraction - 1;
  const nearHalf = phaseFraction >= 0.495 && phaseFraction <= 0.505;
  const { rR, dR } = sampleTerminatorLUT(phaseFraction);
  const rSVG = rR * R_SVG;
  const cCx = 312 - dR * R_SVG;
  const cGx = 312 + dR * R_SVG;
  const chordX = 312 - k * R_SVG;
  const chordXClamped = Math.max(0, Math.min(624, chordX));
  const leftWidth = chordXClamped;
  const rightX = chordXClamped;
  const rightWidth = 624 - chordXClamped;

  const ids = useMemo(() => {
    const base = "moon" + Math.random().toString(36).slice(2);
    return { clip: base+"-clip", litCres: base+"-mask-lit-cres", litGibb: base+"-mask-lit-gibb", litChord: base+"-mask-lit-chord", darkCres: base+"-mask-dark-cres", darkGibb: base+"-mask-dark-gibb", darkChord: base+"-mask-dark-chord", earth: base+"-earth" } as const;
  }, []);

  const darkMaskId = nearHalf ? ids.darkChord : (phaseFraction > 0.5 ? ids.darkGibb : ids.darkCres);
  const litMaskId = nearHalf ? ids.litChord : (phaseFraction > 0.5 ? ids.litGibb : ids.litCres);
  const earthFillUrl = useMemo(() => `url(#${ids.earth})`, [ids]);
  const clipUrl = useMemo(() => `url(#${ids.clip})`, [ids]);
  const darkMaskUrl = useMemo(() => `url(#${darkMaskId})`, [darkMaskId]);
  const litMaskUrl = useMemo(() => `url(#${litMaskId})`, [litMaskId]);

  // Ne pas rendre si hors champ pour éviter un affichage en (0,0)
  if (!visibleX || !visibleY) return null;

  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, -50%) rotate(${rotationDeg}deg)`, zIndex: Z.moon, width: wPx, height: hPx, opacity: (visibleX && visibleY) ? 1 : 0 }}>
      <svg width={wPx} height={hPx} viewBox="0 0 624 624" style={{ position: "absolute", inset: 0, margin: "auto", display: "block" }}>
        <defs>
          <clipPath id={ids.clip}>
            <circle cx="312" cy="312" r="312" />
          </clipPath>

          {/* Lit masks */}
          <mask id={ids.litCres} maskUnits="userSpaceOnUse">
            <g transform={`rotate(${maskAngleDeg},312,312)`}>
              <circle cx="312" cy="312" r="312" fill="white" />
              <circle cx={cCx} cy="312" r={rSVG} fill="black" />
            </g>
          </mask>

          <mask id={ids.litGibb} maskUnits="userSpaceOnUse">
            <g transform={`rotate(${maskAngleDeg},312,312)`}>
              <rect x="0" y="0" width="624" height="624" fill="black" />
              <circle cx={cGx} cy="312" r={rSVG} fill="white" />
            </g>
          </mask>

          <mask id={ids.litChord} maskUnits="userSpaceOnUse">
            <g transform={`rotate(${maskAngleDeg},312,312)`}>
              <rect x={rightX} y="0" width={rightWidth} height="624" fill="white" />
            </g>
          </mask>

          {/* Dark masks for earthshine */}
          <mask id={ids.darkCres} maskUnits="userSpaceOnUse">
            <g transform={`rotate(${maskAngleDeg},312,312)`}>
              <rect x="0" y="0" width="624" height="624" fill="black" />
              <circle cx={cCx} cy="312" r={rSVG} fill="white" />
            </g>
          </mask>

          <mask id={ids.darkGibb} maskUnits="userSpaceOnUse">
            <g transform={`rotate(${maskAngleDeg},312,312)`}>
              <circle cx="312" cy="312" r="312" fill="white" />
              <circle cx={cGx} cy="312" r={rSVG} fill="black" />
            </g>
          </mask>

          <mask id={ids.darkChord} maskUnits="userSpaceOnUse">
            <g transform={`rotate(${maskAngleDeg},312,312)`}>
              <rect x="0" y="0" width={leftWidth} height="624" fill="white" />
            </g>
          </mask>

          {/* Earthshine gradient */}
          <radialGradient id={ids.earth} cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="white" stopOpacity="0.12" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
        </defs>

        {showPhase && (<circle cx="312" cy="312" r="312" fill="#0b0b0b" clipPath={clipUrl} />)}
        {showPhase && earthshine && (<circle cx="312" cy="312" r="312" fill={earthFillUrl} clipPath={clipUrl} mask={darkMaskUrl} />)}
        <image href={moonImg} x={-53} y={-53} width={730} height={730} clipPath={clipUrl} mask={showPhase ? litMaskUrl : undefined} preserveAspectRatio="xMidYMid slice" style={{ filter: "brightness(0.9)" }} />
      </svg>

      {debugMask && (
        <svg width={wPx} height={hPx} viewBox="0 0 624 624" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <circle cx="312" cy="312" r="312" fill="none" stroke="#ffffff66" strokeWidth="1" strokeDasharray="3,4" />
          <g opacity={0.9}>
            <circle cx="312" cy="312" r="5" fill="none" stroke="#ffffff" strokeWidth="1" />
            <line x1="300" y1="312" x2="324" y2="312" stroke="#ffffff" strokeWidth="1" />
            <line x1="312" y1="300" x2="312" y2="324" stroke="#ffffff" strokeWidth="1" />
          </g>
          <g transform={`rotate(${brightLimbAngleDeg},312,312)`}>
            <line x1="312" y1="312" x2="312" y2="140" stroke="#22d3ee" strokeWidth="2" strokeDasharray="6,4" />
            <polygon points="312,130 308,140 316,140" fill="#22d3ee" />
          </g>
          <g transform={`rotate(${maskAngleDeg},312,312)`}>
            {nearHalf ? (
              <g>
                <line x1={Math.max(0, Math.min(624, chordX))} y1="60" x2={Math.max(0, Math.min(624, chordX))} y2="564" stroke="#93c5fd" strokeWidth="2" strokeDasharray="4,3" />
              </g>
            ) : (
              <g>
                <circle cx={phaseFraction > 0.5 ? cGx : cCx} cy="312" r={rSVG} fill="none" stroke="#93c5fd" strokeWidth="2" strokeDasharray="6,4" />
                <circle cx={phaseFraction > 0.5 ? cGx : cCx} cy="312" r="4" fill="#93c5fd" />
                <line x1="312" y1="312" x2={phaseFraction > 0.5 ? cGx : cCx} y2="312" stroke="#93c5fd" strokeWidth="1.5" strokeDasharray="3,3" />
              </g>
            )}
          </g>
        </svg>
      )}

      {showCard && (
        <svg width={wPx} height={hPx} viewBox="0 0 624 624" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <g>
            <line x1="312" y1="36" x2="312" y2="86" stroke="#93c5fd" strokeOpacity="0.9" strokeWidth="2" />
            <text x="312" y="60" textAnchor="middle" fontSize="64" fontWeight="800" fill="#93c5fd" stroke="black" strokeWidth="6">{t('directions.northAbbrev')}</text>
            <line x1="538" y1="312" x2="588" y2="312" stroke="#93c5fd" strokeOpacity="0.9" strokeWidth="2" />
            <text x="564" y="318" textAnchor="start" fontSize="64" fontWeight="800" fill="#93c5fd" stroke="black" strokeWidth="6">{t('directions.eastAbbrev')}</text>
            <line x1="312" y1="538" x2="312" y2="588" stroke="#93c5fd" strokeOpacity="0.9" strokeWidth="2" />
            <text x="312" y="572" textAnchor="middle" fontSize="64" fontWeight="800" fill="#93c5fd" stroke="black" strokeWidth="6">{t('directions.southAbbrev')}</text>
            <line x1="36" y1="312" x2="86" y2="312" stroke="#93c5fd" strokeOpacity="0.9" strokeWidth="2" />
            <text x="60" y="318" textAnchor="end" fontSize="64" fontWeight="800" fill="#93c5fd" stroke="black" strokeWidth="6">{t('directions.westAbbrev')}</text>
          </g>
        </svg>
      )}
    </div>
  );
}
