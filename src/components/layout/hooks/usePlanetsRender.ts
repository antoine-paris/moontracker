import { useCallback, useEffect, useMemo, useState } from "react";
import type { ProjectionMode } from "../../../render/projection";
import { PLANET_REGISTRY, PLANET_DOT_MIN_PX } from "../../../render/PlanetRegistry";
import { PLANET_3D_SWITCH_PX } from "../../../render/PlanetRegistry"; // or your constants if defined elsewhere
import { projectToScreen } from "../../../render/projection";
import { altAzToVec, normalize3 } from "../../../utils/vec3";
import { toDeg, toRad, norm360, clamp } from "../../../utils/math";
import { unrefractAltitudeDeg } from "../../../utils/refraction";
import { sepDeg } from "../../../astro/eclipse";
import { localUpAngleOnScreen, localPoleAngleOnScreen, correctedSpriteRotationDeg } from "../../../render/orientation";
import { getPlanetOrientationAngles, type PlanetId } from "../../../astro/planets";
import { PLANET_RENDER_DIAMETER } from "../../../render/constants";

export interface PlanetRenderItem {
  id: string;
  x: number;
  y: number;
  visibleX?: boolean;
  visibleY?: boolean;
  sizePx: number;
  color: string;
  phaseFrac: number;
  angleToSunDeg: number;
  mode: "dot" | "sprite" | "3d";
  distAU: number;
  rotationDeg: number;
  planetAltDeg: number;
  planetAzDeg: number;
  orientationDegX?: number;
  orientationDegY?: number;
  orientationDegZ?: number;
  localUpAnglePlanetDeg?: number;
  rotationToHorizonDegPlanet?: number;
  rotationDegPlanetScreen?: number;
}

export interface UsePlanetsRenderParams {
  planetsEphemArr: any[];
  showPlanets: Record<string, boolean>;

  refAzDeg: number;
  refAltDeg: number;

  viewport: { x: number; y: number; w: number; h: number };
  fovXDeg: number;
  fovYDeg: number;
  projectionMode: ProjectionMode;
  enlargeObjects: boolean;

  astroSun: { alt: number; az: number; distAU: number };
  sunAltForProj: number; // already refracted/unrefracted upstream
  showRefraction: boolean;

  sunScreen: { x: number; y: number };

  date: Date;
  latDeg: number;
  lngDeg: number;

  lockHorizon: boolean;
  eclipticNorthAltAz: { azDeg: number; altDeg: number };

  glbLoading: boolean;
}

const PLANET_3D_SWITCH_DEFAULT = 20; // fallback if constant is not exported

const get3DSwitchPx = () => {
  const v = Number((PLANET_3D_SWITCH_PX as any) ?? PLANET_3D_SWITCH_DEFAULT);
  return Number.isFinite(v) ? v : PLANET_3D_SWITCH_DEFAULT;
};

function angDiff(a: number, b: number) {
  return ((a - b + 540) % 360) - 180;
}

