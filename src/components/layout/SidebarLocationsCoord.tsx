import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { LocationOption } from '../../data/locations';

type Props = {
  locations: LocationOption[];
  selectedLocation: LocationOption;
  selectedLng: number;
  setSelectedLng: (lng: number) => void;
  onSelectLocation: (loc: LocationOption) => void;
  collapsed: boolean;
  isActive: boolean;
};

function clampLat(x: number) {
  return Math.max(-90, Math.min(90, x));
}
function normLng(deg: number): number {
  let x = ((deg + 180) % 360 + 360) % 360 - 180;
  if (Object.is(x, -180)) x = 180;
  return x;
}

// Great-circle helpers
const R_EARTH_KM = 6371;
const LAT_CAP_DEG = 89;
function toRad(d: number) { return (d * Math.PI) / 180; }
function toDeg(r: number) { return (r * 180) / Math.PI; }

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const φ1 = toRad(lat1), φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R_EARTH_KM * c;
}

function bearingDeg(lat1: number, lon1: number, lat2: number, lon2: number) {
  const φ1 = toRad(lat1), φ2 = toRad(lat2);
  const λ1 = toRad(lon1), λ2 = toRad(lon2);
  const y = Math.sin(λ2 - λ1) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);
  const θ = Math.atan2(y, x);
  return (toDeg(θ) + 360) % 360;
}

function dir8Fr(bearing: number): 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SO' | 'O' | 'NO' {
  const dirs: Array<'N'|'NE'|'E'|'SE'|'S'|'SO'|'O'|'NO'> = ['N','NE','E','SE','S','SO','O','NO'];
  const idx = Math.round(((bearing % 360) / 45)) % 8;
  return dirs[idx];
}

function moveDest(latDeg: number, lngDeg: number, distanceKm: number, bearingDegIn: number) {
  const δ = distanceKm / R_EARTH_KM;
  const θ = toRad(bearingDegIn);
  const φ1 = toRad(latDeg);
  const λ1 = toRad(lngDeg);
  const sinφ1 = Math.sin(φ1), cosφ1 = Math.cos(φ1);
  const sinδ = Math.sin(δ), cosδ = Math.cos(δ);

  const sinφ2 = sinφ1 * cosδ + cosφ1 * sinδ * Math.cos(θ);
  const φ2 = Math.asin(Math.max(-1, Math.min(1, sinφ2)));

  const y = Math.sin(θ) * sinδ * cosφ1;
  const x = cosδ - sinφ1 * sinφ2;
  const λ2 = λ1 + Math.atan2(y, x);

  let lat2 = toDeg(φ2);
  let lng2 = toDeg(λ2);
  lat2 = clampLat(lat2);
  lng2 = normLng(lng2);
  return { lat: lat2, lng: lng2 };
}

// Limit NS move so latitude stays within ±89°
function capNSDistanceKm(latDeg: number, distanceKm: number, bearingDegIn: number) {
  const b = ((bearingDegIn % 360) + 360) % 360;
  if (b !== 0 && b !== 180) return distanceKm; // only cap for N/S
  const φ1 = toRad(latDeg);
  const φCap = toRad(LAT_CAP_DEG);
  const δWanted = distanceKm / R_EARTH_KM;
  let maxδ = 0;
  if (b === 0) {
    // North: φ2 = φ1 + δ ≤ φCap → δ ≤ φCap - φ1
    maxδ = Math.max(0, φCap - φ1);
  } else {
    // South: φ2 = φ1 - δ ≥ -φCap → δ ≤ φ1 + φCap
    maxδ = Math.max(0, φ1 + φCap);
  }
  const δAdj = Math.min(δWanted, maxδ);
  return δAdj * R_EARTH_KM;
}

