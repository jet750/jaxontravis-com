import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, Suspense } from 'react';
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
  return (
    <>
      <ScrollToTop />
      <Nav />
      <Suspense fallback={<PageFallback />}>
        <Outlet />
      </Suspense>
      <Footer />
    </>
  );
}
