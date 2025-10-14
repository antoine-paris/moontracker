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
function shortFloat(n: number, decimals = 1): string {
  const s = n.toFixed(decimals);
  return s.replace(/\.0+$/, '').replace(/(\.\d*?[1-9])0+$/, '$1');
}

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
const PROJ_LIST = ['recti-panini','stereo-centered','ortho','cylindrical'] as const;

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
  setProjectionMode: (p: 'recti-panini'|'stereo-centered'|'ortho'|'cylindrical') => void;

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
  setShowSunCard: (b: boolean) => void;
  setShowMoonCard: (b: boolean) => void;
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
};

export function parseUrlIntoState(q: URLSearchParams, args: UrlInitArgs) {
  const {
    whenMsRef, setWhenMs,
    locations, location, setLocation,
    devices, CUSTOM_DEVICE_ID, setDeviceId, setZoomId, setFovXDeg, setFovYDeg, linkFov, setLinkFov,
    setFollow, setProjectionMode,
    setShowSun, setShowMoon, setShowPhase, setEarthshine, setShowEarth, setShowAtmosphere, setShowStars, setShowMarkers, setShowGrid,
    setShowSunCard, setShowMoonCard, setEnlargeObjects, setDebugMask,
    setShowPanels,
    allPlanetIds, setShowPlanets,
    isAnimating, setIsAnimating, speedMinPerSec, setSpeedMinPerSec,
    setDeltaAzDeg, setDeltaAltDeg,
  } = args;

  // Compact time: t = base36 unix seconds
  const t = q.get('t');
  if (t) {
    let ms: number | undefined;
    // Old formats: ISO or decimal ms
    const isDigits = /^[0-9]+$/.test(t);
    const looksMsDecimal = isDigits && t.length >= 12;
    const looksB36 = /^[0-9a-z]+$/i.test(t) && !t.includes('-') && !t.includes(':') && !looksMsDecimal;
    if (looksB36) {
      const maybe = timeFromB36(t);
      if (Number.isFinite(maybe)) ms = maybe;
    }
    if (ms == null) {
      let parsed = Date.parse(t);
      if (!Number.isFinite(parsed)) {
        const n = Number(t);
        if (Number.isFinite(n)) parsed = n;
      }
      if (Number.isFinite(parsed)) ms = parsed;
    }
    if (ms != null) {
      whenMsRef.current = ms!;
      setWhenMs(ms!);
    }
  }

  // Compact location: prefer explicit lat/lng, else g=geohash, else l=id
  const gh = q.get('g');
  const lId = q.get('l') ?? q.get('loc');
  const tzQ = q.get('tz');
  const labelQ = q.get('label'); // legacy
  const latQ = q.get('lat');
  const lngQ = q.get('lng');

  if (latQ && lngQ) {
    const lat = Number(latQ);
    const lng = Number(lngQ);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      const tz = tzQ || 'UTC';
      const label = labelQ || `Lat ${lat.toFixed(4)}, Lng ${lng.toFixed(4)}`;
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
        label: labelQ || `Lat ${lat.toFixed(4)}, Lng ${lon.toFixed(4)}`,
        lat,
        lng: lon,
        timeZone: tz,
      });
    } catch {
      // ignore invalid geohash, fallback next
    }
  } else if (lId) {
    const found = locations.find(l => l.id === lId);
    if (found) setLocation(found);
  }

  // Follow: compact F=index(base36) else old 'follow'
  const F = q.get('F');
  if (F != null) {
    const idx = fromB36Int(F);
    const v = FOLLOW_ALLOWED[idx as keyof typeof FOLLOW_ALLOWED] as FollowMode | undefined;
    if (v) setFollow(v);
  } else {
    const f = q.get('follow');
    if (f) setFollow(parseEnum(f, FOLLOW_ALLOWED as any, 'LUNE'));
  }

  // DirectionalKeypad deltas (degrees)
  {
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
  }

  // Projection: compact p=index(base36) else old 'proj'
  const pIdx = q.get('p');
  if (pIdx != null) {
    const idx = fromB36Int(pIdx);
    const v = PROJ_LIST[idx as keyof typeof PROJ_LIST];
    if (v) setProjectionMode(v);
  } else {
    const proj = q.get('proj');
    if (proj && (PROJ_LIST as readonly string[]).includes(proj)) setProjectionMode(proj as any);
  }

  // Device / zoom / focal / FOV (compact first)
  const devShort = q.get('d');
  const zoomShort = q.get('z');
  const focalShort = q.get('f');
  const fovxShort = q.get('x');
  const fovyShort = q.get('y');
  const linkShort = q.get('k'); // linkFov

  const devOld = q.get('device');
  const zmOld = q.get('zoom');
  const focalOld = q.get('f');   // 24x36 eq mm
  const fovxOld = q.get('fovx'); // degrees
  const fovyOld = q.get('fovy'); // degrees
  const linkOld = q.get('link');

  const dev = devShort ?? devOld;
  const zm = zoomShort ?? zmOld;
  const focal = focalShort ?? focalOld;
  const fovx = fovxShort ?? fovxOld;
  const fovy = fovyShort ?? fovyOld;
  const link = linkShort ?? linkOld;

  if (dev) {
    const exists = devices.some(d => d.id === dev);
    const finalDev = exists ? dev : CUSTOM_DEVICE_ID;
    setDeviceId(finalDev);
    if (exists && zm && devices.find(d => d.id === finalDev)?.zooms.some(z => z.id === zm)) {
      setZoomId(zm);
    }
  }

  // If custom device requested or no valid device provided, allow focal/FOV control
  const wantsCustom = (dev === CUSTOM_DEVICE_ID) || (!dev);
  if (wantsCustom) {
    setDeviceId(CUSTOM_DEVICE_ID);
    setZoomId('custom-theo');

    // Read link flag first
    const linkFlag = link != null ? parseBool(link, linkFov) : linkFov;
    setLinkFov(linkFlag);

    const fxQ = fovx ? Number(fovx) : NaN;
    const fyQ = fovy ? Number(fovy) : NaN;

    if (!linkFlag && (Number.isFinite(fxQ) || Number.isFinite(fyQ))) {
      // Preserve asymmetric FOV when unlinking
      if (Number.isFinite(fxQ)) setFovXDeg(clamp(fxQ, FOV_DEG_MIN, FOV_DEG_MAX));
      if (Number.isFinite(fyQ)) setFovYDeg(clamp(fyQ, FOV_DEG_MIN, FOV_DEG_MAX));
    } else {
      // accept base36 (compact) or decimal for 'f'
      const fmm = focal ? parseIntB36OrDec(focal) : NaN;
      if (Number.isFinite(fmm) && fmm > 0) {
        // focal → FOV (24x36 eq)
        const FF_W = 36, FF_H = 24;
        const fx = 2 * Math.atan(FF_W / (2 * fmm)) * 180 / Math.PI;
        const fy = 2 * Math.atan(FF_H / (2 * fmm)) * 180 / Math.PI;
        setFovXDeg(clamp(fx, FOV_DEG_MIN, FOV_DEG_MAX));
        setFovYDeg(clamp(fy, FOV_DEG_MIN, FOV_DEG_MAX));
      } else {
        // fallback to explicit x/y if provided
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
      setShowSunCard(u.sunCard);
      setShowMoonCard(u.moonCard);
      setEnlargeObjects(u.enlarge);
      setDebugMask(u.debug);
      setShowPanels(u.panels);
      setIsAnimating(u.play);
    }
  } else {
    // Old verbose params
    const boolMap: Array<[string, (b: boolean) => void]> = [
      ['sun', setShowSun],
      ['moon', setShowMoon],
      ['phase', setShowPhase],
      ['earthshine', setEarthshine],
      ['earth', setShowEarth],
      ['atm', setShowAtmosphere],
      ['stars', setShowStars],
      ['markers', setShowMarkers],
      ['grid', setShowGrid],
      ['sunCard', setShowSunCard],
      ['moonCard', setShowMoonCard],
      ['enlarge', setEnlargeObjects],
      ['debug', setDebugMask],
    ];
    for (const [param, setter] of boolMap) {
      const v = q.get(param);
      if (v != null) setter(parseBool(v));
    }
    const panels = q.get('panels');
    if (panels != null) setShowPanels(parseBool(panels, true));
    if (q.get('play') != null) setIsAnimating(parseBool(q.get('play'), isAnimating));
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
  } else {
    // Old
    const p = q.get('planets');
    if (p) {
      if (p.toLowerCase() === 'none') {
        const allFalse = Object.fromEntries(allPlanetIds.map(id => [id, false]));
        setShowPlanets(allFalse);
      } else if (p.toLowerCase() === 'all') {
        const allTrue = Object.fromEntries(allPlanetIds.map(id => [id, true]));
        setShowPlanets(allTrue);
      } else {
        const list = p.split(',').map(s => s.trim()).filter(Boolean);
        setShowPlanets(prev => {
          const next: Record<string, boolean> = { ...prev };
          for (const id of allPlanetIds) next[id] = list.includes(id);
          return next;
        });
      }
    }
  }

  // Speed (precise decimal first, then compact/int legacy, then verbose)
  const sr = q.get('sr'); // precise decimal speed
  if (sr != null) {
    const v = Number(sr);
    if (Number.isFinite(v)) setSpeedMinPerSec(v);
  } else {
    const s = q.get('s');
    if (s != null) {
      const v = fromB36Int(s);
      if (Number.isFinite(v)) setSpeedMinPerSec(v);
    } else if (q.get('spd') != null) {
      setSpeedMinPerSec(parseNum(q.get('spd'), speedMinPerSec));
    }
  }
}

