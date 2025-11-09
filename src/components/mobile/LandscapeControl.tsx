import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useScreenOrientation } from '../../hooks/useScreenOrientation';
import { useDeviceDetection } from '../../hooks/useDeviceDetection';

interface LandscapeControlProps {
  className?: string;
}

export default function LandscapeControl({ className = '' }: LandscapeControlProps) {
  const { t } = useTranslation('ui');
  const device = useDeviceDetection();
  const orientation = useScreenOrientation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<string>('');

  if (!device.isMobile || !device.isTouchDevice) {
    return null; // Pas de contrôle sur desktop
  }

  const handleRequestLandscape = async () => {
    setIsProcessing(true);
    setMessage('');

    const result = await orientation.requestFullscreenAndLock();
    
    setMessage(result.message);
    setIsProcessing(false);

    // Effacer le message après 3 secondes
    setTimeout(() => setMessage(''), 3000);
  };

  const handleExitFullscreen = async () => {
    setIsProcessing(true);
    setMessage('');

    const result = await orientation.exitFullscreenAndUnlock();
    
    setMessage(result.message);
    setIsProcessing(false);

    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className={`landscape-control ${className}`}>
      {!orientation.isFullscreen ? (
        <button
          onClick={handleRequestLandscape}
          disabled={isProcessing || !orientation.canLock}
          className="bg-blue-500 text-white px-3 py-2 rounded text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          title={orientation.canLock ? 
            t('mobile.enableLandscapeMode', 'Activer le mode paysage (plein écran)') : 
            t('mobile.orientationNotSupported', 'Verrouillage d\'orientation non supporté')
          }
        >
          {isProcessing ? '...' : '📱 →'}
        </button>
      ) : (
        <button
          onClick={handleExitFullscreen}
          disabled={isProcessing}
          className="bg-gray-600 text-white px-3 py-2 rounded text-sm hover:bg-gray-700 disabled:opacity-50"
          title={t('mobile.exitFullscreen', 'Sortir du plein écran')}
        >
          {isProcessing ? '...' : '← 📱'}
        </button>
      )}
      
      {message && (
        <div className="absolute top-full left-0 mt-1 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
          {message}
        </div>
      )}
    </div>
  );
}