import React from "react";
import { Z } from "../../render/constants";

export type CardinalItem = { label: 'N' | 'E' | 'S' | 'O'; x: number };
export type SecondaryCardinalItem = { label: string; x: number };
export type BodyItem = { x: number; label: string; color: string };

type Props = {
  horizonY: number;
  items: CardinalItem[];
  secondaryItems?: SecondaryCardinalItem[];
  bodyItems?: BodyItem[];
};

export default function CardinalMarkers({ horizonY, items, secondaryItems, bodyItems }: Props) {
  return (
    <>
      {items.map((c, i) => (
        <div key={`prim-${i}`} style={{ position: "absolute", left: c.x, top: horizonY, zIndex: Z.horizon }}>
          <div className="-translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
            <div className="h-6 w-0.5 bg-white/70" />
            <div className="mt-1 text-xs font-semibold text-white/80 bg-black/60 px-2 py-0.5 rounded-full border border-white/20">{c.label}</div>
          </div>
        </div>
      ))}
      {secondaryItems?.map((c, i) => (
        <div key={`sec-${i}`} style={{ position: "absolute", left: c.x, top: horizonY, zIndex: Z.horizon }}>
          <div className="-translate-x-1/2 translate-y-[12px] text-[10px] leading-none text-white/60 select-none">
            {c.label}
          </div>
        </div>
      ))}
      {/* NEW: body/constellation horizon markers */}
      {bodyItems?.map((m, i) => (
        <React.Fragment key={`body-${i}`}>
          <div style={{ position: "absolute", left: m.x, top: horizonY, zIndex: Z.horizon }}>
            <div className="-translate-x-1/2 -translate-y-1/2">
              <div className="h-6 w-0.5" style={{ background: m.color, opacity: 0.9 }} />
            </div>
          </div>
          <div
            style={{
              position: "absolute",
              left: m.x + 4,
              top: horizonY - 20,
              zIndex: Z.horizon,
              pointerEvents: "none",
            }}
          >
            <span className="text-xs" style={{ color: m.color, opacity: 0.95 }}>{m.label}</span>
          </div>
        </React.Fragment>
      ))}
    </>
  );
}
