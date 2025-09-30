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

type Planet = {
  name: string;
  screen: ScreenPoint;
  size: SizePx;
  color: string;
};

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

  // planets (optional)
  showPlanets?: boolean;
  planets?: Planet[];
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
  // planets
  showPlanets,
  planets,
}: Props) {
  if (!showMarkers) return null;

  return (
    <>
      {/* Polaris/Crux horizon projections (ticks + labels) */}
      {showStars && polarisHorizon && polarisHorizon.visibleX !== false && (
        <div
          style={{ position: "absolute", left: polarisHorizon.x, top: horizonY, zIndex: zIndexHorizon, pointerEvents: "none" }}
        >
          <div className="-translate-x-1/2">
            <div className="w-0.5 h-3" style={{ background: polarisColor, opacity: 0.95, transform: "translateY(-50%)" }} />
            <div className="text-[10px] leading-none mt-1 select-none" style={{ color: polarisColor, opacity: 0.95, transform: "translateY(-50%)" }}>
              Polaris (horizon)
            </div>
          </div>
        </div>
      )}
      {showStars && cruxHorizon && cruxHorizon.visibleX !== false && (
        <div
          style={{ position: "absolute", left: cruxHorizon.x, top: horizonY, zIndex: zIndexHorizon, pointerEvents: "none" }}
        >
          <div className="-translate-x-1/2">
            <div className="w-0.5 h-3" style={{ background: cruxColor, opacity: 0.95, transform: "translateY(-50%)" }} />
            <div className="text-[10px] leading-none mt-1 select-none" style={{ color: cruxColor, opacity: 0.95, transform: "translateY(-50%)" }}>
              Crux (horizon)
            </div>
          </div>
        </div>
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

      {/* Planets extremity markers + label */}
      {
        planets?.map((p, i) =>
          p?.screen?.visibleX && p?.screen?.visibleY ? (
            <React.Fragment key={`planet-${p.name || i}`}>
              {/* top */}
              <div
                style={{
                  position: "absolute",
                  left: p.screen.x,
                  top: p.screen.y - ((p.size?.h ?? 0) / 2) - 15,
                  zIndex: zIndexHorizon,
                }}
              >
                <div className="-translate-x-1/2 -translate-y-1/2">
                  <div className="h-3 w-0.5" style={{ background: p.color, opacity: 0.9 }} />
                </div>
              </div>
              {/* bottom */}
              <div
                style={{
                  position: "absolute",
                  left: p.screen.x,
                  top: p.screen.y + ((p.size?.h ?? 0) / 2) + 15,
                  zIndex: zIndexHorizon,
                }}
              >
                <div className="-translate-x-1/2 -translate-y-1/2">
                  <div className="h-3 w-0.5" style={{ background: p.color, opacity: 0.9 }} />
                </div>
              </div>
              {/* left */}
              <div
                style={{
                  position: "absolute",
                  left: p.screen.x - ((p.size?.w ?? 0) / 2) - 15,
                  top: p.screen.y,
                  zIndex: zIndexHorizon,
                }}
              >
                <div className="-translate-x-1/2 -translate-y-1/2">
                  <div className="w-3 h-0.5" style={{ background: p.color, opacity: 0.9 }} />
                </div>
              </div>
              {/* right */}
              <div
                style={{
                  position: "absolute",
                  left: p.screen.x + ((p.size?.w ?? 0) / 2) + 15,
                  top: p.screen.y,
                  zIndex: zIndexHorizon,
                }}
              >
                <div className="-translate-x-1/2 -translate-y-1/2">
                  <div className="w-3 h-0.5" style={{ background: p.color, opacity: 0.9 }} />
                </div>
              </div>
              {/* label near bottom dash */}
              <div
                style={{
                  position: "absolute",
                  left: p.screen.x + ((p.size?.w ?? 0) / 2) + 15 - 6,
                  top: p.screen.y + ((p.size?.h ?? 0) / 2) + 15,
                  transform: "translateY(-50%)",
                  zIndex: zIndexHorizon,
                  pointerEvents: "none",
                }}
              >
                <span className="text-xs" style={{ color: p.color, opacity: 0.95 }}>
                  {p.name}
                </span>
              </div>
            </React.Fragment>
          ) : null
        )}
    </>
  );
}