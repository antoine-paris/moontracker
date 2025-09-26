import React from "react";
import { Z } from "../../render/constants";

type Viewport = { x: number; y: number; w: number; h: number };

type Props = {
  viewport: Viewport;
  gradient?: string;
  zIndex?: number; // optional override
};

export default function Athmosphere({ viewport, gradient, zIndex }: Props) {
  return (
    <div
      className="absolute"
      style={{
        left: viewport.x,
        top: viewport.y,
        width: viewport.w,
        height: viewport.h,
        pointerEvents: "none",
        zIndex: zIndex ?? (Z.horizon - 20), // was Z.horizon - 8
        background: gradient ?? "linear-gradient(to top, rgba(0,0,0,0), rgba(0,0,0,0.01))",
      }}
    />
  );
}
