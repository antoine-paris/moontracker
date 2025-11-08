import { useLanguageFromPath } from '../../../../hooks/useLanguageFromPath';
import SpaceViewTabFr from './SpaceViewTab.fr';
import SpaceViewTabEn from './SpaceViewTab.en';

export default function SpaceViewTab() {
  const { currentLanguage } = useLanguageFromPath();
  
  if (currentLanguage === 'en') {
    return <SpaceViewTabEn />;
  }
  
  return <SpaceViewTabFr />;
}