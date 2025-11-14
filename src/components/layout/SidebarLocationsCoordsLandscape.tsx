import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { type LocationOption } from '../../data/locations';
import {
  clampLat,
  normLng,
  haversineKm,
  bearingDeg,
  dir8FullFr,
  moveDest,
  capNSDistanceKm,
} from '../../utils/geo';
import { getFrenchToLocalizedFullDirMap } from '../../utils/directions';

interface SidebarLocationsCoordsLandscapeProps {
  selectedLocation: LocationOption;
  onLocationChange: (location: LocationOption) => void;
  locations?: LocationOption[];
  selectedLng: number;
  setSelectedLng: (lng: number) => void;
}

export default function SidebarLocationsCoordsLandscape({
  selectedLocation,
  onLocationChange,
  locations = [],
  selectedLng,
  setSelectedLng
}: SidebarLocationsCoordsLandscapeProps) {
  const { t } = useTranslation('common');
  const { t: tUi } = useTranslation('ui');
  const [lat, setLat] = useState(selectedLocation.lat);
  const [lng, setLng] = useState(selectedLocation.lng);

  useEffect(() => {
    setLat(selectedLocation.lat);
    setLng(selectedLocation.lng);
  }, [selectedLocation]);

  // Nearest city to current coordinates
  const nearest = useMemo(() => {
    if (!locations?.length) return null;
    let best: LocationOption | null = null;
    let bestD = Number.POSITIVE_INFINITY;
    for (const c of locations) {
      const d = haversineKm(lat, lng, c.lat, c.lng);
      if (d < bestD) { bestD = d; best = c; }
    }
    if (!best) return null;
    const b = bearingDeg(best.lat, best.lng, lat, lng);
    return { city: best, km: bestD, bearingFromCity: b };
  }, [locations, lat, lng]);

  const nearCityParts = useMemo((): { line1: string; city: string } => {
    // Poles special-casing
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      if (lat >= 80) {
        const d = haversineKm(lat, lng, 90, lng);
        const km = Math.round(d);
        if (Number.isFinite(km)) 
          if (km==0)
            return { line1: '', city: t('location.nearNorthPole') };
          else
            return { line1: '', city: t('location.kmFromNorthPole', { km }) };
      }
      if (lat <= -60) {
        const d = haversineKm(lat, lng, -90, lng);
        const km = Math.round(d);
        if (Number.isFinite(km)) 
          if (km==0)
            return { line1: '', city: t('location.nearSouthPole') };
          else
            return { line1: '', city: t('location.kmFromSouthPole', { km }) };
      }
    }

    if (!nearest) return { line1: '', city: '' };
    const km = Math.round(nearest.km);

    if (!Number.isFinite(km)) return { line1: '', city: '' };
    if (km <= 0) return { line1: '', city: `${nearest.city.label}` };
    const dirFr = dir8FullFr(nearest.bearingFromCity);
    const dirMap = getFrenchToLocalizedFullDirMap(t);
    const dir = dirMap[dirFr] || dirFr;
    return {
      line1: tUi('coordinates.distanceFromCity', { km, dir }),
      city: tUi('coordinates.cityWithAsterisk', { city: nearest.city.label }),
    };
  }, [nearest, lat, lng, t, tUi]);

  const handleLatChange = (value: number) => {
    const newLat = clampLat(value);
    setLat(newLat);
    if (nearest) {
      onLocationChange({
        ...nearest.city,
        lat: newLat,
        lng: lng
      });
    }
  };

  const handleLngChange = (value: number) => {
    const newLng = normLng(value);
    setLng(newLng);
    const newLngRounded = Math.round(newLng);
    if (newLngRounded !== selectedLng) {
      setSelectedLng(newLngRounded);
    }
    if (nearest) {
      onLocationChange({
        ...nearest.city,
        lat: lat,
        lng: newLng
      });
    }
  };

  const move100 = (bearing: number) => {
    const kmBase = 100;
    const km = capNSDistanceKm(lat, kmBase, bearing);
    if (km <= 0) return;
    const p = moveDest(lat, lng, km, bearing);
    setLat(p.lat);
    setLng(p.lng);
    if (nearest) {
      onLocationChange({
        ...nearest.city,
        lat: p.lat,
        lng: p.lng
      });
    }
  };

  return (
    <div className="mobile-coords-landscape-container">
      {/* Layout horizontal : pavé à gauche, inputs à droite */}
      <div className="flex flex-row items-start justify-between gap-8 w-full p-4 max-w-4xl mx-auto">
        
        {/* Pavé directionnel - Colonne de gauche */}
        <div className="flex flex-col items-center justify-center flex-1 h-full min-w-0">
          <div className="text-sm font-medium mb-4 text-gray-300 text-center">
            {tUi('coordinates.moveBy100km')}
          </div>
          
          {/* Croix directionnelle - centrée verticalement */}
          <div className="grid grid-cols-3 grid-rows-3 gap-2 justify-items-center items-center place-content-center">
            {/* Ligne 1 */}
            <div></div>
            <button
              type="button"
              onClick={() => move100(0)}
              title={t('directions.toNorth')}
              className="w-12 h-12 bg-gray-700 hover:bg-gray-600 text-white rounded border border-gray-600 text-lg font-medium transition-colors flex items-center justify-center"
            >
              <span style={{ transform: 'rotate(270deg)', display: 'inline-block' }}>&#x27A4;</span>
            </button>
            <div></div>

            {/* Ligne 2 */}
            <button
              type="button"
              onClick={() => move100(270)}
              title={t('directions.toWest')}
              className="w-12 h-12 bg-gray-700 hover:bg-gray-600 text-white rounded border border-gray-600 text-lg font-medium transition-colors flex items-center justify-center"
            >
              <span style={{ transform: 'rotate(180deg)', display: 'inline-block' }}>&#x27A4;</span>
            </button>
            <div></div>
            <button
              type="button"
              onClick={() => move100(90)}
              title={t('directions.toEast')}
              className="w-12 h-12 bg-gray-700 hover:bg-gray-600 text-white rounded border border-gray-600 text-lg font-medium transition-colors flex items-center justify-center"
            >
              <span style={{ transform: 'rotate(0deg)', display: 'inline-block' }}>&#x27A4;</span>
            </button>

            {/* Ligne 3 */}
            <div></div>
            <button
              type="button"
              onClick={() => move100(180)}
              title={t('directions.toSouth')}
              className="w-12 h-12 bg-gray-700 hover:bg-gray-600 text-white rounded border border-gray-600 text-lg font-medium transition-colors flex items-center justify-center"
            >
              <span style={{ transform: 'rotate(90deg)', display: 'inline-block' }}>&#x27A4;</span>
            </button>
            <div></div>
          </div>
        </div>

        {/* Inputs Lat/Lng - Colonne de droite */}
        <div className="flex flex-col space-y-4 flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-300">
            {tUi('coordinates.enterCoordinates')}
          </div>
          
          {/* Latitude et Longitude côte à côte */}
          <div className="flex flex-row gap-4">
            {/* Latitude */}
            <div className="flex-1 space-y-2">
              <label className="block text-xs font-medium text-gray-400">
                {tUi('coordinates.latitude')}
              </label>
              <input
                type="number"
                value={Number.isFinite(lat) ? lat.toFixed(3) : ''}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  if (!Number.isFinite(v)) return;
                  handleLatChange(v);
                }}
                step="0.001"
                min="-89.999"
                max="89.999"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Longitude */}
            <div className="flex-1 space-y-2">
              <label className="block text-xs font-medium text-gray-400">
                {tUi('coordinates.longitude')}
              </label>
              <input
                type="number"
                value={Number.isFinite(lng) ? lng.toFixed(3) : ''}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  if (!Number.isFinite(v)) return;
                  handleLngChange(v);
                }}
                step="0.001"
                min="-180"
                max="180"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Info sur la ville la plus proche */}
          <div className="mt-4 p-3  rounded-md">
            <div className="text-sm text-white">
              {nearCityParts.line1 && (
                <div className="text-xs text-gray-300">{nearCityParts.line1}</div>
              )}
              {nearCityParts.city ? (
                <div className="font-medium">{nearCityParts.city}</div>
              ) : (
                <div>—</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}