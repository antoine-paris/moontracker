import { useLanguageFromPath } from '../../../../hooks/useLanguageFromPath';
import SimulationsTabFr from './SimulationsTab.fr';
import SimulationsTabEn from './SimulationsTab.en';

export default function SimulationsTab() {
  const { currentLanguage } = useLanguageFromPath();
  
  if (currentLanguage === 'en') {
    return <SimulationsTabEn />;
  }
  
  return <SimulationsTabFr />;
}