import { Link, useNavigate } from 'react-router-dom';
import styles from './Footer.module.css';

const NAV_LINKS = [
  { label: 'AI Interview',   path: '/interview' },
  { label: 'Perennial',      path: '/perennial' },
  { label: 'Bazaar Blends',  path: '/bazaar-blends' },
  { label: 'About',          path: '/about' },
  { label: 'Work Samples',   path: '/work-samples' },
];

const SOCIAL = [
  { label: 'Email',    href: 'mailto:jaxontravis7@gmail.com' },
  { label: 'LinkedIn', href: 'https://linkedin.com/in/jaxontravis' },
];

export default function Footer() {
  const year     = new Date().getFullYear();
  const navigate = useNavigate();

  const handleBrandClick = () => {
    navigate('/');
    window.scrollTo(0, 0);
  };

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>

        <div className={styles.top}>
          <button
            className={styles.brand}
            onClick={handleBrandClick}
            aria-label="Go to home"
          >
            Jaxon Travis
          </button>

          <nav className={styles.nav} aria-label="Footer navigation">
            {NAV_LINKS.map(link => (
              <Link
                key={link.path}
                className={styles.navLink}
                to={link.path}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className={styles.social}>
            {SOCIAL.map(s => (
              <a
                key={s.label}
                href={s.href}
                className={styles.socialLink}
                target={s.href.startsWith('mailto') ? undefined : '_blank'}
                rel={s.href.startsWith('mailto') ? undefined : 'noopener noreferrer'}
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>

        <div className={styles.bottom}>
          <p className={styles.copyright}>© {year} Jaxon Travis · Carlsbad, CA</p>
          <p className={styles.credit}>Built with React &amp; Claude</p>
        </div>

      </div>
    </footer>
  );
}
