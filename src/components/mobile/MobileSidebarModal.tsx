import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { type LocationOption } from '../../data/locations';
import SidebarLocationsCities from '../layout/SidebarLocationsCities';
import SidebarLocationsCoord from '../layout/SidebarLocationsCoord';
import SidebarLocationsCoordsLandscape from '../layout/SidebarLocationsCoordsLandscape';

import '../../styles/mobile-sidebar.css';

interface MobileSidebarModalProps {
  isOpen: boolean;
  onClose: () => void;
  locations: LocationOption[];
  selectedLocation: LocationOption;
  onSelectLocation: (location: LocationOption) => void;
  utcMs: number;
  activeAzDeg: number;
  activeAltDeg: number;
  preselectedCityIds: string[];
  setPreselectedCityIds: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function MobileSidebarModal({
  isOpen,
  onClose,
  locations,
  selectedLocation,
  onSelectLocation,
  preselectedCityIds,
  setPreselectedCityIds,
}: MobileSidebarModalProps) {
  const { t } = useTranslation('ui');
  const [activeTab, setActiveTab] = useState<'cities' | 'coords'>('cities');
  const [selectedLng, setSelectedLng] = useState(selectedLocation.lng);
  const coordinatesRef = useRef<HTMLDivElement>(null);
  // Logique claire : W >= 1280 = desktop, sinon mobile avec détection orientation
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  //const isDesktop = screenWidth >= 1280;
  const isMobile = screenWidth < 1280;
  const isLandscapeMode = screenWidth > screenHeight;


  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[85] bg-black flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-black/90 backdrop-blur border-b border-white/10 p-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">
          {t('sidebar.locationsSidebarLabel', 'Localisation')}
        </h2>
        <button
          onTouchEnd={(e) => {
            e.preventDefault();
            onClose();
          }}
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
          aria-label={t('general.close', 'Fermer')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Onglets */}
      <div className="bg-black/50 border-b border-white/10">
        <div className="flex" role="tablist" aria-label={t('sidebar.locationModeSelection', 'Sélection du mode de localisation')}>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'cities'}
            onTouchEnd={(e) => {
              e.preventDefault();
              setActiveTab('cities');
            }}
            onClick={() => setActiveTab('cities')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'cities'
                ? 'text-white bg-white/10 border-b-2 border-blue-400'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            {t('sidebar.cities', 'Villes')}
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
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'coords'
                ? 'text-white bg-white/10 border-b-2 border-blue-400'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            {t('sidebar.coordinates', 'Coordonnées')}
          </button>
        </div>
      </div>

      {/* Content scrollable */}
      <div className="flex-1 overflow-y-auto mobile-sidebar-content">
        {/* Onglet Villes */}
        <div role="tabpanel" hidden={activeTab !== 'cities'} className="h-full">
          {activeTab === 'cities' && (
            <SidebarLocationsCities
              locations={locations}
              selectedLocation={selectedLocation}
              selectedLng={selectedLng}
              setSelectedLng={setSelectedLng}
              onSelectLocation={(location) => {
                onSelectLocation(location);
                // Ne pas fermer automatiquement pour permettre la navigation
              }}
              collapsed={false}
              isActive={activeTab === 'cities'}
              preselectedIds={preselectedCityIds}
              setPreselectedIds={setPreselectedCityIds}
            />
          )}
        </div>

        {/* Onglet Coordonnées */}
        <div role="tabpanel" hidden={activeTab !== 'coords'} className="h-full">
          {activeTab === 'coords' && (
            <div ref={coordinatesRef} className="mobile-coordinates-content">
              {/* Layout conditionnel selon l'orientation */}
              {isMobile && isLandscapeMode ? (
                // Mode paysage : utiliser le composant spécialisé
                <SidebarLocationsCoordsLandscape
                  selectedLocation={selectedLocation}
                  locations={locations}
                  onLocationChange={(location) => {
                    onSelectLocation(location);
                    // Ne pas fermer automatiquement pour permettre la navigation
                  }}
                />
              ) : (
                // Mode portrait ou desktop : utiliser le composant original
                <SidebarLocationsCoord
                  locations={locations}
                  selectedLocation={selectedLocation}
                  selectedLng={selectedLng}
                  setSelectedLng={setSelectedLng}
                  onSelectLocation={(location) => {
                    onSelectLocation(location);
                    // Ne pas fermer automatiquement pour permettre la navigation
                  }}
                  collapsed={false}
                  isActive={activeTab === 'coords'}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}