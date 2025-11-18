import React, { useMemo, useRef, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { clamp } from "../../utils/math";
import type { FollowMode } from "../../types";
import type { LocationOption } from "../../data/locations";
import {
  clampLat,
  normLng,
  haversineKm,
  bearingDeg,
  moveDest,
  capNSDistanceKm,
} from "../../utils/geo";

type Props = {
  baseRefAlt: number;
  stepAzDeg: number;
  stepAltDeg: number;
  setDeltaAzDeg: React.Dispatch<React.SetStateAction<number>>;
  setDeltaAltDeg: React.Dispatch<React.SetStateAction<number>>;
  zIndex?: number;
  onLongPoseClear?: () => void;
  isMobile?: boolean;
  isLandscape?: boolean;
  follow: FollowMode;
  // Props for Earth3D mode
  showMobileEarth3D?: boolean;
  location?: LocationOption;
  onSelectLocation?: (loc: LocationOption) => void;
  locations?: LocationOption[];
};

export default function DirectionalKeypad({
  baseRefAlt,
  stepAzDeg,
  stepAltDeg,
  setDeltaAzDeg,
  setDeltaAltDeg,
  zIndex,
  onLongPoseClear,
  isMobile = false,
  isLandscape = false,
  follow,
  showMobileEarth3D = false,
  location,
  onSelectLocation,
  locations,
}: Props) {
  const { t } = useTranslation('common');
  const { t: tUi } = useTranslation('ui');
  
  // Local state for Earth3D mode
  const [lat, setLat] = useState<number>(location?.lat ?? 0);
  const [lng, setLng] = useState<number>(location?.lng ?? 0);
  const [isGeolocating, setIsGeolocating] = useState<boolean>(false);
  const updateSrcRef = useRef<'idle' | 'user' | 'sync'>('idle');
  const suppressNextSyncRef = useRef<boolean>(false);
  
  // Sync local state with location prop only when location ID changes (external city change)
  useEffect(() => {
    if (suppressNextSyncRef.current) {
      suppressNextSyncRef.current = false;
      return;
    }
    
    if (location && showMobileEarth3D && location.id !== 'loading') {
      updateSrcRef.current = 'sync';
      setLat(location.lat);
      setLng(location.lng);
      updateSrcRef.current = 'idle';
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location?.id, location?.lat, location?.lng, showMobileEarth3D]);
  
  // Calculate nearest city
  const nearest = useMemo(() => {
    if (!showMobileEarth3D || !locations?.length) return null;
    let best: LocationOption | null = null;
    let bestD = Number.POSITIVE_INFINITY;
    for (const c of locations) {
      const d = haversineKm(lat, lng, c.lat, c.lng);
      if (d < bestD) { bestD = d; best = c; }
    }
    if (!best) return null;
    const b = bearingDeg(best.lat, best.lng, lat, lng);
    return { city: best, km: bestD, bearingFromCity: b };
  }, [showMobileEarth3D, locations, lat, lng]);
  
  // Auto-apply location change in Earth3D mode
  useEffect(() => {
    if (!showMobileEarth3D || !nearest || !location || !onSelectLocation) {
      return;
    }
    if (updateSrcRef.current !== 'user') {
      return;
    }
    
    const newLat = clampLat(lat);
    const newLng = normLng(lng);
    
    const sameLat = Math.abs(newLat - location.lat) <= 1e-9;
    const sameLng = Math.abs(normLng(newLng) - normLng(location.lng)) <= 1e-9;
    
    if (sameLat && sameLng) {
      return;
    }
    
    onSelectLocation({
      ...nearest.city,
      lat: newLat,
      lng: newLng,
    });
    
    // Prevent the immediate prop→state sync from clobbering our lat/lng
    suppressNextSyncRef.current = true;
    
    updateSrcRef.current = 'idle';
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng, nearest, showMobileEarth3D]);
  
  // Function to move 100km in a direction (Earth3D mode)
  const move100 = (bearing: number) => {
    if (!showMobileEarth3D) return;
    const kmBase = 100;
    const km = capNSDistanceKm(lat, kmBase, bearing);
    if (km <= 0) return;
    const p = moveDest(lat, lng, km, bearing);
    updateSrcRef.current = 'user';
    setLat(p.lat);
    setLng(p.lng);
  };
  
  // Function to get user's geolocation
  const handleGeolocation = () => {
    if (!showMobileEarth3D) return;
    if (isGeolocating) return; // Prevent multiple concurrent requests
    if ('geolocation' in navigator) {
      setIsGeolocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLat = position.coords.latitude;
          const newLng = position.coords.longitude;
          updateSrcRef.current = 'user';
          setLat(newLat);
          setLng(newLng);
          setIsGeolocating(false);
        },
        (error) => {
          console.error('Geolocation error:', error.code, error.message);
          // On error, move to equator/prime meridian
          updateSrcRef.current = 'user';
          setLat(0);
          setLng(0);
          setIsGeolocating(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    }
  };


  // Fonction pour obtenir l'icône correspondant au mode de suivi
  const getFollowIcon = (mode: FollowMode) => {
    const stroke = 'currentColor';
    const strokeWidth = 1.7;
    const s = { fill: 'none', stroke, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

    switch (mode) {
      case 'SOLEIL':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" className="shrink-0 pointer-events-none select-none">
            <circle cx="12" cy="12" r="4" {...s} fill="#FFD54A" />
            <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" {...s} />
          </svg>
        );
      case 'LUNE':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" className="shrink-0 pointer-events-none select-none">
            <circle cx="12" cy="12" r="10" {...s} stroke={stroke} />
            <path d="M4 12A8 8 0 0 1 20 12L4 12Z" fill="#000" />
            <path d="M20 12A8 8 0 0 1 4 12L20 12Z" fill="#000" />
            <path d="M12 3 A 9 9 0 0 1 12 21 A 3.5 9 0 0 0 12 3 Z" {...s} stroke={stroke} fill={stroke} />
          </svg>
        );
      case 'MERCURE': return <span>&#9791;</span>;
      case 'VENUS': return <span>&#9792;</span>;
      case 'MARS': return <span>&#9794;</span>;
      case 'JUPITER': return <span>&#9795;</span>;
      case 'SATURNE': return <span>&#9796;</span>;
      case 'URANUS': return <span>&#9797;</span>;
      case 'NEPTUNE': return <span>&#9798;</span>;
      case 'O': return <span style={{ display: 'inline-block', transform: 'rotate(180deg)' }}>&#x27A4;</span>;
      case 'N': return <span style={{ display: 'inline-block', transform: 'rotate(270deg)' }}>&#x27A4;</span>;
      case 'S': return <span style={{ display: 'inline-block', transform: 'rotate(90deg)' }}>&#x27A4;</span>;
      case 'E': return <span>&#x27A4;</span>;
      default: return '•';
    }
  };

  if (isMobile && !isLandscape) {
    // Layout PORTRAIT mobile : boutons verticaux à gauche de l'écran, à 30px du bas
    return (
      <div 
        className="fixed left-4 flex flex-col items-center gap-3"
        style={{ zIndex, bottom: '30px' }}
      >
        {/* Bouton Haut */}
        <button
          className="w-12 h-12 rounded-md border border-white/30 bg-black/50 hover:bg-black/70 active:bg-black/80 text-white text-lg font-bold transition-all duration-150 active:scale-95"
          title={showMobileEarth3D ? t('directions.toNorth') : tUi('directionalKeypad.moveUp', { degrees: stepAltDeg.toFixed(1) })}
          aria-label={showMobileEarth3D ? t('directions.toNorth') : tUi('directionalKeypad.up')}
          onTouchEnd={(e) => {
            e.preventDefault();
            if (showMobileEarth3D) {
              move100(0); // North
            } else {
              setDeltaAltDeg(prev => {
                const tgt = clamp(baseRefAlt + prev + stepAltDeg, -89.9, 89.9);
                return tgt - baseRefAlt;
              });
              onLongPoseClear?.();
            }
          }}
          onClick={() => {
            if (showMobileEarth3D) {
              move100(0); // North
            } else {
              setDeltaAltDeg(prev => {
                const tgt = clamp(baseRefAlt + prev + stepAltDeg, -89.9, 89.9);
                return tgt - baseRefAlt;
              });
              onLongPoseClear?.();
            }
          }}
        >
          {showMobileEarth3D ? (
            <span style={{ transform: 'rotate(270deg)', display: 'inline-block' }}>➤</span>
          ) : (
            '↑'
          )}
        </button>

        {/* Bouton Gauche */}
        <button
          className="w-12 h-12 rounded-md border border-white/30 bg-black/50 hover:bg-black/70 active:bg-black/80 text-white text-lg font-bold transition-all duration-150 active:scale-95"
          title={showMobileEarth3D ? t('directions.toWest') : tUi('directionalKeypad.moveLeft', { degrees: stepAzDeg.toFixed(1) })}
          aria-label={showMobileEarth3D ? t('directions.toWest') : tUi('directionalKeypad.left')}
          onTouchEnd={(e) => {
            e.preventDefault();
            if (showMobileEarth3D) {
              move100(270); // West
            } else {
              setDeltaAzDeg(prev => {
                const nd = prev - stepAzDeg;
                return ((nd + 180) % 360 + 360) % 360 - 180;
              });
              onLongPoseClear?.();
            }
          }}
          onClick={() => {
            if (showMobileEarth3D) {
              move100(270); // West
            } else {
              setDeltaAzDeg(prev => {
                const nd = prev - stepAzDeg;
                return ((nd + 180) % 360 + 360) % 360 - 180;
              });
              onLongPoseClear?.();
            }
          }}
        >
          {showMobileEarth3D ? (
            <span style={{ transform: 'rotate(180deg)', display: 'inline-block' }}>➤</span>
          ) : (
            '←'
          )}
        </button>

        {/* Bouton Centre (Recenter or Geolocation) */}
        <button
          className="w-12 h-12 rounded-md border border-white/30 bg-black/50 hover:bg-black/70 active:bg-black/80 text-white text-xl font-bold transition-all duration-150 active:scale-95 flex items-center justify-center"
          title={showMobileEarth3D ? tUi('coordinates.geolocation', 'Géolocalisation') : tUi('directionalKeypad.recenter')}
          aria-label={showMobileEarth3D ? tUi('coordinates.geolocation', 'Géolocalisation') : tUi('directionalKeypad.recenter')}
          onTouchEnd={(e) => {
            e.preventDefault();
            if (showMobileEarth3D) {
              handleGeolocation();
            } else {
              setDeltaAzDeg(0);
              setDeltaAltDeg(0);
              onLongPoseClear?.();
            }
          }}
          onClick={() => {
            if (showMobileEarth3D) {
              handleGeolocation();
            } else {
              setDeltaAzDeg(0);
              setDeltaAltDeg(0);
              onLongPoseClear?.();
            }
          }}
        >
          {showMobileEarth3D ? (
            isGeolocating ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="3" fill="currentColor" />
                <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
              </svg>
            )
          ) : (
            getFollowIcon(follow)
          )}
        </button>

        {/* Bouton Droite */}
        <button
          className="w-12 h-12 rounded-md border border-white/30 bg-black/50 hover:bg-black/70 active:bg-black/80 text-white text-lg font-bold transition-all duration-150 active:scale-95"
          title={showMobileEarth3D ? t('directions.toEast') : tUi('directionalKeypad.moveRight', { degrees: stepAzDeg.toFixed(1) })}
          aria-label={showMobileEarth3D ? t('directions.toEast') : tUi('directionalKeypad.right')}
          onTouchEnd={(e) => {
            e.preventDefault();
            if (showMobileEarth3D) {
              move100(90); // East
            } else {
              setDeltaAzDeg(prev => {
                const nd = prev + stepAzDeg;
                return ((nd + 180) % 360 + 360) % 360 - 180;
              });
              onLongPoseClear?.();
            }
          }}
          onClick={() => {
            if (showMobileEarth3D) {
              move100(90); // East
            } else {
              setDeltaAzDeg(prev => {
                const nd = prev + stepAzDeg;
                return ((nd + 180) % 360 + 360) % 360 - 180;
              });
              onLongPoseClear?.();
            }
          }}
        >
          {showMobileEarth3D ? (
            <span style={{ transform: 'rotate(0deg)', display: 'inline-block' }}>➤</span>
          ) : (
            '→'
          )}
        </button>

        {/* Bouton Bas */}
        <button
          className="w-12 h-12 rounded-md border border-white/30 bg-black/50 hover:bg-black/70 active:bg-black/80 text-white text-lg font-bold transition-all duration-150 active:scale-95"
          title={showMobileEarth3D ? t('directions.toSouth') : tUi('directionalKeypad.moveDown', { degrees: stepAltDeg.toFixed(1) })}
          aria-label={showMobileEarth3D ? t('directions.toSouth') : tUi('directionalKeypad.down')}
          onTouchEnd={(e) => {
            e.preventDefault();
            if (showMobileEarth3D) {
              move100(180); // South
            } else {
              setDeltaAltDeg(prev => {
                const tgt = clamp(baseRefAlt + prev - stepAltDeg, -89.9, 89.9);
                return tgt - baseRefAlt;
              });
              onLongPoseClear?.();
            }
          }}
          onClick={() => {
            if (showMobileEarth3D) {
              move100(180); // South
            } else {
              setDeltaAltDeg(prev => {
                const tgt = clamp(baseRefAlt + prev - stepAltDeg, -89.9, 89.9);
                return tgt - baseRefAlt;
              });
              onLongPoseClear?.();
            }
          }}
        >
          {showMobileEarth3D ? (
            <span style={{ transform: 'rotate(90deg)', display: 'inline-block' }}>➤</span>
          ) : (
            '↓'
          )}
        </button>
      </div>
    );
  }

  if (isMobile && isLandscape) {
    // Layout PAYSAGE mobile : croix comme desktop mais à gauche de l'écran, à 30px du bas
    return (
      <div
        className="fixed left-4 flex flex-col items-center gap-2"
        style={{ zIndex, bottom: '30px' }}
      >
        {/* Bouton Haut */}
        <button
          className="w-12 h-12 rounded-md border border-white/30 bg-black/50 hover:bg-black/70 active:bg-black/80 text-white text-lg font-bold transition-all duration-150 active:scale-95"
          title={showMobileEarth3D ? t('directions.toNorth') : tUi('directionalKeypad.moveUp', { degrees: stepAltDeg.toFixed(1) })}
          aria-label={showMobileEarth3D ? t('directions.toNorth') : tUi('directionalKeypad.up')}
          onTouchEnd={(e) => {
            e.preventDefault();
            if (showMobileEarth3D) {
              move100(0); // North
            } else {
              setDeltaAltDeg(prev => {
                const tgt = clamp(baseRefAlt + prev + stepAltDeg, -89.9, 89.9);
                return tgt - baseRefAlt;
              });
              onLongPoseClear?.();
            }
          }}
          onClick={() => {
            if (showMobileEarth3D) {
              move100(0); // North
            } else {
              setDeltaAltDeg(prev => {
                const tgt = clamp(baseRefAlt + prev + stepAltDeg, -89.9, 89.9);
                return tgt - baseRefAlt;
              });
              onLongPoseClear?.();
            }
          }}
        >
          {showMobileEarth3D ? (
            <span style={{ transform: 'rotate(270deg)', display: 'inline-block' }}>➤</span>
          ) : (
            '↑'
          )}
        </button>

        {/* Ligne du milieu : Gauche + Centre + Droite */}
        <div className="flex items-center gap-2">
          <button
            className="w-12 h-12 rounded-md border border-white/30 bg-black/50 hover:bg-black/70 active:bg-black/80 text-white text-lg font-bold transition-all duration-150 active:scale-95"
            title={showMobileEarth3D ? t('directions.toWest') : tUi('directionalKeypad.moveLeft', { degrees: stepAzDeg.toFixed(1) })}
            aria-label={showMobileEarth3D ? t('directions.toWest') : tUi('directionalKeypad.left')}
            onTouchEnd={(e) => {
              e.preventDefault();
              if (showMobileEarth3D) {
                move100(270); // West
              } else {
                setDeltaAzDeg(prev => {
                  const nd = prev - stepAzDeg;
                  return ((nd + 180) % 360 + 360) % 360 - 180;
                });
                onLongPoseClear?.();
              }
            }}
            onClick={() => {
              if (showMobileEarth3D) {
                move100(270); // West
              } else {
                setDeltaAzDeg(prev => {
                  const nd = prev - stepAzDeg;
                  return ((nd + 180) % 360 + 360) % 360 - 180;
                });
                onLongPoseClear?.();
              }
            }}
          >
            {showMobileEarth3D ? (
              <span style={{ transform: 'rotate(180deg)', display: 'inline-block' }}>➤</span>
            ) : (
              '←'
            )}
          </button>
          <button
            className="w-12 h-12 rounded-md border border-white/30 bg-black/50 hover:bg-black/70 active:bg-black/80 text-white text-xl font-bold transition-all duration-150 active:scale-95 flex items-center justify-center"
            title={showMobileEarth3D ? tUi('coordinates.geolocation', 'Géolocalisation') : tUi('directionalKeypad.recenter')}
            aria-label={showMobileEarth3D ? tUi('coordinates.geolocation', 'Géolocalisation') : tUi('directionalKeypad.recenter')}
            onTouchEnd={(e) => {
              e.preventDefault();
              if (showMobileEarth3D) {
                handleGeolocation();
              } else {
                setDeltaAzDeg(0);
                setDeltaAltDeg(0);
                onLongPoseClear?.();
              }
            }}
            onClick={() => {
              if (showMobileEarth3D) {
                handleGeolocation();
              } else {
                setDeltaAzDeg(0);
                setDeltaAltDeg(0);
                onLongPoseClear?.();
              }
            }}
          >
            {showMobileEarth3D ? (
              isGeolocating ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                  <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="3" fill="currentColor" />
                  <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
                </svg>
              )
            ) : (
              getFollowIcon(follow)
            )}
          </button>
          <button
            className="w-12 h-12 rounded-md border border-white/30 bg-black/50 hover:bg-black/70 active:bg-black/80 text-white text-lg font-bold transition-all duration-150 active:scale-95"
            title={showMobileEarth3D ? t('directions.toEast') : tUi('directionalKeypad.moveRight', { degrees: stepAzDeg.toFixed(1) })}
            aria-label={showMobileEarth3D ? t('directions.toEast') : tUi('directionalKeypad.right')}
            onTouchEnd={(e) => {
              e.preventDefault();
              if (showMobileEarth3D) {
                move100(90); // East
              } else {
                setDeltaAzDeg(prev => {
                  const nd = prev + stepAzDeg;
                  return ((nd + 180) % 360 + 360) % 360 - 180;
                });
                onLongPoseClear?.();
              }
            }}
            onClick={() => {
              if (showMobileEarth3D) {
                move100(90); // East
              } else {
                setDeltaAzDeg(prev => {
                  const nd = prev + stepAzDeg;
                  return ((nd + 180) % 360 + 360) % 360 - 180;
                });
                onLongPoseClear?.();
              }
            }}
          >
            {showMobileEarth3D ? (
              <span style={{ transform: 'rotate(0deg)', display: 'inline-block' }}>➤</span>
            ) : (
              '→'
            )}
          </button>
        </div>

        {/* Bouton Bas */}
        <button
          className="w-12 h-12 rounded-md border border-white/30 bg-black/50 hover:bg-black/70 active:bg-black/80 text-white text-lg font-bold transition-all duration-150 active:scale-95"
          title={showMobileEarth3D ? t('directions.toSouth') : tUi('directionalKeypad.moveDown', { degrees: stepAltDeg.toFixed(1) })}
          aria-label={showMobileEarth3D ? t('directions.toSouth') : tUi('directionalKeypad.down')}
          onTouchEnd={(e) => {
            e.preventDefault();
            if (showMobileEarth3D) {
              move100(180); // South
            } else {
              setDeltaAltDeg(prev => {
                const tgt = clamp(baseRefAlt + prev - stepAltDeg, -89.9, 89.9);
                return tgt - baseRefAlt;
              });
              onLongPoseClear?.();
            }
          }}
          onClick={() => {
            if (showMobileEarth3D) {
              move100(180); // South
            } else {
              setDeltaAltDeg(prev => {
                const tgt = clamp(baseRefAlt + prev - stepAltDeg, -89.9, 89.9);
                return tgt - baseRefAlt;
              });
              onLongPoseClear?.();
            }
          }}
        >
          {showMobileEarth3D ? (
            <span style={{ transform: 'rotate(90deg)', display: 'inline-block' }}>➤</span>
          ) : (
            '↓'
          )}
        </button>
      </div>
    );
  }

  // Layout desktop classique
  return (
    <div
      className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2"
      style={{ zIndex, marginTop: '3.5em', marginRight: '3px' }}
    >
      <button
        className="w-10 h-10 rounded-md border border-white/30 bg-black/50 hover:bg-black/70"
        title={tUi('directionalKeypad.moveUp', { degrees: stepAltDeg.toFixed(1) })}
        aria-label={tUi('directionalKeypad.up')}
        onTouchEnd={(e) => {
          e.preventDefault();
          setDeltaAltDeg(prev => {
            const tgt = clamp(baseRefAlt + prev + stepAltDeg, -89.9, 89.9);
            return tgt - baseRefAlt;
          });
          onLongPoseClear?.();
        }}
        onClick={() => {
          setDeltaAltDeg(prev => {
            const tgt = clamp(baseRefAlt + prev + stepAltDeg, -89.9, 89.9);
            return tgt - baseRefAlt;
          });
          onLongPoseClear?.();
        }}
      >
        ↑
      </button>
      <div className="flex items-center gap-2">
        <button
          className="w-10 h-10 rounded-md border border-white/30 bg-black/50 hover:bg-black/70"
          title={tUi('directionalKeypad.moveLeft', { degrees: stepAzDeg.toFixed(1) })}
          aria-label={tUi('directionalKeypad.left')}
          onTouchEnd={(e) => {
            e.preventDefault();
            setDeltaAzDeg(prev => {
              const nd = prev - stepAzDeg;
              return ((nd + 180) % 360 + 360) % 360 - 180; // wrap [-180,180]
            });
            onLongPoseClear?.();
          }}
          onClick={() => {
            setDeltaAzDeg(prev => {
              const nd = prev - stepAzDeg;
              return ((nd + 180) % 360 + 360) % 360 - 180; // wrap [-180,180]
            });
            onLongPoseClear?.();
          }}
        >
          ←
        </button>
        <button
          className="w-10 h-10 rounded-md border border-white/30 bg-black/50 hover:bg-black/70 flex items-center justify-center"
          title={tUi('directionalKeypad.recenter')}
          aria-label={tUi('directionalKeypad.recenter')}
          onTouchEnd={(e) => {
            e.preventDefault();
            setDeltaAzDeg(0);
            setDeltaAltDeg(0);
            onLongPoseClear?.();
          }}
          onClick={() => {
            setDeltaAzDeg(0);
            setDeltaAltDeg(0);
            onLongPoseClear?.();
          }}
        >
          {getFollowIcon(follow)}
        </button>
        <button
          className="w-10 h-10 rounded-md border border-white/30 bg-black/50 hover:bg-black/70"
          title={tUi('directionalKeypad.moveRight', { degrees: stepAzDeg.toFixed(1) })}
          aria-label={tUi('directionalKeypad.right')}
          onTouchEnd={(e) => {
            e.preventDefault();
            setDeltaAzDeg(prev => {
              const nd = prev + stepAzDeg;
              return ((nd + 180) % 360 + 360) % 360 - 180; // wrap [-180,180]
            });
            onLongPoseClear?.();
          }}
          onClick={() => {
            setDeltaAzDeg(prev => {
              const nd = prev + stepAzDeg;
              return ((nd + 180) % 360 + 360) % 360 - 180; // wrap [-180,180]
            });
            onLongPoseClear?.();
          }}
        >
          →
        </button>
      </div>
      <button
        className="w-10 h-10 rounded-md border border-white/30 bg-black/50 hover:bg-black/70"
        title={tUi('directionalKeypad.moveDown', { degrees: stepAltDeg.toFixed(1) })}
        aria-label={tUi('directionalKeypad.down')}
        onTouchEnd={(e) => {
          e.preventDefault();
          setDeltaAltDeg(prev => {
            const tgt = clamp(baseRefAlt + prev - stepAltDeg, -89.9, 89.9);
            return tgt - baseRefAlt;
          });
          onLongPoseClear?.();
        }}
        onClick={() => {
          setDeltaAltDeg(prev => {
            const tgt = clamp(baseRefAlt + prev - stepAltDeg, -89.9, 89.9);
            return tgt - baseRefAlt;
          });
          onLongPoseClear?.();
        }}
      >
        ↓
      </button>
    </div>
  );
}
