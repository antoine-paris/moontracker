import { useState, useEffect } from 'react';

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouchDevice: boolean;
  screenWidth: number;
  screenHeight: number;
  devicePixelRatio: number;
  isSmallScreen: boolean;
}

export function useDeviceDetection(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => {
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isTouchDevice: false,
        screenWidth: 1024,
        screenHeight: 768,
        devicePixelRatio: 1,
        isSmallScreen: false
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Détection basée sur la taille d'écran et les capacités tactiles
    const isMobile = width < 768 && isTouchDevice;
    const isTablet = width >= 768 && width < 1024 && isTouchDevice;
    const isDesktop = !isMobile && !isTablet;
    const isSmallScreen = width < 640;

    return {
      isMobile,
      isTablet,
      isDesktop,
      isTouchDevice,
      screenWidth: width,
      screenHeight: height,
      devicePixelRatio: window.devicePixelRatio || 1,
      isSmallScreen
    };
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      const isMobile = width < 768 && isTouchDevice;
      const isTablet = width >= 768 && width < 1024 && isTouchDevice;
      const isDesktop = !isMobile && !isTablet;
      const isSmallScreen = width < 640;

      setDeviceInfo({
        isMobile,
        isTablet,
        isDesktop,
        isTouchDevice,
        screenWidth: width,
        screenHeight: height,
        devicePixelRatio: window.devicePixelRatio || 1,
        isSmallScreen
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return deviceInfo;
}