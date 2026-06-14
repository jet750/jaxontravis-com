import { lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { MotionConfig } from 'framer-motion';
import { initAnalytics, initGA4, initClarity } from './lib/analytics';
import { DURATION, EASE } from './lib/motion';
import RootLayout      from './layouts/RootLayout';
import HomePage        from './pages/HomePage';     // eager — primary entry / LCP
import NotFoundPage    from './pages/NotFoundPage'; // eager — tiny, sits outside the layout

// Secondary routes are split into their own chunks, fetched on navigation.
const AIInterviewPage  = lazy(() => import('./pages/AIInterviewPage'));
const PerennialPage    = lazy(() => import('./pages/PerennialPage'));
const BazaarBlendsPage = lazy(() => import('./pages/BazaarBlendsPage'));
const AboutPage        = lazy(() => import('./pages/AboutPage'));
const WorkSamplesPage  = lazy(() => import('./pages/WorkSamplesPage'));

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