export type BuildShareUrlArgs = {
  whenMs: number;

  // location
  location: LocationOption;
  locations: LocationOption[];

  // enums
  follow: FollowMode;
  projectionMode: 'recti-panini'|'stereo-centered'|'ortho'|'cylindrical';

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
    showSunCard: boolean;
    showMoonCard: boolean;
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
    // NEW
    deltaAzDeg, deltaAltDeg,
    baseUrl, appendHash,
  } = args;

  const q = new URLSearchParams();

  // location:
  // - If id matches a known city AND coordinates are exactly the canonical ones → l=id
  // - Else → g=geohash(9) + lat/lng decimals (+tz if not UTC)
  const matchById = locations.find(l => l.id === location.id);
  const coordsMatch =
    !!matchById &&
    Math.abs(location.lat - matchById.lat) <= 1e-9 &&
    Math.abs(normLng(location.lng) - normLng(matchById.lng)) <= 1e-9;

  if (matchById && coordsMatch) {
    q.set('l', location.id);
  } else {
    // precise numeric coords for exact reproduction
    q.set('lat', location.lat.toFixed(6));
    q.set('lng', location.lng.toFixed(6));
    // compact/geohash for backwards compatibility and brevity
    const gh = geohashEncode(location.lat, location.lng, 9);
    q.set('g', gh);
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
    // Always persist linkFov
    q.set('k', linkFov ? '1' : '0');

    if (linkFov) {
      // derive 24x36 eq focal from horizontal FOV (compact)
      const FF_W = 36;
      const rad = (Math.PI / 180) * fovXDeg;
      const tanHalf = Math.tan(rad / 2);
      if (tanHalf > 0) {
        const f = FF_W / (2 * tanHalf);
        q.set('f', toB36Int(Math.round(f))); // base36 for shorter
      }
      // no x/y when linked
    } else {
      // unlink: preserve asymmetric FOVs; omit 'f'
      q.set('x', shortFloat(fovXDeg, 1));
      q.set('y', shortFloat(fovYDeg, 1));
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

  // speed: precise decimal + legacy compact
  q.set('sr', shortFloat(speedMinPerSec, 6));         // precise
  q.set('s', toB36Int(Math.round(speedMinPerSec)));   // legacy

  // DirectionalKeypad deltas: only include when non-zero (keep URL short)
  if (Math.abs(deltaAzDeg) > 1e-6) q.set('da', shortFloat(deltaAzDeg, 3));
  if (Math.abs(deltaAltDeg) > 1e-6) q.set('dh', shortFloat(deltaAltDeg, 3));

  const base = baseUrl ?? `${window.location.origin}${window.location.pathname}`;
  const hash = appendHash ?? (window.location.hash || '');
  return `${base}?${q.toString()}${hash}`;
}