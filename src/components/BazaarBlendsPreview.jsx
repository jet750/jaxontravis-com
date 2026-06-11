import { useNavigate } from 'react-router-dom';
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

/* Intentional "Coming Soon" photo placeholder — styled as a product photo frame,
   not a broken-image state. */
function PhotoSlot() {
  return (
    <div className={styles.photoSlot} role="img" aria-label="Product photo coming soon">
      <div className={styles.photoInner} aria-hidden="true">
        {/* Minimal aperture / lens icon */}
        <svg
          className={styles.photoIcon}
          viewBox="0 0 32 32"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="16" cy="16" r="9"  stroke="currentColor" strokeWidth="1.25" />
          <circle cx="16" cy="16" r="4"  stroke="currentColor" strokeWidth="1.25" />
          {/* 6 aperture blades */}
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

function BlendTile({ blend }) {
  return (
    <article className={styles.tile}>
      <PhotoSlot />

      <div className={styles.tileBody}>
        <h3 className={styles.tileName}>{blend.name}</h3>
        <p  className={styles.tileDescriptor}>{blend.descriptor}</p>
      </div>
    </article>
  );
}

export default function BazaarBlendsPreview() {
  const navigate = useNavigate();

  return (
    <section className={styles.section} data-accent="ember">
      <div className={styles.container}>

        <header className={styles.header}>
          <span className={styles.eyebrow}>Artisan Studio</span>
          <h2 className={styles.heading}>Bazaar Blends</h2>
          <p className={styles.subhead}>
            Authentic regional spice blends sourced from the cultures that created them.
          </p>
        </header>

        <div className={styles.tileGrid} role="list" aria-label="Featured Bazaar Blends">
          {BLENDS.map(blend => (
            <div key={blend.id} role="listitem">
              <BlendTile blend={blend} />
            </div>
          ))}
        </div>

        <div className={styles.ctas}>
          <button
            className={styles.ctaPrimary}
            onClick={() => navigate('/bazaar-blends')}
          >
            Explore Bazaar Blends →
          </button>
        </div>

      </div>
    </section>
  );
}
