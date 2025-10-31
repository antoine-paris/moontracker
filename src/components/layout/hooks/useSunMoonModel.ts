import { useMemo } from "react";

// Astro core
import {
  getSunAndMoonAltAzDeg,
  getMoonIllumination,
  getMoonLibration,
  moonHorizontalParallaxDeg,
  topocentricMoonDistanceKm,
  getSunOrientationAngles,
  getMoonOrientationAngles,
  sunOnMoon,
} from "../../../astro/aeInterop";
import { sunApparentDiameterDeg } from "../../../astro/sun";
import { moonApparentDiameterDeg } from "../../../astro/moon";
import { altAzFromRaDec } from "../../../astro/stars";

// Math / projection
import { clamp, norm360 } from "../../../utils/math";
import { projectToScreen, type ProjectionMode } from "../../../render/projection";
import { localPoleAngleOnScreen, localUpAngleOnScreen, correctedSpriteRotationDeg } from "../../../render/orientation";
import { unrefractAltitudeDeg } from "../../../utils/refraction";

// Constants
import { MOON_RENDER_DIAMETER } from "../../../render/constants";

const MOON_DOT_PX = 5;
const MOON_3D_SWITCH_PX = 20;

export interface UseSunMoonModelParams {
  date: Date;
  latDeg: number;
  lngDeg: number;

  viewport: { x: number; y: number; w: number; h: number };
  refAzDeg: number;
  refAltDeg: number;
  fovXDeg: number;
  fovYDeg: number;
  projectionMode: ProjectionMode;
  lockHorizon: boolean;

  showRefraction: boolean;
  enlargeObjects: boolean;
  glbLoading: boolean;
}

