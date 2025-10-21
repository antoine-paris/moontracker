import type React from 'react';
import type { FollowMode } from '../types';
import type { LocationOption } from '../data/locations';
import type { Device } from '../optics/types';
import { clamp } from '../utils/math';
import { FOV_DEG_MIN, FOV_DEG_MAX } from '../optics/fov';

type DeviceLike = Device;

// Geohash helpers (base32 alphabet without a, i, l, o)
const GH_BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';
const GH_MAP: Record<string, number> = Object.fromEntries([...GH_BASE32].map((c, i) => [c, i]));

function geohashEncode(lat: number, lon: number, precision = 7): string {
  let minLat = -90, maxLat = 90, minLon = -180, maxLon = 180;
  let evenBit = true, bit = 0, ch = 0, hash = '';
  while (hash.length < precision) {
    if (evenBit) {
      const mid = (minLon + maxLon) / 2;
      if (lon >= mid) { ch = (ch << 1) + 1; minLon = mid; }
      else { ch = (ch << 1) + 0; maxLon = mid; }
    } else {
      const mid = (minLat + maxLat) / 2;
      if (lat >= mid) { ch = (ch << 1) + 1; minLat = mid; }
      else { ch = (ch << 1) + 0; maxLat = mid; }
    }
    evenBit = !evenBit;
    if (++bit === 5) { hash += GH_BASE32[ch]; bit = 0; ch = 0; }
  }
  return hash;
}

function geohashDecode(gh: string): { lat: number; lon: number } {
  let minLat = -90, maxLat = 90, minLon = -180, maxLon = 180;
  let evenBit = true;
  for (const c of gh) {
    let bits = GH_MAP[c];
    for (let n = 4; n >= 0; n--) {
      const bit = (bits >> n) & 1;
      if (evenBit) {
        const mid = (minLon + maxLon) / 2;
        if (bit) minLon = mid; else maxLon = mid;
      } else {
        const mid = (minLat + maxLat) / 2;
        if (bit) minLat = mid; else maxLat = mid;
      }
      evenBit = !evenBit;
    }
  }
  return { lat: (minLat + maxLat) / 2, lon: (minLon + maxLon) / 2 };
}

// Compact helpers
function toB36Int(n: number): string { return Math.round(n).toString(36); }
function fromB36Int(s: string): number { const n = parseInt(s, 36); return Number.isFinite(n) ? n : NaN; }
function timeToB36(ms: number): string { return toB36Int(Math.floor(ms / 1000)); }
function timeFromB36(s: string): number { const sec = fromB36Int(s); return Number.isFinite(sec) ? sec * 1000 : NaN; }

// NEW: parse integer that might be base36 (compact) or decimal (legacy)
function parseIntB36OrDec(s: string): number {
  if (/^\d+$/.test(s)) return Number(s);
  const n = parseInt(s, 36);
  return Number.isFinite(n) ? n : NaN;
}

// Normalize longitude to [-180,180], with 180 instead of -180 for consistency
function normLng(lon: number) {
  let x = ((lon + 180) % 360 + 360) % 360 - 180;
  if (Object.is(x, -180)) x = 180;
  return x;
}

function parseBool(v: string | null, def = false) {
  if (v == null) return def;
  const s = v.toLowerCase();
  return s === '1' || s === 'true' || s === 'yes' || s === 'on';
}

