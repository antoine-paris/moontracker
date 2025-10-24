import { Z } from "../../render/constants";
import { clamp } from "../../utils/math";

type Viewport = { x: number; y: number; w: number; h: number };

type Props = {
  viewport: Viewport;
  // Si 'gradient' n'est pas fourni, le composant le calcule à partir de l'altitude du Soleil:
  sunAltDeg?: number;
  gradient?: string;
  zIndex?: number; // optional override
};

function computeGradientFromSunAlt(sunAltDeg?: number): string {
  const alt = Number.isFinite(sunAltDeg) ? (sunAltDeg as number) : -30;

  // Night/day blend: 0 à alt<=-6°, 1 à alt>=~10° (même formule que précédemment)
  const dayBlend = clamp((alt + 6) / (10 + 6), 0, 1);

  // Warmth (glow coucher/lever) fort près de l’horizon, s’estompe ~±4°
  const warm = clamp(1 - Math.abs(alt) / 4, 0, 1);

  // Couleurs de base (nuit → jour)
  const topNight = { r: 3, g: 7, b: 17 };
  const topDay   = { r: 91, g: 188, b: 255 };
  const horNight = { r: 0, g: 0, b: 0 };
  const horDay   = { r: 191, g: 227, b: 255 };
  const warmCol  = { r: 255, g: 122, b: 40 };

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const mix = (c1: any, c2: any, t: number) => ({
    r: Math.round(lerp(c1.r, c2.r, t)),
    g: Math.round(lerp(c1.g, c2.g, t)),
    b: Math.round(lerp(c1.b, c2.b, t)),
  });
  const toHex = (c: any) =>
    `#${[c.r, c.g, c.b].map(v => v.toString(16).padStart(2, '0')).join('')}`;

  const topBase = mix(topNight, topDay, dayBlend);
  const horBase = mix(horNight, horDay, dayBlend);

  // Teinte chaude près de l’horizon pendant crépuscule/soleil bas
  const topColor = toHex(mix(topBase, warmCol, 0.15 * warm));
  const horizonColor = toHex(mix(horBase, warmCol, 0.60 * warm));

  return `linear-gradient(to top, ${horizonColor}, ${topColor})`;
}

export default function Athmosphere({ gradient, sunAltDeg, zIndex }: Props) {
  const bg = gradient ?? computeGradientFromSunAlt(sunAltDeg);

  return (
    <div
      className="absolute"
      style={{
        // Remplit le wrapper parent; ne pas réappliquer viewport.x/y ici
        left: 0,
        top: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: zIndex ?? (Z.horizon - 20), // was Z.horizon - 8
        background: bg,
      }}
    />
  );
}
