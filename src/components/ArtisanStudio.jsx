import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer, DURATION, EASE } from '../lib/motion';
import styles from './ArtisanStudio.module.css';

// ── Data ──────────────────────────────────────────────────────────────────────

const BLENDS = [
  {
    name:    'Spicy Garlic',
    origin:  'Mediterranean',
    profile: 'Bold and pungent with slow-building heat.',
    notes:   ['Roasted Garlic', 'Calabrian Chili', 'Black Pepper', 'Sea Salt'],
    artType: 'garlic',
  },
  {
    name:    'Classic Italian',
    origin:  'Southern Italy',
    profile: 'Herbaceous and savory — the soul of Italian cooking.',
    notes:   ['Basil', 'Oregano', 'Rosemary', 'Thyme', 'Garlic'],
    artType: 'herb',
  },
  {
    name:    'Tikka Masala',
    origin:  'Punjab, India',
    profile: 'Warm and layered with aromatic depth.',
    notes:   ['Cumin', 'Coriander', 'Turmeric', 'Fenugreek', 'Cardamom'],
    artType: 'anise',
  },
];

const VALUE_PROPS = [
  {
    number: '01',
    title:  'Origin-First',
    desc:   'Every blend is developed from the source culture outward — not recreated from a Western pantry.',
  },
  {
    number: '02',
    title:  'Authentic Recipes',
    desc:   'Each tin ships with regional recipes written by people who grew up cooking these flavors.',
  },
  {
    number: '03',
    title:  'Transparent Sourcing',
    desc:   'Every ingredient labeled with its regional origin. No mystery blends. No generic "spices."',
  },
];

const PROJECTS = [
  {
    name: 'The Blend Lab',
    desc: 'Custom blend development for restaurants and specialty retailers sourcing authentic regional flavors at scale.',
    tag:  'B2B',
  },
  {
    name: 'Seasonal Collections',
    desc: 'Limited-edition regional sets timed to harvest cycles — featuring single-origin spices at peak freshness.',
    tag:  'Limited',
  },
  {
    name: 'Origin Stories',
    desc: 'Long-form editorial on the culinary history and cultural context behind every blend in the lineup.',
    tag:  'Content',
  },
];

// ── Shared viewport config ────────────────────────────────────────────────────

const VIEW = { once: true, amount: 0.3 };

// ── Inline SVG art ────────────────────────────────────────────────────────────

function GarlicArt() {
  return (
    <svg className={styles.artSvg} viewBox="0 0 80 80" fill="none" aria-hidden="true">
      <path
        d="M20 55 Q18 41 26 31 Q31 24 40 22 Q49 24 54 31 Q62 41 60 55 Q54 64 40 66 Q26 64 20 55Z"
        stroke="currentColor" strokeWidth="1" fill="currentColor" fillOpacity="0.1"
      />
      <path d="M40 22 Q38 42 40 66" stroke="currentColor" strokeWidth="0.7" strokeLinecap="round" />
      <path d="M34 26 Q28 44 29 62"  stroke="currentColor" strokeWidth="0.7" strokeLinecap="round" />
      <path d="M46 26 Q52 44 51 62"  stroke="currentColor" strokeWidth="0.7" strokeLinecap="round" />
      <path d="M20 49 Q19 43 21 38" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" />
      <path d="M60 49 Q61 43 59 38" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" />
      <path d="M40 22 C39 15 40 10 40 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M28 63 Q34 68 40 66 Q46 68 52 63" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
      <path d="M30 65 Q28 70 27 74" stroke="currentColor" strokeWidth="0.7" strokeLinecap="round" />
      <path d="M35 66 Q34 72 34 76" stroke="currentColor" strokeWidth="0.7" strokeLinecap="round" />
      <path d="M40 66 L40 76"        stroke="currentColor" strokeWidth="0.7" strokeLinecap="round" />
      <path d="M45 66 Q46 72 46 76" stroke="currentColor" strokeWidth="0.7" strokeLinecap="round" />
      <path d="M50 65 Q52 70 53 74" stroke="currentColor" strokeWidth="0.7" strokeLinecap="round" />
    </svg>
  );
}

