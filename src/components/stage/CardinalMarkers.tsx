import React from "react";
import { Z } from "../../render/constants";

export type CardinalItem = { label: 'N' | 'E' | 'S' | 'O'; x: number };
export type SecondaryCardinalItem = { label: string; x: number };

type Props = {
  horizonY: number;
  items: CardinalItem[];
  secondaryItems?: SecondaryCardinalItem[];
};

export default function CardinalMarkers({ horizonY, items, secondaryItems }: Props) {
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
    </>
  );
}
