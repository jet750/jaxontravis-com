import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import styles from './Nav.module.css';

// Desktop nav link with a subtle magnetic pull toward the cursor. Hooks must be
// called at the component's top level (not inside Nav's NAV_LINKS.map), so each
// link is its own component. The onMouseMove handler only fires on pointer
// devices, so touch devices never trigger the effect.
function MagneticNavLink({ path, label, accent, isActive }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 300, damping: 25 });
  const springY = useSpring(y, { stiffness: 300, damping: 25 });

  function handleMouseMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - (rect.left + rect.width / 2)) * 0.25);
    y.set((e.clientY - (rect.top + rect.height / 2)) * 0.25);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      style={{ x: springX, y: springY, display: 'inline-flex' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <Link
        className={`${styles.link} ${isActive ? styles.active : ''}`}
        data-accent={accent}
        to={path}
        aria-current={isActive ? 'page' : undefined}
      >
        <span className={styles.dot} aria-hidden="true" />
        {label}
      </Link>
    </motion.div>
  );
}

const NAV_LINKS = [
  { path: '/interview',     label: 'AI Interview',   accent: 'gold' },
  { path: '/perennial',     label: 'Perennial',      accent: 'botanical' },
  { path: '/bazaar-blends', label: 'Bazaar Blends',  accent: 'ember' },
  { path: '/photography',   label: 'JET Photography', accent: 'violet' },
  { path: '/about',         label: 'About',          accent: 'cerulean' },
  { path: '/work-samples',  label: 'Work Samples',   accent: 'gold' },
  { path: '/games/pollinator', label: 'Great Pollinator', accent: 'botanical' },
];

const SCROLL_THRESHOLD = 80;

export default function Nav() {
  const [scrolled,  setScrolled] = useState(false);
  // Store the location.key at which the menu was opened. location.key is unique
  // per navigation entry (including back/forward), so menuOpen naturally becomes
  // false on any navigation without needing a separate route-change effect.
  const [openAtKey, setOpenAtKey] = useState(null);

  // useLocation must be called before the derived menuOpen value below.
  const location = useLocation();
  const navigate  = useNavigate();

  const menuOpen = openAtKey === location.key;

  /* ── Scroll-aware background ── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
    <>
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
                  <MagneticNavLink
                    path={path}
                    label={label}
                    accent={accent}
                    isActive={isActive(path)}
                  />
                </li>
              ))}
            </ul>
          </nav>

          {/* Hamburger — mobile only */}
          <button
            className={`${styles.hamburger} ${menuOpen ? styles.hamburgerOpen : ''}`}
            onClick={() => setOpenAtKey(prev => prev === location.key ? null : location.key)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      {/* Mobile overlay — rendered as sibling of header, not child, to avoid
          backdrop-filter on the scrolled header breaking position:fixed */}
      <div
        id="mobile-menu"
        className={`${styles.overlay} ${menuOpen ? styles.overlayOpen : ''}`}
        aria-hidden={!menuOpen}
      >
        <nav aria-label="Mobile site navigation">
          <ul className={styles.overlayList}>
            <motion.li whileHover={{ scale: 1.05, transition: { duration: 0.15 } }}>
              <Link
                className={`${styles.overlayLink} ${isActive('/') ? styles.overlayActive : ''}`}
                data-accent="home"
                to="/"
                aria-current={isActive('/') ? 'page' : undefined}
              >
                <span className={styles.overlayDot} aria-hidden="true" />
                Home
              </Link>
            </motion.li>
            {NAV_LINKS.map(({ path, label, accent }) => (
              <motion.li
                key={path}
                whileHover={{ scale: 1.05, transition: { duration: 0.15 } }}
              >
                <Link
                  className={`${styles.overlayLink} ${isActive(path) ? styles.overlayActive : ''}`}
                  data-accent={accent}
                  to={path}
                  aria-current={isActive(path) ? 'page' : undefined}
                >
                  <span className={styles.overlayDot} aria-hidden="true" />
                  {label}
                </Link>
              </motion.li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
}
