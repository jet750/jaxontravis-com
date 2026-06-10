import styles from './Hero.module.css';

const CARDS = [
  {
    id:         'ai-interview',
    eyebrow:    'PROFESSIONAL',
    heading:    'Interview Me',
    descriptor: 'Talk to an AI trained on my full background. Takes 5 minutes. Saves you a screening call.',
    accent:     'gold',
  },
  {
    id:         'game-design',
    eyebrow:    'GAME DESIGN',
    heading:    'Perennial',
    descriptor: 'A botanical engine-building card game for 2–4 players. Standalone box.',
    accent:     'botanical',
  },
  {
    id:         'artisan-studio',
    eyebrow:    'ARTISAN STUDIO',
    heading:    'Bazaar Blends',
    descriptor: 'Where every spice has an origin story.',
    accent:     'ember',
  },
  {
    id:         'about',
    eyebrow:    'ABOUT',
    heading:    'The Through-Line',
    descriptor: 'Process architect. Systems thinker. Carlsbad, CA.',
    accent:     'cerulean',
  },
];

function scrollTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

export default function Hero() {
  return (
    <section id="hero" className={styles.hero}>
      {/* ── Main content ── */}
      <div className={styles.content}>
        <p className={styles.location} aria-label="Location: Carlsbad, California">
          Carlsbad, California
        </p>

        <h1 className={styles.name}>Jaxon Travis</h1>

        <p
          className={styles.discipline}
          aria-label="Game Designer · AI Builder · Artisan Creator"
        >
          <span className={styles.disciplineGame}>Game Designer</span>
          <span className={styles.sep} aria-hidden="true">·</span>
          <span className={styles.disciplineAI}>AI Builder</span>
          <span className={styles.sep} aria-hidden="true">·</span>
          <span className={styles.disciplineArtisan}>Artisan Creator</span>
        </p>

        <p className={styles.tagline}>
          Building at the intersection of design, technology, and craft.
        </p>

        <div className={styles.scrollHint} aria-hidden="true">
          <span className={styles.scrollLine} />
          <span className={styles.scrollLabel}>scroll</span>
        </div>
      </div>

      {/* ── Entry cards ── */}
      <ul className={styles.cards}>
        {CARDS.map(({ id, eyebrow, heading, descriptor, accent }) => (
          <li key={id} className={styles.cardItem}>
            <button
              className={styles.card}
              data-accent={accent}
              onClick={() => scrollTo(id)}
            >
              <span className={styles.cardEyebrow}>{eyebrow}</span>
              <span className={styles.cardHeading}>{heading}</span>
              <span className={styles.cardDescriptor}>{descriptor}</span>
              <span className={styles.cardArrow} aria-hidden="true">→</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
