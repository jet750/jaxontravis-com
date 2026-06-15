import {
  motion,
  useMotionValue,
  useSpring,
  useReducedMotion,
} from 'framer-motion';
import { fadeInUp, staggerContainer, EASE } from '../../lib/motion';
import PhotoMedia from './PhotoMedia';
import styles from './PhotoGrid.module.css';

// Max parallax offset per tile, in px (spec: ~8–12px).
const PARALLAX_MAX = 10;

function GridTile({ photo, index, onOpen }) {
  const prefersReduced = useReducedMotion();

  // Mouse-position parallax, scoped to this tile only. Raw values are driven by
  // pointer position; springs smooth them so the image eases toward the cursor.
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 150, damping: 18, mass: 0.4 });
  const springY = useSpring(y, { stiffness: 150, damping: 18, mass: 0.4 });

  const handleMove = (e) => {
    if (prefersReduced) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width - 0.5;  // -0.5 … 0.5
    const relY = (e.clientY - rect.top) / rect.height - 0.5;
    x.set(relX * PARALLAX_MAX * 2);
    y.set(relY * PARALLAX_MAX * 2);
  };

  const handleLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.button
      type="button"
      className={styles.tile}
      onClick={() => onOpen(index)}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      whileHover={prefersReduced ? undefined : { scale: 1.02, y: -4 }}
      transition={{ duration: 0.25, ease: EASE }}
      aria-label={`Open ${photo.title} in lightbox`}
    >
      <motion.div className={styles.mediaWrap} style={{ x: springX, y: springY }}>
        <PhotoMedia photo={photo} />
      </motion.div>
      <span className={styles.hoverRing} aria-hidden="true" />
    </motion.button>
  );
}

export default function PhotoGrid({ photos, onOpen }) {
  return (
    <motion.ul
      className={styles.grid}
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      aria-label="Photography grid"
    >
      {photos.map((photo, index) => (
        <motion.li key={photo.id} className={styles.cell} variants={fadeInUp}>
          <GridTile photo={photo} index={index} onOpen={onOpen} />
        </motion.li>
      ))}
    </motion.ul>
  );
}
