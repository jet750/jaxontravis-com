import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer, DURATION, EASE } from '../lib/motion';
import TiltCard from './TiltCard';
import styles from './GameDesign.module.css';

// Real card art (found in src/assets/perennial/). Mapped to the featured
// cards by position below; if any image fails to load, TiltCard falls back
// to the inline SVG art passed as fallbackContent.
import cardBirdsOfParadise from '../assets/perennial/card-birds-of-paradise.png';
import cardSaguaroCactus from '../assets/perennial/card-saguaro-cactus.png';
import cardBlueMorphoButterfly from '../assets/perennial/card-blue-morpho-butterfly.png';

// ── Data ──────────────────────────────────────────────────────────────────────

const CHIPS = [
  { label: '2–4 Players',      variant: 'neutral' },
  { label: '60–120 min',       variant: 'neutral' },
  { label: 'Engine-Building',  variant: 'neutral' },
  { label: 'In Playtesting',   variant: 'accent'  },
];

const FEATURED_CARDS = [
  {
    name:      'Birds of Paradise',
    tier:      'T3',
    archetype: 'Flowering',
    mechanic:  'End of season: place 3 Pollen tokens on adjacent plant spaces.',
    flavor:    'Bred for spectacle. Built for the long season.',
    artType:   'birds',
    image:     cardBirdsOfParadise,
  },
  {
    name:      'Saguaro Cactus',
    tier:      'T2',
    archetype: 'Succulent',
    mechanic:  'Drought — immune to dry-season discard. Store 2 Water tokens each season.',
    flavor:    'A century of patience, measured in inches.',
    artType:   'saguaro',
    image:     cardSaguaroCactus,
  },
  {
    name:      'Blue Morpho Butterfly',
    tier:      null,
    archetype: 'Pollinator',
    mechanic:  'Pollinate: move to any adjacent plant and transfer all Pollen tokens.',
    flavor:    'Iridescence is a defense. Beauty, a strategy.',
    artType:   'morpho',
    image:     cardBlueMorphoButterfly,
  },
];

const SPINOFFS = [
  {
    name:        'Perennial: Cultivar',
    description: 'A focused 2-player variant built around hybrid breeding mechanics and head-to-head seasonal pressure.',
    status:      'Concept',
  },
  {
    name:        'Perennial: Succession',
    description: 'Expansion introducing ecological succession — pioneer species, climax communities, and disturbance cascades.',
    status:      'Concept',
  },
  {
    name:        'Automa Solo Mode',
    description: 'A fully modeled AI opponent that simulates competitive planting strategy — no second player required.',
    status:      'In Design',
  },
];

// ── Shared viewport config ────────────────────────────────────────────────────

const VIEW = { once: true, amount: 0.3 };

// ── Inline SVG art ────────────────────────────────────────────────────────────

function LilyArt() {
  const petals = [0, 60, 120, 180, 240, 300];
  const stamens = [0, 40, -40, 20, -20];
  return (
    <svg className={styles.artSvg} viewBox="0 0 80 80" fill="none" aria-hidden="true">
      {petals.map(deg => (
        <path
          key={deg}
          d="M40 12 C34 23 33 33 40 40 C47 33 46 23 40 12Z"
          stroke="currentColor"
          strokeWidth="0.9"
          fill="currentColor"
          fillOpacity="0.1"
          transform={`rotate(${deg} 40 40)`}
        />
      ))}
      {stamens.map((offset, i) => (
        <line
          key={i}
          x1="40" y1="36"
          x2="40" y2="22"
          stroke="currentColor"
          strokeWidth="0.7"
          strokeLinecap="round"
          transform={`rotate(${offset} 40 40)`}
        />
      ))}
      {stamens.map((offset, i) => (
        <circle
          key={i}
          cx="40" cy="22"
          r="1.2"
          fill="currentColor"
          fillOpacity="0.7"
          transform={`rotate(${offset} 40 40)`}
        />
      ))}
      <circle cx="40" cy="40" r="5.5" stroke="currentColor" strokeWidth="0.9" fill="currentColor" fillOpacity="0.18" />
      <circle cx="40" cy="40" r="2.5" fill="currentColor" fillOpacity="0.4" />
    </svg>
  );
}

