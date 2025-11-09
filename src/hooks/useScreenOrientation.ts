import { useState, useCallback } from 'react';

export interface ScreenOrientationState {
  isSupported: boolean;
  canLock: boolean;
  currentOrientation?: string;
  isFullscreen: boolean;
}

export function useScreenOrientation() {
  const [state, setState] = useState<ScreenOrientationState>(() => ({
    isSupported: 'screen' in window && 'orientation' in window.screen,
    canLock: 'screen' in window && 'orientation' in window.screen && 'lock' in (window.screen.orientation || {}),
    currentOrientation: window.screen?.orientation?.type,
    isFullscreen: !!document.fullscreenElement
  }));

  const requestFullscreenAndLock = useCallback(async (element?: HTMLElement) => {
    try {
      // 1. Demander le plein écran
      const targetElement = element || document.documentElement;
      if (targetElement.requestFullscreen) {
        await targetElement.requestFullscreen();
      }

      // 2. Attendre un peu que le plein écran soit actif
      await new Promise(resolve => setTimeout(resolve, 100));

      // 3. Essayer de verrouiller en paysage
      if (state.canLock && (window.screen as any)?.orientation?.lock) {
        await (window.screen as any).orientation.lock('landscape');
        return { success: true, message: 'Orientation verrouillée en paysage' };
      } else {
        return { 
          success: false, 
          message: 'Verrouillage d\'orientation non supporté par ce navigateur' 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        message: `Erreur: ${error instanceof Error ? error.message : 'Impossible de verrouiller l\'orientation'}` 
      };
    }
  }, [state.canLock]);

  const exitFullscreenAndUnlock = useCallback(async () => {
    try {
      // Libérer le verrouillage d'orientation
      if (state.canLock && (window.screen as any)?.orientation?.unlock) {
        (window.screen as any).orientation.unlock();
      }

      // Sortir du plein écran
      if (document.exitFullscreen && document.fullscreenElement) {
        await document.exitFullscreen();
      }

      return { success: true, message: 'Plein écran et verrouillage d\'orientation désactivés' };
    } catch (error) {
      return { 
        success: false, 
        message: `Erreur: ${error instanceof Error ? error.message : 'Problème lors de la sortie'}` 
      };
    }
  }, [state.canLock]);

  const updateState = useCallback(() => {
    setState({
      isSupported: 'screen' in window && 'orientation' in window.screen,
      canLock: 'screen' in window && 'orientation' in window.screen && 'lock' in (window.screen.orientation || {}),
      currentOrientation: window.screen?.orientation?.type,
      isFullscreen: !!document.fullscreenElement
    });
  }, []);

  return {
    ...state,
    requestFullscreenAndLock,
    exitFullscreenAndUnlock,
    updateState
  };
}