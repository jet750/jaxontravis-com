import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Nav    from '../components/Nav';
import Footer from '../components/Footer';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

export default function RootLayout() {
  return (
    <>
      <ScrollToTop />
      <Nav />
      <Outlet />
      <Footer />
    </>
  );
}
