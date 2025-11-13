import { useTranslation } from 'react-i18next';

interface OrientationPromptProps {
  show: boolean;
}

export default function OrientationPrompt({ show }: OrientationPromptProps) {
  const { t } = useTranslation('ui');

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-sm mx-auto text-center">
        <div className="mb-4 flex justify-center">
          <div className="relative">
            <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
              📱
            </div>
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-500 absolute -top-1 -right-1">
              ↻
            </div>
          </div>
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {t('orientation.landscapeRequired', 'Veuillez tourner votre appareil en mode paysage pour voir l\'application')}
        </h3>
        
        <p className="text-gray-600 mb-4 text-sm">
          {t('orientation.rotateDeviceMessage', 
            'Pour utiliser SpaceView, l\'orientation paysage est requise. Tournez votre appareil pour commencer.'
          )}
        </p>
        
        <div className="flex flex-col gap-2">
          <p className="text-sm text-blue-600 font-medium">
            {t('orientation.waitingForLandscape', 'En attente du mode paysage...')}
          </p>
        </div>
      </div>
    </div>
  );
}