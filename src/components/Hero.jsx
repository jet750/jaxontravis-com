import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fadeInUp, fadeIn, DURATION, EASE } from '../lib/motion';
import styles from './Hero.module.css';

const CARDS = [
  {
    path:       '/interview',
    eyebrow:    'PROFESSIONAL',
    heading:    'Interview Me',
    descriptor: 'Talk to an AI trained on my full background. Takes 5 minutes. Saves you a screening call.',
    accent:     'gold',
  },
  {
    path:       '/perennial',
    eyebrow:    'GAME DESIGN',
    heading:    'Perennial',
    descriptor: 'A botanical engine-building card game for 2–4 players. Standalone box.',
    accent:     'botanical',
  },
  {
    path:       '/bazaar-blends',
    eyebrow:    'ARTISAN STUDIO',
    heading:    'Bazaar Blends',
    descriptor: 'Where every spice has an origin story.',
    accent:     'ember',
  },
  {
    path:       '/photography',
    eyebrow:    'PHOTOGRAPHY',
    heading:    'JET Photography',
    descriptor: 'A personal visual archive — landscapes, cityscapes, and travel.',
    accent:     'violet',
  },
  {
    path:       '/about',
    eyebrow:    'ABOUT',
    heading:    'The Through-Line',
    descriptor: 'Process architect. Systems thinker. Carlsbad, CA.',
    accent:     'cerulean',
  },
  {
    path:       '/work-samples',
    eyebrow:    'PROFESSIONAL',
    heading:    'Work Samples',
    descriptor: 'Selected deliverables from past roles. Password-protected — ask for access.',
    accent:     'gold',
  },
];

export default function Hero() {
  const navigate = useNavigate();

  return (
    <section id="hero" className={styles.hero}>

      {/* ── Text content ── */}
      <div className={styles.content}>

        <motion.p
          className={styles.location}
          aria-label="Location: Carlsbad, California"
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
        >
          Carlsbad, California
        </motion.p>

        <motion.h1
          className={styles.name}
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ duration: DURATION, ease: EASE, delay: 0.15 }}
        >
          Jaxon Travis
        </motion.h1>

        <motion.p
          className={styles.discipline}
          aria-label="Game Designer · AI Builder · Artisan Creator"
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ duration: DURATION, ease: EASE, delay: 0.3 }}
        >
          <span className={styles.disciplineGame}>Game Designer</span>
          <span className={styles.sep} aria-hidden="true">·</span>
          <span className={styles.disciplineAI}>AI Builder</span>
          <span className={styles.sep} aria-hidden="true">·</span>
          <span className={styles.disciplineArtisan}>Artisan Creator</span>
        </motion.p>

        <motion.p
          className={styles.tagline}
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ duration: DURATION, ease: EASE, delay: 0.45 }}
        >
          Building at the intersection of design, technology, and craft.
        </motion.p>

        <motion.div
          className={styles.scrollHint}
          aria-hidden="true"
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          transition={{ duration: DURATION, ease: EASE, delay: 0.65 }}
        >
          <span className={styles.scrollLine} />
          <span className={styles.scrollLabel}>scroll</span>
        </motion.div>

      </div>

      {/* ── Navigation cards ── */}
      <motion.ul
        className={styles.cards}
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.6, ease: EASE, delay: 0.5 }}
      >
        {CARDS.map(({ path, eyebrow, heading, descriptor, accent }) => (
          <li key={path} className={styles.cardItem}>
            <button
              className={styles.card}
              data-accent={accent}
              onClick={() => navigate(path)}
            >
              <span className={styles.cardEyebrow}>{eyebrow}</span>
              <span className={styles.cardHeading}>{heading}</span>
              <span className={styles.cardDescriptor}>{descriptor}</span>
              <span className={styles.cardArrow} aria-hidden="true">→</span>
            </button>
          </li>
        ))}
      </motion.ul>

    </section>
  );
}
