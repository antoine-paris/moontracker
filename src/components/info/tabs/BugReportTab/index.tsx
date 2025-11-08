import { useLanguageFromPath } from '../../../../hooks/useLanguageFromPath';
import BugReportTabFr from './BugReportTab.fr';
import BugReportTabEn from './BugReportTab.en';

export default function BugReportTab() {
  const { currentLanguage } = useLanguageFromPath();
  
  if (currentLanguage === 'en') {
    return <BugReportTabEn />;
  }
  
  return <BugReportTabFr />;
}