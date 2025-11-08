import { useLanguageFromPath } from '../../../../hooks/useLanguageFromPath';
import FlatEarthTabFr from './FlatEarthTab.fr';
import FlatEarthTabEn from './FlatEarthTab.en';

export default function FlatEarthTab() {
  const { currentLanguage } = useLanguageFromPath();
  
  if (currentLanguage === 'en') {
    return <FlatEarthTabEn />;
  }
  
  return <FlatEarthTabFr />;
}