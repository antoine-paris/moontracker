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

  // Sur mobile en portrait: bloquer l'application, plus de possibilité de dismiss
  const shouldBlockApp = 
    showOrientationPrompt &&
    device.isMobile && 
    orientation.isPortrait;

  return (
    <div 
      className={`mobile-layout ${device.isMobile ? 'is-mobile' : ''} ${orientation.isPortrait ? 'is-portrait' : 'is-landscape'}`}
      data-orientation={orientation.orientation}
      data-device-type={device.isMobile ? 'mobile' : device.isTablet ? 'tablet' : 'desktop'}
    >
      {/* En mode portrait sur mobile: afficher UNIQUEMENT le prompt, bloquer l'app */}
      {shouldBlockApp ? (
        <OrientationPrompt 
          show={true}
        />
      ) : (
        <>
          {children}
        </>
      )}
    </div>
  );
}