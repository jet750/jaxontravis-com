import { useState, useEffect, useCallback } from 'react';
import styles from './Nav.module.css';

const NAV_LINKS = [
  { id: 'ai-interview',    label: 'AI Interview',    accent: 'gold' },
  { id: 'game-design',     label: 'Game Design',     accent: 'botanical' },
  { id: 'artisan-studio',  label: 'Artisan Studio',  accent: 'ember' },
  { id: 'about',           label: 'About',           accent: 'cerulean' },
];

const SCROLL_THRESHOLD = 80;

export default function Nav() {
  const [scrolled, setScrolled]     = useState(false);
  const [menuOpen, setMenuOpen]     = useState(false);
  const [activeId, setActiveId]     = useState('');

  /* ── Scroll-aware background ── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ── IntersectionObserver — active section ── */
  useEffect(() => {
    const sectionIds = NAV_LINKS.map((l) => l.id);
    const observers  = [];

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;

      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveId(id); },
        { rootMargin: '-40% 0px -50% 0px', threshold: 0 }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((obs) => obs.disconnect());
  }, []);

  /* ── Lock body scroll when mobile menu is open ── */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const handleLinkClick = useCallback((id) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleLogoClick = useCallback(() => {
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

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
          aria-label="Back to top"
        >
          Jaxon Travis
        </button>

        {/* Desktop links */}
        <nav aria-label="Site navigation">
          <ul className={styles.linkList}>
            {NAV_LINKS.map(({ id, label, accent }) => (
              <li key={id}>
                <button
                  className={`${styles.link} ${activeId === id ? styles.active : ''}`}
                  data-accent={accent}
                  onClick={() => handleLinkClick(id)}
                  aria-current={activeId === id ? 'true' : undefined}
                >
                  <span className={styles.dot} aria-hidden="true" />
                  {label}
                </button>
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
            {NAV_LINKS.map(({ id, label, accent }) => (
              <li key={id}>
                <button
                  className={`${styles.overlayLink} ${activeId === id ? styles.overlayActive : ''}`}
                  data-accent={accent}
                  onClick={() => handleLinkClick(id)}
                  aria-current={activeId === id ? 'true' : undefined}
                >
                  <span className={styles.overlayDot} aria-hidden="true" />
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
