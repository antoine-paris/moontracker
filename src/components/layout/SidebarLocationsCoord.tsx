import React, { useEffect, useMemo, useState } from 'react';
import type { LocationOption } from '../../data/locations';

type Props = {
  selectedLocation: LocationOption;
  selectedLng: number;
  setSelectedLng: (lng: number) => void;
  onSelectLocation: (loc: LocationOption) => void;
  collapsed: boolean;
};

function clampLat(x: number) {
  return Math.max(-90, Math.min(90, x));
}
function normLng(deg: number): number {
  let x = ((deg + 180) % 360 + 360) % 360 - 180;
  if (Object.is(x, -180)) x = 180;
  return x;
}

export default function SidebarLocationsCoord({
  selectedLocation,
  selectedLng,
  setSelectedLng,
  onSelectLocation,
  collapsed,
}: Props) {
  const [lat, setLat] = useState<number>(selectedLocation.lat);
  const [lng, setLng] = useState<number>(selectedLocation.lng);

  useEffect(() => {
    setLat(selectedLocation.lat);
    setLng(selectedLocation.lng);
  }, [selectedLocation.lat, selectedLocation.lng]);

  const isChanged = useMemo(
    () =>
      Math.abs(lat - selectedLocation.lat) > 1e-9 ||
      Math.abs(normLng(lng) - normLng(selectedLocation.lng)) > 1e-9,
    [lat, lng, selectedLocation.lat, selectedLocation.lng]
  );

  const apply = () => {
    const newLat = clampLat(lat);
    const newLng = normLng(lng);
    onSelectLocation({
      ...selectedLocation,
      lat: newLat,
      lng: newLng,
    });
    setSelectedLng(Math.round(normLng(newLng)));
  };

  const styles: Record<string, React.CSSProperties> = {
    wrap: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      opacity: collapsed ? 0.85 : 1,
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
    },
    btnRow: {
      display: 'flex',
      gap: 8,
      justifyContent: 'flex-end',
      marginTop: 4,
    },
    btn: {
      padding: '6px 10px',
      borderRadius: 8,
      border: '1px solid rgba(255,255,255,0.15)',
      background: 'transparent',
      color: 'rgba(255,255,255,0.9)',
      cursor: 'pointer',
      fontSize: 13,
    },
    btnPrimary: {
      background: 'rgba(0,150,255,0.18)',
      borderColor: 'rgba(0,150,255,0.35)',
      color: '#e6f3ff',
    },
    hint: {
      fontSize: 12,
      color: 'rgba(255,255,255,0.6)',
    },
  };

  return (
    <div style={styles.wrap} aria-label="Entrer des coordonnées">
      <div style={styles.row}>
        <label style={styles.label} htmlFor="coord-lat">
          Latitude (°)
        </label>
        <input
          id="coord-lat"
          type="number"
          step="0.01"
          min={-90}
          max={90}
          value={lat}
          onChange={(e) => setLat(clampLat(parseFloat(e.target.value)))}
          style={styles.input}
        />
      </div>

      <div style={styles.row}>
        <label style={styles.label} htmlFor="coord-lng">
          Longitude (°)
        </label>
        <input
          id="coord-lng"
          type="number"
          step="0.01"
          min={-180}
          max={180}
          value={lng}
          onChange={(e) => setLng(parseFloat(e.target.value))}
          style={styles.input}
        />
      </div>

      <div style={styles.row}>
        <span style={styles.hint}>
          Conseil: utilisez “Centrer la vue sur la longitude” pour aligner le globe.
        </span>
      </div>

      <div style={styles.btnRow}>
        <button
          type="button"
          style={styles.btn}
          onClick={() => setSelectedLng(Math.round(normLng(lng)))}
          title="Met à jour la rotation du globe pour cette longitude"
        >
          Centrer la vue sur la longitude
        </button>
        <button
          type="button"
          style={{ ...styles.btn, ...styles.btnPrimary, opacity: isChanged ? 1 : 0.7 }}
          onClick={apply}
          disabled={!isChanged}
          title="Appliquer ces coordonnées au lieu sélectionné"
        >
          Appliquer
        </button>
      </div>
    </div>
  );
}