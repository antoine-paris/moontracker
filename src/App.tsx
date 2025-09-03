import React, { useEffect, useMemo, useRef, useState } from "react";
// SunCalc interop ESM/CJS
import * as SunCalcNS from "suncalc";
const SunCalc: typeof import("suncalc") = (SunCalcNS as { default?: typeof import("suncalc") }).default ?? SunCalcNS;

// --- Types & constants -------------------------------------------------------
export type FollowMode = 'SOLEIL' | 'LUNE' | 'N' | 'E' | 'S' | 'O';

type LocationOption = {
  id: string;
  label: string; // Pays — Capitale
  lat: number;
  lng: number;
  timeZone: string;
};

const LOCATIONS: LocationOption[] = [
  { id: "no", label: "Norvège — Oslo", lat: 59.9139, lng: 10.7522, timeZone: "Europe/Oslo" },
  { id: "dk", label: "Danemark — Copenhague", lat: 55.6761, lng: 12.5683, timeZone: "Europe/Copenhagen" },
  { id: "fr", label: "France — Paris", lat: 48.8566, lng: 2.3522, timeZone: "Europe/Paris" },
  { id: "dz", label: "Algérie — Alger", lat: 36.7538, lng: 3.0588, timeZone: "Africa/Algiers" },
  { id: "ml", label: "Mali — Bamako", lat: 12.6392, lng: -8.0029, timeZone: "Africa/Bamako" },
  { id: "gh", label: "Ghana — Accra", lat: 5.6037, lng: -0.1870, timeZone: "Africa/Accra" },
  { id: "ga", label: "Gabon — Libreville", lat: 0.4162, lng: 9.4673, timeZone: "Africa/Libreville" },
  { id: "za", label: "Afrique du Sud — Pretoria", lat: -25.7479, lng: 28.2293, timeZone: "Africa/Johannesburg" },
];

// NASA image specs
const NASA_IMG =
  "https://svs.gsfc.nasa.gov/vis/a000000/a005100/a005187/frames/730x730_1x1_30p/moon.2709.jpg";
const NASA_IMG_TOTAL = 730;
const NASA_IMG_MARGIN = 53; // each side
const MOON_DISC_DIAMETER = NASA_IMG_TOTAL - 2 * NASA_IMG_MARGIN; // 624
const MOON_SCALE = 0.2; // 20%
const MOON_RENDER_DIAMETER = MOON_DISC_DIAMETER * MOON_SCALE; // ~124.8 px

// z-index policy (low→high): Sun (10), Moon (20), Phase (30), Horizon (40), UI (50)
const Z = { sun: 10, moon: 20, phase: 30, horizon: 40, ui: 50 } as const;

// 16-wind rose (French)
const ROSE_16 = [
  "N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSO","SO","OSO","O","ONO","NO","NNO",
];

// Field of View 220° (±110°)
const FOV_HALF = 110;

// --- Terminator LUT (1% steps for 1..49) ------------------------------------
// User-supplied table for the concave/crescent side (1..49%).
// We mirror it around 50% for 51..99%. The 49.5..50.5% window uses the straight chord.
// rR = r/R, dR = d/R where R is lunar disc radius in SVG space (R=312).
const TERMINATOR_LUT_CRES: Array<{ f: number; rR: number; dR: number }> = [
  { f: 1, rR: 1.0001264814647446, dR: 0.015905311284288598 },
  { f: 2, rR: 1.0005189337402591, dR: 0.032220129930605704 },
  { f: 3, rR: 1.0011982171783809, dR: 0.0489680516374513 },
  { f: 4, rR: 1.0021871516206684, dR: 0.0661746694253082 },
  { f: 5, rR: 1.0035107408330763, dR: 0.08386779457783547 },
  { f: 6, rR: 1.0051964277809604, dR: 0.10207770777012667 },
  { f: 7, rR: 1.0072743857507385, dR: 0.12083744531198748 },
  { f: 8, rR: 1.009777851272342, dR: 0.14018312637471136 },
  { f: 9, rR: 1.012743505951352, dR: 0.1601543282169932 },
  { f: 10, rR: 1.0162119157330227, dR: 0.18079451783110112 },
  { f: 11, rR: 1.0202280378583408, dR: 0.20215155016046849 },
  { f: 12, rR: 1.0248418079201134, dR: 0.2242782451798805 },
  { f: 13, rR: 1.0301088220954107, dR: 0.24723305879027258 },
  { f: 14, rR: 1.0360911329638598, dR: 0.27108086580637625 },
  { f: 15, rR: 1.0428581815090696, dR: 0.2958938774973282 },
  { f: 16, rR: 1.0504878931939987, dR: 0.3217527214293078 },
  { f: 17, rR: 1.0590679727352954, dR: 0.3487477180909553 },
  { f: 18, rR: 1.0686974408266428, dR: 0.3769803974073659 },
  { f: 19, rR: 1.0794884671868006, dR: 0.4065653093776056 },
  { f: 20, rR: 1.0915685687681047, dR: 0.4376321975385823 },
  { f: 21, rR: 1.1050832609056234, dR: 0.47032862291572897 },
  { f: 22, rR: 1.1201992742182008, dR: 0.504823151171758 },
  { f: 23, rR: 1.137108483445354, dR: 0.5413092490650726 },
  { f: 24, rR: 1.1560327393280965, dR: 0.5800100812903364 },
  { f: 25, rR: 1.177229855739742, dR: 0.6211844599191243 },
  { f: 26, rR: 1.2010010882861943, dR: 0.6651342827314068 },
  { f: 27, rR: 1.2277005574908788, dR: 0.7122139136968713 },
  { f: 28, rR: 1.2577472344081828, dR: 0.7628421236805374 },
  { f: 29, rR: 1.2916403418540163, dR: 0.817517444893233 },
  { f: 30, rR: 1.329979365717774, dR: 0.8768381339991167 },
  { f: 31, rR: 1.3734903737872348, dR: 0.9415284418891432 },
  { f: 32, rR: 1.423061094014365, dR: 1.0124736427667447 },
  { f: 33, rR: 1.4797883581433566, dR: 1.0907674293343246 },
  { f: 34, rR: 1.5450433198074405, dR: 1.1777770842063435 },
  { f: 35, rR: 1.6205627413815176, dR: 1.2752347230035652 },
  { f: 36, rR: 1.708579383912963, dR: 1.385367644754417 },
  { f: 37, rR: 1.8120125561567524, dR: 1.5110888470469654 },
  { f: 38, rR: 1.934753916832045, dR: 1.6562828015459616 },
  { f: 39, rR: 2.0821091481231946, dR: 1.8262471094291417 },
  { f: 40, rR: 2.2615046139555948, dR: 2.028399151780153 },
  { f: 41, rR: 2.4836651076412486, dR: 2.273453840946549 },
  { f: 42, rR: 2.764674899487546, dR: 2.5774846846987227 },
  { f: 43, rR: 3.1298053942812034, dR: 2.965751474090794 },
  { f: 44, rR: 3.62117045660428, dR: 3.4803556536342155 },
  { f: 45, rR: 4.314568156014174, dR: 4.197082126059907 },
  { f: 46, rR: 5.361585189118876, dR: 5.267503748473169 },
  { f: 47, rR: 7.11591025436942, dR: 7.045294794984796 },
  { f: 48, rR: 10.638587756722007, dR: 10.591484761707179 },
  { f: 49, rR: 21.23479422889962, dR: 21.211234899074327 },
];