export function useSunMoonModel(params: UseSunMoonModelParams) {
  const {
    date, latDeg, lngDeg,
    viewport, refAzDeg, refAltDeg, fovXDeg, fovYDeg, projectionMode, lockHorizon,
    showRefraction, enlargeObjects, glbLoading,
  } = params;

  // Base ephemerides + apparent diameters + libration
  const astro = useMemo(() => {
    const both = getSunAndMoonAltAzDeg(date, latDeg, lngDeg);
    const sun = both.sun;
    const moon = both.moon;

    const illum = getMoonIllumination(date);
    const sunDiamDeg = sunApparentDiameterDeg(date, sun.distAU);

    const moonParallaxDeg = moonHorizontalParallaxDeg(moon.distanceKm);
    const moonTopoKm = topocentricMoonDistanceKm(moon.distanceKm, moon.altDeg);
    const moonDiamDeg = moonApparentDiameterDeg(moonTopoKm);

    let moonLibrationTopo:
      | { latDeg: number; lonDeg: number; paDeg: number }
      | undefined;
    try {
      moonLibrationTopo = getMoonLibration(date, { lat: latDeg, lng: lngDeg });
    } catch {
      // ignore
    }

    return {
      sun: { alt: sun.altDeg, az: sun.azDeg, distAU: sun.distAU, appDiamDeg: sunDiamDeg },
      moon: {
        alt: moon.altDeg,
        az: moon.azDeg,
        parallacticDeg: moonParallaxDeg,
        distKm: moon.distanceKm,
        topoDistKm: moonTopoKm,
        appDiamDeg: moonDiamDeg,
        librationTopo: moonLibrationTopo,
      },
      illum,
    };
  }, [date, latDeg, lngDeg]);

  // Ecliptic north (for “lock horizon” logic and sprite orientation)
  const eclipticNorthAltAz = useMemo(
    () => altAzFromRaDec(date, latDeg, lngDeg, 270, 66.5607),
    [date, latDeg, lngDeg]
  );

  // Projection altitude (with/without refraction)
  const sunAltForProj = useMemo(
    () => (showRefraction ? astro.sun.alt : unrefractAltitudeDeg(astro.sun.alt)),
    [showRefraction, astro.sun.alt]
  );
  const moonAltForProj = useMemo(
    () => (showRefraction ? astro.moon.alt : unrefractAltitudeDeg(astro.moon.alt)),
    [showRefraction, astro.moon.alt]
  );

  // Orientation to horizon (solar/lunar “north”), then rebase to chosen local angle (horizon or ecliptic)
  const rotationToHorizonDegSun = useMemo(
    () => getSunOrientationAngles(date, latDeg, lngDeg).rotationToHorizonDegSolarNorth,
    [date, latDeg, lngDeg]
  );
  const rotationToHorizonDegMoon = useMemo(
    () => getMoonOrientationAngles(date, latDeg, lngDeg).rotationToHorizonDegMoonNorth,
    [date, latDeg, lngDeg]
  );

  const angDiff = (a: number, b: number) => ((a - b + 540) % 360) - 180;

  const sunAngles = useMemo(() => {
    const ctx = {
      refAz: refAzDeg, refAlt: refAltDeg,
      viewport: { w: viewport.w, h: viewport.h },
      fovXDeg, fovYDeg, projectionMode,
      lockHorizon,
      eclipticUpAzDeg: eclipticNorthAltAz.azDeg,
      eclipticUpAltDeg: eclipticNorthAltAz.altDeg,
    };
    const aH = localUpAngleOnScreen(astro.sun.az, sunAltForProj, ctx);
    const aE = localPoleAngleOnScreen(astro.sun.az, sunAltForProj, eclipticNorthAltAz.azDeg, eclipticNorthAltAz.altDeg, ctx);
    return { aH, aE };
  }, [astro.sun.az, sunAltForProj, refAzDeg, refAltDeg, viewport.w, viewport.h, fovXDeg, fovYDeg, projectionMode, lockHorizon, eclipticNorthAltAz.azDeg, eclipticNorthAltAz.altDeg]);

  const moonAngles = useMemo(() => {
    const ctx = {
      refAz: refAzDeg, refAlt: refAltDeg,
      viewport: { w: viewport.w, h: viewport.h },
      fovXDeg, fovYDeg, projectionMode,
      lockHorizon,
      eclipticUpAzDeg: eclipticNorthAltAz.azDeg,
      eclipticUpAltDeg: eclipticNorthAltAz.altDeg,
    };
    const aH = localUpAngleOnScreen(astro.moon.az, moonAltForProj, ctx);
    const aE = localPoleAngleOnScreen(astro.moon.az, moonAltForProj, eclipticNorthAltAz.azDeg, eclipticNorthAltAz.altDeg, ctx);
    return { aH, aE };
  }, [astro.moon.az, moonAltForProj, refAzDeg, refAltDeg, viewport.w, viewport.h, fovXDeg, fovYDeg, projectionMode, lockHorizon, eclipticNorthAltAz.azDeg, eclipticNorthAltAz.altDeg]);

  const rotationDegSunScreen = useMemo(() => {
    const chosenAngle = lockHorizon ? sunAngles.aH : sunAngles.aE;
    const deltaRef = lockHorizon ? 0 : angDiff(sunAngles.aE, sunAngles.aH);
    const rotationToChosen = rotationToHorizonDegSun - deltaRef;
    return correctedSpriteRotationDeg(rotationToChosen, chosenAngle);
  }, [rotationToHorizonDegSun, lockHorizon, sunAngles.aH, sunAngles.aE]);

  const rotationDegMoonScreen = useMemo(() => {
    const chosenAngle = lockHorizon ? moonAngles.aH : moonAngles.aE;
    const deltaRef = lockHorizon ? 0 : angDiff(moonAngles.aE, moonAngles.aH);
    const rotationToChosen = rotationToHorizonDegMoon - deltaRef;
    return correctedSpriteRotationDeg(rotationToChosen, chosenAngle);
  }, [rotationToHorizonDegMoon, lockHorizon, moonAngles.aH, moonAngles.aE]);

  // Screens
  const sunScreen = useMemo(() => {
    const s = projectToScreen(
      astro.sun.az, sunAltForProj,
      refAzDeg, viewport.w, viewport.h, refAltDeg, 0,
      fovXDeg, fovYDeg, projectionMode, lockHorizon,
      eclipticNorthAltAz.azDeg, eclipticNorthAltAz.altDeg
    );
    return { ...s, x: viewport.x + s.x, y: viewport.y + s.y };
  }, [astro.sun.az, sunAltForProj, refAzDeg, refAltDeg, viewport, fovXDeg, fovYDeg, projectionMode, lockHorizon, eclipticNorthAltAz.azDeg, eclipticNorthAltAz.altDeg]);

  const moonScreen = useMemo(() => {
    const m = projectToScreen(
      astro.moon.az, moonAltForProj,
      refAzDeg, viewport.w, viewport.h, refAltDeg, 0,
      fovXDeg, fovYDeg, projectionMode, lockHorizon,
      eclipticNorthAltAz.azDeg, eclipticNorthAltAz.altDeg
    );
    return { ...m, x: viewport.x + m.x, y: viewport.y + m.y };
  }, [astro.moon.az, moonAltForProj, refAzDeg, refAltDeg, viewport, fovXDeg, fovYDeg, projectionMode, lockHorizon, eclipticNorthAltAz.azDeg, eclipticNorthAltAz.altDeg]);

  // Pixel sizes for sprites
  const bodySizes = useMemo(() => {
    const centerSun = projectToScreen(
      astro.sun.az, sunAltForProj, refAzDeg, viewport.w, viewport.h, refAltDeg, 0,
      fovXDeg, fovYDeg, projectionMode, lockHorizon,
      eclipticNorthAltAz.azDeg, eclipticNorthAltAz.altDeg
    );
    const centerMoon = projectToScreen(
      astro.moon.az, moonAltForProj, refAzDeg, viewport.w, viewport.h, refAltDeg, 0,
      fovXDeg, fovYDeg, projectionMode, lockHorizon,
      eclipticNorthAltAz.azDeg, eclipticNorthAltAz.altDeg
    );
    const pxPerDegXSun = centerSun.pxPerDegX || (viewport.w / Math.max(1e-9, fovXDeg));
    const pxPerDegYSun = centerSun.pxPerDegY || (viewport.h / Math.max(1e-9, fovYDeg));
    const pxPerDegXMoon = centerMoon.pxPerDegX || (viewport.w / Math.max(1e-9, fovXDeg));
    const pxPerDegYMoon = centerMoon.pxPerDegY || (viewport.h / Math.max(1e-9, fovYDeg));

    const sunWCalc = (astro.sun.appDiamDeg ?? 0) * pxPerDegXSun;
    const sunHCalc = (astro.sun.appDiamDeg ?? 0) * pxPerDegYSun;
    const sunW = enlargeObjects ? Math.max(MOON_RENDER_DIAMETER, sunWCalc) : sunWCalc;
    const sunH = enlargeObjects ? Math.max(MOON_RENDER_DIAMETER, sunHCalc) : sunHCalc;

    const moonWCalc = (astro.moon.appDiamDeg ?? 0) * pxPerDegXMoon;
    const moonHCalc = (astro.moon.appDiamDeg ?? 0) * pxPerDegYMoon;
    const moonW = enlargeObjects ? Math.max(MOON_RENDER_DIAMETER, moonWCalc) : moonWCalc;
    const moonH = enlargeObjects ? Math.max(MOON_RENDER_DIAMETER, moonHCalc) : moonHCalc;

    const sunR = Math.max(sunW, sunH) / 2;
    const moonR = Math.max(moonW, moonH) / 2;

    return { sun: { w: sunW, h: sunH, r: sunR }, moon: { w: moonW, h: moonH, r: moonR } };
  }, [
    viewport, fovXDeg, fovYDeg, projectionMode,
    astro.sun.az, sunAltForProj, astro.moon.az, moonAltForProj,
    astro.sun.appDiamDeg, astro.moon.appDiamDeg, refAzDeg, refAltDeg, enlargeObjects,
    lockHorizon, eclipticNorthAltAz.azDeg, eclipticNorthAltAz.altDeg
  ]);

  // Lune apparent px for render mode
  const moonApparentPx = useMemo(() => {
    const p = projectToScreen(
      astro.moon.az, moonAltForProj, refAzDeg, viewport.w, viewport.h, refAltDeg, 0,
      fovXDeg, fovYDeg, projectionMode, lockHorizon,
      eclipticNorthAltAz.azDeg, eclipticNorthAltAz.altDeg
    );
    const pxPerDegX = p.pxPerDegX ?? (viewport.w / Math.max(1e-9, fovXDeg));
    const pxPerDegY = p.pxPerDegY ?? (viewport.h / Math.max(1e-9, fovYDeg));
    const pxPerDeg = (pxPerDegX + pxPerDegY) / 2;
    return (astro.moon.appDiamDeg ?? 0) * pxPerDeg;
  }, [astro.moon.az, moonAltForProj, astro.moon.appDiamDeg, refAzDeg, refAltDeg, viewport, fovXDeg, fovYDeg, projectionMode, lockHorizon, eclipticNorthAltAz.azDeg, eclipticNorthAltAz.altDeg]);

  const moonRenderMode = useMemo<'dot' | 'sprite' | '3d'>(() => {
    if (enlargeObjects) return '3d';
    if (!Number.isFinite(moonApparentPx)) return 'sprite';
    if (moonApparentPx < MOON_DOT_PX) return 'dot';
    if (moonApparentPx < MOON_3D_SWITCH_PX) return 'sprite';
    return '3d';
  }, [enlargeObjects, moonApparentPx]);

  const moonRenderModeEffective = useMemo(
    () => (glbLoading && moonRenderMode === '3d' ? 'sprite' : moonRenderMode),
    [glbLoading, moonRenderMode]
  );

  // Sun-on-Moon: bright limb and mask angle (phase border)
  const sunOnMoonInfo = useMemo(() => sunOnMoon(date), [date]);
  const brightLimbAngleDeg = useMemo(() => sunOnMoonInfo.bearingDeg, [sunOnMoonInfo]);
  const maskAngleBase = useMemo(() => norm360(brightLimbAngleDeg - 90), [brightLimbAngleDeg]);
  const maskAngleDeg = useMemo(() => {
    const litVecAngle = norm360(maskAngleBase + 90);
    let d = norm360(litVecAngle - brightLimbAngleDeg); if (d > 180) d = 360 - d;
    return d > 90 ? norm360(maskAngleBase + 180) : maskAngleBase;
  }, [maskAngleBase, brightLimbAngleDeg]);

  const phaseFraction = clamp(astro.illum.fraction ?? 0, 0, 1);

  return {
    // Ephemerides and helpers
    astro,
    eclipticNorthAltAz,
    sunAltForProj,
    moonAltForProj,

    // Projections and sizes
    sunScreen,
    moonScreen,
    bodySizes,

    // Rotations (screen)
    rotationDegSunScreen,
    rotationDegMoonScreen,

    // Phase/mask
    phaseFraction,
    brightLimbAngleDeg,
    maskAngleDeg,

    // Moon render mode
    moonRenderMode,
    moonRenderModeEffective,
  };
}