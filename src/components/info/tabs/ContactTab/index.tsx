import { useLanguageFromPath } from '../../../../hooks/useLanguageFromPath';
import ContactTabFr from './ContactTab.fr';
import ContactTabEn from './ContactTab.en';

export default function ContactTab() {
  const { currentLanguage } = useLanguageFromPath();
  
  if (currentLanguage === 'en') {
    return <ContactTabEn />;
  }
  
  return <ContactTabFr />;
}