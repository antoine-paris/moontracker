import { useLocation } from 'react-router-dom';
import MoonPhaseCalculatorPage from './MoonPhaseCalculatorPage';
import MoonPhaseCalculatorPageFr from './MoonPhaseCalculatorPageFr';

export default function MoonPhaseCalculatorPageWrapper() {
  const location = useLocation();
  const isFrench = location.pathname.startsWith('/fr');
  
  return isFrench ? <MoonPhaseCalculatorPageFr /> : <MoonPhaseCalculatorPage />;
}