function HerbArt() {
  return (
    <svg className={styles.artSvg} viewBox="0 0 80 80" fill="none" aria-hidden="true">
      <path d="M40 74 C40 60 40 46 40 16" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M40 64 C32 59 23 55 19 49 C24 46 34 51 40 62Z"
        stroke="currentColor" strokeWidth="0.85" fill="currentColor" fillOpacity="0.1" />
      <path d="M40 64 C48 59 57 55 61 49 C56 46 46 51 40 62Z"
        stroke="currentColor" strokeWidth="0.85" fill="currentColor" fillOpacity="0.1" />
      <path d="M19 49 C28 52 35 56 40 64" stroke="currentColor" strokeWidth="0.4" />
      <path d="M61 49 C52 52 45 56 40 64" stroke="currentColor" strokeWidth="0.4" />
      <path d="M40 50 C32 44 23 39 20 33 C25 30 35 36 40 48Z"
        stroke="currentColor" strokeWidth="0.85" fill="currentColor" fillOpacity="0.1" />
      <path d="M40 50 C48 44 57 39 60 33 C55 30 45 36 40 48Z"
        stroke="currentColor" strokeWidth="0.85" fill="currentColor" fillOpacity="0.1" />
      <path d="M20 33 C29 37 36 42 40 50" stroke="currentColor" strokeWidth="0.4" />
      <path d="M60 33 C51 37 44 42 40 50" stroke="currentColor" strokeWidth="0.4" />
      <path d="M40 34 C35 25 35 17 40 14 C45 17 45 25 40 34Z"
        stroke="currentColor" strokeWidth="0.85" fill="currentColor" fillOpacity="0.12" />
      <path d="M40 14 C40 21 40 28 40 34" stroke="currentColor" strokeWidth="0.4" />
    </svg>
  );
}

function AniseArt() {
  const arms = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <svg className={styles.artSvg} viewBox="0 0 80 80" fill="none" aria-hidden="true">
      {arms.map(deg => (
        <path
          key={deg}
          d="M40 36 C37 27 36 18 40 14 C44 18 43 27 40 36Z"
          stroke="currentColor" strokeWidth="0.9"
          fill="currentColor" fillOpacity="0.1"
          transform={`rotate(${deg} 40 40)`}
        />
      ))}
      <circle cx="40" cy="40" r="10"
        stroke="currentColor" strokeWidth="0.7"
        fill="currentColor" fillOpacity="0.06" />
      {arms.map(deg => (
        <line key={deg}
          x1="40" y1="35" x2="40" y2="26"
          stroke="currentColor" strokeWidth="0.5"
          transform={`rotate(${deg} 40 40)`}
        />
      ))}
      <circle cx="40" cy="40" r="5"
        stroke="currentColor" strokeWidth="0.9"
        fill="currentColor" fillOpacity="0.25" />
      {arms.map(deg => (
        <circle key={deg}
          cx="40" cy="14" r="1.8"
          fill="currentColor" fillOpacity="0.5"
          transform={`rotate(${deg} 40 40)`}
        />
      ))}
    </svg>
  );
}

// ── Blend card ────────────────────────────────────────────────────────────────