// Interpolate LUT_CRES for a given percentage in 1..49 (linear between integer entries)
function interpCres(pct: number) {
  const p = Math.min(49, Math.max(1, pct));
  const i0 = Math.floor(p);
  const i1 = Math.ceil(p);
  if (i0 === i1) {
    const row = TERMINATOR_LUT_CRES.find(x => x.f === i0)!;
    return { rR: row.rR, dR: row.dR };
  }
  const a = TERMINATOR_LUT_CRES.find(x => x.f === i0)!;
  const b = TERMINATOR_LUT_CRES.find(x => x.f === i1)!;
  const t = (p - i0) / (i1 - i0);
  return { rR: a.rR + (b.rR - a.rR) * t, dR: a.dR + (b.dR - a.dR) * t };
}

// Sample function for any fraction (0..1), mirroring around 50%.
function sampleTerminatorLUT(frac: number) {
  const pct = Math.max(0, Math.min(100, frac * 100));
  if (pct <= 50) {
    // use 1..49; clamp 0 to 1
    const p = pct < 1 ? 1 : pct > 49 ? 49 : pct;
    return interpCres(p);
  } else {
    // mirror: 51..99 map to 49..1
    const p = 100 - pct; // 0..49
    const pm = p < 1 ? 1 : p > 49 ? 49 : p;
    return interpCres(pm);
  }
}

// --- Utility functions -------------------------------------------------------
const toDeg = (rad: number) => (rad * 180) / Math.PI;
const toRad = (deg: number) => (deg * Math.PI) / 180;
const norm360 = (deg: number) => ((deg % 360) + 360) % 360;
const angularDiff = (a: number, b: number) => {
  let d = norm360(a - b);
  if (d > 180) d -= 360;
  return d; // [-180, +180]
};
const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