function parseNum(v: string | null, def: number) {
  if (v == null) return def;
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

function parseEnum<T extends string>(v: string | null, allowed: readonly T[], def: T): T {
  if (!v) return def;
  const up = v.toUpperCase() as T;
  return (allowed as readonly string[]).includes(up) ? (up as T) : def;
}

const FOLLOW_ALLOWED = ['SOLEIL','LUNE','MERCURE','VENUS','MARS','JUPITER','SATURNE','URANUS','NEPTUNE','N','E','S','O'] as const;
// Garder l'ordre initial des 4 premiers pour compatibilité des indices 'p'
const PROJ_LIST = ['recti-panini','stereo-centered','ortho','cylindrical','rectilinear','cylindrical-horizon'] as const;

// NEW: timelapse units (order matters for compact header)
const TL_UNITS = ['minute','hour', 'day', 'sidereal-day', 'month', 'lunar-fraction', 'synodic-fraction'] as const;

// Bit positions for packed toggles
const ToggleBits = {
  sun: 0,
  moon: 1,
  phase: 2,
  earthshine: 3,
  earth: 4,
  atm: 5,
  stars: 6,
  markers: 7,
  grid: 8,
  sunCard: 9,
  moonCard: 10,
  enlarge: 11,
  debug: 12,
  panels: 13,
  play: 14,
  horizon: 15,
  ecliptic: 16,
} as const;

function packTogglesToMask(t: {
  showSun: boolean;
  showMoon: boolean;
  showPhase: boolean;
  earthshine: boolean;
  showEarth: boolean;
  showAtmosphere: boolean;
  showStars: boolean;
  showMarkers: boolean;
  showGrid: boolean;
  showSunCard: boolean;
  showMoonCard: boolean;
  enlargeObjects: boolean;
  debugMask: boolean;
  showHorizon: boolean;
  showEcliptique: boolean;
}, showPanels: boolean, isAnimating: boolean): number {
  let m = 0;
  if (t.showSun) m |= 1 << ToggleBits.sun;
  if (t.showMoon) m |= 1 << ToggleBits.moon;
  if (t.showPhase) m |= 1 << ToggleBits.phase;
  if (t.earthshine) m |= 1 << ToggleBits.earthshine;
  if (t.showEarth) m |= 1 << ToggleBits.earth;
  if (t.showAtmosphere) m |= 1 << ToggleBits.atm;
  if (t.showStars) m |= 1 << ToggleBits.stars;
  if (t.showMarkers) m |= 1 << ToggleBits.markers;
  if (t.showGrid) m |= 1 << ToggleBits.grid;
  if (t.showSunCard) m |= 1 << ToggleBits.sunCard;
  if (t.showMoonCard) m |= 1 << ToggleBits.moonCard;
  if (t.enlargeObjects) m |= 1 << ToggleBits.enlarge;
  if (t.debugMask) m |= 1 << ToggleBits.debug;
  if (t.showHorizon) m |= 1 << ToggleBits.horizon;
  if (t.showEcliptique) m |= 1 << ToggleBits.ecliptic;
  if (showPanels) m |= 1 << ToggleBits.panels;
  if (isAnimating) m |= 1 << ToggleBits.play;
  return m >>> 0;
}

function unpackMaskToToggles(mask: number) {
  return {
    sun: !!(mask & (1 << ToggleBits.sun)),
    moon: !!(mask & (1 << ToggleBits.moon)),
    phase: !!(mask & (1 << ToggleBits.phase)),
    earthshine: !!(mask & (1 << ToggleBits.earthshine)),
    earth: !!(mask & (1 << ToggleBits.earth)),
    atm: !!(mask & (1 << ToggleBits.atm)),
    stars: !!(mask & (1 << ToggleBits.stars)),
    markers: !!(mask & (1 << ToggleBits.markers)),
    grid: !!(mask & (1 << ToggleBits.grid)),
    sunCard: !!(mask & (1 << ToggleBits.sunCard)),
    moonCard: !!(mask & (1 << ToggleBits.moonCard)),
    enlarge: !!(mask & (1 << ToggleBits.enlarge)),
    debug: !!(mask & (1 << ToggleBits.debug)),
    horizon: !!(mask & (1 << ToggleBits.horizon)),
    ecliptic: !!(mask & (1 << ToggleBits.ecliptic)),
    panels: !!(mask & (1 << ToggleBits.panels)),
    play: !!(mask & (1 << ToggleBits.play)),
  };
}

export type UrlInitArgs = {
  // time
  whenMsRef: React.MutableRefObject<number>;
  setWhenMs: (ms: number) => void;

  // location data
  locations: LocationOption[];
  location: LocationOption;
  setLocation: (loc: LocationOption) => void;

  // optics
  devices: DeviceLike[];
  CUSTOM_DEVICE_ID: string;
  setDeviceId: (id: string) => void;
  setZoomId: (id: string) => void;
  setFovXDeg: (n: number) => void;
  setFovYDeg: (n: number) => void;
  linkFov: boolean;
  setLinkFov: (b: boolean) => void;

  // enums
  setFollow: (f: FollowMode) => void;
  setProjectionMode: (p: 'recti-panini'|'stereo-centered'|'ortho'|'cylindrical'|'rectilinear'|'cylindrical-horizon') => void;

  // toggles
  setShowSun: (b: boolean) => void;
  setShowMoon: (b: boolean) => void;
  setShowPhase: (b: boolean) => void;
  setEarthshine: (b: boolean) => void;
  setShowEarth: (b: boolean) => void;
  setShowAtmosphere: (b: boolean) => void;
  setShowStars: (b: boolean) => void;
  setShowMarkers: (b: boolean) => void;
  setShowGrid: (b: boolean) => void;
  setShowHorizon: (b: boolean) => void;
  setShowSunCard: (b: boolean) => void;
  setShowMoonCard: (b: boolean) => void;
  setShowEcliptique: (b: boolean) => void;
  setEnlargeObjects: (b: boolean) => void;
  setDebugMask: (b: boolean) => void;

  // UI panels
  setShowPanels: (b: boolean) => void;

  // planets
  allPlanetIds: string[];
  setShowPlanets: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;

  // animation
  isAnimating: boolean;
  setIsAnimating: (b: boolean) => void;
  speedMinPerSec: number;
  setSpeedMinPerSec: (n: number) => void;

  // DirectionalKeypad deltas
  setDeltaAzDeg: (n: number) => void;
  setDeltaAltDeg: (n: number) => void;

  // NEW: timelapse setters + start-ref
  setTimeLapseEnabled: (b: boolean) => void;
  setTimeLapsePeriodMs: (n: number) => void;
  setTimeLapseStepValue: (n: number) => void;
  setTimeLapseStepUnit: (u: typeof TL_UNITS[number]) => void;
  setTimeLapseLoopAfter: (n: number) => void;
  timeLapseStartMsRef: React.MutableRefObject<number>;

  setTimeLapseEnabled: (b: boolean) => void;
  setTimeLapsePeriodMs: (n: number) => void;
  setTimeLapseStepValue: (n: number) => void;
  setTimeLapseStepUnit: (u: typeof TL_UNITS[number]) => void;
  setTimeLapseLoopAfter: (n: number) => void;
  timeLapseStartMsRef: React.MutableRefObject<number>;


  // NEW: Long pose setters
  setLongPoseEnabled: (b: boolean) => void;
  setLongPoseRetainFrames: (n: number) => void;

};

export function parseUrlIntoState(q: URLSearchParams, args: UrlInitArgs) {
  const {
    whenMsRef, setWhenMs,
    locations, setLocation,
    devices, CUSTOM_DEVICE_ID, setDeviceId, setZoomId, setFovXDeg, setFovYDeg, linkFov, setLinkFov,
    setFollow, setProjectionMode,
    setShowSun, setShowMoon, setShowPhase, setEarthshine, setShowEarth, setShowAtmosphere, setShowStars, setShowMarkers, setShowGrid,
    setShowHorizon,
    setShowSunCard, setShowMoonCard, setShowEcliptique, setEnlargeObjects, setDebugMask,
    setShowPanels,
    allPlanetIds, setShowPlanets,
    setIsAnimating, setSpeedMinPerSec,
    setDeltaAzDeg, setDeltaAltDeg,
    setTimeLapseEnabled, setTimeLapsePeriodMs, setTimeLapseStepValue, setTimeLapseStepUnit, setTimeLapseLoopAfter, timeLapseStartMsRef,
    setLongPoseEnabled, setLongPoseRetainFrames,
  } = args;

  // Time: base36 unix seconds
  const t = q.get('t');
  if (t) {
    const ms = timeFromB36(t);
    if (Number.isFinite(ms)) {
      whenMsRef.current = ms;
      setWhenMs(ms);
    }
  }

  // Location: lat/lng, geohash, or id
  const latQ = q.get('lat');
  const lngQ = q.get('lng');
  const gh = q.get('g');
  const lId = q.get('l');
  const tzQ = q.get('tz');

  if (latQ && lngQ) {
    const lat = Number(latQ);
    const lng = Number(lngQ);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      const tz = tzQ || 'UTC';
      const label = `Lat ${lat.toFixed(4)}, Lng ${lng.toFixed(4)}`;
      setLocation({
        id: `url@${lat.toFixed(6)},${lng.toFixed(6)}`,
        label,
        lat,
        lng,
        timeZone: tz,
      });
    }
  } else if (gh) {
    try {
      const { lat, lon } = geohashDecode(gh);
      const tz = tzQ || 'UTC';
      setLocation({
        id: `g@${gh}`,
        label: `Lat ${lat.toFixed(4)}, Lng ${lon.toFixed(4)}`,
        lat,
        lng: lon,
        timeZone: tz,
      });
    } catch {
      // ignore invalid geohash
    }
  } else if (lId) {
    const found = locations.find(l => l.id === lId);
    if (found) setLocation(found);
  }

  // Follow: F=index(base36)
  const F = q.get('F');
  if (F != null) {
    const idx = fromB36Int(F);
    const v = FOLLOW_ALLOWED[idx as keyof typeof FOLLOW_ALLOWED] as FollowMode | undefined;
    if (v) setFollow(v);
  }

  // DirectionalKeypad deltas
  const da = q.get('da');
  const dh = q.get('dh');
  if (da != null) {
    const v = Number(da);
    if (Number.isFinite(v)) setDeltaAzDeg(v);
  }
  if (dh != null) {
    const v = Number(dh);
    if (Number.isFinite(v)) setDeltaAltDeg(v);
  }

  // Projection: p=index(base36)
  const pIdx = q.get('p');
  if (pIdx != null) {
    const idx = fromB36Int(pIdx);
    const v = PROJ_LIST[idx as keyof typeof PROJ_LIST];
    if (v) setProjectionMode(v);
  }

  // Device / zoom / focal / FOV
  const dev = q.get('d');
  const zm = q.get('z');
  const focal = q.get('f');
  const fovx = q.get('x');
  const fovy = q.get('y');
  const link = q.get('k');

  if (dev) {
    const exists = devices.some(d => d.id === dev);
    const finalDev = exists ? dev : CUSTOM_DEVICE_ID;
    setDeviceId(finalDev);
    if (exists && zm && devices.find(d => d.id === finalDev)?.zooms.some(z => z.id === zm)) {
      setZoomId(zm);
    }
  }

  const wantsCustom = (dev === CUSTOM_DEVICE_ID) || (!dev);
  if (wantsCustom) {
    setDeviceId(CUSTOM_DEVICE_ID);
    setZoomId('custom-theo');

    const linkFlag = link != null ? (link === '1') : linkFov;
    setLinkFov(linkFlag);

    const fxQ = fovx ? Number(fovx) : NaN;
    const fyQ = fovy ? Number(fovy) : NaN;

    if (!linkFlag && (Number.isFinite(fxQ) || Number.isFinite(fyQ))) {
      if (Number.isFinite(fxQ)) setFovXDeg(clamp(fxQ, FOV_DEG_MIN, FOV_DEG_MAX));
      if (Number.isFinite(fyQ)) setFovYDeg(clamp(fyQ, FOV_DEG_MIN, FOV_DEG_MAX));
    } else {
      const fmm = focal ? parseIntB36OrDec(focal) : NaN;
      if (Number.isFinite(fmm) && fmm > 0) {
        const FF_W = 36, FF_H = 24;
        const fx = 2 * Math.atan(FF_W / (2 * fmm)) * 180 / Math.PI;
        const fy = 2 * Math.atan(FF_H / (2 * fmm)) * 180 / Math.PI;
        setFovXDeg(clamp(fx, FOV_DEG_MIN, FOV_DEG_MAX));
        setFovYDeg(clamp(fy, FOV_DEG_MIN, FOV_DEG_MAX));
      } else {
        if (Number.isFinite(fxQ)) setFovXDeg(clamp(fxQ, FOV_DEG_MIN, FOV_DEG_MAX));
        if (Number.isFinite(fyQ)) setFovYDeg(clamp(fyQ, FOV_DEG_MIN, FOV_DEG_MAX));
      }
    }
  }

  // Visibility toggles + panels + animation (compact bitmask first)
  const b = q.get('b');
  if (b != null) {
    const mask = fromB36Int(b);
    if (Number.isFinite(mask)) {
      const u = unpackMaskToToggles(mask);
      setShowSun(u.sun);
      setShowMoon(u.moon);
      setShowPhase(u.phase);
      setEarthshine(u.earthshine);
      setShowEarth(u.earth);
      setShowAtmosphere(u.atm);
      setShowStars(u.stars);
      setShowMarkers(u.markers);
      setShowGrid(u.grid);
      setShowHorizon(u.horizon);
      setShowSunCard(u.sunCard);
      setShowMoonCard(u.moonCard);
      setShowEcliptique(u.ecliptic);
      setEnlargeObjects(u.enlarge);
      setDebugMask(u.debug);
      setShowPanels(u.panels);
      setIsAnimating(u.play);
    }
  } else {
    // Old verbose params (removed)
  }

  // Planets selection (compact first)
  const pl = q.get('pl');
  if (pl) {
    if (pl === 'n') {
      const allFalse = Object.fromEntries(allPlanetIds.map(id => [id, false]));
      setShowPlanets(allFalse);
    } else if (pl === 'a') {
      const allTrue = Object.fromEntries(allPlanetIds.map(id => [id, true]));
      setShowPlanets(allTrue);
    } else {
      const mask = fromB36Int(pl);
      if (Number.isFinite(mask)) {
        const m = mask >>> 0;
        const next: Record<string, boolean> = {};
        allPlanetIds.forEach((id, i) => { next[id] = !!(m & (1 << i)); });
        setShowPlanets(next);
      }
    }
  }

  const lp = q.get('lp');
  if (lp) {
    const parts = lp.split('.');
    const bytes = unpackBytes(parts[0], 2);
    const header = bytes[0] ?? 0;
    const rShort = bytes[1] ?? 0;
    let retain = rShort;
    if (parts[1]) {
      const rExt = parseIntB36OrDec(parts[1]);
      if (Number.isFinite(rExt)) retain = rExt;
    }
    const enabled = !!(header & 1);
    const retainClamped = Math.max(1, Math.round(retain || 1));
    setLongPoseEnabled(enabled);
    setLongPoseRetainFrames(retainClamped);
  }

  // Speed: try precise 'sr' first, then compact 's', then legacy 'spd'
  const sr = q.get('sr');
  if (sr != null) {
    const v = Number(sr);
    if (Number.isFinite(v)) setSpeedMinPerSec(v);
  }

  // NEW: Timelapse MORE compact: tl = HPSL.T where HPSL is packed 4-byte base36
  const tl = q.get('tl');
  if (tl) {
    const parts = tl.split('.');
    if (parts.length >= 2) {
      const [hpsl, tPart] = parts;
      const bytes = unpackBytes(hpsl, 4);
      const h = bytes[0];
      const pHigh = bytes[1];
      const sHigh = bytes[2]; 
      const lHigh = bytes[3];

      // For values > 255, check if there's extended precision in parts[2], [3], [4]
      const p = parts[2] ? parseIntB36OrDec(parts[2]) : pHigh;
      const s = parts[3] ? parseIntB36OrDec(parts[3]) : sHigh;
      const l = parts[4] ? parseIntB36OrDec(parts[4]) : lHigh;
      const t0ms = timeFromB36(tPart);

      if (Number.isFinite(h)) {
        const enabled = !!(h & 1);
        const unitIdx = (h >> 1) & 0x7;
        const unit = TL_UNITS[unitIdx] ?? TL_UNITS[0];

        setTimeLapseEnabled(enabled);
        if (Number.isFinite(p)) setTimeLapsePeriodMs(Math.max(1, p));
        if (Number.isFinite(s)) setTimeLapseStepValue(Math.max(1, s));
        setTimeLapseStepUnit(unit as any);
        if (Number.isFinite(l)) setTimeLapseLoopAfter(Math.max(0, l));
        if (Number.isFinite(t0ms)) timeLapseStartMsRef.current = t0ms;
      }
    } else {
      // OLD format: H.P.S.L.T
      const tlParts = tl.split('.');
      if (tlParts.length >= 5) {
        const h = fromB36Int(tlParts[0]);
        const p = parseIntB36OrDec(tlParts[1]);
        const s = parseIntB36OrDec(tlParts[2]);
        const l = parseIntB36OrDec(tlParts[3]);
        const t0ms = timeFromB36(tlParts[4]);

        if (Number.isFinite(h)) {
          const enabled = !!(h & 1);
          const unitIdx = (h >> 1) & 0x7;
          const unit = TL_UNITS[unitIdx] ?? TL_UNITS[0];

          setTimeLapseEnabled(enabled);
          if (Number.isFinite(p)) setTimeLapsePeriodMs(Math.max(1, p));
          if (Number.isFinite(s)) setTimeLapseStepValue(Math.max(1, s));
          setTimeLapseStepUnit(unit as any);
          if (Number.isFinite(l)) setTimeLapseLoopAfter(Math.max(0, l));
          if (Number.isFinite(t0ms)) timeLapseStartMsRef.current = t0ms;
        }
      }
    }
  }
}