function SundewArt() {
  const count = 12;
  const arms = Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * 2 * Math.PI - Math.PI / 2;
    const innerR = 10;
    const outerR = 28;
    const dropR  = 32;
    return {
      x1:  40 + innerR * Math.cos(angle),
      y1:  40 + innerR * Math.sin(angle),
      x2:  40 + outerR * Math.cos(angle),
      y2:  40 + outerR * Math.sin(angle),
      dx:  40 + dropR  * Math.cos(angle),
      dy:  40 + dropR  * Math.sin(angle),
    };
  });

  return (
    <svg className={styles.artSvg} viewBox="0 0 80 80" fill="none" aria-hidden="true">
      <circle cx="40" cy="40" r="10" stroke="currentColor" strokeWidth="0.9" fill="currentColor" fillOpacity="0.1" />
      <circle cx="40" cy="40" r="4"  fill="currentColor" fillOpacity="0.25" />
      {arms.map(({ x1, y1, x2, y2 }, i) => (
        <line
          key={i}
          x1={x1.toFixed(1)} y1={y1.toFixed(1)}
          x2={x2.toFixed(1)} y2={y2.toFixed(1)}
          stroke="currentColor"
          strokeWidth="0.8"
          strokeLinecap="round"
        />
      ))}
      {arms.map(({ dx, dy }, i) => (
        <circle
          key={i}
          cx={dx.toFixed(1)} cy={dy.toFixed(1)}
          r="1.8"
          fill="currentColor"
          fillOpacity="0.55"
        />
      ))}
    </svg>
  );
}

function BeeArt() {
  const r = 12;
  function hexPoints(cx, cy) {
    return [0, 60, 120, 180, 240, 300]
      .map(deg => {
        const rad = deg * Math.PI / 180;
        return `${(cx + r * Math.cos(rad)).toFixed(1)},${(cy + r * Math.sin(rad)).toFixed(1)}`;
      })
      .join(' ');
  }

  const dX = 2 * r;
  const dY = r * Math.sqrt(3);
  const cells = [
    [40,          40        ],
    [40 + dX,     40        ],
    [40 - dX,     40        ],
    [40 + r,      40 - dY   ],
    [40 - r,      40 - dY   ],
    [40 + r,      40 + dY   ],
    [40 - r,      40 + dY   ],
  ];

  return (
    <svg className={styles.artSvg} viewBox="0 0 80 80" fill="none" aria-hidden="true">
      {cells.map(([cx, cy], i) => (
        <polygon
          key={i}
          points={hexPoints(cx, cy)}
          stroke="currentColor"
          strokeWidth="0.9"
          fill="currentColor"
          fillOpacity={i === 0 ? 0.18 : 0.05}
        />
      ))}
      <ellipse cx="40" cy="39" rx="3.5" ry="5.5" fill="currentColor" fillOpacity="0.5" />
      <ellipse cx="40" cy="34" rx="3"   ry="3"   fill="currentColor" fillOpacity="0.4" />
      <ellipse cx="35" cy="37" rx="4.5" ry="2.5" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="0.5" transform="rotate(-20 35 37)" />
      <ellipse cx="45" cy="37" rx="4.5" ry="2.5" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="0.5" transform="rotate(20 45 37)"  />
    </svg>
  );
}

// ── Fallback SVG art lookup (used when a card image is missing or fails) ───────

const FALLBACK_ART = {
  birds:   <LilyArt />,
  saguaro: <SundewArt />,
  morpho:  <BeeArt />,
};

// ── Spinoff card ──────────────────────────────────────────────────────────────

