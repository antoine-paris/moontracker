import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { LocationOption } from '../../data/locations';
import { searchLocations } from '../../data/locations';

type Props = {
  locations: LocationOption[];
  selectedLocation: LocationOption;
  selectedLng: number;
  setSelectedLng: (lng: number) => void;
  onSelectLocation: (loc: LocationOption) => void;
  collapsed: boolean;
  isActive: boolean; // nouvel indicateur
};

function normLng(deg: number): number {
  let x = ((deg + 180) % 360 + 360) % 360 - 180;
  if (Object.is(x, -180)) x = 180;
  return x;
}

export default function SidebarLocationsCities({
  locations,
  selectedLocation,
  selectedLng,
  setSelectedLng,
  onSelectLocation,
  collapsed,
  isActive,
}: Props) {
  const [search, setSearch] = useState('');
  const listRef = useRef<HTMLUListElement>(null);
  const preListRef = useRef<HTMLUListElement>(null);

  const [activeList, setActiveList] = useState<'main' | 'pre'>('main');

  // user's preselected cities
  const [preselected, setPreselected] = useState<LocationOption[]>([]);
  const preselectedSorted = useMemo(
    () => [...preselected].sort((a, b) => b.lat - a.lat),
    [preselected]
  );
  const preselectedSet = useMemo(() => new Set(preselected.map(l => l.id)), [preselected]);
  const addPreselected = (loc: LocationOption) => {
    setPreselected(prev => (prev.some(l => l.id === loc.id) ? prev : [...prev, loc]));
  };
  const removePreselected = (locId: string) => {
    setPreselected(prev => prev.filter(l => l.id !== locId));
  };

  const [flashNoSameLat, setFlashNoSameLat] = useState(false);

  const styles: Record<string, React.CSSProperties> = {
    search: {
      display: collapsed ? 'none' : 'block',
      width: '100%',
      padding: '8px 10px',
      borderRadius: 8,
      background: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(255,255,255,0.12)',
      color: '#fff',
      outline: 'none',
      marginBottom: 8,
      fontSize: 14,
    },
    list: {
      listStyle: 'none',
      padding: 0,
      margin: 0,
      display: collapsed ? 'none' : 'block',
      flex: 1,
      overflowY: 'auto',
      overflowX: 'hidden',
      minHeight: 0,
      scrollbarWidth: 'thin',
      scrollbarColor: 'rgba(255, 255, 255, 0.2) rgba(255, 255, 255, 0.05)',
    } as React.CSSProperties & {
      scrollbarWidth?: string;
      scrollbarColor?: string;
    },
    itemBtn: {
      width: '100%',
      textAlign: 'left' as const,
      padding: '8px 10px',
      borderRadius: 10,
      border: '1px solid rgba(255,255,255,0.10)',
      background: 'transparent',
      color: '#fff',
      cursor: 'pointer',
      marginBottom: 6,
      fontSize: 13,
      transition: 'all 0.2s ease',
      outline: 'none',
    },
    sub: {
      fontSize: 11,
      color: 'rgba(255,255,255,0.55)',
      marginTop: 2,
    },
    preList: {
      listStyle: 'none',
      padding: 0,
      margin: 0,
      display: collapsed ? 'none' : 'block',
      maxHeight: 180,
      overflowY: 'auto',
      overflowX: 'hidden',
      marginBottom: 8,
      scrollbarWidth: 'thin',
      scrollbarColor: 'rgba(255, 255, 255, 0.2) rgba(255, 255, 255, 0.05)',
    } as React.CSSProperties & { scrollbarWidth?: string; scrollbarColor?: string },
    subRow: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      marginTop: 2,
    },
    miniIconBtn: {
      fontSize: 11,
      lineHeight: 1,
      padding: '2px 6px',
      borderRadius: 6,
      border: '1px solid rgba(255,255,255,0.25)',
      background: 'transparent',
      color: 'rgba(255,255,255,0.9)',
      cursor: 'pointer',
      flex: '0 0 auto',
      userSelect: 'none',
    },
    navDir: {
      fontSize: 16,
      opacity: 0.9,
    },
    navText: {
      flex: 1,
      minWidth: 0,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    navPad: {
      display: collapsed ? 'none' : 'flex',
      gap: 8,
      marginTop: 8,
      width: '100%',
      flexWrap: 'nowrap',
    },
    navBtn: {
      flex: '1 1 0%',
      minWidth: 0,
      boxSizing: 'border-box',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '8px 10px',
      borderRadius: 10,
      border: '1px solid rgba(255,255,255,0.15)',
      background: 'rgba(255,255,255,0.03)',
      color: 'rgba(255,255,255,0.95)',
      fontSize: 13,
      cursor: 'pointer',
    },
  };

  const isSearching = useMemo(() => search.trim().length > 0, [search]);

  // Filtered list (search vs by longitude column)
  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (s.length > 0) {
      const hits = searchLocations(s, locations);
      return hits.length
        ? hits
        : locations
            .filter(l => l.label.toLowerCase().includes(s))
            .sort((a, b) => b.lat - a.lat);
    }
    return locations
      .filter(l => Math.round(normLng(l.lng)) === selectedLng)
      .sort((a, b) => b.lat - a.lat);
  }, [locations, selectedLng, search]);

  const northPole: LocationOption = useMemo(() => ({
    id: `np@${selectedLng}`,
    label: 'Pôle Nord',
    lat: 89,
    lng: selectedLng,
    timeZone: 'Etc/UTC',
  }), [selectedLng]);

  const southPole: LocationOption = useMemo(() => ({
    id: `sp@${selectedLng}`,
    label: 'Pôle Sud',
    lat: -89,
    lng: selectedLng,
    timeZone: 'Etc/UTC',
  }), [selectedLng]);

  // Build allLocations with poles when not searching
  const allLocations = useMemo(() => {
    if (isSearching) return [...filtered];
    return [northPole, ...filtered, southPole];
  }, [northPole, filtered, southPole, isSearching]);

  // East/West targets (same-latitude navigation)
  const eastTarget = useMemo(() => {
    const targetLatDeg = Math.trunc(selectedLocation.lat);
    const sameLatCities = locations
      .filter(l => Math.trunc(l.lat) === targetLatDeg)
      .sort((a, b) => normLng(a.lng) - normLng(b.lng));
    if (sameLatCities.length <= 1) {
      return { loc: null as LocationOption | null, disabled: true };
    }
    let currentIndex = sameLatCities.findIndex(c => c.id === selectedLocation.id);
    if (currentIndex === -1) currentIndex = 0;
    const newIndex = (currentIndex + 1) % sameLatCities.length;
    return { loc: sameLatCities[newIndex], disabled: false };
  }, [locations, selectedLocation]);

  const westTarget = useMemo(() => {
    const targetLatDeg = Math.trunc(selectedLocation.lat);
    const sameLatCities = locations
      .filter(l => Math.trunc(l.lat) === targetLatDeg)
      .sort((a, b) => normLng(a.lng) - normLng(b.lng));
    if (sameLatCities.length <= 1) {
      return { loc: null as LocationOption | null, disabled: true };
    }
    let currentIndex = sameLatCities.findIndex(c => c.id === selectedLocation.id);
    if (currentIndex === -1) currentIndex = 0;
    const newIndex = (currentIndex - 1 + sameLatCities.length) % sameLatCities.length;
    return { loc: sameLatCities[newIndex], disabled: false };
  }, [locations, selectedLocation]);

  // Keyboard navigation
  useEffect(() => {
    // n’activer que si l’onglet Villes est visible
    if (collapsed || !isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (collapsed) return;

      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();

        // If last active is preselected, navigate only within preselected (clamped)
        if (activeList === 'pre' && preselectedSorted.length > 0) {
          const isDown = e.key === 'ArrowDown';
          let idx = preselectedSorted.findIndex(l => l.id === selectedLocation.id);

          if (idx === -1) {
            idx = isDown ? 0 : preselectedSorted.length - 1;
          } else {
            idx = isDown ? Math.min(idx + 1, preselectedSorted.length - 1) : Math.max(idx - 1, 0);
          }

          const newLoc = preselectedSorted[idx];
          if (newLoc && newLoc.id !== selectedLocation.id) {
            setSelectedLng(Math.round(normLng(newLoc.lng)));
            onSelectLocation(newLoc);
            if (isSearching) setSearch('');
          }

          setTimeout(() => {
            const selectedButton = preListRef.current?.querySelector(`button[data-location-id="${newLoc.id}"]`) as HTMLButtonElement;
            selectedButton?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            selectedButton?.focus();
          }, 0);

          return;
        }

        // Default main list behavior
        const currentIndex = allLocations.findIndex(loc => loc.id === selectedLocation.id);
        const atNorthPole = !isSearching && selectedLocation.id === northPole.id;
        const atSouthPole = !isSearching && selectedLocation.id === southPole.id;

        if ((e.key === 'ArrowUp' && atNorthPole) || (e.key === 'ArrowDown' && atSouthPole)) {
          setFlashNoSameLat(true);
          setTimeout(() => setFlashNoSameLat(false), 600);
          return;
        }

        let newIndex: number;
        if (e.key === 'ArrowDown') {
          newIndex = currentIndex < allLocations.length - 1 ? currentIndex + 1 : 0;
        } else {
          newIndex = currentIndex > 0 ? currentIndex - 1 : allLocations.length - 1;
        }

        const newLoc = allLocations[newIndex];
        setSelectedLng(Math.round(normLng(newLoc.lng)));
        onSelectLocation(newLoc);
        if (isSearching) setSearch('');

        setTimeout(() => {
          const selectedButton = listRef.current?.querySelector(`button[data-location-id="${newLoc.id}"]`) as HTMLButtonElement;
          selectedButton?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          selectedButton?.focus();
        }, 0);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        const target = e.key === 'ArrowRight' ? eastTarget : westTarget;
        if (target.disabled || !target.loc) return;

        const newLoc = target.loc;
        const newLng = Math.round(normLng(newLoc.lng));
        setSelectedLng(newLng);
        onSelectLocation(newLoc);
        if (search.trim()) setSearch('');

        setTimeout(() => {
          const container = activeList === 'pre' ? preListRef.current : listRef.current;
          const btn = container?.querySelector(`button[data-location-id="${newLoc.id}"]`) as HTMLButtonElement;
          btn?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          btn?.focus();
        }, 0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    collapsed,
    isActive,
    locations,
    selectedLocation,
    onSelectLocation,
    allLocations,
    search,
    selectedLng,
    isSearching,
    northPole,
    southPole,
    activeList,
    preselectedSorted,
    eastTarget,
    westTarget,
    setSelectedLng,
  ]);

  const moveToLocation = (newLoc: LocationOption) => {
    const newLng = Math.round(normLng(newLoc.lng));
    setSelectedLng(newLng);
    onSelectLocation(newLoc);
    if (search.trim()) setSearch('');
    setTimeout(() => {
      const container = activeList === 'pre' ? preListRef.current : listRef.current;
      const btn = container?.querySelector(`button[data-location-id="${newLoc.id}"]`) as HTMLButtonElement;
      btn?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      btn?.focus();
    }, 0);
  };

  return (
    <>
      {/* Preselected cities list */}
      {preselected.length > 0 && (
        <ul style={styles.preList} className="cities-list" ref={preListRef}>
          {preselectedSorted.map(loc => (
            <li key={`pre-${loc.id}`}>
              <button
                style={{
                  ...styles.itemBtn,
                  background: loc.id === selectedLocation.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                  borderColor: loc.id === selectedLocation.id ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.10)',
                }}
                onClick={() => {
                  setActiveList('pre');
                  const newLng = Math.round(normLng(loc.lng));
                  setSelectedLng(newLng);
                  onSelectLocation(loc);
                  setSearch('');
                  setTimeout(() => {
                    const selectedButton = listRef.current?.querySelector(`button[data-location-id="${loc.id}"]`) as HTMLButtonElement;
                    selectedButton?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    selectedButton?.focus();
                  }, 0);
                }}
                data-location-id={loc.id}
                onFocus={(e) => e.currentTarget.blur()}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {loc.id !== selectedLocation.id && (
                    <span
                      style={{
                        fontSize: 16,
                        opacity: 0.9,
                        display: 'inline-block',
                        transform: loc.lat > selectedLocation.lat ? 'rotate(270deg)' : 'rotate(90deg)',
                      }}
                    >
                      &#x27A4;
                    </span>
                  )}
                  <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {loc.label}
                  </span>
                </div>
                <div style={styles.subRow}>
                  <span style={styles.sub}>{`${loc.lat.toFixed(3)}°, ${loc.lng.toFixed(3)}°`}</span>
                  <span
                    role="button"
                    tabIndex={0}
                    title="Retirer de la présélection"
                    style={styles.miniIconBtn}
                    onClick={(e) => { e.stopPropagation(); removePreselected(loc.id); }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); removePreselected(loc.id); }
                    }}
                  >
                    &#128465;
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Search */}
      <input
        type="text"
        placeholder="Rechercher une ville..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={styles.search}
      />

      {/* List */}
      <ul style={styles.list} className="cities-list" ref={listRef}>
        <style>{`
          .cities-list::-webkit-scrollbar { width: 6px; }
          .cities-list::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.05); border-radius: 3px; }
          .cities-list::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); border-radius: 3px; }
          .cities-list::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.3); }
          @keyframes flashSelected {
            0% { box-shadow: 0 0 0 0 rgba(80,80,80,0); }
            30% { box-shadow: 0 0 0 4px rgba(80,80,80,0.65); }
            60% { box-shadow: 0 0 0 4px rgba(80,80,80,0.65); }
            100% { box-shadow: 0 0 0 0 rgba(80,80,80,0); }
          }
          .flash-no-same-lat { animation: flashSelected 600ms ease-in-out; }
        `}</style>

        {/* Poles only when not searching */}
        {!isSearching && (
          <li>
            <button
              className={northPole.id === selectedLocation.id && flashNoSameLat ? 'flash-no-same-lat' : undefined}
              style={{
                ...styles.itemBtn,
                background: selectedLocation.id === northPole.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                borderColor: selectedLocation.id === northPole.id ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.10)',
              }}
              onClick={() => {
                onSelectLocation(northPole);
                setSelectedLng(Math.round(normLng(northPole.lng)));
                setSearch('');
                setTimeout(() => {
                  const selectedButton = listRef.current?.querySelector(`button[data-location-id="${northPole.id}"]`) as HTMLButtonElement;
                  selectedButton?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                  selectedButton?.focus();
                }, 0);
              }}
              title={`89° LAT ${selectedLng}° LNG`}
              data-location-id={northPole.id}
              onFocus={(e) => e.currentTarget.blur()}
            >
              <div>{'Pôle Nord'}</div>
              <div style={styles.sub}>{`89.000°, ${selectedLng.toFixed(0)}°`}</div>
            </button>
          </li>
        )}

        {filtered.map(loc => (
          <li key={loc.id}>
            <button
              className={loc.id === selectedLocation.id && flashNoSameLat ? 'flash-no-same-lat' : undefined}
              style={{
                ...styles.itemBtn,
                background: loc.id === selectedLocation.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                borderColor: loc.id === selectedLocation.id ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.10)',
              }}
              onClick={() => {
                setActiveList('main');
                const newLng = Math.round(normLng(loc.lng));
                setSelectedLng(newLng);
                onSelectLocation(loc);
                setSearch('');
                setTimeout(() => {
                  const selectedButton = listRef.current?.querySelector(`button[data-location-id="${loc.id}"]`) as HTMLButtonElement;
                  selectedButton?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                  selectedButton?.focus();
                }, 0);
              }}
              data-location-id={loc.id}
              onFocus={(e) => e.currentTarget.blur()}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {loc.id !== selectedLocation.id && (
                  <span
                    style={{
                      ...styles.navDir,
                      display: 'inline-block',
                      transform: loc.lat > selectedLocation.lat ? 'rotate(270deg)' : 'rotate(90deg)',
                    }}
                  >
                    &#x27A4;
                  </span>
                )}
                <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {loc.label}
                </span>
              </div>

              <div style={styles.subRow}>
                <span style={styles.sub}>{`${loc.lat.toFixed(3)}°, ${loc.lng.toFixed(3)}°`}</span>
                <span
                  role="button"
                  tabIndex={0}
                  title={preselectedSet.has(loc.id) ? 'Retirer de la présélection' : 'Ajouter à la présélection'}
                  style={styles.miniIconBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (preselectedSet.has(loc.id)) {
                      removePreselected(loc.id);
                    } else {
                      addPreselected(loc);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      if (preselectedSet.has(loc.id)) {
                        removePreselected(loc.id);
                      } else {
                        addPreselected(loc);
                      }
                    }
                  }}
                >
                  {preselectedSet.has(loc.id) ? '🗑' : '+'}
                </span>
              </div>
            </button>
          </li>
        ))}

        {!isSearching && (
          <li>
            <button
              className={southPole.id === selectedLocation.id && flashNoSameLat ? 'flash-no-same-lat' : undefined}
              style={{
                ...styles.itemBtn,
                background: selectedLocation.id === southPole.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                borderColor: selectedLocation.id === southPole.id ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.10)',
              }}
              onClick={() => {
                onSelectLocation(southPole);
                setSelectedLng(Math.round(normLng(southPole.lng)));
                setSearch('');
                setTimeout(() => {
                  const selectedButton = listRef.current?.querySelector(`button[data-location-id="${southPole.id}"]`) as HTMLButtonElement;
                  selectedButton?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                  selectedButton?.focus();
                }, 0);
              }}
              title={`-89° LAT ${selectedLng}° LNG`}
              data-location-id={southPole.id}
              onFocus={(e) => e.currentTarget.blur()}
            >
              <div>{'Pôle Sud'}</div>
              <div style={styles.sub}>{`-89.000°, ${selectedLng.toFixed(0)}°`}</div>
            </button>
          </li>
        )}
      </ul>

      {/* NESW quick navigation pad */}
      <div style={styles.navPad} role="group" aria-label="Navigation rapide NESW">
        <button
          type="button"
          style={{
            ...styles.navBtn,
            opacity: westTarget.disabled ? 0.5 : 1,
            cursor: westTarget.disabled ? 'default' : 'pointer',
          }}
          disabled={westTarget.disabled}
          title={westTarget.loc ? `Aller à l’ouest: ${westTarget.loc.label}` : 'Aucune autre ville à cette latitude'}
          onClick={() => westTarget.loc && moveToLocation(westTarget.loc)}
        >
          <span
            style={{ ...styles.navDir, display: 'inline-block', transform: 'rotate(180deg)' }}
          >
            &#x27A4;
          </span>
          <span style={styles.navText}>{westTarget.loc ? westTarget.loc.label : '—'}</span>
        </button>

        <button
          type="button"
          style={{
            ...styles.navBtn,
            opacity: eastTarget.disabled ? 0.5 : 1,
            cursor: eastTarget.disabled ? 'default' : 'pointer',
          }}
          disabled={eastTarget.disabled}
          title={eastTarget.loc ? `Aller à l’est: ${eastTarget.loc.label}` : 'Aucune autre ville à cette latitude'}
          onClick={() => eastTarget.loc && moveToLocation(eastTarget.loc)}
        >
          <span style={styles.navText}>{eastTarget.loc ? eastTarget.loc.label : '—'}</span>
          <span style={styles.navDir}>&#x27A4;</span>
        </button>
      </div>
    </>
  );
}