import { useState, useEffect } from 'react';

export type OrientationType = 'portrait' | 'landscape';

export interface OrientationState {
  orientation: OrientationType;
  angle: number;
  isPortrait: boolean;
  isLandscape: boolean;
}

export function useOrientation(): OrientationState {
  const [orientation, setOrientation] = useState<OrientationState>(() => {
    if (typeof window === 'undefined') {
      return {
        orientation: 'portrait',
        angle: 0,
        isPortrait: true,
        isLandscape: false
      };
    }

    const angle = window.screen?.orientation?.angle ?? 0;
    const isPortrait = Math.abs(angle) === 0 || Math.abs(angle) === 180;
    
    return {
      orientation: isPortrait ? 'portrait' : 'landscape',
      angle,
      isPortrait,
      isLandscape: !isPortrait
    };
  });

  useEffect(() => {
    const handleOrientationChange = () => {
      const angle = window.screen?.orientation?.angle ?? 0;
      const isPortrait = Math.abs(angle) === 0 || Math.abs(angle) === 180;
      
      setOrientation({
        orientation: isPortrait ? 'portrait' : 'landscape',
        angle,
        isPortrait,
        isLandscape: !isPortrait
      });
    };

    // Écouter les changements d'orientation
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, []);

  return orientation;
}