import { useMemo } from 'react';
import { Z } from '../../render/constants';
import { sampleTerminatorLUT } from '../../astro/lut';
import { SATURN_RING_OUTER_TO_GLOBE_DIAM_RATIO, SATURN_RING_INNER_TO_GLOBE_DIAM_RATIO } from '../../astro/planets';

type Props = {
  x: number;
  y: number;
  visibleX?: boolean;
  visibleY?: boolean;
  rotationDeg: number;
  angleToSunDeg: number;
  maskAngleDeg?: number;
  phaseFraction: number;
  wPx: number;
  hPx: number;
  color: string;
  textureUrl?: string;
  ambientNight?: number;
  debugMask?: boolean;
  brightLimbAngleDeg?: number;
  zIndex?: number;
  planetId?: string;
  orientationDegZ?: number;
  orientationDegX?: number;           // + add (tilt anneaux vue)
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
  planetId,
  orientationDegX,                     // + add
}: Props) {
  // Do not cull here; parent handles partial on-screen culling.

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
  const isSaturn = planetId === 'Saturn';

  // Ratios physiques (diamètres / diamètre planète)
  const OUTER_RATIO = SATURN_RING_OUTER_TO_GLOBE_DIAM_RATIO || 2.35;   // ≈2.35
  const INNER_RATIO = SATURN_RING_INNER_TO_GLOBE_DIAM_RATIO || 1.28;   // ≈1.28 (ajuste si différent)

  // Largeur (diamètre horizontal) fixe des anneaux
  const ringOuterDiamPx = isSaturn ? wPx * OUTER_RATIO : 0;
  const ringInnerDiamPx = isSaturn ? wPx * INNER_RATIO : 0;

  // Ouverture (0° → 0, >=30° → pleine hauteur = diamètre planète)
  const D2R = Math.PI / 180;
  const tiltDeg = Math.abs(orientationDegX ?? 0);
  const refDeg = 30;
  const opennessNorm = Math.min(1, Math.max(0,
    Math.sin(Math.min(tiltDeg, refDeg) * D2R) / Math.sin(refDeg * D2R)
  ));

  // Hauteur cible: planète * opennessNorm (donc à 30° hauteur = diamètre planète)
  const ringOuterHeightPxTarget = isSaturn ? (wPx * opennessNorm) : 0;
  // Empêche disparition complète, mais garde une vraie ligne edge-on
  const drawAsLine = isSaturn && ringOuterHeightPxTarget < 1;
  const ringOuterHeightPx = drawAsLine ? 1 : Math.max(1, ringOuterHeightPxTarget);

  // Inner height suit la même échelle (trou central)
  const ringInnerHeightPx = drawAsLine
    ? 1
    : ringOuterHeightPx * (ringInnerDiamPx / ringOuterDiamPx);

  // Styles
  const ringFill = '#d8d0c2';
  const ringFillOpacity = 0.55;
  const ringStroke = '#e9e1d5';
  const ringStrokeOpacity = 0.7;
  const ringStrokeWidthPx = 1.0;

  

  // FIX: variable manquante
  const hidePlanetForDebug = debugMask && isSaturn;

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
        overflow: 'visible',
        opacity: (visibleX && visibleY) ? 1 : 0,
      }}
    >
      {/* Disque planète + phases (caché en debug pour inspecter l’anneau) */}
      {!hidePlanetForDebug && (
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
      )}

      {/* Anneaux Saturne (annulus) */}
      {isSaturn && ringOuterDiamPx > 0 && (
        <svg
          width={ringOuterDiamPx}
          height={ringOuterHeightPx}
          viewBox={`0 0 ${ringOuterDiamPx} ${ringOuterHeightPx}`}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            outline: debugMask ? '1px dashed #00ffff88' : 'none',
            background: debugMask ? '#11223322' : 'transparent',
          }}
        >
          {drawAsLine ? (
            <line
              x1={0}
              y1={ringOuterHeightPx / 2}
              x2={ringOuterDiamPx}
              y2={ringOuterHeightPx / 2}
              stroke={ringStroke}
              strokeOpacity={0.85}
              strokeWidth={Math.min(2, ringStrokeWidthPx + 0.8)}
            />
          ) : (
            <>
              <defs>
                <mask id={`${ids.clip}-ring-mask`}>
                  <rect
                    x={0}
                    y={0}
                    width={ringOuterDiamPx}
                    height={ringOuterHeightPx}
                    fill="white"
                  />
                  {/* Trou central */}
                  <ellipse
                    cx={ringOuterDiamPx / 2}
                    cy={ringOuterHeightPx / 2}
                    rx={ringInnerDiamPx / 2}
                    ry={ringInnerHeightPx / 2}
                    fill="black"
                  />
                </mask>
              </defs>
              {/* Anneau plein avec trou */}
              <ellipse
                cx={ringOuterDiamPx / 2}
                cy={ringOuterHeightPx / 2}
                rx={ringOuterDiamPx / 2}
                ry={ringOuterHeightPx / 2}
                fill={ringFill}
                fillOpacity={ringFillOpacity}
                stroke={ringStroke}
                strokeOpacity={ringStrokeOpacity}
                strokeWidth={ringStrokeWidthPx}
                mask={`url(#${ids.clip}-ring-mask)`}
              />
              {/* Liseré interne subtil */}
              <ellipse
                cx={ringOuterDiamPx / 2}
                cy={ringOuterHeightPx / 2}
                rx={ringInnerDiamPx / 2}
                ry={ringInnerHeightPx / 2}
                fill="none"
                stroke="#f5efe6"
                strokeOpacity={0.25}
                strokeWidth={0.6}
              />
            </>
          )}
          {debugMask && (
            <text
              x={4}
              y={14}
              fontSize={12}
              fill="#fff"
            >{`W=${ringOuterDiamPx.toFixed(1)} H=${ringOuterHeightPx.toFixed(1)} tilt=${tiltDeg.toFixed(1)}°`}</text>
          )}
        </svg>
      )}

      {/* Debug (inchangé) */}
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