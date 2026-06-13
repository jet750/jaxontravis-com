import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
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
    path:       '/about',
    eyebrow:    'ABOUT',
    heading:    'The Through-Line',
    descriptor: 'Process architect. Systems thinker. Carlsbad, CA.',
    accent:     'cerulean',
  },
];

export default function Hero() {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();

  // Cards reveal once then stay — not scroll-linked, so they don't re-hide.
  // Reduced-motion users see the cards immediately without any scroll requirement.
  const [cardsShown, setCardsShown] = useState(false);

  // useScroll measures against the full 200dvh hero section.
  // offset 'end start' = progress 1 when hero bottom reaches viewport top.
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  // Text fades out over the first 35% of hero scroll (~70dvh).
  const contentOpacity = useTransform(scrollYProgress, [0, 0.35], [1, 0]);

  useEffect(() => {
    if (prefersReducedMotion) {
      setCardsShown(true);
      return;
    }
    // Reveal cards after ~15% of hero scroll (≈30dvh) — before they'd
    // naturally scroll into view, so the transition is already complete
    // when they appear.
    const unsubscribe = scrollYProgress.on('change', v => {
      if (v > 0.15) setCardsShown(true);
    });
    return unsubscribe;
  }, [scrollYProgress, prefersReducedMotion]);

  return (
    <section id="hero" className={styles.hero} ref={heroRef}>

      {/* Sticky wrapper — stays locked at the top of the viewport for the
          first 100dvh of scroll, giving the cards a stable resting place. */}
      <div className={styles.stickyWrapper}>

        {/* ── Text content — fades out as the user scrolls ── */}
        <motion.div className={styles.content} style={{ opacity: contentOpacity }}>

          {/* 1 — Location eyebrow */}
          <motion.p
            className={styles.location}
            aria-label="Location: Carlsbad, California"
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
          >
            Carlsbad, California
          </motion.p>

          {/* 2 — Name */}
          <motion.h1
            className={styles.name}
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            transition={{ duration: DURATION, ease: EASE, delay: 0.15 }}
          >
            Jaxon Travis
          </motion.h1>

          {/* 3 — Discipline line */}
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

          {/* 4 — Tagline */}
          <motion.p
            className={styles.tagline}
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            transition={{ duration: DURATION, ease: EASE, delay: 0.45 }}
          >
            Building at the intersection of design, technology, and craft.
          </motion.p>

          {/* 5 — Scroll cue */}
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

        </motion.div>

        {/* ── Navigation cards — appear once, then stay static at the bottom ── */}
        <motion.ul
          className={styles.cards}
          initial={{ opacity: 0 }}
          animate={{ opacity: cardsShown ? 1 : 0 }}
          transition={{ duration: 0.6, ease: EASE }}
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

      </div>
    </section>
  );
}
