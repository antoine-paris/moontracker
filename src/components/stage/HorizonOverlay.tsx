import React from "react";
import { Z } from "../../render/constants";

type Props = {
  viewport: { x: number; y: number; w: number; h: number };
  horizonY: number;
  topLineY: number;
  bottomLineY: number;
};

export default function HorizonOverlay({ viewport, horizonY, topLineY, bottomLineY }: Props) {
  return (
    <>
      <div className="absolute" style={{ left: viewport.x, width: viewport.w, top: horizonY, height: 0, borderTop: "1px solid rgba(255,255,255,0.35)", zIndex: Z.horizon }} />
      <div className="absolute" style={{ left: viewport.x, width: viewport.w, top: topLineY, height: 0, borderTop: "1px dashed rgba(255,255,255,0.3)", zIndex: Z.horizon }} />
      <div className="absolute text-[10px] text-white/70 bg-black/60 px-1.5 py-0.5 rounded border border-white/10" style={{ left: 8, top: topLineY - 12, zIndex: Z.horizon }}>haut</div>
      <div className="absolute" style={{ left: viewport.x, width: viewport.w, top: bottomLineY, height: 0, borderTop: "1px dashed rgba(255,255,255,0.3)", zIndex: Z.horizon }} />
      <div className="absolute text-[10px] text-white/70 bg-black/60 px-1.5 py-0.5 rounded border border-white/10" style={{ left: 8, top: bottomLineY - 12, zIndex: Z.horizon }}>bas</div>
    </>
  );
}
