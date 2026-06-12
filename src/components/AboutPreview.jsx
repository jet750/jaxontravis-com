import { useNavigate } from 'react-router-dom';
import headshotSrc from '../assets/about/headshot.jpg';
import styles from './AboutPreview.module.css';

function Headshot() {
  return (
    <div className={styles.photoWrap}>
      <div className={styles.photoFrame}>
        <img
          src={headshotSrc}
          alt="Jaxon Travis"
          className={styles.headshot}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling.style.display = 'flex';
          }}
        />
        {/* Fallback initials — hidden when photo loads */}
        <div className={styles.initials} style={{ display: 'none' }} aria-hidden="true">
          JT
        </div>
      </div>
    </div>
  );
}

export default function AboutPreview() {
  const navigate = useNavigate();

  return (
    <section className={styles.section} data-accent="cerulean">
      <div className={styles.container}>

        <div className={styles.layout}>

          {/* ── Photo ── */}
          <Headshot />

          {/* ── Text ── */}
          <div className={styles.textSide}>
            <span className={styles.eyebrow}>About</span>
            <h2 className={styles.name}>Jaxon Travis</h2>
            <p className={styles.title}>Senior Director of Strategic Growth</p>

            <p className={styles.descriptor}>
              Process architect and systems thinker. I specialize in building operational
              infrastructure from scratch — CRMs, GTM systems, revenue operations — and
              turning blank slates into structured, repeatable, measurable outcomes. Every
              role has followed the same pattern: arrive where the infrastructure doesn't
              fully exist, and build it.
            </p>

            <button
              className={styles.ctaPrimary}
              onClick={() => navigate('/about')}
            >
              The Through-Line →
            </button>
          </div>

        </div>

      </div>
    </section>
  );
}
