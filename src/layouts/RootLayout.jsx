import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Nav    from '../components/Nav';
import Footer from '../components/Footer';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

// Reserves vertical space so the page doesn't collapse while a lazy route chunk loads.
function PageFallback() {
  return <div style={{ minHeight: '60vh' }} aria-hidden="true" />;
}

export default function RootLayout() {
  const location = useLocation();

  return (
    <>
      <ScrollToTop />
      <Nav />
      <Suspense fallback={<PageFallback />}>
        {/* Page micro-transition: each route fades + slides on change.
            mode="wait" lets the exiting page fully fade before the entering
            page starts, preventing a layout jump from both rendering at once.
            Keyed by pathname so home (/) is included — the first navigation
            away from home triggers the exit animation too. */}
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </Suspense>
      <Footer />
    </>
  );
}
