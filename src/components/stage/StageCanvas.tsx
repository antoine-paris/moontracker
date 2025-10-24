
import { Z } from "../../render/constants";

export type Viewport = { x: number; y: number; w: number; h: number };

type Props = {
  viewport: Viewport;
  stageSize: { w: number; h: number };
  showCameraFrame: boolean;
};

export default function StageCanvas({ viewport, stageSize, showCameraFrame }: Props) {
  if (!showCameraFrame) return null;
  return (
    <>
      {/* Haut */}
      <div className="absolute pointer-events-none" style={{ left: 0, top: 0, width: stageSize.w, height: viewport.y, background: '#000', zIndex: Z.ui - 2 }} />
      {/* Bas */}
      <div className="absolute pointer-events-none" style={{ left: 0, top: viewport.y + viewport.h, width: stageSize.w, height: Math.max(0, stageSize.h - (viewport.y + viewport.h)), background: '#000', zIndex: Z.ui - 2 }} />
      {/* Gauche */}
      <div className="absolute pointer-events-none" style={{ left: 0, top: viewport.y, width: viewport.x, height: viewport.h, background: '#000', zIndex: Z.ui - 2 }} />
      {/* Droite */}
      <div className="absolute pointer-events-none" style={{ left: viewport.x + viewport.w, top: viewport.y, width: Math.max(0, stageSize.w - (viewport.x + viewport.w)), height: viewport.h, background: '#000', zIndex: Z.ui - 2 }} />
      {/* Cadre appareil: bordure rouge pointillée */}
      <div className="absolute pointer-events-none" style={{ left: viewport.x, top: viewport.y, width: viewport.w, height: viewport.h, border: '1px dashed rgba(248,113,113,0.95)', zIndex: Z.ui - 1 }} />
    </>
  );
}
