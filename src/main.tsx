import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import InfoPage from './pages/InfoPage'
import MoonTrackerTab from './components/info/tabs/MoonTrackerTab'
import HelpTab from './components/info/tabs/HelpTab'
import SimulationsTab from './components/info/tabs/SimulationsTab'
import FlatEarthTab from './components/info/tabs/FlatEarthTab'
import BugReportTab from './components/info/tabs/BugReportTab'
import ContactTab from './components/info/tabs/ContactTab'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        {/* Info layout (light theme, crawlable subpages) */}
        <Route path="/info" element={<InfoPage />}>
          <Route index element={<MoonTrackerTab />} />
          <Route path="aide" element={<HelpTab />} />
          <Route path="simulations" element={<SimulationsTab />} />
          <Route path="flat-earth" element={<FlatEarthTab />} />
          <Route path="bug" element={<BugReportTab />} />
          <Route path="contact" element={<ContactTab />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
)