// NEW: Compact float encoding (2 decimal places by default, strips trailing zeros)
function compactFloat(n: number, decimals = 2): string {
  const s = n.toFixed(decimals);
  return s.replace(/\.?0+$/, '');
}

// NEW: Pack multiple small numbers into single base36 (each 8 bits)
function packBytes(...values: number[]): string {
  let packed = 0;
  for (let i = 0; i < Math.min(values.length, 7); i++) {
    packed |= ((values[i] & 0xFF) << (i * 8));
  }
  return toB36Int(packed);
}

function unpackBytes(s: string, count: number): number[] {
  const packed = fromB36Int(s);
  const result: number[] = [];
  for (let i = 0; i < count; i++) {
    result.push((packed >>> (i * 8)) & 0xFF);
  }
  return result;
}

export type BuildShareUrlArgs = {
  whenMs: number;

  // location
  location: LocationOption;
  locations: LocationOption[];

  // enums
  follow: FollowMode;
  projectionMode: 'recti-panini'|'stereo-centered'|'ortho'|'cylindrical'|'rectilinear'|'cylindrical-horizon';

  // optics
  deviceId: string;
  zoomId: string;
  fovXDeg: number;
  fovYDeg: number;
  linkFov: boolean;
  CUSTOM_DEVICE_ID: string;

  // toggles
  toggles: {
    showSun: boolean;
    showMoon: boolean;
    showPhase: boolean;
    earthshine: boolean;
    showEarth: boolean;
    showAtmosphere: boolean;
    showStars: boolean;
    showMarkers: boolean;
    showGrid: boolean;
    showHorizon: boolean;
    showSunCard: boolean;
    showMoonCard: boolean;
    showEcliptique: boolean;
    enlargeObjects: boolean;
    debugMask: boolean;
  };

  // UI panels
  showPanels: boolean;

  // planets
  showPlanets: Record<string, boolean>;
  allPlanetIds: string[];

  // anim
  isAnimating: boolean;
  speedMinPerSec: number;

  // DirectionalKeypad deltas
  deltaAzDeg: number;
  deltaAltDeg: number;

  timeLapseEnabled: boolean;
  timeLapsePeriodMs: number;
  timeLapseStepValue: number;
  timeLapseStepUnit: typeof TL_UNITS[number];
  timeLapseLoopAfter: number;
  timeLapseStartMs: number;

  longPoseEnabled: boolean;
  longPoseRetainFrames: number;

  baseUrl?: string;
  appendHash?: string;
};

