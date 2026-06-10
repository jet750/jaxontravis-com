import styles from './Footer.module.css';

const NAV_LINKS = [
  { label: 'AI Interview',   id: 'ai-interview' },
  { label: 'Game Design',    id: 'game-design' },
  { label: 'Artisan Studio', id: 'artisan-studio' },
  { label: 'About',          id: 'about' },
];

const SOCIAL = [
  { label: 'Email',    href: 'mailto:jaxontravis7@gmail.com' },
  { label: 'LinkedIn', href: 'https://linkedin.com/in/jaxontravis' },
];

function scrollTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>

        <div className={styles.top}>
          <button
            className={styles.brand}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label="Back to top"
          >
            Jaxon Travis
          </button>

          <nav className={styles.nav} aria-label="Footer navigation">
            {NAV_LINKS.map(link => (
              <button
                key={link.id}
                className={styles.navLink}
                onClick={() => scrollTo(link.id)}
              >
                {link.label}
              </button>
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
