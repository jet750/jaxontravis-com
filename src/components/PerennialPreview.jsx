import { useNavigate } from 'react-router-dom';
import birdsOfParadiseImg     from '../assets/perennial/card-birds-of-paradise.png';
import saguaroCactusImg       from '../assets/perennial/card-saguaro-cactus.png';
import blueMorphoButterflyImg from '../assets/perennial/card-blue-morpho-butterfly.png';
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

      {/* Gradient vignette — always present for badge legibility */}
      <div className={styles.vignette} aria-hidden="true" />

      {/* Tier + archetype badges */}
      <div className={styles.artMeta}>
        {tier && <span className={styles.tierBadge}>{tier}</span>}
        <span className={styles.archetypeTag}>{archetype}</span>
      </div>
    </div>
  );
}

function PreviewCard({ card }) {
  return (
    <article className={styles.card}>
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
    </article>
  );
}

export default function PerennialPreview() {
  const navigate = useNavigate();

  return (
    <section className={styles.section} data-accent="botanical">
      <div className={styles.container}>

        <header className={styles.header}>
          <span className={styles.eyebrow}>Game Design</span>
          <h2 className={styles.heading}>Perennial: A Cultivar Anthology</h2>
          <p className={styles.subhead}>
            A botanical engine-building card game for 2–4 players.
            10 growing seasons. 4 biomes.
          </p>
        </header>

        <div className={styles.cardGrid} role="list" aria-label="Featured Perennial cards">
          {CARDS.map(card => (
            <div key={card.id} role="listitem">
              <PreviewCard card={card} />
            </div>
          ))}
        </div>

        <div className={styles.ctas}>
          <button
            className={styles.ctaPrimary}
            onClick={() => navigate('/perennial')}
          >
            Explore Perennial →
          </button>
        </div>

      </div>
    </section>
  );
}