export function buildShareUrl(args: BuildShareUrlArgs): string {
  const {
    whenMs,
    location, locations,
    follow, projectionMode,
    deviceId, zoomId, fovXDeg, fovYDeg, linkFov, CUSTOM_DEVICE_ID,
    toggles,
    showPanels,
    showPlanets, allPlanetIds,
    isAnimating, speedMinPerSec,
    deltaAzDeg, deltaAltDeg,
    timeLapseEnabled, timeLapsePeriodMs, timeLapseStepValue, timeLapseStepUnit, timeLapseLoopAfter, timeLapseStartMs,
    longPoseEnabled, longPoseRetainFrames,

    baseUrl, appendHash,
  } = args;

  const q = new URLSearchParams();

  // Timelapse: compact format
  {
    const unitIdx = Math.max(0, (Array.prototype.indexOf.call(TL_UNITS, timeLapseStepUnit) as number));
    const header = (unitIdx << 1) | (timeLapseEnabled ? 1 : 0);
    
    const pVal = Math.max(1, Math.round(timeLapsePeriodMs || 1));
    const sVal = Math.max(1, Math.round(timeLapseStepValue || 1));
    const lVal = Math.max(0, Math.round(timeLapseLoopAfter || 0));
    
    if (pVal <= 255 && sVal <= 255 && lVal <= 255) {
      const packed = packBytes(header, pVal, sVal, lVal);
      const T = timeToB36(timeLapseStartMs);
      q.set('tl', `${packed}.${T}`);
    } else {
      const P = toB36Int(pVal);
      const S = toB36Int(sVal);
      const L = toB36Int(lVal);
      const T = timeToB36(timeLapseStartMs);
      const packed = packBytes(header, 255, 255, 255);
      q.set('tl', `${packed}.${T}.${P}.${S}.${L}`);
    }
  }
  {
    const header = (longPoseEnabled ? 1 : 0);
    const retain = Math.max(1, Math.round(longPoseRetainFrames || 1));
    if (retain <= 255) {
      const packed = packBytes(header, retain);
      q.set('lp', packed);
    } else {
      const packed = packBytes(header, 255);
      q.set('lp', `${packed}.${toB36Int(retain)}`);
    }
  }

  // location: Use geohash (9 chars) OR lat/lng (6 decimals), not both
  const matchById = locations.find(l => l.id === location.id);
  const coordsMatch =
    !!matchById &&
    Math.abs(location.lat - matchById.lat) <= 1e-9 &&
    Math.abs(normLng(location.lng) - normLng(matchById.lng)) <= 1e-9;

  if (matchById && coordsMatch) {
    q.set('l', location.id);
  } else {
    // For custom locations: use geohash (shorter) if precision allows
    const gh = geohashEncode(location.lat, location.lng, 9);
    const decoded = geohashDecode(gh);
    const latErr = Math.abs(decoded.lat - location.lat);
    const lonErr = Math.abs(decoded.lon - location.lng);
    
    // Geohash precision 9 ≈ ±2.4m; if location needs more precision, use lat/lng
    if (latErr < 0.00002 && lonErr < 0.00002) {
      q.set('g', gh);
    } else {
      q.set('lat', location.lat.toFixed(6));
      q.set('lng', location.lng.toFixed(6));
    }
    
    if (location.timeZone && location.timeZone !== 'UTC') {
      q.set('tz', location.timeZone);
    }
  }

  // time: base36 unix seconds
  q.set('t', timeToB36(whenMs));

  // follow (index)
  const fIdx = Math.max(0, (FOLLOW_ALLOWED as readonly string[]).indexOf(follow));
  q.set('F', toB36Int(fIdx));

  // projection (index)
  const pIdx = Math.max(0, (PROJ_LIST as readonly string[]).indexOf(projectionMode));
  q.set('p', toB36Int(pIdx));

  // device/zoom or custom focal/FOV
  q.set('d', deviceId);
  if (deviceId === CUSTOM_DEVICE_ID) {
    q.set('k', linkFov ? '1' : '0');

    if (linkFov) {
      const FF_W = 36;
      const rad = (Math.PI / 180) * fovXDeg;
      const tanHalf = Math.tan(rad / 2);
      if (tanHalf > 0) {
        const f = FF_W / (2 * tanHalf);
        q.set('f', toB36Int(Math.round(f)));
      }
    } else {
      q.set('x', compactFloat(fovXDeg, 1));
      q.set('y', compactFloat(fovYDeg, 1));
    }
  } else {
    q.set('z', zoomId);
  }

  // toggles + panels + animation in one bitmask
  const mask = packTogglesToMask(toggles, showPanels, isAnimating);
  q.set('b', toB36Int(mask));

  // planets
  const allMask = (1 << Math.min(31, allPlanetIds.length)) - 1;
  let pMask = 0;
  for (let i = 0; i < allPlanetIds.length && i < 31; i++) {
    if (showPlanets[allPlanetIds[i]]) pMask |= (1 << i);
  }
  if (pMask === 0) q.set('pl', 'n');
  else if (pMask === allMask) q.set('pl', 'a');
  else q.set('pl', toB36Int(pMask));

  // speed: only precise decimal (removed legacy 's' param)
  q.set('sr', compactFloat(speedMinPerSec, 4));

  // DirectionalKeypad deltas: only include when non-zero
  if (Math.abs(deltaAzDeg) > 1e-6) q.set('da', compactFloat(deltaAzDeg, 2));
  if (Math.abs(deltaAltDeg) > 1e-6) q.set('dh', compactFloat(deltaAltDeg, 2));

  const base = baseUrl ?? `${window.location.origin}${window.location.pathname}`;
  const hash = appendHash ?? (window.location.hash || '');
  return `${base}?${q.toString()}${hash}`;
}