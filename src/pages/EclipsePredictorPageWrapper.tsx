import { useLocation } from 'react-router-dom';
import EclipsePredictorPage from './EclipsePredictorPage';
import EclipsePredictorPageFr from './EclipsePredictorPageFr';

export default function EclipsePredictorPageWrapper() {
  const location = useLocation();
  const isFrench = location.pathname.startsWith('/fr');
  
  return isFrench ? <EclipsePredictorPageFr /> : <EclipsePredictorPage />;
}