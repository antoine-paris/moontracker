import { useLocation } from 'react-router-dom';
import AstrPhotographyPlannerPage from './AstrPhotographyPlannerPage';
import AstroPhotographyPlannerPageFr from './AstroPhotographyPlannerPageFr';

export default function AstroPhotographyPlannerPageWrapper() {
  const location = useLocation();
  const isFrench = location.pathname.startsWith('/fr');
  
  return isFrench ? <AstroPhotographyPlannerPageFr /> : <AstrPhotographyPlannerPage />;
}