export default function SidebarLocationsCoord({
  locations,
  selectedLocation,
  selectedLng,
  setSelectedLng,
  onSelectLocation,
  collapsed,
  isActive,
}: Props) {
  const [lat, setLat] = useState<number>(selectedLocation.lat);
  const [lng, setLng] = useState<number>(selectedLocation.lng);

  // Track source of last lat/lng change to avoid ping-pong with App
  const updateSrcRef = useRef<'idle' | 'user' | 'sync'>('idle');
  const suppressNextSyncRef = useRef<boolean>(false);

  // Sync local fields only when selection id changes (external city change)
  useEffect(() => {
    if (suppressNextSyncRef.current) {
      suppressNextSyncRef.current = false;
      return;
    }
    // Ignore placeholder during async load
    if (selectedLocation.id === 'loading') return;
    updateSrcRef.current = 'sync';
    setLat(selectedLocation.lat);
    setLng(selectedLocation.lng);
    updateSrcRef.current = 'idle';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLocation.id]);

  // Nearest city to current coordinates
  const nearest = useMemo(() => {
    if (!locations?.length) return null as null | { city: LocationOption; km: number; bearingFromCity: number };
    let best: LocationOption | null = null;
    let bestD = Number.POSITIVE_INFINITY;
    for (const c of locations) {
      const d = haversineKm(lat, lng, c.lat, c.lng);
      if (d < bestD) { bestD = d; best = c; }
    }
    if (!best) return null;
    const b = bearingDeg(best.lat, best.lng, lat, lng); // bearing from city to current point
    return { city: best, km: bestD, bearingFromCity: b };
  }, [locations, lat, lng]);

  // NESO highlight state
  const isN = lat > 0, isS = lat < 0;
  const isE = lng > 0, isO = lng < 0;

  // Auto-apply: only when user changed lat/lng, locations are ready, and not placeholder
  useEffect(() => {
    if (!isActive) return;                 // act only when the tab is active
    if (!nearest) return;                  // needs data
    if (selectedLocation.id === 'loading') return;
    if (updateSrcRef.current !== 'user') return; // avoid reacting to external sync

    const newLat = clampLat(lat);
    const newLng = normLng(lng);

    const sameLat = Math.abs(newLat - selectedLocation.lat) <= 1e-9;
    const sameLng = Math.abs(normLng(newLng) - normLng(selectedLocation.lng)) <= 1e-9;
    const sameCity = selectedLocation.id === nearest.city.id;
    if (sameLat && sameLng && sameCity) return;

    // Apply: keep city id/label/tz, override coordinates
    onSelectLocation({
      ...nearest.city,
      lat: newLat,
      lng: newLng,
    });

    // Prevent the immediate prop→state sync from clobbering our lat/lng
    suppressNextSyncRef.current = true;

    const newLngRounded = Math.round(normLng(newLng));
    if (newLngRounded !== selectedLng) {
      setSelectedLng(newLngRounded);
    }

    // Reset source after applying
    updateSrcRef.current = 'idle';
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng, nearest, isActive]);

  // Keyboard: arrow keys move 100 km when tab active and not collapsed
  useEffect(() => {
    if (collapsed || !isActive) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        let bearing = 0;
        if (e.key === 'ArrowUp') bearing = 0;        // N
        if (e.key === 'ArrowRight') bearing = 90;    // E
        if (e.key === 'ArrowDown') bearing = 180;    // S
        if (e.key === 'ArrowLeft') bearing = 270;    // O
        const kmBase = 100;
        const km = capNSDistanceKm(lat, kmBase, bearing);
        if (km <= 0) return;
        const p = moveDest(lat, lng, km, bearing);
        updateSrcRef.current = 'user';
        setLat(p.lat);
        setLng(p.lng);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [collapsed, isActive, lat, lng]);

  const styles: Record<string, React.CSSProperties> = {
    wrap: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      opacity: collapsed ? 0.85 : 1,
    },
    rowGroup: {
      display: 'flex',
      gap: 8,
      alignItems: 'stretch',
    },
    colInputs: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      flex: 1,
      minWidth: 0,
    },
    row: {
      display: 'flex',
      gap: 8,
      alignItems: 'center',
    },
    label: {
      width: 110,
      fontSize: 13,
      color: 'rgba(255,255,255,0.9)',
    },
    input: {
      flex: 1,
      padding: '6px 8px',
      borderRadius: 6,
      border: '1px solid rgba(255,255,255,0.15)',
      background: 'transparent',
      color: '#fff',
      outline: 'none',
      fontSize: 13, // smaller font
    },
    nesoBox: {
      flex: '0 0 auto',
      width: 84,
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gridTemplateRows: '1fr 1fr',
      gap: 6,
      alignItems: 'center',
      justifyItems: 'center',
      borderRadius: 8,
      border: '1px solid rgba(255,255,255,0.12)',
      padding: 6,
    },
    arrow: {
      fontSize: 16,
      lineHeight: 1,
      color: 'rgba(255,255,255,0.55)',
      display: 'inline-block',
      userSelect: 'none',
    },
    arrowActive: {
      color: '#e6f3ff',
      textShadow: '0 0 6px rgba(80,160,255,0.6)',
    },
    nearCity: {
      fontSize: 12,
      color: 'rgba(255,255,255,0.8)',
    },
    padWrap: {
      display: 'grid',
      gridTemplateColumns: '36px 36px 36px',
      gridTemplateRows: '36px 36px 36px',
      justifyContent: 'center',
      gap: 6,
      marginTop: 4,
    },
    padBtn: {
      width: 36,
      height: 36,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 8,
      border: '1px solid rgba(255,255,255,0.20)',
      background: 'transparent',
      color: 'rgba(255,255,255,0.9)',
      cursor: 'pointer',
      fontSize: 16,
      userSelect: 'none',
    },
    padSpacer: { width: 36, height: 36 },
  };

  const formatNearCity = useMemo(() => {
    if (!nearest) return '';
    const km = Math.round(nearest.km);
    if (!Number.isFinite(km)) return '';
    if (km <= 0) return `${nearest.city.label}`; // remove “0 km de …”
    const dir = dir8Fr(nearest.bearingFromCity);
    return `à ${km}km au ${dir} de ${nearest.city.label}`;
  }, [nearest]);

  const move100 = (bearing: number) => {
    const kmBase = 100;
    const km = capNSDistanceKm(lat, kmBase, bearing);
    if (km <= 0) return;
    const p = moveDest(lat, lng, km, bearing);
    updateSrcRef.current = 'user';
    setLat(p.lat);
    setLng(p.lng);
  };

  return (
    <div style={styles.wrap} aria-label="Entrer des coordonnées">
      {/* Inputs + NESO indicator at right */}
      <div style={styles.rowGroup}>
        <div style={styles.colInputs}>
          <div style={styles.row}>
            <label style={styles.label} htmlFor="coord-lat">
              Latitude
            </label>
            <input
              id="coord-lat"
              type="number"
              step="0.001"
              min={-89}
              max={89}
              value={Number.isFinite(lat) ? lat.toFixed(3) : ''}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                if (!Number.isFinite(v)) return;
                updateSrcRef.current = 'user';
                setLat(clampLat(v));
              }}
              style={styles.input}
            />
          </div>

          <div style={styles.row}>
            <label style={styles.label} htmlFor="coord-lng">
              Longitude
            </label>
            <input
              id="coord-lng"
              type="number"
              step="0.001"
              min={-180}
              max={180}
              value={Number.isFinite(lng) ? lng.toFixed(3) : ''}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                if (!Number.isFinite(v)) return;
                updateSrcRef.current = 'user';
                setLng(v);
              }}
              style={styles.input}
            />
          </div>
        </div>

        
      </div>

      {/* Nearest city hint */}
      <div style={styles.row}>
        <span style={styles.nearCity}>
          {formatNearCity || '—'}
        </span>
      </div>

      {/* Move pad (100 km steps) */}
      <div style={styles.padWrap} role="group" aria-label="Déplacement de 100 km">
        <div style={styles.padSpacer} />
        <button type="button" style={styles.padBtn} title="Aller vers le Nord (100 km)" onClick={() => move100(0)}>
          <span style={{ transform: 'rotate(270deg)', display: 'inline-block' }}>&#x27A4;</span>
        </button>
        <div style={styles.padSpacer} />

        <button type="button" style={styles.padBtn} title="Aller vers l’Ouest (100 km)" onClick={() => move100(270)}>
          <span style={{ transform: 'rotate(180deg)', display: 'inline-block' }}>&#x27A4;</span>
        </button>
        <div style={styles.padSpacer} />
        <button type="button" style={styles.padBtn} title="Aller vers l’Est (100 km)" onClick={() => move100(90)}>
          <span style={{ transform: 'rotate(0deg)', display: 'inline-block' }}>&#x27A4;</span>
        </button>

        <div style={styles.padSpacer} />
        <button type="button" style={styles.padBtn} title="Aller vers le Sud (100 km)" onClick={() => move100(180)}>
          <span style={{ transform: 'rotate(90deg)', display: 'inline-block' }}>&#x27A4;</span>
        </button>
        <div style={styles.padSpacer} />
      </div>
    </div>
  );
}