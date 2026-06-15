import { lazy, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { MotionConfig, AnimatePresence } from 'framer-motion';
import { initAnalytics, initGA4, initClarity } from './lib/analytics';
import { DURATION, EASE } from './lib/motion';
import { useRecruiterDetection } from './hooks/useRecruiterDetection';
import RecruiterNudge from './components/RecruiterNudge';
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

// Global recruiter-nudge controller. Rendered inside BrowserRouter so it can
// read the current route (useLocation) and suppress the nudge on /interview.
// Signals 1 (LinkedIn) and 3 (returning visitor) run here globally; the dwell
// signal (2) is section-scoped and reaches us via the 'jt:nudge_trigger' event
// dispatched from AboutPreview — which avoids prop-drilling through HomePage.
function RecruiterNudgeHost() {
  const location = useLocation();
  const globalShouldNudge = useRecruiterDetection(); // no sectionRef → signals 1 & 3

  const [dwellTriggered, setDwellTriggered] = useState(false);
  const [nudgeDismissed, setNudgeDismissed] = useState(() => {
    // Defaults to false; reads the session flag so a remount stays dismissed.
    try { return sessionStorage.getItem('jt_nudge_dismissed') === 'true'; }
    catch { return false; }
  });

  useEffect(() => {
    const onTrigger = () => setDwellTriggered(true);
    window.addEventListener('jt:nudge_trigger', onTrigger);
    return () => window.removeEventListener('jt:nudge_trigger', onTrigger);
  }, []);

  const handleDismiss = () => {
    setNudgeDismissed(true);
    try { sessionStorage.setItem('jt_nudge_dismissed', 'true'); } catch { /* no-op */ }
  };

  const shouldNudge = globalShouldNudge || dwellTriggered;
  const onInterviewRoute = location.pathname === '/interview';

  return (
    <AnimatePresence>
      {shouldNudge && !nudgeDismissed && !onInterviewRoute && (
        <RecruiterNudge key="recruiter-nudge" visible onDismiss={handleDismiss} />
      )}
    </AnimatePresence>
  );
}

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
        <RecruiterNudgeHost />
      </BrowserRouter>
    </MotionConfig>
  );
}
