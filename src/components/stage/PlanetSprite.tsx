import React, { useMemo } from 'react';
import { Z } from '../../render/constants';
import { sampleTerminatorLUT } from '../../astro/lut';

type Props = {
  x: number;
  y: number;
  visibleX?: boolean;
  visibleY?: boolean;

  // Orientation locale du sprite (Nord planète vers le haut écran)
  rotationDeg: number;

  // Angle écran vers le Soleil (0=→, 90=↓)
  angleToSunDeg: number;

  // Optionnel: forcer directement l’angle du masque (sinon calculé depuis angleToSunDeg/rotationDeg)
  maskAngleDeg?: number;

  // Phase 0..1
  phaseFraction: number;

  // Rendu
  wPx: number;
  hPx: number;

  // Couleur de base si pas de texture
  color: string;

  // Optionnel: texture de surface (si fournie, appliquée comme pour la Lune)
  textureUrl?: string;

  // Intensité du halo côté nuit (0..0.3) — similaire à l’earthshine de la Lune
  ambientNight?: number;

  // Debug: affiche le gabarit du terminateur
  debugMask?: boolean;

  // Optionnel: angle du limbe brillant (pour debug visuel uniquement)
  brightLimbAngleDeg?: number;

  zIndex?: number;
};

export default function PlanetSprite({
  x, y, visibleX = true, visibleY = true,
  rotationDeg, angleToSunDeg, maskAngleDeg,
  phaseFraction, wPx, hPx, color,
  textureUrl,
  ambientNight = 0.12,
  debugMask = false,
  brightLimbAngleDeg,
  zIndex = Z.horizon - 2,
}: Props) {
  if (!visibleX || !visibleY) return null;

  const R_SVG = 312;

  // LUT pour le terminateur (mêmes calculs que MoonSprite)
  const k = 2 * phaseFraction - 1;
  const nearHalf = phaseFraction >= 0.495 && phaseFraction <= 0.505;
  const { rR, dR } = sampleTerminatorLUT(phaseFraction);
  const rSVG = rR * R_SVG;
  const cCx = 312 - dR * R_SVG; // centre côté croissant
  const cGx = 312 + dR * R_SVG; // centre côté gibbeux
  const chordX = 312 - k * R_SVG;
  const chordXClamped = Math.max(0, Math.min(624, chordX));
  const leftWidth = chordXClamped;
  const rightX = chordXClamped;
  const rightWidth = 624 - chordXClamped;

  // Ids uniques
  const ids = useMemo(() => {
    const base = 'pl' + Math.random().toString(36).slice(2);
    return {
      clip: base + '-clip',
      litCres: base + '-mask-lit-cres',
      litGibb: base + '-mask-lit-gibb',
      litChord: base + '-mask-lit-chord',
      darkCres: base + '-mask-dark-cres',
      darkGibb: base + '-mask-dark-gibb',
      darkChord: base + '-mask-dark-chord',
      night: base + '-night-grad',
    } as const;
  }, []);

  // Orientation du terminateur (même convention que MoonSprite)
  // (-90° car l’axe du masque est perpendiculaire à la direction « vers le Soleil »)
  const computedMaskAngleDeg = (maskAngleDeg ?? (angleToSunDeg - rotationDeg ));

  const darkMaskId = nearHalf ? ids.darkChord : (phaseFraction > 0.5 ? ids.darkGibb : ids.darkCres);
  const litMaskId = nearHalf ? ids.litChord : (phaseFraction > 0.5 ? ids.litGibb : ids.litCres);

  const useTexture = !!textureUrl;

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%, -50%) rotate(${rotationDeg}deg)`,
        zIndex,
        width: wPx,
        height: hPx,
        pointerEvents: 'none',
      }}
    >
      <svg width={wPx} height={hPx} viewBox="0 0 624 624" style={{ position: 'absolute', inset: 0, display: 'block' }}>
        <defs>
          <clipPath id={ids.clip}>
            <circle cx="312" cy="312" r="312" />
          </clipPath>

          {/* Masques "lit" (partie éclairée) */}
          <mask id={ids.litCres} maskUnits="userSpaceOnUse">
            <g transform={`rotate(${computedMaskAngleDeg},312,312)`}>
              <circle cx="312" cy="312" r="312" fill="white" />
              <circle cx={cCx} cy="312" r={rSVG} fill="black" />
            </g>
          </mask>
          <mask id={ids.litGibb} maskUnits="userSpaceOnUse">
            <g transform={`rotate(${computedMaskAngleDeg},312,312)`}>
              <rect x="0" y="0" width="624" height="624" fill="black" />
              <circle cx={cGx} cy="312" r={rSVG} fill="white" />
            </g>
          </mask>
          <mask id={ids.litChord} maskUnits="userSpaceOnUse">
            <g transform={`rotate(${computedMaskAngleDeg},312,312)`}>
              <rect x={rightX} y="0" width={rightWidth} height="624" fill="white" />
            </g>
          </mask>

          {/* Masques "dark" (partie non éclairée) */}
          <mask id={ids.darkCres} maskUnits="userSpaceOnUse">
            <g transform={`rotate(${computedMaskAngleDeg},312,312)`}>
              <rect x="0" y="0" width="624" height="624" fill="black" />
              <circle cx={cCx} cy="312" r={rSVG} fill="white" />
            </g>
          </mask>
          <mask id={ids.darkGibb} maskUnits="userSpaceOnUse">
            <g transform={`rotate(${computedMaskAngleDeg},312,312)`}>
              <circle cx="312" cy="312" r="312" fill="white" />
              <circle cx={cGx} cy="312" r={rSVG} fill="black" />
            </g>
          </mask>
          <mask id={ids.darkChord} maskUnits="userSpaceOnUse">
            <g transform={`rotate(${computedMaskAngleDeg},312,312)`}>
              <rect x="0" y="0" width={leftWidth} height="624" fill="white" />
            </g>
          </mask>

          {/* Halo côté nuit (analogue à l'earthshine, très discret) */}
          <radialGradient id={ids.night} cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor={color} stopOpacity={Math.max(0, Math.min(0.3, ambientNight))} />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Clip disque planète */}
        {!useTexture && (
          <>
            {/* Base color */}
            <circle cx="312" cy="312" r="312" fill={color} clipPath={`url(#${ids.clip})`} />
            {/* Ombre côté nuit */}
            <g style={{ mixBlendMode: 'multiply' }} clipPath={`url(#${ids.clip})`}>
              <rect x="0" y="0" width="624" height="624" fill="black" mask={`url(#${darkMaskId})`} />
            </g>
            {/* Léger halo côté nuit pour lisibilité */}
            {ambientNight > 0 && (
              <circle cx="312" cy="312" r="312" fill={`url(#${ids.night})`} clipPath={`url(#${ids.clip})`} mask={`url(#${darkMaskId})`} />
            )}
          </>
        )}

        {useTexture && (
          <>
            {/* Fond sombre sous la texture */}
            <circle cx="312" cy="312" r="312" fill="#0b0b0b" clipPath={`url(#${ids.clip})`} />
            {/* Halo côté nuit (très doux) */}
            {ambientNight > 0 && (
              <circle cx="312" cy="312" r="312" fill={`url(#${ids.night})`} clipPath={`url(#${ids.clip})`} mask={`url(#${darkMaskId})`} />
            )}
            {/* Texture visible uniquement côté jour (comme MoonSprite) */}
            <image
              href={textureUrl}
              x={-53}
              y={-53}
              width={730}
              height={730}
              clipPath={`url(#${ids.clip})`}
              mask={`url(#${litMaskId})`}
              preserveAspectRatio="xMidYMid slice"
              style={{ filter: 'brightness(0.9)' }}
            />
          </>
        )}
      </svg>

      {debugMask && (
        <svg width={wPx} height={hPx} viewBox="0 0 624 624" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <circle cx="312" cy="312" r="312" fill="none" stroke="#ffffff66" strokeWidth="1" strokeDasharray="3,4" />
          <g opacity={0.9}>
            <circle cx="312" cy="312" r="5" fill="none" stroke="#ffffff" strokeWidth="1" />
            <line x1="300" y1="312" x2="324" y2="312" stroke="#ffffff" strokeWidth="1" />
            <line x1="312" y1="300" x2="312" y2="324" stroke="#ffffff" strokeWidth="1" />
          </g>
          {typeof brightLimbAngleDeg === 'number' && (
            <g transform={`rotate(${brightLimbAngleDeg},312,312)`}>
              <line x1="312" y1="312" x2="312" y2="140" stroke="#22d3ee" strokeWidth="2" strokeDasharray="6,4" />
              <polygon points="312,130 308,140 316,140" fill="#22d3ee" />
            </g>
          )}
          <g transform={`rotate(${computedMaskAngleDeg},312,312)`}>
            {nearHalf ? (
              <line
                x1={Math.max(0, Math.min(624, chordX))}
                y1="60"
                x2={Math.max(0, Math.min(624, chordX))}
                y2="564"
                stroke="#93c5fd"
                strokeWidth="2"
                strokeDasharray="4,3"
              />
            ) : (
              <>
                <circle cx={phaseFraction > 0.5 ? cGx : cCx} cy="312" r={rSVG} fill="none" stroke="#93c5fd" strokeWidth="2" strokeDasharray="6,4" />
                <circle cx={phaseFraction > 0.5 ? cGx : cCx} cy="312" r="4" fill="#93c5fd" />
                <line x1="312" y1="312" x2={phaseFraction > 0.5 ? cGx : cCx} y2="312" stroke="#93c5fd" strokeWidth="1.5" strokeDasharray="3,3" />
              </>
            )}
          </g>
        </svg>
      )}
    </div>
  );
}