import { useLanguageFromPath } from '../../../../hooks/useLanguageFromPath';
import HelpTabFr from './HelpTab.fr';
import HelpTabEn from './HelpTab.en';

export default function HelpTab() {
  const { currentLanguage } = useLanguageFromPath();
  
  if (currentLanguage === 'en') {
    return <HelpTabEn />;
  }
  
  return <HelpTabFr />;
}