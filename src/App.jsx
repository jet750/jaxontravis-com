import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { MotionConfig } from 'framer-motion';
import { initAnalytics, initGA4, initClarity } from './lib/analytics';
import { DURATION, EASE } from './lib/motion';
import RootLayout      from './layouts/RootLayout';
import HomePage        from './pages/HomePage';
import AIInterviewPage from './pages/AIInterviewPage';
import PerennialPage   from './pages/PerennialPage';
import BazaarBlendsPage from './pages/BazaarBlendsPage';
import AboutPage       from './pages/AboutPage';
import WorkSamplesPage from './pages/WorkSamplesPage';
import NotFoundPage    from './pages/NotFoundPage';

initAnalytics();
initGA4();
initClarity();

export default function App() {
  return (
    <MotionConfig reducedMotion="user" transition={{ duration: DURATION, ease: EASE }}>
      <BrowserRouter>
        <Analytics />
        <Routes>
          <Route element={<RootLayout />}>
            <Route path="/"              element={<HomePage />} />
            <Route path="/interview"     element={<AIInterviewPage />} />
            <Route path="/perennial"     element={<PerennialPage />} />
            <Route path="/bazaar-blends" element={<BazaarBlendsPage />} />
            <Route path="/about"         element={<AboutPage />} />
            <Route path="/work-samples"  element={<WorkSamplesPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </MotionConfig>
  );
}
