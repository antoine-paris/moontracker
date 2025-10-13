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
  // accept either name or label (App.tsx sends "label")
  name?: string;
  label?: string;
  screen: ScreenPoint;
  // size can be omitted (optional chaining already used below)
  size?: SizePx;
  color: string;
};

type Props = {
  showMarkers: boolean;
  showStars: boolean;
  zIndexHorizon: number;
  // horizonY?: number;                    // removed
  // horizonMarkers?: { x: number; label: string; color: string }[]; // removed
  showSun: boolean;
  sunScreen: { x: number; y: number; visibleX?: boolean; visibleY?: boolean };
  sunSize: { w: number; h: number };
  showMoon: boolean;
  moonScreen: { x: number; y: number; visibleX?: boolean; visibleY?: boolean };
  moonSize: { w: number; h: number };
  polarisScreen: { x: number; y: number; visibleX?: boolean; visibleY?: boolean };
  sunColor: string;
  moonColor: string;
  polarisColor: string;
  cruxColor: string;
  planets: { screen: { x: number; y: number; visibleX?: boolean; visibleY?: boolean }, label: string, color: string, size: { w: number; h: number } }[];
};

export default function Markers(props: Props) {
  const {
    showMarkers,
    showStars,
    zIndexHorizon,
    // horizonY,             // removed
    // horizonMarkers,       // removed
    showSun, sunScreen, sunSize,
    showMoon, moonScreen, moonSize,
    polarisScreen,
    sunColor, moonColor, polarisColor, cruxColor,
    planets,
  } = props;

  if (!showMarkers) return null;

  return (
    <>
      
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
      {planets?.map((p, i) =>
        p?.screen?.visibleX && p?.screen?.visibleY ? (
          <React.Fragment key={`planet-${p.label || i}`}>
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
                {p.label}
              </span>
            </div>
          </React.Fragment>
        ) : null
      )}
    </>
  );
}