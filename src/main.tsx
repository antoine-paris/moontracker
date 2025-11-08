import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n' // Initialize i18n
import App from './App.tsx'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import InfoPage from './pages/InfoPage'
import SpaceViewTab from './components/info/tabs/SpaceViewTab/index'
import HelpTab from './components/info/tabs/HelpTab/index'
import SimulationsTab from './components/info/tabs/SimulationsTab/index'
import FlatEarthTab from './components/info/tabs/FlatEarthTab/index'
import BugReportTab from './components/info/tabs/BugReportTab/index'
import ContactTab from './components/info/tabs/ContactTab/index'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Main app routes (with optional language prefix) */}
        <Route path="/" element={<App />} />
        <Route path="/en" element={<App />} />
        <Route path="/fr" element={<App />} />
        
        {/* Info layout (light theme, crawlable subpages) */}
        <Route path="/info" element={<InfoPage />}>
          <Route index element={<SpaceViewTab />} />
          <Route path="help" element={<HelpTab />} />
          <Route path="simulations" element={<SimulationsTab />} />
          <Route path="flat-earth" element={<FlatEarthTab />} />
          <Route path="bug" element={<BugReportTab />} />
          <Route path="contact" element={<ContactTab />} />
        </Route>
        
        {/* Language-prefixed info routes */}
        <Route path="/en/info" element={<InfoPage />}>
          <Route index element={<SpaceViewTab />} />
          <Route path="help" element={<HelpTab />} />
          <Route path="simulations" element={<SimulationsTab />} />
          <Route path="flat-earth" element={<FlatEarthTab />} />
          <Route path="bug" element={<BugReportTab />} />
          <Route path="contact" element={<ContactTab />} />
        </Route>
        
        <Route path="/fr/info" element={<InfoPage />}>
          <Route index element={<SpaceViewTab />} />
          <Route path="help" element={<HelpTab />} />
          <Route path="simulations" element={<SimulationsTab />} />
          <Route path="flat-earth" element={<FlatEarthTab />} />
          <Route path="bug" element={<BugReportTab />} />
          <Route path="contact" element={<ContactTab />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
)