function BlendCard({ blend }) {
  return (
    <motion.article
      className={styles.card}
      data-art={blend.artType}
      variants={fadeInUp}
      initial="hidden"
      whileHover={{ scale: 1.03, y: -4, transition: { duration: 0.2 } }}
    >
      <div className={styles.cardArt}>
        <div className={styles.artBadge}>
          {blend.artType === 'garlic' && <GarlicArt />}
          {blend.artType === 'herb'   && <HerbArt />}
          {blend.artType === 'anise'  && <AniseArt />}
        </div>
      </div>

      <div className={styles.cardBody}>
        <p  className={styles.cardOrigin}>{blend.origin}</p>
        <h3 className={styles.cardName}>{blend.name}</h3>
        <p  className={styles.cardProfile}>{blend.profile}</p>

        <ul className={styles.noteList} aria-label="Key ingredients">
          {blend.notes.map(n => (
            <li key={n} className={styles.noteChip}>{n}</li>
          ))}
        </ul>
      </div>
    </motion.article>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ArtisanStudio() {
  return (
    <section id="artisan-studio" className={styles.section} data-accent="ember">
      <div className={styles.container}>

        {/* ── Block 1: Section header — delay 0 ── */}
        <motion.header
          className={styles.sectionTop}
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={VIEW}
        >
          <span className={styles.eyebrow}>ARTISAN STUDIO</span>

          <div className={styles.headingRow}>
            <h2 className={styles.heading}>Bazaar Blends</h2>
            <span className={styles.prelaunchBadge}>
              <span className={styles.pulseDot} aria-hidden="true" />
              Pre-Launch · bazaarblends.com
            </span>
          </div>

          <p className={styles.tagline}>Where Every Spice Has an Origin Story</p>
          <p className={styles.subhead}>
            Authentic regional spice blends sourced from the cultures that created
            them. Coming to bazaarblends.com.
          </p>
        </motion.header>

        {/* ── Block 2: Philosophy — delay 0.1s ── */}
        <motion.div
          className={styles.philosophy}
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={VIEW}
          transition={{ duration: DURATION, ease: EASE, delay: 0.1 }}
        >
          <div className={styles.philosophyInner}>
            <span className={styles.philosophyEyebrow}>Our Philosophy</span>
            <blockquote className={styles.philosophyQuote}>
              "Authentic regional blends that put the origin culture first."
            </blockquote>
            <p className={styles.philosophySub}>
              Most spice blends are approximations — reverse-engineered from taste
              memories or simplified for Western palates. Bazaar Blends goes to the
              source: the regional kitchens, the local markets, the cooks who have
              been making these blends for generations.
            </p>
          </div>
        </motion.div>

        {/* ── Block 3: Blend grid label — delay 0.2s ── */}
        <motion.div
          className={styles.blendHeader}
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={VIEW}
          transition={{ duration: DURATION, ease: EASE, delay: 0.2 }}
        >
          <span className={styles.blendEyebrow}>FIRST RELEASE — THREE BLENDS</span>
        </motion.div>

        {/* ── Block 4: Blend card grid — staggerContainer, independent whileInView ── */}
        <motion.div
          className={styles.cardGrid}
          role="list"
          aria-label="Featured blends"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={VIEW}
        >
          {BLENDS.map(blend => (
            <div key={blend.name} role="listitem">
              <BlendCard blend={blend} />
            </div>
          ))}
        </motion.div>

        {/* ── Block 5: Value props — delay 0.3s ── */}
        <motion.div
          className={styles.valueBlock}
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={VIEW}
          transition={{ duration: DURATION, ease: EASE, delay: 0.3 }}
        >
          <header className={styles.valueHeader}>
            <span className={styles.valueEyebrow}>WHY BAZAAR BLENDS</span>
            <h3 className={styles.valueHeading}>Built different from the shelf.</h3>
          </header>

          <div className={styles.valueGrid} role="list">
            {VALUE_PROPS.map(vp => (
              <div key={vp.number} className={styles.valueProp} role="listitem">
                <span className={styles.valueNumber} aria-hidden="true">{vp.number}</span>
                <h4 className={styles.valueTitle}>{vp.title}</h4>
                <p  className={styles.valueDesc}>{vp.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Block 6: Culinary projects — delay 0.4s ── */}
        <motion.div
          className={styles.projectsBlock}
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={VIEW}
          transition={{ duration: DURATION, ease: EASE, delay: 0.4 }}
        >
          <div className={styles.projectsDivider} aria-hidden="true">
            <span className={styles.dividerLine} />
            <span className={styles.dividerLabel}>The Bazaar Blends Universe</span>
            <span className={styles.dividerLine} />
          </div>

          <header className={styles.projectsHeader}>
            <h3 className={styles.projectsHeading}>Culinary Projects</h3>
            <p className={styles.projectsSubhead}>
              The blend lineup is the beginning, not the product.
            </p>
          </header>

          <div className={styles.projects} role="list">
            {PROJECTS.map(p => (
              <div key={p.name} className={styles.project} role="listitem">
                <span className={styles.projectTag}>{p.tag}</span>
                <h4 className={styles.projectName}>{p.name}</h4>
                <p  className={styles.projectDesc}>{p.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Block 7: CTAs — delay 0.5s ── */}
        <motion.div
          className={styles.ctas}
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={VIEW}
          transition={{ duration: DURATION, ease: EASE, delay: 0.5 }}
        >
          <motion.button
            className={styles.ctaPrimary}
            whileHover={{ scale: 1.02, y: -2, transition: { duration: 0.2 } }}
          >
            Notify me at launch →
          </motion.button>
          <motion.a
            href="https://instagram.com"
            className={styles.ctaOutline}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.02, y: -2, transition: { duration: 0.2 } }}
          >
            Follow on Instagram →
          </motion.a>
        </motion.div>

      </div>
    </section>
  );
}
