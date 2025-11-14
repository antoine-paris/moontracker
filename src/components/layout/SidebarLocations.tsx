import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';
import appLogo from '../../assets/applogos/android-chrome-192x192.png';
import type { LocationOption } from '../../data/locations';
import SidebarLocationsCities from './SidebarLocationsCities';
import SidebarLocationsCoord from './SidebarLocationsCoord';
import EarthViewer3D from './EarthViewer3D';

type Props = {
  locations: LocationOption[];
  selectedLocation: LocationOption;
  onSelectLocation: (loc: LocationOption) => void;
  utcMs: number; // + current UTC time from the app
  //  active viewing direction from App (follow mode)
  activeAzDeg: number;
  activeAltDeg: number;
  preselectedCityIds: string[];
  setPreselectedCityIds: React.Dispatch<React.SetStateAction<string[]>>;
};

function normLng(deg: number): number {
  let x = ((deg + 180) % 360 + 360) % 360 - 180;
  // keep 180 instead of -180 for display clarity
  if (Object.is(x, -180)) x = 180;
  return x;
}

export default function SidebarLocations({
  locations,
  selectedLocation,
  onSelectLocation,
  utcMs,
  activeAzDeg,
  activeAltDeg,
  preselectedCityIds,
  setPreselectedCityIds,
}: Props) {
  const { t: tUi } = useTranslation('ui');
  const [collapsed, setCollapsed] = useState(false);
  const [selectedLng, setSelectedLng] = useState<number>(() => Math.round(normLng(selectedLocation.lng)));
  // refs for header measuring
  const headerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLImageElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const [collapsedWidth, setCollapsedWidth] = useState<number>(64);
  // Nouvel état pour l’onglet actif
  const [activeTab, setActiveTab] = useState<'cities' | 'coords'>('cities');

  useLayoutEffect(() => {
    const measure = () => {
      const padding = 8 * 2;
      const gap = 8;
      const logoW = logoRef.current?.offsetWidth ?? 48;
      const btnW = toggleRef.current?.offsetWidth ?? 28;
      const min = 64;
      setCollapsedWidth(Math.max(min, padding + logoW + gap + btnW));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (headerRef.current) ro.observe(headerRef.current);
    if (toggleRef.current) ro.observe(toggleRef.current);
    if (logoRef.current) ro.observe(logoRef.current);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  // Update selectedLng when selectedLocation changes externally
  useEffect(() => {
    setSelectedLng(Math.round(normLng(selectedLocation.lng)));
  }, [selectedLocation.lng]);

  // Keep body class in sync (optional)
  useEffect(() => {
    document.body.classList.toggle('sidebar-collapsed', collapsed);
    return () => document.body.classList.remove('sidebar-collapsed');
  }, [collapsed]);

  // Use measured collapsed width
  const width = collapsed ? collapsedWidth : 260;

  const styles: Record<string, React.CSSProperties> = {
    aside: {
      width,
      transition: 'width 200ms ease',
      borderRight: '1px solid rgba(255,255,255,0.1)',
      height: '100vh',
      position: 'sticky',
      top: 0,
      background: '#000',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 10,
    },
    header: {
      height: 56,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '0 8px',
      borderBottom: '1px solid rgba(255,255,255,0.1)',
    },
    logo: {
      width: 48,
      height: 48,
      borderRadius: 6,
      flex: '0 0 auto',
      cursor: collapsed ? 'pointer' : 'default',
    },
    brandText: {
      fontWeight: 600,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      display: collapsed ? 'none' : 'inline',
      fontSize: '1rem',
      color: '#fff',
    },
    toggle: {
      marginLeft: 'auto',
      border: '1px solid rgba(255,255,255,0.15)',
      background: 'transparent',
      color: 'rgba(255,255,255,0.8)',
      cursor: 'pointer',
      fontSize: 14,
      lineHeight: 1,
      padding: '6px 8px',
      borderRadius: 8,
    },
    content: {
      padding: 8,
      overflow: 'hidden',
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
    },
    viewerWrap: {
      display: collapsed ? 'none' : 'block',
      width: '100%',
      aspectRatio: '1 / 1',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 8,
      overflow: 'hidden',
      background: 'rgba(255,255,255,0.03)',
      marginBottom: 8,
      position: 'relative',
    },
    // Styles des onglets
    tabs: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      flex: 1,
      minHeight: 0,
    },
    tabList: {
      display: collapsed ? 'none' : 'flex',   // <- masquer quand réduit
      gap: 12,
      marginBottom: 4,
      flex: '0 0 auto',
      alignSelf: 'stretch',
      padding: '0 2px',
      borderBottom: '1px solid rgba(255,255,255,0.12)',
      background: 'transparent',
      height: 44,
    },
    tabBtn: {
      appearance: 'none',
      background: 'transparent',
      border: 'none',
      color: 'rgba(255,255,255,0.85)',
      cursor: 'pointer',
      fontSize: 13,
      lineHeight: 1,
      padding: '12px 8px',
      height: 44,
      minHeight: 44,
      outline: 'none',
    },
    tabBtnActive: {
      color: '#fff',
      fontWeight: 600,
      boxShadow: 'inset 0 -2px 0 0 rgba(0,150,255,0.9)', // souligné actif
    },
    tabPanel: {
      minHeight: 0,
      flex: 1,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    },
  };

  return (
    <aside style={styles.aside} aria-label={tUi('sidebar.locationsSidebarLabel')}>
      <div style={styles.header} ref={headerRef}>
        <img
          ref={logoRef}
          src={appLogo}
          alt="SpaceView.me"
          width={48}
          height={48}
          style={styles.logo}
        />
        <span style={styles.brandText}>SpaceView.me</span>
        <button
          ref={toggleRef}
          type="button"
          aria-label={collapsed ? tUi('sidebar.expandSidebar') : tUi('sidebar.collapseSidebar')}
          title={collapsed ? tUi('sidebar.expand') : tUi('sidebar.collapse')}
          onTouchEnd={(e) => {
            e.preventDefault();
            setCollapsed(v => !v);
          }}
          onClick={() => setCollapsed(v => !v)}
          style={styles.toggle}
        >
          {collapsed ? '»' : '«'}
        </button>
      </div>

      <div style={styles.content}>
        {/* 3D viewer stays here */}
        <div style={styles.viewerWrap}>
          {!collapsed && (
            <EarthViewer3D
              selectedLocation={selectedLocation}
              selectedLng={selectedLng}
              setSelectedLng={setSelectedLng}
              utcMs={utcMs}
              activeAzDeg={activeAzDeg}
              activeAltDeg={activeAltDeg}
            />
          )}
        </div>

        {/* Onglets: Villes / Coordonnées */}
        <div style={styles.tabs}>
          <div
            style={styles.tabList}
            role="tablist"
            aria-label={tUi('sidebar.locationModeSelection')}
            aria-hidden={collapsed}              // <- accessibilité
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'cities'}
              onTouchEnd={(e) => {
                e.preventDefault();
                setActiveTab('cities');
              }}
              onClick={() => setActiveTab('cities')}
              style={{ ...styles.tabBtn, ...(activeTab === 'cities' ? styles.tabBtnActive : {}) }}
            >
              {tUi('sidebar.cities')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'coords'}
              onTouchEnd={(e) => {
                e.preventDefault();
                setActiveTab('coords');
              }}
              onClick={() => setActiveTab('coords')}
              style={{ ...styles.tabBtn, ...(activeTab === 'coords' ? styles.tabBtnActive : {}) }}
            >
              {tUi('sidebar.coordinates')}
            </button>
          </div>

          <div role="tabpanel" hidden={activeTab !== 'cities'} style={styles.tabPanel}>
            <SidebarLocationsCities
              locations={locations}
              selectedLocation={selectedLocation}
              selectedLng={selectedLng}
              setSelectedLng={setSelectedLng}
              onSelectLocation={onSelectLocation}
              collapsed={collapsed}
              isActive={activeTab === 'cities'}
              preselectedIds={preselectedCityIds}
              setPreselectedIds={setPreselectedCityIds}
            />
          </div>

          <div role="tabpanel" hidden={activeTab !== 'coords'} style={styles.tabPanel}>
            <SidebarLocationsCoord
              locations={locations}
              selectedLocation={selectedLocation}
              selectedLng={selectedLng}
              setSelectedLng={setSelectedLng}
              onSelectLocation={onSelectLocation}
              collapsed={collapsed}
              isActive={activeTab === 'coords'}
            />
          </div>
        </div>
      </div>
    </aside>
  );
}