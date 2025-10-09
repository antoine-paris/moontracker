import React from 'react';

type Viewport = { x: number; y: number; w: number; h: number };

type Props = {
  viewport: Viewport;
  containerW: number;
  containerH: number;
  zIndex?: number;
};

// Static colors for masks and 16:9 frame
const FRAME_COLOR = '#363636ff';         // dark outer masks
const FRAME_169_COLOR = '#363636ff';     // dashed 16:9 guide
const FRAME_169_BORDER_PX = 2;

export default function PhotoFrame({ viewport, containerW, containerH, zIndex = 10_000 }: Props) {
  // Clamp values to avoid negative sizes
  const vX = Math.max(0, Math.min(viewport.x, containerW));
  const vY = Math.max(0, Math.min(viewport.y, containerH));
  const vW = Math.max(0, Math.min(viewport.w, Math.max(0, containerW - vX)));
  const vH = Math.max(0, Math.min(viewport.h, Math.max(0, containerH - vY)));

  // Masks (slightly adjusted to avoid 1px gaps/overlaps)
  const topH = Math.max(0, vY) + 1;
  const bottomH = Math.max(0, containerH - (vY + vH));
  const leftW = Math.max(0, vX);
  const rightW = Math.max(0, containerW - (vX + vW));

  // If viewport covers all, nothing to draw
  const nothingToMask = topH === 0 && bottomH === 0 && leftW === 0 && rightW === 0;

  // Compute a centered 16:9 rectangle that fits within the viewport
  const AR_169 = 16 / 9;
  let rectW = vW;
  let rectH = Math.round(rectW / AR_169);
  if (rectH > vH) {
    rectH = vH;
    rectW = Math.round(rectH * AR_169);
  }
  const rectX = vX + Math.round((vW - rectW) / 2);
  const rectY = vY + Math.round((vH - rectH) / 2);

  const maskCommon: React.CSSProperties = {
    position: 'absolute',
    background: FRAME_COLOR,
    pointerEvents: 'none',
  };

  return (
    <div
      className="absolute inset-0"
      style={{
        zIndex,
        pointerEvents: 'none',
      }}
      aria-hidden
    >
      {/* Top mask */}
      {!nothingToMask && topH > 0 && (
        <div
          style={{
            ...maskCommon,
            left: 0,
            top: 0,
            width: containerW,
            height: topH,
          }}
        />
      )}

      {/* Bottom mask */}
      {!nothingToMask && bottomH > 0 && (
        <div
          style={{
            ...maskCommon,
            left: 0,
            top: vY + vH -1,
            width: containerW,
            height: bottomH,
          }}
        />
      )}

      {/* Left mask */}
      {!nothingToMask && leftW > 0 && vH > 0 && (
        <div
          style={{
            ...maskCommon,
            left: 0,
            top: vY,
            width: leftW,
            height: vH,
          }}
        />
      )}

      {/* Right mask */}
      {!nothingToMask && rightW > 0 && vH > 0 && (
        <div
          style={{
            ...maskCommon,
            left: vX + vW,
            top: vY,
            width: rightW,
            height: vH,
          }}
        />
      )}

      {/* 16:9 dashed guide inside the viewport */}
      {vW > 0 && vH > 0 && rectW > 0 && rectH > 0 && (
        <>
          {/* Top dashed line */}
          <div
            style={{
              position: 'absolute',
              left: rectX,
              top: rectY,
              width: rectW,
              height: 0,
              borderTop: `${FRAME_169_BORDER_PX}px dashed ${FRAME_169_COLOR}`,
              pointerEvents: 'none',
            }}
          />
          {/* Bottom dashed line */}
          <div
            style={{
              position: 'absolute',
              left: rectX,
              top: rectY + rectH,
              width: rectW,
              height: 0,
              borderTop: `${FRAME_169_BORDER_PX}px dashed ${FRAME_169_COLOR}`,
              pointerEvents: 'none',
            }}
          />
        </>
      )}
    </div>
  );
}