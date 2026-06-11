import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import styles from './Nav.module.css';

const NAV_LINKS = [
  { path: '/interview',     label: 'AI Interview',   accent: 'gold' },
  { path: '/perennial',     label: 'Perennial',      accent: 'botanical' },
  { path: '/bazaar-blends', label: 'Bazaar Blends',  accent: 'ember' },
  { path: '/about',         label: 'About',          accent: 'cerulean' },
];

const SCROLL_THRESHOLD = 80;

export default function Nav() {
  const [scrolled,  setScrolled]  = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  /* ── Scroll-aware background ── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ── Close mobile menu on route change ── */
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  /* ── Lock body scroll when mobile menu is open ── */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const handleLogoClick = () => {
    navigate('/');
    window.scrollTo(0, 0);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header
      className={`${styles.nav} ${scrolled ? styles.scrolled : ''}`}
      role="banner"
    >
      <div className={styles.inner}>
        {/* Logo */}
        <button
          className={styles.logo}
          onClick={handleLogoClick}
          aria-label="Go to home"
        >
          Jaxon Travis
        </button>

        {/* Desktop links */}
        <nav aria-label="Site navigation">
          <ul className={styles.linkList}>
            {NAV_LINKS.map(({ path, label, accent }) => (
              <li key={path}>
                <Link
                  className={`${styles.link} ${isActive(path) ? styles.active : ''}`}
                  data-accent={accent}
                  to={path}
                  aria-current={isActive(path) ? 'page' : undefined}
                >
                  <span className={styles.dot} aria-hidden="true" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Hamburger — mobile only */}
        <button
          className={`${styles.hamburger} ${menuOpen ? styles.hamburgerOpen : ''}`}
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {/* Mobile overlay */}
      <div
        id="mobile-menu"
        className={`${styles.overlay} ${menuOpen ? styles.overlayOpen : ''}`}
        aria-hidden={!menuOpen}
      >
        <nav aria-label="Mobile site navigation">
          <ul className={styles.overlayList}>
            {NAV_LINKS.map(({ path, label, accent }) => (
              <li key={path}>
                <Link
                  className={`${styles.overlayLink} ${isActive(path) ? styles.overlayActive : ''}`}
                  data-accent={accent}
                  to={path}
                  aria-current={isActive(path) ? 'page' : undefined}
                >
                  <span className={styles.overlayDot} aria-hidden="true" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