function azFromSunCalc(radAz: number): number {
  // SunCalc: azimuth measured from South, positive towards West
  // Convert to compass azimuth (0=N, 90=E, 180=S, 270=O)
  return norm360(toDeg(radAz) + 180);
}
function compass16(az: number): string {
  const idx = Math.round(norm360(az) / 22.5) % 16;
  return ROSE_16[idx];
}
function formatDeg(value: number, digits = 1): string {
  const sign = value >= 0 ? "" : "-";
  return `${sign}${Math.abs(value).toFixed(digits)}°`;
}
function toDatetimeLocalInputValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}`;
}
// Format time HH:MM in a specific IANA timezone based on the current date used for rendering
function formatTimeInZone(d: Date, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat('fr-FR', { timeZone, hour: '2-digit', minute: '2-digit', hour12: false }).format(d);
  } catch {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  }
}

// --- Sidereal time & alt/az -> RA/Dec helpers (Option B) ----------------------
function julianDay(date: Date): number { return date.getTime() / 86400000 + 2440587.5; }
function gmstDeg(date: Date): number {
  const JD = julianDay(date);
  const D = JD - 2451545.0; // days since J2000.0
  const T = D / 36525.0;
  const GMST = 280.46061837 + 360.98564736629 * D + 0.000387933 * T * T - (T * T * T) / 38710000.0;
  return norm360(GMST);
}
function lstDeg(date: Date, lonDeg: number): number { return norm360(gmstDeg(date) + lonDeg); }
// Convert alt/az (A from North->East, alt=h) to RA/Dec using site lat and LST
function altazToRaDec(azDeg: number, altDeg: number, latDeg: number, lstDegVal: number) {
  // Inputs: azDeg measured from NORTH toward EAST (0°=N, 90°=E), altDeg=h
  const A = toRad(azDeg);
  const h = toRad(altDeg);
  const phi = toRad(latDeg);
  // Correct north-referenced formulas
  // sinδ = sinφ·sinh + cosφ·cosh·cosA
  const sinDelta = Math.sin(phi) * Math.sin(h) + Math.cos(phi) * Math.cos(h) * Math.cos(A);
  const delta = Math.asin(Math.max(-1, Math.min(1, sinDelta)));
  const cosDelta = Math.max(1e-9, Math.cos(delta));
  // Hour angle H with A from North→East:
  // sinH = - (sinA · cosh) / cosδ
  // cosH = (sinh − sinφ·sinδ) / (cosφ·cosδ)
  const sinH = -(Math.sin(A) * Math.cos(h)) / cosDelta;
  const cosH = (Math.sin(h) - Math.sin(phi) * Math.sin(delta)) / (Math.max(1e-9, Math.cos(phi) * cosDelta));
  const H = Math.atan2(sinH, cosH); // radians (−π..+π), positive westward
  // RA = LST − H
  let ra = toRad(lstDegVal) - H;
  ra = ((ra % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  return { raDeg: toDeg(ra), decDeg: toDeg(delta), Hdeg: toDeg(H) };
}

// Map (az, alt) to screen (x, y) within ±110°
function projectToScreen(
  azDeg: number,
  altDeg: number,
  refAzDeg: number,
  width: number,
  height: number,
  refAltDeg: number = 0,
  radiusPx: number = 0
) {
  const dx = angularDiff(azDeg, refAzDeg); // [-180, +180]
  // Convert pixel radius to angular margin in both axes
  const marginXDeg = width > 0 ? (radiusPx / (width / 2)) * FOV_HALF : 0;
  const marginYDeg = height > 0 ? (radiusPx / (height / 2)) * FOV_HALF : 0;
  const visibleX = Math.abs(dx) <= (FOV_HALF + marginXDeg);
  const visibleY = Math.abs(altDeg - refAltDeg) <= (FOV_HALF + marginYDeg);
  const x = width / 2 + (dx / FOV_HALF) * (width / 2);
  const y = height / 2 - ((altDeg - refAltDeg) / FOV_HALF) * (height / 2);
  return { x, y, visibleX, visibleY };
}

// Parallactic angle (deg) from alt-az and latitude
// q = atan2( sin(A), tan(phi)*cos(h) - sin(h)*cos(A) )
function parallacticAngleDeg(azDeg: number, altDeg: number, latDeg: number): number {
  const A = (azDeg * Math.PI) / 180;
  const h = (altDeg * Math.PI) / 180;
  const phi = (latDeg * Math.PI) / 180;
  const num = Math.sin(A);
  const den = Math.tan(phi) * Math.cos(h) - Math.sin(h) * Math.cos(A);
  const q = Math.atan2(num, den);
  return (q * 180) / Math.PI;
}

// --- Main Component ----------------------------------------------------------
export default function App() {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [stageSize, setStageSize] = useState({ w: 800, h: 500 });

  // Controls
  const [location, setLocation] = useState<LocationOption>(LOCATIONS[2]); // default Paris
  const [when, setWhen] = useState<string>(() => toDatetimeLocalInputValue(new Date()));
  const [follow, setFollow] = useState<FollowMode>('LUNE');
  const [showSun, setShowSun] = useState(true);
  const [showMoon, setShowMoon] = useState(true);
  const [showPhase, setShowPhase] = useState(true);
  const [earthshine, setEarthshine] = useState(false);
  // Overlays N/E/S/O sur les corps
  const [showSunCard, setShowSunCard] = useState(false);
  const [showMoonCard, setShowMoonCard] = useState(false);
  const [debugMask, setDebugMask] = useState(false);
  // Toggle for locations sidebar
  const [showLocations, setShowLocations] = useState(true);

  // Animation
  const [isAnimating, setIsAnimating] = useState(false);
  const [speedMinPerSec, setSpeedMinPerSec] = useState<number>(0); // -360..+360 (0 par défaut)
  const rafIdRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const whenMsRef = useRef<number>(Date.parse(when));
  const handleWhenChange = (val: string) => {
    setIsAnimating(false); // pause quand on modifie la date
    setWhen(val);
    whenMsRef.current = Date.parse(val);
  };

  // Resize (use ResizeObserver so stage fills space during sidebar animation)
  useEffect(() => {
    const update = () => {
      if (!stageRef.current) return;
      const rect = stageRef.current.getBoundingClientRect();
      setStageSize({ w: rect.width, h: rect.height });
    };
    update();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && stageRef.current) {
      ro = new ResizeObserver(() => update());
      ro.observe(stageRef.current);
    }
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
      if (ro) ro.disconnect();
    };
  }, []);

  // Keep ref in sync when paused
  useEffect(() => { if (!isAnimating) { whenMsRef.current = Date.parse(when); } }, [when, isAnimating]);

  // Parsed date
  const date = useMemo(() => new Date(when), [when]);

  // Astronomical positions
  const astro = useMemo(() => {
    const { lat, lng } = location;
    const sun = SunCalc.getPosition(date, lat, lng);
    const moon = SunCalc.getMoonPosition(date, lat, lng) as import("suncalc").GetMoonPositionResult & { parallacticAngle?: number };
    const illum = SunCalc.getMoonIllumination(date);
    const sunAlt = toDeg(sun.altitude);
    const sunAz = azFromSunCalc(sun.azimuth);
    const moonAlt = toDeg(moon.altitude);
    const moonAz = azFromSunCalc(moon.azimuth);
    const parallacticDeg = toDeg(moon.parallacticAngle ?? 0);
    return { sun: { alt: sunAlt, az: sunAz }, moon: { alt: moonAlt, az: moonAz, parallacticDeg }, illum };
  }, [date, location]);

  // Reference azimuth & altitude (follow mode)
  const refAz = useMemo(() => {
    switch (follow) {
      case 'SOLEIL': return astro.sun.az;
      case 'LUNE': return astro.moon.az;
      case 'N': return 0;
      case 'E': return 90;
      case 'S': return 180;
      case 'O': return 270;
    }
  }, [follow, astro]);
  const refAlt = useMemo(() => (follow === 'SOLEIL' ? astro.sun.alt : follow === 'LUNE' ? astro.moon.alt : 0), [follow, astro]);

  // Screen positions
  const sunScreen = useMemo(() => projectToScreen(astro.sun.az, astro.sun.alt, refAz, stageSize.w, stageSize.h, refAlt, MOON_RENDER_DIAMETER / 2), [astro.sun, refAz, refAlt, stageSize]);
  const moonScreen = useMemo(() => projectToScreen(astro.moon.az, astro.moon.alt, refAz, stageSize.w, stageSize.h, refAlt, MOON_RENDER_DIAMETER / 2), [astro.moon, refAz, refAlt, stageSize]);

  // Orientation & phase
  const rotationToHorizonDegMoon = useMemo(() => -parallacticAngleDeg(astro.moon.az, astro.moon.alt, location.lat), [astro.moon, location.lat]);
  const rotationToHorizonDegSun = useMemo(() => -parallacticAngleDeg(astro.sun.az, astro.sun.alt, location.lat), [astro.sun, location.lat]);
  // Angle du limbe éclairé P (Option B RA/Dec), retourné de 180° pour pointer vers le Soleil
  const brightLimbAngleDeg = useMemo(() => {
    const LST = lstDeg(date, location.lng);
    const sunEQ = altazToRaDec(astro.sun.az, astro.sun.alt, location.lat, LST);
    const moonEQ = altazToRaDec(astro.moon.az, astro.moon.alt, location.lat, LST);
    const dAlpha = toRad(angularDiff(sunEQ.raDeg, moonEQ.raDeg));
    const decS = toRad(sunEQ.decDeg);
    const decM = toRad(moonEQ.decDeg);
    const num = Math.cos(decS) * Math.sin(dAlpha);
    const den = Math.sin(decS) * Math.cos(decM) - Math.cos(decS) * Math.sin(decM) * Math.cos(dAlpha);
    const P = Math.atan2(num, den);
    return norm360(toDeg(P) + 180);
  }, [date, location, astro.sun, astro.moon]);
  // Auto-polarity to ensure lit side points toward the Sun
  const maskAngleBase = useMemo(() => norm360(brightLimbAngleDeg - 90), [brightLimbAngleDeg]);
  const maskAngleDeg = useMemo(() => {
    const litVecAngle = norm360(maskAngleBase + 90);
    let d = norm360(litVecAngle - brightLimbAngleDeg); if (d > 180) d = 360 - d;
    return d > 90 ? norm360(maskAngleBase + 180) : maskAngleBase;
  }, [maskAngleBase, brightLimbAngleDeg]);

  const phaseFraction = astro.illum.fraction ?? 0; // [0..1]

  // Phase geometry helpers (SVG space, R=312)
  const R_SVG = 312; // MOON_DISC_DIAMETER / 2
  const k = 2 * phaseFraction - 1; // [-1..+1]
  const nearHalf = phaseFraction >= 0.495 && phaseFraction <= 0.505; // 49.5–50.5% => chord

  // LUT-driven circle geometry (outside chord window)
  const { rR, dR } = sampleTerminatorLUT(phaseFraction);
  const rSVG = rR * R_SVG;
  const cCx = 312 - dR * R_SVG; // crescent center (left)
  const cGx = 312 + dR * R_SVG; // gibbous  center (right)

  // Chord position (signed, linear near 0.5)
  const chordX = 312 - k * R_SVG; // bright = right side of the line

  // IDs for SVG defs
  const ids = useMemo(() => {
    const base = "moon" + Math.random().toString(36).slice(2);
    return {
      clip: base + "-clip",
      litCres: base + "-mask-lit-cres",
      litGibb: base + "-mask-lit-gibb",
      litChord: base + "-mask-lit-chord",
      darkCres: base + "-mask-dark-cres",
      darkGibb: base + "-mask-dark-gibb",
      darkChord: base + "-mask-dark-chord",
      earth: base + "-earth",
    } as const;
  }, []);

  // Horizon & helper lines
  const topLineY = useMemo(() => projectToScreen(refAz, 90, refAz, stageSize.w, stageSize.h, refAlt).y, [refAz, refAlt, stageSize]);
  const bottomLineY = useMemo(() => projectToScreen(refAz, -90, refAz, stageSize.w, stageSize.h, refAlt).y, [refAz, refAlt, stageSize]);
  const horizonY = useMemo(() => projectToScreen(refAz, 0, refAz, stageSize.w, stageSize.h, refAlt).y, [refAz, refAlt, stageSize]);

  // Markers on horizon for bodies
  const horizonMarkers = useMemo(() => {
    const items: { x: number; label: string; color: string }[] = [];
    if (showSun) {
      const { x, visibleX } = projectToScreen(astro.sun.az, 0, refAz, stageSize.w, stageSize.h, refAlt);
      if (visibleX) items.push({ x, label: "Soleil", color: "#f59e0b" });
    }
    if (showMoon) {
      const { x, visibleX } = projectToScreen(astro.moon.az, 0, refAz, stageSize.w, stageSize.h, refAlt);
      if (visibleX) items.push({ x, label: "Lune", color: "#93c5fd" });
    }
    return items;
  }, [showSun, showMoon, astro, refAz, refAlt, stageSize]);

  // Visible cardinal points on horizon (global N/E/S/O)
  const visibleCardinals = useMemo(() => {
    const list = [
      { label: 'N' as const, az: 0 },
      { label: 'E' as const, az: 90 },
      { label: 'S' as const, az: 180 },
      { label: 'O' as const, az: 270 },
    ].map(c => {
      const p = projectToScreen(c.az, 0, refAz, stageSize.w, stageSize.h, refAlt);
      return { ...c, x: p.x, visible: p.visibleX };
    }).filter(c => c.visible);
    return list.sort((a,b) => a.x - b.x);
  }, [refAz, refAlt, stageSize]);

  // Animation loop
  useEffect(() => {
    if (!isAnimating) {
      if (rafIdRef.current != null) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null; lastTsRef.current = null; return;
    }
    whenMsRef.current = Date.parse(when); lastTsRef.current = null;
    const tick = (ts: number) => {
      if (lastTsRef.current == null) { lastTsRef.current = ts; }
      else {
        const dtSec = (ts - lastTsRef.current) / 1000; lastTsRef.current = ts;
        const rate = clamp(speedMinPerSec, -360, 360);
        whenMsRef.current += dtSec * rate * 60 * 1000;
        setWhen(toDatetimeLocalInputValue(new Date(whenMsRef.current)));
      }
      rafIdRef.current = requestAnimationFrame(tick);
    };
    rafIdRef.current = requestAnimationFrame(tick);
    return () => { if (rafIdRef.current != null) cancelAnimationFrame(rafIdRef.current); rafIdRef.current = null; lastTsRef.current = null; };
  }, [isAnimating, speedMinPerSec, when]);

  // --- Dev-time test cases ---------------------------------------------------
  useEffect(() => {
    function approx(a: number, b: number, eps = 1e-6) { return Math.abs(a - b) <= eps; }
    const W = 1000, H = 1000, REF = 0;
    const c0 = projectToScreen(0, 0, REF, W, H);
    console.assert(approx(c0.x, 500) && approx(c0.y, 500), "Center should map to center");
    const rightEdge = projectToScreen(+110, 0, REF, W, H);
    console.assert(Math.round(rightEdge.x) === 1000, "+110° → right edge");
    const leftEdge = projectToScreen(-110, 0, REF, W, H);
    console.assert(Math.round(leftEdge.x) === 0, "-110° → left edge");
    const topEdge = projectToScreen(REF, +110, REF, W, H);
    console.assert(Math.round(topEdge.y) === 0, "+110° alt → top edge");
    const bottomEdge = projectToScreen(REF, -110, REF, W, H);
    console.assert(Math.round(bottomEdge.y) === 1000, "-110° alt → bottom edge");

    console.assert(compass16(0) === "N", "N label");
    console.assert(compass16(90) === "E", "E label");
    console.assert(compass16(180) === "S", "S label");
    console.assert(compass16(270) === "O", "O label");

    const rate = 60, dt = 2; const expectedMs = rate * dt * 60 * 1000;
    console.assert(expectedMs === 7200000, "2s @60 min/s = 2h");

    const f1 = SunCalc.getMoonIllumination(new Date('2024-04-22T20:00:00Z')).fraction;
    const f2 = SunCalc.getMoonIllumination(new Date('2024-04-23T20:00:00Z')).fraction;
    console.assert(Math.abs(f2 - f1) > 0, "Illumination fraction should change day-to-day");

    const isChord = (f: number) => f >= 0.495 && f <= 0.505;
    console.assert(isChord(0.495) && isChord(0.505), "Chord includes 49.5%..50.5%");
    console.assert(!isChord(0.494) && !isChord(0.506), "Chord excludes outside window");

    const qMoon = parallacticAngleDeg(120, 30, 48.85);
    const qSun = parallacticAngleDeg(200, 10, 48.85);
    console.assert(Number.isFinite(qMoon) && Number.isFinite(qSun), "Parallactic angles finite");

    // LUT sanity
    const st = sampleTerminatorLUT(0.3);
    console.assert(Number.isFinite(st.rR) && Number.isFinite(st.dR), "LUT returns finite numbers");

    // Alt/Az -> RA/Dec sanity: returns finite values
    {
      const LST = lstDeg(new Date('2025-01-01T00:00:00Z'), 2.35); // ~Paris
      const eq = altazToRaDec(120, 30, 48.85, LST);
      console.assert(Number.isFinite(eq.raDeg) && Number.isFinite(eq.decDeg), 'altazToRaDec finite');
    }

    // Known identities checks for altaz<->equatorial relations
    // 1) Zenith case: h=90° ⇒ δ≈φ, H≈0
    {
      const LST = lstDeg(new Date('2025-01-01T00:00:00Z'), 2.35);
      const eq = altazToRaDec(0, 90, 48.85, LST);
      console.assert(Math.abs(eq.decDeg - 48.85) < 0.1, 'Zenith: dec≈lat');
      console.assert(Math.abs(eq.Hdeg) < 1e-6, 'Zenith: H≈0');
    }
    // 2) Equator east-horizon case: φ=0°, h=0°, A=90° ⇒ H≈−90°
    {
      const LST = 0; // arbitrary
      const eq = altazToRaDec(90, 0, 0, LST);
      console.assert(Math.abs(eq.Hdeg + 90) < 1e-6, 'Equator east horizon: H≈−90°');
    }
  }, []);

  // --- JSX -------------------------------------------------------------------
  return (
    <div className="w-full h-screen bg-black text-white overflow-hidden">
      <div className="flex h-full">
        {/* Left column: locations */}
        <aside
          className="hidden md:block shrink-0 border-r border-white/10 bg-black overflow-hidden relative"
          style={{ width: showLocations ? 256 : 48, transition: 'width 250ms ease', zIndex: Z.ui + 5 }}
        >
          {showLocations ? (
            <div className="p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm uppercase tracking-widest text-white/60">Lieux d'observation</h2>
                <button
                  onClick={() => setShowLocations(false)}
                  className="ml-2 px-2 py-1 rounded-lg border border-white/15 text-sm text-white/80 hover:border-white/30"
                  aria-label="Masquer les lieux"
                  title="Masquer les lieux"
                >
                  {"<<"}
                </button>
              </div>
              <ul className="mt-3 space-y-2">
                {LOCATIONS.map((loc) => (
                  <li key={loc.id}>
                    <button
                      onClick={() => setLocation(loc)}
                      className={`w-full text-left px-3 py-2 rounded-xl border transition ${
                        location.id === loc.id ? "border-white/40 bg-white/5" : "border-white/10 hover:border-white/20 hover:bg-white/5"
                      }`}
                    >
                      <div className="font-medium">{loc.label}</div>
                      <div className="text-xs text-white/50">
                        {loc.lat.toFixed(3)}°, {loc.lng.toFixed(3)}° · {formatTimeInZone(date, loc.timeZone)}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <button
                onClick={() => setShowLocations(true)}
                className="px-2 py-1 rounded-lg border border-white/15 text-sm text-white/80 hover:border-white/30"
                aria-label="Afficher les lieux"
                title="Afficher les lieux"
              >
                {">>"}
              </button>
            </div>
          )}
        </aside>

        {/* Main stage */}
        <main className="relative flex-1">
          {/* Top UI bar */}
          <div className="absolute top-0 left-0 right-0 p-2 sm:p-3" style={{ zIndex: Z.ui }}>
            <div className="mx-2 sm:mx-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {/* SUIVI */}
              <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur px-3 py-3">
                <div className="text-xs uppercase tracking-wider text-white/60 mb-2">SUIVI</div>
                <div className="flex flex-wrap gap-2">
                  {(['SOLEIL','LUNE','N','E','S','O'] as FollowMode[]).map(opt => (
                    <button key={opt}
                      className={`px-3 py-1.5 rounded-lg border text-sm ${follow === opt ? 'border-white/50 bg-white/10' : 'border-white/15 text-white/80 hover:border-white/30'}`}
                      onClick={() => setFollow(opt)}
                    >{opt}</button>
                  ))}
                </div>
                <div className="mt-2 text-xs text-white/50">
                  {follow === 'SOLEIL' && "Le Soleil est centré ; l'horizon se translate verticalement."}
                  {follow === 'LUNE' && "La Lune est centrée ; horizon horizontal et rotation locale conservée."}
                  {(['N','E','S','O'] as FollowMode[]).includes(follow) && `Référence fixe : ${follow}`}
                </div>
              </div>

              {/* Date & heure + Animation (empilés) */}
              <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur px-3 py-3">
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="text-xs uppercase tracking-wider text-white/60">Date & heure</label>
                    <input type="datetime-local" step={1} value={when} onChange={(e) => handleWhenChange(e.target.value)} className="mt-1 w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-white/40" />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider text-white/60">Animation (min/s)</label>
                    <div className="mt-1 flex items-center gap-2">
                      <button onClick={() => setIsAnimating(v => !v)} className={`px-3 py-2 rounded-lg border text-sm ${isAnimating ? "border-emerald-400/60 text-emerald-300" : "border-white/15 text-white/80 hover:border-white/30"}`}>{isAnimating ? "Pause" : "Lecture"}</button>
                      <div className="relative flex-1">
                        <input
                          type="range"
                          min={-360}
                          max={360}
                          step={1}
                          value={speedMinPerSec}
                          onChange={(e) => setSpeedMinPerSec(clamp(parseInt(e.target.value || "0", 10), -360, 360))}
                          className="w-full"
                        />
                        {/* Center tick for 0 */}
                        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                          <div className="w-px h-3 bg-white/40" />
                        </div>
                        <div className="pointer-events-none absolute left-1/2 top-full -translate-x-1/2 mt-0.5 text-[10px] text-white/60">0</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Objets à afficher */}
              <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur px-3 py-3">
                <div className="text-xs uppercase tracking-wider text-white/60 mb-2">Objets à afficher</div>
                <div className="flex flex-wrap gap-3">
                  <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={showSun} onChange={(e) => setShowSun(e.target.checked)} /><span className="text-amber-300">Soleil</span></label>
                  <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={showMoon} onChange={(e) => setShowMoon(e.target.checked)} /><span className="text-sky-300">Lune</span></label>
                  <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={showPhase} onChange={(e) => setShowPhase(e.target.checked)} /><span>Phase de la Lune</span></label>
                  <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={earthshine} disabled={!showPhase} onChange={(e) => setEarthshine(e.target.checked)} /><span>Clair de Terre</span></label>
                  <span className="w-px h-5 bg-white/10 mx-1" />
                  <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={showSunCard} onChange={(e) => setShowSunCard(e.target.checked)} /><span>Cardinal Soleil</span></label>
                  <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={showMoonCard} onChange={(e) => setShowMoonCard(e.target.checked)} /><span>Cardinal Lune</span></label>
                  <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={debugMask} onChange={(e) => setDebugMask(e.target.checked)} /><span>Debug masque</span></label>
                </div>
              </div>
            </div>
          </div>

          {/* Stage canvas */}
          <div ref={stageRef} className="absolute inset-0">
            {/* Horizon line */}
            <div className="absolute left-0 right-0" style={{ top: horizonY, height: 0, borderTop: "1px solid rgba(255,255,255,0.35)", zIndex: Z.horizon }} />
            {/* +90 / -90 lines */}
            <div className="absolute left-0 right-0" style={{ top: topLineY, height: 0, borderTop: "1px dashed rgba(255,255,255,0.3)", zIndex: Z.horizon }} />
            <div className="absolute text-[10px] text-white/70 bg-black/60 px-1.5 py-0.5 rounded border border-white/10" style={{ left: 8, top: topLineY - 12, zIndex: Z.horizon }}>haut</div>
            <div className="absolute left-0 right-0" style={{ top: bottomLineY, height: 0, borderTop: "1px dashed rgba(255,255,255,0.3)", zIndex: Z.horizon }} />
            <div className="absolute text-[10px] text-white/70 bg-black/60 px-1.5 py-0.5 rounded border border-white/10" style={{ left: 8, top: bottomLineY - 12, zIndex: Z.horizon }}>bas</div>

            {/* Global cardinal points on the horizon */}
            {visibleCardinals.map((c, i) => (
              <div key={i} style={{ position: "absolute", left: c.x, top: horizonY, zIndex: Z.horizon }}>
                <div className="-translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                  <div className="h-6 w-0.5 bg-white/70" />
                  <div className="mt-1 text-xs font-semibold text-white/80 bg-black/60 px-2 py-0.5 rounded-full border border-white/20">{c.label}</div>
                </div>
              </div>
            ))}

            {/* Body azimuth markers on horizon */}
            {horizonMarkers.map((m, i) => (
              <div key={i} style={{ position: "absolute", left: m.x, top: horizonY, zIndex: Z.horizon }}>
                <div className="-translate-x-1/2 -translate-y-1/2"><div className="h-6 w-0.5" style={{ background: m.color, opacity: 0.9 }} /></div>
              </div>
            ))}

            {/* SUN */}
            {showSun && sunScreen.visibleX && sunScreen.visibleY && (
              <div style={{ position: "absolute", left: sunScreen.x, top: sunScreen.y, transform: `translate(-50%, -50%) rotate(${rotationToHorizonDegSun}deg)`, zIndex: Z.sun, width: MOON_RENDER_DIAMETER, height: MOON_RENDER_DIAMETER }}>
                <div className="rounded-full" style={{ width: MOON_RENDER_DIAMETER, height: MOON_RENDER_DIAMETER, background: "radial-gradient(circle at 30% 30%, rgba(255,255,200,1) 0%, rgba(255,200,80,0.95) 35%, rgba(255,160,30,0.85) 55%, rgba(255,120,10,0.7) 75%, rgba(255,100,0,0.5) 100%)", boxShadow: "0 0 40px 10px rgba(255,180,40,0.35), 0 0 80px 20px rgba(255,180,40,0.15)" }} />
                {showSunCard && (
                  <svg width={MOON_RENDER_DIAMETER} height={MOON_RENDER_DIAMETER} viewBox="0 0 624 624" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                    <g>
                      <line x1="312" y1="36" x2="312" y2="86" stroke="white" strokeOpacity="0.9" strokeWidth="2" />
                      <text x="312" y="60" textAnchor="middle" fontSize="64" fill="white" stroke="black" strokeWidth="4">N</text>
                      <line x1="538" y1="312" x2="588" y2="312" stroke="white" strokeOpacity="0.9" strokeWidth="2" />
                      <text x="564" y="318" textAnchor="start" fontSize="64" fill="white" stroke="black" strokeWidth="4">E</text>
                      <line x1="312" y1="538" x2="312" y2="588" stroke="white" strokeOpacity="0.9" strokeWidth="2" />
                      <text x="312" y="572" textAnchor="middle" fontSize="64" fill="white" stroke="black" strokeWidth="4">S</text>
                      <line x1="36" y1="312" x2="86" y2="312" stroke="white" strokeOpacity="0.9" strokeWidth="2" />
                      <text x="60" y="318" textAnchor="end" fontSize="64" fill="white" stroke="black" strokeWidth="4">O</text>
                    </g>
                  </svg>
                )}
              </div>
            )}

            {/* MOON (rotated group for local orientation) */}
            {showMoon && moonScreen.visibleX && moonScreen.visibleY && (
              <div style={{ position: "absolute", left: moonScreen.x, top: moonScreen.y, transform: `translate(-50%, -50%) rotate(${rotationToHorizonDegMoon}deg)`, zIndex: Z.moon, width: MOON_RENDER_DIAMETER, height: MOON_RENDER_DIAMETER }}>
                <svg width={MOON_RENDER_DIAMETER} height={MOON_RENDER_DIAMETER} viewBox="0 0 624 624" style={{ position: "absolute", inset: 0, margin: "auto", display: "block" }}>
                  <defs>
                    <clipPath id={ids.clip}><circle cx="312" cy="312" r="312" /></clipPath>
                    {/* Lit masks */}
                    <mask id={ids.litCres} maskUnits="userSpaceOnUse">
                      <g transform={`rotate(${maskAngleDeg},312,312)`}>
                        <circle cx="312" cy="312" r="312" fill="white" />
                        <circle cx={cCx} cy="312" r={rSVG} fill="black" />
                      </g>
                    </mask>
                    <mask id={ids.litGibb} maskUnits="userSpaceOnUse">
                      <g transform={`rotate(${maskAngleDeg},312,312)`}>
                        <rect x="0" y="0" width="624" height="624" fill="black" />
                        <circle cx={cGx} cy="312" r={rSVG} fill="white" />
                      </g>
                    </mask>
                    <mask id={ids.litChord} maskUnits="userSpaceOnUse">
                      <g transform={`rotate(${maskAngleDeg},312,312)`}>
                        <rect x={Math.max(0, Math.min(624, chordX))} y="0" width={Math.max(0, Math.min(624, 624 - chordX))} height="624" fill="white" />
                      </g>
                    </mask>
                    {/* Dark masks for earthshine */}
                    <mask id={ids.darkCres} maskUnits="userSpaceOnUse">
                      <g transform={`rotate(${maskAngleDeg},312,312)`}>
                        <rect x="0" y="0" width="624" height="624" fill="black" />
                        <circle cx={cCx} cy="312" r={rSVG} fill="white" />
                      </g>
                    </mask>
                    <mask id={ids.darkGibb} maskUnits="userSpaceOnUse">
                      <g transform={`rotate(${maskAngleDeg},312,312)`}>
                        <circle cx="312" cy="312" r="312" fill="white" />
                        <circle cx={cGx} cy="312" r={rSVG} fill="black" />
                      </g>
                    </mask>
                    <mask id={ids.darkChord} maskUnits="userSpaceOnUse">
                      <g transform={`rotate(${maskAngleDeg},312,312)`}>
                        <rect x="0" y="0" width={Math.max(0, Math.min(624, chordX))} height="624" fill="white" />
                      </g>
                    </mask>
                    {/* Earthshine gradient (a bit brighter center) */}
                    <radialGradient id={ids.earth} cx="50%" cy="50%" r="60%">
                      <stop offset="0%" stopColor="white" stopOpacity="0.12" />
                      <stop offset="100%" stopColor="white" stopOpacity="0" />
                    </radialGradient>
                  </defs>

                  {/* Silhouette only when phase shown (occlusion of Sun) */}
                  {showPhase && (<circle cx="312" cy="312" r="312" fill="#0b0b0b" clipPath={`url(#${ids.clip})`} />)}

                  {/* Optional earthshine */}
                  {showPhase && earthshine && (
                    <circle
                      cx="312" cy="312" r="312"
                      fill={`url(#${ids.earth})`}
                      clipPath={`url(#${ids.clip})`}
                      mask={`url(#${ids[ nearHalf ? 'darkChord' : (phaseFraction > 0.5 ? 'darkGibb' : 'darkCres') ]})`}
                    />
                  )}

                  {/* NASA image masked by lit region */}
                  {showPhase ? (
                    <image
                      href={NASA_IMG}
                      x={-53} y={-53} width={730} height={730}
                      clipPath={`url(#${ids.clip})`}
                      mask={`url(#${ids[ nearHalf ? 'litChord' : (phaseFraction > 0.5 ? 'litGibb' : 'litCres') ]})`}
                      preserveAspectRatio="xMidYMid slice"
                      style={{ filter: "brightness(0.9)" }}
                    />
                  ) : (
                    <image href={NASA_IMG} x={-53} y={-53} width={730} height={730} clipPath={`url(#${ids.clip})`} preserveAspectRatio="xMidYMid slice" style={{ filter: "brightness(0.9)" }} />
                  )}
                </svg>

                {debugMask && (
                  <svg width={MOON_RENDER_DIAMETER} height={MOON_RENDER_DIAMETER} viewBox="0 0 624 624" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                    {/* Disque lunaire (contour) */}
                    <circle cx="312" cy="312" r="312" fill="none" stroke="#ffffff66" strokeWidth="1" strokeDasharray="3,4" />

                    {/* Centre du disque */}
                    <g opacity={0.9}>
                      <circle cx="312" cy="312" r="5" fill="none" stroke="#ffffff" strokeWidth="1" />
                      <line x1="300" y1="312" x2="324" y2="312" stroke="#ffffff" strokeWidth="1" />
                      <line x1="312" y1="300" x2="312" y2="324" stroke="#ffffff" strokeWidth="1" />
                    </g>

                    {/* Vecteur P (direction Soleil en repère Nord→Est du disque) */}
                    <g transform={`rotate(${brightLimbAngleDeg},312,312)`}>
                      <line x1="312" y1="312" x2="312" y2="140" stroke="#22d3ee" strokeWidth="2" strokeDasharray="6,4" />
                      <polygon points="312,130 308,140 316,140" fill="#22d3ee" />
                    </g>

                    {/* Géométrie du masque (dans le repère du masque) */}
                    <g transform={`rotate(${maskAngleDeg},312,312)`}>
                      {nearHalf ? (
                        <g>
                          {/* corde droite */}
                          <line x1={Math.max(0, Math.min(624, chordX))} y1="60" x2={Math.max(0, Math.min(624, chordX))} y2="564" stroke="#93c5fd" strokeWidth="2" strokeDasharray="4,3" />
                        </g>
                      ) : (
                        <g>
                          {/* cercle auxiliaire + centre */}
                          <circle cx={phaseFraction > 0.5 ? cGx : cCx} cy="312" r={rSVG} fill="none" stroke="#93c5fd" strokeWidth="2" strokeDasharray="6,4" />
                          <circle cx={phaseFraction > 0.5 ? cGx : cCx} cy="312" r="4" fill="#93c5fd" />
                          <line x1="312" y1="312" x2={phaseFraction > 0.5 ? cGx : cCx} y2="312" stroke="#93c5fd" strokeWidth="1.5" strokeDasharray="3,3" />
                        </g>
                      )}
                    </g>
                  </svg>
                )}

                {showMoonCard && (
                  <svg width={MOON_RENDER_DIAMETER} height={MOON_RENDER_DIAMETER} viewBox="0 0 624 624" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                    <g>
                      {/* Traits & lettres en #93c5fd pour cohérence avec le marqueur d'azimut lunaire */}
                      <line x1="312" y1="36" x2="312" y2="86" stroke="#93c5fd" strokeOpacity="0.9" strokeWidth="2" />
                      <text x="312" y="60" textAnchor="middle" fontSize="64" fontWeight="800" fill="#93c5fd" stroke="black" strokeWidth="6">N</text>
                      <line x1="538" y1="312" x2="588" y2="312" stroke="#93c5fd" strokeOpacity="0.9" strokeWidth="2" />
                      <text x="564" y="318" textAnchor="start" fontSize="64" fontWeight="800" fill="#93c5fd" stroke="black" strokeWidth="6">E</text>
                      <line x1="312" y1="538" x2="312" y2="588" stroke="#93c5fd" strokeOpacity="0.9" strokeWidth="2" />
                      <text x="312" y="572" textAnchor="middle" fontSize="64" fontWeight="800" fill="#93c5fd" stroke="black" strokeWidth="6">S</text>
                      <line x1="36" y1="312" x2="86" y2="312" stroke="#93c5fd" strokeOpacity="0.9" strokeWidth="2" />
                      <text x="60" y="318" textAnchor="end" fontSize="64" fontWeight="800" fill="#93c5fd" stroke="black" strokeWidth="6">O</text>
                    </g>
                  </svg>
                )}
              </div>
            )}
          </div>

          {/* Bottom telemetry cards */}
          <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3" style={{ zIndex: Z.ui }}>
            <div className="mx-2 sm:mx-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="rounded-2xl border border-white/10 bg-black/50 backdrop-blur px-4 py-3">
                <div className="flex items-center justify-between"><div className="text-sm font-semibold text-sky-300">Lune</div><div className="text-xs text-white/60">{compass16(astro.moon.az)}</div></div>
                <div className="mt-1 text-sm text-white/85">Altitude : <span className="font-mono">{formatDeg(astro.moon.alt)}</span></div>
                <div className="text-sm text-white/85">Azimut : <span className="font-mono">{formatDeg(astro.moon.az)}</span></div>
                <div className="text-xs text-white/55 mt-1">Orientation (parallactique) : <span className="font-mono">{rotationToHorizonDegMoon.toFixed(1)}°</span></div>
                <div className="text-xs text-white/55">Phase : {(phaseFraction * 100).toFixed(1)}% éclairée — Angle du limbe : {brightLimbAngleDeg.toFixed(1)}°</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/50 backdrop-blur px-4 py-3">
                <div className="flex items-center justify-between"><div className="text-sm font-semibold text-amber-300">Soleil</div><div className="text-xs text-white/60">{compass16(astro.sun.az)}</div></div>
                <div className="mt-1 text-sm text-white/85">Altitude : <span className="font-mono">{formatDeg(astro.sun.alt)}</span></div>
                <div className="text-sm text-white/85">Azimut : <span className="font-mono">{formatDeg(astro.sun.az)}</span></div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
