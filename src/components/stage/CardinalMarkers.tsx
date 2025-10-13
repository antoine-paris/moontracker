import React from "react";
import { Z } from "../../render/constants";
import { projectToScreen } from "../../render/projection";
import { compass16 } from "../../utils/compass";
import { angularDiff } from "../../utils/math";

export type CardinalItem = { label: 'N' | 'E' | 'S' | 'O'; x: number; az: number };
export type SecondaryCardinalItem = { label: string; x: number; az: number };
export type BodyItem = { x: number; label: string; color: string; az: number };

type Props = {
  // projection context
  viewport: { x: number; y: number; w: number; h: number };
  refAzDeg: number;
  refAltDeg: number;
  fovXDeg: number;
  fovYDeg: number;
  projectionMode: 'recti-panini' | 'stereo-centered' | 'ortho' | 'cylindrical';

  // Only keep bodyItems coming from parent; cardinals are computed here
  bodyItems?: BodyItem[];
};

export default function CardinalMarkers({
  viewport, refAzDeg, refAltDeg, fovXDeg, fovYDeg, projectionMode,
  bodyItems
}: Props) {
  const yForAz = (az: number) => {
    const p = projectToScreen(az, 0, refAzDeg, viewport.w, viewport.h, refAltDeg, 0, fovXDeg, fovYDeg, projectionMode);
    const y = (p?.y ?? Number.NaN); // local (pas de + viewport.y)

    if (Number.isFinite(y)) return y;

    // Fallback: clamp inside local viewport
    const dAzRad = (az - refAzDeg) * Math.PI / 180;
    const dy = Math.cos(dAzRad);
    const edgePad = 1;
    return (dy > 0 ? viewport.h - edgePad : edgePad);
  };

  // New: fallback for x when projection collapses at zenith/nadir
  const xForAz = (x: number, az: number) => {
    if (Number.isFinite(x)) return x;
    const dAzRad = (az - refAzDeg) * Math.PI / 180;
    const dx = Math.sin(dAzRad);
    const edgePad = 1;
    return (dx > 0 ? viewport.w - edgePad : edgePad); // local (pas de + viewport.x)
  };

  // Compute primary N/E/S/O markers (dedup on x)
  const primaryItems: CardinalItem[] = React.useMemo(() => {
    const base = [
      { label: 'N' as const, az: 0 },
      { label: 'E' as const, az: 90 },
      { label: 'S' as const, az: 180 },
      { label: 'O' as const, az: 270 },
    ];
    const projected = base
      .map(c => {
        const p = projectToScreen(c.az, 0, refAzDeg, viewport.w, viewport.h, refAltDeg, 0, fovXDeg, fovYDeg, projectionMode);
        const x = p.x; // local
        const delta = Math.abs(angularDiff(c.az, refAzDeg));
        return { ...c, x, visible: p.visibleX, delta };
      })
      .filter(c => c.visible);

    const EPS = 1;
    const dedup: typeof projected = [];
    for (const it of projected) {
      const idx = dedup.findIndex(d => Math.abs(d.x - it.x) <= EPS);
      if (idx === -1) dedup.push(it);
      else if (it.delta < dedup[idx].delta) dedup[idx] = it;
    }

    return dedup
      .sort((a, b) => a.x - b.x)
      .map(({ label, az, x }) => ({ label, az, x }));
  }, [refAzDeg, refAltDeg, viewport.w, viewport.h, fovXDeg, fovYDeg, projectionMode]);

  // Compute secondary 16-wind markers (dedup on x, skip primaries)
  const secondaryItems: SecondaryCardinalItem[] = React.useMemo(() => {
    const primaries = new Set(['N', 'E', 'S', 'O']);
    const items: { label: string; az: number; x: number; delta: number }[] = [];
    for (let i = 0; i < 16; i++) {
      const az = i * 22.5;
      const label = compass16(az);
      if (primaries.has(label)) continue;
      const p = projectToScreen(az, 0, refAzDeg, viewport.w, viewport.h, refAltDeg, 0, fovXDeg, fovYDeg, projectionMode);
      if (!p.visibleX) continue;
      const x = p.x; // local
      const delta = Math.abs(angularDiff(az, refAzDeg));
      items.push({ label, az, x, delta });
    }
    const EPS = 6;
    const dedup: typeof items = [];
    for (const it of items) {
      const idx = dedup.findIndex(d => Math.abs(d.x - it.x) <= EPS);
      if (idx === -1) dedup.push(it);
      else if (it.delta < dedup[idx].delta) dedup[idx] = it;
    }
    return dedup.sort((a, b) => a.x - b.x).map(({ label, az, x }) => ({ label, az, x }));
  }, [refAzDeg, refAltDeg, viewport.w, viewport.h, fovXDeg, fovYDeg, projectionMode]);

  return (
    <>
      {primaryItems.map((c, i) => {
        const y = yForAz(c.az);
        const x = xForAz(c.x, c.az);
        return (
          <div
            key={`prim-${i}`}
            style={{ position: "absolute", left: x, top: y, zIndex: Z.horizon + 5, pointerEvents: "none" }}
          >
            <div className="-translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
              <div className="h-6 w-0.5 bg-white/70" />
              <div className="mt-1 text-xs font-semibold text-white/80 bg-black/60 px-2 py-0.5 rounded-full border border-white/20">{c.label}</div>
            </div>
          </div>
        );
      })}
      {secondaryItems.map((c, i) => {
        const y = yForAz(c.az);
        const x = xForAz(c.x, c.az);
        return (
          <div
            key={`sec-${i}`}
            style={{ position: "absolute", left: x, top: y, zIndex: Z.horizon + 5, pointerEvents: "none" }}
          >
            <div className="-translate-x-1/2 translate-y-[12px] text-[10px] leading-none text-white/60 select-none">
              {c.label}
            </div>
          </div>
        );
      })}
      {/* body/constellation horizon markers */}
      {bodyItems?.map((m, i) => {
        const y = yForAz(m.az);
        const x = xForAz(m.x, m.az);
        return (
          <React.Fragment key={`body-${i}`}>
            <div
              style={{ position: "absolute", left: x, top: y, zIndex: Z.horizon + 5, pointerEvents: "none" }}
            >
              <div className="-translate-x-1/2 -translate-y-1/2">
                <div className="h-6 w-0.5" style={{ background: m.color, opacity: 0.9 }} />
              </div>
            </div>
            <div
              style={{
                position: "absolute",
                left: x + 4,
                top: y - 20,
                zIndex: Z.horizon + 5,
                pointerEvents: "none",
              }}
            >
              <span className="text-xs" style={{ color: m.color, opacity: 0.95 }}>{m.label}</span>
            </div>
          </React.Fragment>
        );
      })}
    </>
  );
}