export function usePlanetsRender(params: UsePlanetsRenderParams) {
  const {
    planetsEphemArr,
    showPlanets,
    refAzDeg,
    refAltDeg,
    viewport,
    fovXDeg,
    fovYDeg,
    projectionMode,
    enlargeObjects,
    astroSun,
    sunAltForProj,
    showRefraction,
    sunScreen,
    date,
    latDeg,
    lngDeg,
    lockHorizon,
    eclipticNorthAltAz,
    glbLoading,
  } = params;

  const planetNeeds3D = useCallback(
    (p: PlanetRenderItem) => {
      if (!p.visibleX || !p.visibleY) return false;
      if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) return false;

      const S = Math.max(4, Math.round(p.sizePx));
      const half = S / 2;
      const offscreen =
        p.x + half < viewport.x ||
        p.x - half > viewport.x + viewport.w ||
        p.y + half < viewport.y ||
        p.y - half > viewport.y + viewport.h;
      if (offscreen) return false;

      const effectiveMode = glbLoading && p.mode === "3d" ? "sprite" : p.mode;
      return effectiveMode === "3d";
    },
    [viewport.x, viewport.y, viewport.w, viewport.h, glbLoading]
  );

  const planetsRender: PlanetRenderItem[] = useMemo(() => {
    if (!Array.isArray(planetsEphemArr) || !planetsEphemArr.length) return [];

    const items: PlanetRenderItem[] = [];
    const SWITCH_PX = get3DSwitchPx();

    for (const p of planetsEphemArr) {
      const id = (p as any).id as PlanetId;
      if (!id || !showPlanets[id]) continue;

      const reg = PLANET_REGISTRY[id as keyof typeof PLANET_REGISTRY];
      const color = reg?.color ?? "#9ca3af";

      const altRaw = ((p as any).altDeg ?? (p as any).alt) as number | undefined;
      const az = ((p as any).azDeg ?? (p as any).az) as number | undefined;
      if (altRaw == null || az == null) continue;

      const alt = showRefraction ? altRaw : unrefractAltitudeDeg(altRaw);

      const proj = projectToScreen(
        az,
        alt,
        refAzDeg,
        viewport.w,
        viewport.h,
        refAltDeg,
        0,
        fovXDeg,
        fovYDeg,
        projectionMode,
        lockHorizon,
        eclipticNorthAltAz.azDeg,
        eclipticNorthAltAz.altDeg
      );
      if (!Number.isFinite(proj.x) || !Number.isFinite(proj.y)) continue;

      const projVisible = !!(proj.visibleX && proj.visibleY);
      if (projectionMode === "ortho" && !projVisible) continue;

      const screenX = viewport.x + proj.x;
      const screenY = viewport.y + proj.y;

      const pxPerDegX = proj.pxPerDegX ?? viewport.w / Math.max(1e-9, fovXDeg);
      const pxPerDegY = proj.pxPerDegY ?? viewport.h / Math.max(1e-9, fovYDeg);
      const pxPerDeg = (pxPerDegX + pxPerDegY) / 2;

      const appDiamDeg = Number((p as any).appDiamDeg ?? 0);
      const computedSize = appDiamDeg > 0 ? appDiamDeg * pxPerDeg : 0;

      // OLD
      // let sizePx = enlargeObjects ? Math.max(20, computedSize) : computedSize;
      // const hasValidSize = Number.isFinite(computedSize) && computedSize > 0;
      // if (!hasValidSize && !enlargeObjects) sizePx = PLANET_DOT_MIN_PX;

      // NEW: quand enlargeObjects, imposer au moins la taille de la Lune
      const hasValidSize = Number.isFinite(computedSize) && computedSize > 0;
      let sizePx = computedSize;
      if (enlargeObjects) {
        sizePx = Math.max(PLANET_RENDER_DIAMETER, hasValidSize ? computedSize : 0);
      } else if (!hasValidSize) {
        sizePx = PLANET_DOT_MIN_PX;
      }

      const mode: "dot" | "sprite" | "3d" =
        enlargeObjects
          ? "3d"
          : !hasValidSize || sizePx < PLANET_DOT_MIN_PX
          ? "dot"
          : sizePx >= SWITCH_PX
          ? "3d"
          : "sprite";

      const distAU = Number((p as any).distAU ?? (p as any).distanceAU ?? NaN);

      const half = sizePx / 2;
      const intersectsX = !(screenX + half < viewport.x || screenX - half > viewport.x + viewport.w);
      const intersectsY = !(screenY + half < viewport.y || screenY - half > viewport.y + viewport.h);

      const visibleX = projectionMode === "ortho" ? !!proj.visibleX : intersectsX;
      const visibleY = projectionMode === "ortho" ? !!proj.visibleY : intersectsY;
      if (!visibleX && !visibleY) continue;

      let angleToSunDeg: number;
      {
        const u0 = altAzToVec(az, alt);
        const uS = altAzToVec(astroSun.az, sunAltForProj);
        const dotUS = u0[0] * uS[0] + u0[1] * uS[1] + u0[2] * uS[2];

        const EPS_RAD = toRad(0.05);
        if (1 - Math.abs(dotUS) < 1e-9) {
          const alpha = Math.atan2(sunScreen.y - screenY, sunScreen.x - screenX);
          angleToSunDeg = norm360(toDeg(alpha) + 90);
        } else {
          const t = normalize3([uS[0] - dotUS * u0[0], uS[1] - dotUS * u0[1], uS[2] - dotUS * u0[2]]);
          const wF = normalize3([
            Math.cos(EPS_RAD) * u0[0] + Math.sin(EPS_RAD) * t[0],
            Math.cos(EPS_RAD) * u0[1] + Math.sin(EPS_RAD) * t[1],
            Math.cos(EPS_RAD) * u0[2] + Math.sin(EPS_RAD) * t[2],
          ]);
          const wB = normalize3([
            Math.cos(EPS_RAD) * u0[0] - Math.sin(EPS_RAD) * t[0],
            Math.cos(EPS_RAD) * u0[1] - Math.sin(EPS_RAD) * t[1],
            Math.cos(EPS_RAD) * u0[2] - Math.sin(EPS_RAD) * t[2],
          ]);

          const altF = toDeg(Math.asin(wF[2]));
          const azF = norm360(toDeg(Math.atan2(wF[0], wF[1])));
          const altB = toDeg(Math.asin(wB[2]));
          const azB = norm360(toDeg(Math.atan2(wB[0], wB[1])));

          const pF = projectToScreen(
            azF,
            altF,
            refAzDeg,
            viewport.w,
            viewport.h,
            refAltDeg,
            0,
            fovXDeg,
            fovYDeg,
            projectionMode,
            lockHorizon,
            eclipticNorthAltAz.azDeg,
            eclipticNorthAltAz.altDeg
          );
          const pB = projectToScreen(
            azB,
            altB,
            refAzDeg,
            viewport.w,
            viewport.h,
            refAltDeg,
            0,
            fovXDeg,
            fovYDeg,
            projectionMode,
            lockHorizon,
            eclipticNorthAltAz.azDeg,
            eclipticNorthAltAz.altDeg
          );

          const xF = viewport.x + pF.x,
            yF = viewport.y + pF.y;
          const xB = viewport.x + pB.x,
            yB = viewport.y + pB.y;

          const dxF = xF - screenX,
            dyF = yF - screenY;
          const dxB = xB - screenX,
            dyB = yB - screenY;

          const mF = Math.hypot(dxF, dyF);
          const mB = Math.hypot(dxB, dyB);

          const useBack = mB > mF;
          const alpha = Math.atan2(useBack ? dyB : dyF, useBack ? dxB : dxF);
          let deg = norm360(toDeg(alpha) + 90);
          if (useBack) deg = norm360(deg + 180);
          if (Math.max(mF, mB) < 1e-6) {
            const a = Math.atan2(sunScreen.y - screenY, sunScreen.x - screenX);
            deg = norm360(toDeg(a) + 90);
          }
          angleToSunDeg = deg;
        }
      }

      let phaseFrac = Number((p as any).phaseFraction);
      if (!Number.isFinite(phaseFrac)) {
        const sep = sepDeg(alt, az, astroSun.alt, astroSun.az);
        phaseFrac = clamp((1 + Math.cos((sep * Math.PI) / 180)) / 2, 0, 1);
      } else {
        phaseFrac = clamp(phaseFrac, 0, 1);
      }

      const rotationDeg = angleToSunDeg - 90;

      const ori = (p as any).orientationXYZDeg;
      const orientationDegX = Number.isFinite(ori?.x) ? Number(ori.x) : undefined;
      const orientationDegY = Number.isFinite(ori?.y) ? Number(ori.y) : undefined;
      const orientationDegZ = Number.isFinite(ori?.z) ? Number(ori.z) : undefined;

      const ctxAngles = {
        refAz: refAzDeg,
        refAlt: refAltDeg,
        viewport: { w: viewport.w, h: viewport.h },
        fovXDeg,
        fovYDeg,
        projectionMode,
        lockHorizon,
        eclipticUpAzDeg: eclipticNorthAltAz.azDeg,
        eclipticUpAltDeg: eclipticNorthAltAz.altDeg,
      };
      const localUpH = localUpAngleOnScreen(az, alt, ctxAngles);
      const localUpE = localPoleAngleOnScreen(az, alt, eclipticNorthAltAz.azDeg, eclipticNorthAltAz.altDeg, ctxAngles);
      const chosenLocalAngle = lockHorizon ? localUpH : localUpE;
      const deltaRef = lockHorizon ? 0 : angDiff(localUpE, localUpH);

      let rotationToHorizonDegPlanet: number | undefined;
      try {
        const po = getPlanetOrientationAngles(date, latDeg, lngDeg, id as PlanetId);
        rotationToHorizonDegPlanet =
          (po as any)?.rotationToHorizonDegPlanetNorth ??
          (po as any)?.rotationToHorizonDegPlanet ??
          (po as any)?.rotationToHorizonDeg ??
          undefined;
      } catch {
        // ignore
      }

      const rotationToChosenDeg = Number.isFinite(rotationToHorizonDegPlanet)
        ? (rotationToHorizonDegPlanet as number) - deltaRef
        : 0;

      const rotationDegPlanetScreen = correctedSpriteRotationDeg(rotationToChosenDeg, chosenLocalAngle);

      items.push({
        id,
        x: screenX,
        y: screenY,
        visibleX: intersectsX,
        visibleY: intersectsY,
        sizePx,
        color,
        phaseFrac,
        angleToSunDeg,
        mode,
        distAU,
        rotationDeg,
        planetAltDeg: alt,
        planetAzDeg: az,
        orientationDegX,
        orientationDegY,
        orientationDegZ,
        localUpAnglePlanetDeg: chosenLocalAngle,
        rotationToHorizonDegPlanet,
        rotationDegPlanetScreen,
      });
    }

    // Render back-to-front (farther first)
    items.sort((a, b) => (b.distAU - a.distAU));
    return items;
  }, [
    planetsEphemArr,
    showPlanets,
    refAzDeg,
    viewport.w,
    viewport.h,
    viewport.x,
    viewport.y,
    refAltDeg,
    fovXDeg,
    fovYDeg,
    projectionMode,
    enlargeObjects,
    astroSun.az,
    astroSun.alt,
    sunAltForProj,
    showRefraction,
    sunScreen.x,
    sunScreen.y,
    date,
    latDeg,
    lngDeg,
    lockHorizon,
    eclipticNorthAltAz.azDeg,
    eclipticNorthAltAz.altDeg,
  ]);

  // Readiness gating (first-time 3D ready)
  const [readyPlanetIds, setReadyPlanetIds] = useState<Set<string>>(new Set());
  const [everReadyPlanetIds, setEverReadyPlanetIds] = useState<Set<string>>(new Set());

  const neededPlanetIds = useMemo(
    () => planetsRender.filter(planetNeeds3D).map((p) => p.id as string),
    [planetsRender, planetNeeds3D]
  );

  useEffect(() => {
    setReadyPlanetIds((prev) => {
      const next = new Set<string>();
      for (const id of neededPlanetIds) if (prev.has(id)) next.add(id);
      return next;
    });
  }, [neededPlanetIds]);

  const gatingPlanetIds = useMemo(
    () => neededPlanetIds.filter((id) => !everReadyPlanetIds.has(id)),
    [neededPlanetIds, everReadyPlanetIds]
  );

  const markPlanetReady = useCallback((id: string) => {
    setReadyPlanetIds((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
    setEverReadyPlanetIds((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
  }, []);

  const planetsReady = useMemo(() => {
    if (!gatingPlanetIds.length) return true;
    for (const id of gatingPlanetIds) if (!readyPlanetIds.has(id)) return false;
    return true;
  }, [gatingPlanetIds, readyPlanetIds]);

  return {
    planetsRender,
    planetsReady,
    markPlanetReady,
  };
}