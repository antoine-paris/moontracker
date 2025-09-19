import React from "react";

export type HorizonMarker = { x: number; label: string; color: string };

export type ScreenPoint = {
  x: number;
  y: number;
  visibleX?: boolean;
  visibleY?: boolean;
};

type HorizonPoint = {
  x: number;
  visibleX?: boolean;
};

type SizePx = { w: number; h: number };

type Props = {
  // global toggles
  showMarkers: boolean;
  showStars: boolean;

  // layering
  zIndexHorizon: number;

  // horizon line position
  horizonY: number;

  // body horizon markers
  horizonMarkers: HorizonMarker[];

  // Polaris and Crux horizon projections
  polarisHorizon: HorizonPoint;
  cruxHorizon: HorizonPoint;

  // body screens + sizes
  showSun: boolean;
  sunScreen: ScreenPoint;
  sunSize: SizePx;

  showMoon: boolean;
  moonScreen: ScreenPoint;
  moonSize: SizePx;

  // Polaris object position
  polarisScreen: ScreenPoint;

  // colors
  sunColor: string;
  moonColor: string;
  polarisColor: string;
  cruxColor: string;
};

export default function Markers({
  showMarkers,
  showStars,
  zIndexHorizon,
  horizonY,
  horizonMarkers,
  polarisHorizon,
  cruxHorizon,
  showSun,
  sunScreen,
  sunSize,
  showMoon,
  moonScreen,
  moonSize,
  polarisScreen,
  sunColor,
  moonColor,
  polarisColor,
  cruxColor,
}: Props) {
  if (!showMarkers) return null;

  return (
    <>
      {/* Body horizon markers */}
      {horizonMarkers.map((m, i) => (
        <React.Fragment key={i}>
          <div style={{ position: "absolute", left: m.x, top: horizonY, zIndex: zIndexHorizon }}>
            <div className="-translate-x-1/2 -translate-y-1/2">
              <div className="h-6 w-0.5" style={{ background: m.color, opacity: 0.9 }} />
            </div>
          </div>
          {/* Horizon label aligned like Polaris */}
          <div
            style={{
              position: "absolute",
              left: m.x + 4,
              top: horizonY - 20,
              zIndex: zIndexHorizon,
              pointerEvents: "none",
            }}
          >
            <span className="text-xs" style={{ color: m.color, opacity: 0.95 }}>
              {m.label}
            </span>
          </div>
        </React.Fragment>
      ))}

      {/* Polaris horizon marker + label */}
      {polarisHorizon.visibleX && (
        <>
          <div style={{ position: "absolute", left: polarisHorizon.x, top: horizonY, zIndex: zIndexHorizon }}>
            <div className="-translate-x-1/2 -translate-y-1/2">
              <div className="h-6 w-0.5" style={{ background: polarisColor, opacity: 0.9 }} />
            </div>
          </div>
          <div
            style={{
              position: "absolute",
              left: polarisHorizon.x + 4,
              top: horizonY - 20,
              zIndex: zIndexHorizon,
              pointerEvents: "none",
            }}
          >
            <span className="text-xs" style={{ color: polarisColor, opacity: 0.95 }}>Polaris</span>
          </div>
        </>
      )}

      {/* Southern Cross horizon marker + label */}
      {cruxHorizon.visibleX && (
        <>
          <div style={{ position: "absolute", left: cruxHorizon.x, top: horizonY, zIndex: zIndexHorizon }}>
            <div className="-translate-x-1/2 -translate-y-1/2">
              <div className="h-6 w-0.5" style={{ background: cruxColor, opacity: 0.9 }} />
            </div>
          </div>
          <div
            style={{
              position: "absolute",
              left: cruxHorizon.x + 4,
              top: horizonY - 20,
              zIndex: zIndexHorizon,
              pointerEvents: "none",
            }}
          >
            <span className="text-xs" style={{ color: cruxColor, opacity: 0.95 }}>Croix du Sud</span>
          </div>
        </>
      )}

      {/* Sun extremity markers + label */}
      {showSun && sunScreen.visibleX && sunScreen.visibleY && (
        <>
          {/* top */}
          <div style={{ position: "absolute", left: sunScreen.x, top: sunScreen.y - sunSize.h / 2 - 15, zIndex: zIndexHorizon }}>
            <div className="-translate-x-1/2 -translate-y-1/2">
              <div className="h-3 w-0.5" style={{ background: sunColor, opacity: 0.9 }} />
            </div>
          </div>
          {/* bottom */}
          <div style={{ position: "absolute", left: sunScreen.x, top: sunScreen.y + sunSize.h / 2 + 15, zIndex: zIndexHorizon }}>
            <div className="-translate-x-1/2 -translate-y-1/2">
              <div className="h-3 w-0.5" style={{ background: sunColor, opacity: 0.9 }} />
            </div>
          </div>
          {/* left */}
          <div style={{ position: "absolute", left: sunScreen.x - sunSize.w / 2 - 15, top: sunScreen.y, zIndex: zIndexHorizon }}>
            <div className="-translate-x-1/2 -translate-y-1/2">
              <div className="w-3 h-0.5" style={{ background: sunColor, opacity: 0.9 }} />
            </div>
          </div>
          {/* right */}
          <div style={{ position: "absolute", left: sunScreen.x + sunSize.w / 2 + 15, top: sunScreen.y, zIndex: zIndexHorizon }}>
            <div className="-translate-x-1/2 -translate-y-1/2">
              <div className="w-3 h-0.5" style={{ background: sunColor, opacity: 0.9 }} />
            </div>
          </div>
          {/* label near bottom dash */}
          <div
            style={{
              position: "absolute",
              left: sunScreen.x + sunSize.w / 2 + 15 - 6,
              top: sunScreen.y + sunSize.h / 2 + 15,
              transform: "translateY(-50%)",
              zIndex: zIndexHorizon,
              pointerEvents: "none",
            }}
          >
            <span className="text-xs" style={{ color: sunColor, opacity: 0.95 }}>Soleil</span>
          </div>
        </>
      )}

      {/* Moon extremity markers + label */}
      {showMoon && moonScreen.visibleX && moonScreen.visibleY && (
        <>
          {/* top */}
          <div style={{ position: "absolute", left: moonScreen.x, top: moonScreen.y - moonSize.h / 2 - 15, zIndex: zIndexHorizon }}>
            <div className="-translate-x-1/2 -translate-y-1/2">
              <div className="h-3 w-0.5" style={{ background: moonColor, opacity: 0.9 }} />
            </div>
          </div>
          {/* bottom */}
          <div style={{ position: "absolute", left: moonScreen.x, top: moonScreen.y + moonSize.h / 2 + 15, zIndex: zIndexHorizon }}>
            <div className="-translate-x-1/2 -translate-y-1/2">
              <div className="h-3 w-0.5" style={{ background: moonColor, opacity: 0.9 }} />
            </div>
          </div>
          {/* left */}
          <div style={{ position: "absolute", left: moonScreen.x - moonSize.w / 2 - 15, top: moonScreen.y, zIndex: zIndexHorizon }}>
            <div className="-translate-x-1/2 -translate-y-1/2">
              <div className="w-3 h-0.5" style={{ background: moonColor, opacity: 0.9 }} />
            </div>
          </div>
          {/* right */}
          <div style={{ position: "absolute", left: moonScreen.x + moonSize.w / 2 + 15, top: moonScreen.y, zIndex: zIndexHorizon }}>
            <div className="-translate-x-1/2 -translate-y-1/2">
              <div className="w-3 h-0.5" style={{ background: moonColor, opacity: 0.9 }} />
            </div>
          </div>
          {/* label near bottom dash */}
          <div
            style={{
              position: "absolute",
              left: moonScreen.x + moonSize.w / 2 + 15 - 6,
              top: moonScreen.y + moonSize.h / 2 + 15,
              transform: "translateY(-50%)",
              zIndex: zIndexHorizon,
              pointerEvents: "none",
            }}
          >
            <span className="text-xs" style={{ color: moonColor, opacity: 0.95 }}>Lune</span>
          </div>
        </>
      )}

      {/* Polaris object extremity markers + label */}
      {showStars && polarisScreen.visibleX && polarisScreen.visibleY && (
        <>
          {/* top */}
          <div style={{ position: "absolute", left: polarisScreen.x, top: polarisScreen.y - 15, zIndex: zIndexHorizon }}>
            <div className="-translate-x-1/2 -translate-y-1/2">
              <div className="h-3 w-0.5" style={{ background: polarisColor, opacity: 0.9 }} />
            </div>
          </div>
          {/* bottom */}
          <div style={{ position: "absolute", left: polarisScreen.x, top: polarisScreen.y + 15, zIndex: zIndexHorizon }}>
            <div className="-translate-x-1/2 -translate-y-1/2">
              <div className="h-3 w-0.5" style={{ background: polarisColor, opacity: 0.9 }} />
            </div>
          </div>
          {/* left */}
          <div style={{ position: "absolute", left: polarisScreen.x - 15, top: polarisScreen.y, zIndex: zIndexHorizon }}>
            <div className="-translate-x-1/2 -translate-y-1/2">
              <div className="w-3 h-0.5" style={{ background: polarisColor, opacity: 0.9 }} />
            </div>
          </div>
          {/* right */}
          <div style={{ position: "absolute", left: polarisScreen.x + 15, top: polarisScreen.y, zIndex: zIndexHorizon }}>
            <div className="-translate-x-1/2 -translate-y-1/2">
              <div className="w-3 h-0.5" style={{ background: polarisColor, opacity: 0.9 }} />
            </div>
          </div>
          {/* label near bottom dash */}
          <div
            style={{
              position: "absolute",
              left: polarisScreen.x + 15 - 6,
              top: polarisScreen.y + 15,
              transform: "translateY(-50%)",
              zIndex: zIndexHorizon,
              pointerEvents: "none",
            }}
          >
            <span className="text-xs" style={{ color: polarisColor, opacity: 0.95 }}>Polaris</span>
          </div>
        </>
      )}
    </>
  );
}