function SpinoffCard({ spinoff }) {
  return (
    <div className={styles.spinoff}>
      <span className={`${styles.statusChip} ${
        spinoff.status === 'In Design' ? styles.chipAccent : styles.chipNeutral
      }`}>
        {spinoff.status}
      </span>
      <h4 className={styles.spinoffName}>{spinoff.name}</h4>
      <p  className={styles.spinoffDesc}>{spinoff.description}</p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function GameDesign() {
  return (
    <section id="game-design" className={styles.section} data-accent="botanical">
      <div className={styles.container}>

        {/* ── Block 1: Section header — delay 0 ── */}
        <motion.header
          className={styles.sectionTop}
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={VIEW}
        >
          <span className={styles.eyebrow}>GAME DESIGN</span>
          <h2 className={styles.heading}>Perennial: A Cultivar Anthology</h2>
          <p className={styles.subhead}>
            A botanical engine-building card game for 2–4 players.
            Standalone box. 60–120 minutes.
          </p>

          <div className={styles.chips} role="list" aria-label="Game details">
            {CHIPS.map(({ label, variant }) => (
              <span
                key={label}
                role="listitem"
                className={`${styles.chip} ${variant === 'accent' ? styles.chipAccent : styles.chipNeutral}`}
              >
                {label}
              </span>
            ))}
          </div>
        </motion.header>

        {/* ── Block 2: Pitch stats — delay 0.1s ── */}
        <motion.div
          className={styles.pitch}
          aria-label="Ten growing seasons. Four biomes. Ecological accuracy in every mechanic."
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={VIEW}
          transition={{ duration: DURATION, ease: EASE, delay: 0.1 }}
        >
          <div className={styles.pitchStat} aria-hidden="true">
            <span className={styles.pitchNumber}>10</span>
            <span className={styles.pitchLabel}>Growing Seasons</span>
          </div>
          <div className={styles.pitchDivider} aria-hidden="true" />
          <div className={styles.pitchStat} aria-hidden="true">
            <span className={styles.pitchNumber}>4</span>
            <span className={styles.pitchLabel}>Biomes</span>
          </div>
          <div className={styles.pitchDivider} aria-hidden="true" />
          <div className={styles.pitchStatement} aria-hidden="true">
            <span className={styles.pitchText}>
              Ecological accuracy<br />in every mechanic.
            </span>
          </div>
        </motion.div>

        {/* ── Block 3: Featured card grid — staggerContainer ── */}
        {/* 3 cards only → standard staggerChildren 0.08 is fine */}
        <motion.div
          className={styles.cardGrid}
          role="list"
          aria-label="Featured cards"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={VIEW}
        >
          {FEATURED_CARDS.map((card, i) => (
            <motion.div
              key={card.name}
              role="listitem"
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={VIEW}
              transition={{ duration: DURATION, ease: EASE, delay: i * 0.08 }}
            >
              <TiltCard
                imageOnly
                imageSrc={card.image}
                fallbackContent={FALLBACK_ART[card.artType]}
                title={card.name}
                tier={card.tier}
                archetype={card.archetype}
                mechanic={card.mechanic}
                flavor={card.flavor}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* ── Universe divider — decorative, no animation ── */}
        <div className={styles.universeDivider} aria-hidden="true">
          <span className={styles.universeDividerLine} />
          <span className={styles.universeDividerLabel}>The Perennial Universe</span>
          <span className={styles.universeDividerLine} />
        </div>

        {/* ── Block 4: Spinoffs — delay 0.2s, treated as one block ── */}
        <motion.div
          className={styles.universeBlock}
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={VIEW}
          transition={{ duration: DURATION, ease: EASE, delay: 0.2 }}
        >
          <header className={styles.universeHeader}>
            <h3 className={styles.universeHeading}>Expansions &amp; Spinoffs</h3>
            <p className={styles.universeSubhead}>
              Perennial is designed as a universe, not a single game.
            </p>
          </header>

          <div className={styles.spinoffs} role="list" aria-label="Spinoffs and expansions">
            {SPINOFFS.map(s => (
              <div key={s.name} role="listitem">
                <SpinoffCard spinoff={s} />
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Block 5: CTAs — delay 0.3s ── */}
        <motion.div
          className={styles.ctas}
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={VIEW}
          transition={{ duration: DURATION, ease: EASE, delay: 0.3 }}
        >
          <motion.button
            className={styles.ctaPrimary}
            whileHover={{ scale: 1.02, y: -2, transition: { duration: 0.2 } }}
          >
            Join the playtester list →
          </motion.button>
          <motion.button
            className={styles.ctaOutline}
            whileHover={{ scale: 1.02, y: -2, transition: { duration: 0.2 } }}
          >
            Notify me: Kickstarter →
          </motion.button>
        </motion.div>

      </div>
    </section>
  );
}
