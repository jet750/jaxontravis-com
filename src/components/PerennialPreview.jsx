import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { fadeInUp, DURATION, EASE } from '../lib/motion';
import birdsOfParadiseImg     from '../assets/perennial/birds-of-paradise.webp';
import saguaroCactusImg       from '../assets/perennial/saguaro-cactus.webp';
import blueMorphoButterflyImg from '../assets/perennial/blue-morpho-butterfly.webp';
import styles from './PerennialPreview.module.css';

const CARDS = [
  {
    id:          'birds-of-paradise',
    name:        'Birds of Paradise',
    tier:        'T3',
    archetype:   'Flowering',
    effectLabel: 'Bloom Effect',
    effectName:  'Altruistic Bloom',
    descriptor:  'A powerful Tier 3 Flowering Flora card that can only be played in the Greenhouse, which opens halfway through the game, and requires a powerful stream of nutrients from your other biomes to support for a gorgeous payoff.',
    imgSrc:      birdsOfParadiseImg,
  },
  {
    id:          'saguaro-cactus',
    name:        'Saguaro Cactus',
    tier:        'T2',
    archetype:   'Cacti',
    effectLabel: 'Bloom Effect',
    effectName:  'Sentinel Bloom',
    descriptor:  'A tactical Tier 2 Cacti Flora that can be played in the Meadow biome to lower the cost of the next cacti card and provide a steady stream of Sun and Seeds to bankroll building your engine.',
    imgSrc:      saguaroCactusImg,
  },
  {
    id:          'blue-morpho-butterfly',
    name:        'Blue Morpho Butterfly',
    tier:        null,
    archetype:   'Pollinator',
    effectLabel: 'Pollinator',
    effectName:  'Iridescent Signal',
    descriptor:  "Pollinates Flora cards to trigger that plant's seed yields, bloom effects across the biome, and the biome's root yield.",
    imgSrc:      blueMorphoButterflyImg,
  },
];

function ImageZone({ id, name, imgSrc, tier, archetype }) {
  return (
    <div className={`${styles.imageZone} ${styles[id]}`}>
      <img
        src={imgSrc}
        alt={`${name} card art`}
        className={styles.cardImg}
        onError={(e) => { e.currentTarget.style.display = 'none'; }}
        loading="lazy"
      />
      <div className={styles.vignette} aria-hidden="true" />
      <div className={styles.artMeta}>
        {tier && <span className={styles.tierBadge}>{tier}</span>}
        <span className={styles.archetypeTag}>{archetype}</span>
      </div>
    </div>
  );
}

function PreviewCard({ card, index }) {
  return (
    <motion.article
      className={styles.card}
      variants={fadeInUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: DURATION, ease: EASE, delay: index * 0.08 }}
      whileHover={{ scale: 1.02, y: -2, transition: { duration: 0.2 } }}
    >
      <ImageZone
        id={card.id}
        name={card.name}
        imgSrc={card.imgSrc}
        tier={card.tier}
        archetype={card.archetype}
      />
      <div className={styles.cardBody}>
        <h3 className={styles.cardName}>{card.name}</h3>
        <p className={styles.cardEffect}>
          <span className={styles.effectLabel}>{card.effectLabel}:</span>{' '}
          {card.effectName}
        </p>
        <div className={styles.bodyDivider} aria-hidden="true" />
        <p className={styles.cardDescriptor}>{card.descriptor}</p>
      </div>
    </motion.article>
  );
}

export default function PerennialPreview() {
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
      data-accent="botanical"
      style={{ opacity: sectionOpacity, scale: sectionScale }}
    >
      <div className={styles.container}>

        <header className={styles.header}>
          <span className={styles.eyebrow}>Game Design</span>
          <motion.h2
            className={styles.heading}
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            Perennial: A Cultivar Anthology
          </motion.h2>
          <motion.p
            className={styles.subhead}
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: DURATION, ease: EASE, delay: 0.1 }}
          >
            A botanical engine-building card game for 2–4 players.
            10 growing seasons. 4 biomes.
          </motion.p>
        </header>

        <div
          className={styles.cardGrid}
          role="list"
          aria-label="Featured Perennial cards"
        >
          {CARDS.map((card, index) => (
            <div key={card.id} role="listitem">
              <PreviewCard card={card} index={index} />
            </div>
          ))}
        </div>

        <div className={styles.ctas}>
          <motion.button
            className={styles.ctaPrimary}
            onClick={() => navigate('/perennial')}
            whileHover={{ scale: 1.02, y: -2, transition: { duration: 0.2 } }}
          >
            Explore Perennial →
          </motion.button>
        </div>

      </div>
    </motion.section>
  );
}
