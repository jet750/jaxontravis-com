import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { fadeInUp, DURATION, EASE } from '../lib/motion';
import styles from './BazaarBlendsPreview.module.css';

const BLENDS = [
  {
    id:          'spicy-garlic',
    name:        'Spicy Garlic',
    descriptor:  'The flagship blend. Composed of over 10 types of peppers and California garlic, designed to showcase the depth of chilis\' flavors beyond standard burning heat.',
  },
  {
    id:          'tikka-masala',
    name:        'Tikka Masala',
    descriptor:  'A meticulously designed blend focused on authentic spices from Indian cuisine, including Hing, Dagad Phool, and Shahi Jeera, sourced from the ancient markets of Old Delhi.',
  },
  {
    id:          'mediterranean-blend',
    name:        'Mediterranean Blend',
    descriptor:  'Mixing classic basil, oregano and thyme with Urfa Biber from Turkey and Long Pepper, a spice highly prized by the Roman Empire.',
  },
];

function PhotoSlot() {
  return (
    <div className={styles.photoSlot} role="img" aria-label="Product photo coming soon">
      <div className={styles.photoInner} aria-hidden="true">
        <svg
          className={styles.photoIcon}
          viewBox="0 0 32 32"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="16" cy="16" r="9"  stroke="currentColor" strokeWidth="1.25" />
          <circle cx="16" cy="16" r="4"  stroke="currentColor" strokeWidth="1.25" />
          {[0, 60, 120, 180, 240, 300].map(deg => (
            <line
              key={deg}
              x1="16" y1="7"
              x2="16" y2="5"
              stroke="currentColor"
              strokeWidth="1.25"
              strokeLinecap="round"
              transform={`rotate(${deg} 16 16)`}
            />
          ))}
        </svg>
        <span className={styles.comingSoonLabel}>Coming Soon</span>
      </div>
    </div>
  );
}

function BlendTile({ blend, index }) {
  return (
    <motion.article
      className={styles.tile}
      variants={fadeInUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: DURATION, ease: EASE, delay: index * 0.08 }}
      whileHover={{ scale: 1.02, y: -2, transition: { duration: 0.2 } }}
    >
      <PhotoSlot />
      <div className={styles.tileBody}>
        <h3 className={styles.tileName}>{blend.name}</h3>
        <p  className={styles.tileDescriptor}>{blend.descriptor}</p>
      </div>
    </motion.article>
  );
}

export default function BazaarBlendsPreview() {
  const navigate = useNavigate();
  const sectionRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'start center'],
  });
  const sectionOpacity = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const sectionScale   = useTransform(scrollYProgress, [0, 1], [0.96, 1]);

  return (
    <motion.section
      ref={sectionRef}
      className={styles.section}
      data-accent="ember"
      style={{ opacity: sectionOpacity, scale: sectionScale }}
    >
      <div className={styles.container}>

        <header className={styles.header}>
          <span className={styles.eyebrow}>Artisan Studio</span>
          <motion.h2
            className={styles.heading}
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            Bazaar Blends
          </motion.h2>
          <motion.p
            className={styles.subhead}
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: DURATION, ease: EASE, delay: 0.1 }}
          >
            Authentic regional spice blends sourced from the cultures that created them.
          </motion.p>
        </header>

        <div
          className={styles.tileGrid}
          role="list"
          aria-label="Featured Bazaar Blends"
        >
          {BLENDS.map((blend, index) => (
            <div key={blend.id} role="listitem">
              <BlendTile blend={blend} index={index} />
            </div>
          ))}
        </div>

        <div className={styles.ctas}>
          <motion.button
            className={styles.ctaPrimary}
            onClick={() => navigate('/bazaar-blends')}
            whileHover={{ scale: 1.02, y: -2, transition: { duration: 0.2 } }}
          >
            Explore Bazaar Blends →
          </motion.button>
        </div>

      </div>
    </motion.section>
  );
}
