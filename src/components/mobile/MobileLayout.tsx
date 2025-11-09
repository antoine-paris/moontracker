import { useState, useEffect } from 'react';
import { useOrientation } from '../../hooks/useOrientation';
import { useDeviceDetection } from '../../hooks/useDeviceDetection';
import OrientationPrompt from './OrientationPrompt';

interface MobileLayoutProps {
  children: React.ReactNode;
  showOrientationPrompt?: boolean;
}

export default function MobileLayout({ 
  children, 
  showOrientationPrompt = true 
}: MobileLayoutProps) {
  const orientation = useOrientation();
  const device = useDeviceDetection();
  const [orientationPromptDismissed, setOrientationPromptDismissed] = useState(false);

  // Auto-dismiss orientation prompt après 10 secondes
  useEffect(() => {
    if (showOrientationPrompt && device.isMobile && orientation.isPortrait) {
      const timer = setTimeout(() => {
        setOrientationPromptDismissed(true);
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [showOrientationPrompt, device.isMobile, orientation.isPortrait]);

  // Reset dismissal when orientation changes to landscape
  useEffect(() => {
    if (orientation.isLandscape) {
      setOrientationPromptDismissed(false);
    }
  }, [orientation.isLandscape]);

  const shouldShowOrientationPrompt = 
    showOrientationPrompt &&
    device.isMobile && 
    orientation.isPortrait && 
    !orientationPromptDismissed;

  return (
    <div 
      className={`mobile-layout ${device.isMobile ? 'is-mobile' : ''} ${orientation.isPortrait ? 'is-portrait' : 'is-landscape'}`}
      data-orientation={orientation.orientation}
      data-device-type={device.isMobile ? 'mobile' : device.isTablet ? 'tablet' : 'desktop'}
    >
      {children}
      
      <OrientationPrompt 
        show={shouldShowOrientationPrompt}
        onDismiss={() => setOrientationPromptDismissed(true)}
      />
      

    </div>
  );
}