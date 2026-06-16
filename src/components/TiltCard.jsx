import { useRef, useState } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useMotionTemplate,
} from 'framer-motion';
import FadeImage from './FadeImage';
import styles from './TiltCard.module.css';

/**
 * Reusable 3D tilt card with optional holographic glare.
 *
 * Tilt is driven entirely by Framer Motion motion values (no React state),
 * so pointer movement never triggers a re-render.
 */
export default function TiltCard({
  imageSrc,
  fallbackContent,
  title,
  tier,
  archetype,
  mechanic,
  flavor,
  accentClass,
  maxTilt = 15,
  glare = true,
  imageOnly = false,
}) {
  const ref = useRef(null);
  const [imgFailed, setImgFailed] = useState(false);

  // Normalized pointer position relative to card center: -0.5 (edge) .. 0.5 (edge).
  const px = useMotionValue(0);
  const py = useMotionValue(0);

  const spring = { stiffness: 200, damping: 20 };
  // Vertical pointer → rotateX (inverted so the top edge tilts away from the viewer).
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [maxTilt, -maxTilt]), spring);
  // Horizontal pointer → rotateY.
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-maxTilt, maxTilt]), spring);

  // Glare "light source" position follows the tilt: rotateY drives X, rotateX drives Y.
  const glareX = useTransform(rotateY, [-maxTilt, maxTilt], [15, 85]);
  const glareY = useTransform(rotateX, [-maxTilt, maxTilt], [85, 15]);
  const glareBg = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.05) 35%, rgba(255,255,255,0) 65%)`;

  // Rainbow shimmer whose angle shifts as the card tilts.
  const shimmerAngle = useTransform(rotateY, [-maxTilt, maxTilt], [55, 125]);
  const shimmerBg = useMotionTemplate`linear-gradient(${shimmerAngle}deg, hsla(0,90%,70%,0.06) 0%, hsla(55,95%,70%,0.05) 25%, hsla(150,85%,70%,0.06) 50%, hsla(220,90%,70%,0.05) 75%, hsla(300,90%,70%,0.06) 100%)`;

  function setFromPoint(clientX, clientY) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    px.set((clientX - rect.left) / rect.width - 0.5);
    py.set((clientY - rect.top) / rect.height - 0.5);
  }

  function handleMouseMove(e) {
    setFromPoint(e.clientX, e.clientY);
  }

  function handleTouchMove(e) {
    const touch = e.touches[0];
    if (touch) setFromPoint(touch.clientX, touch.clientY);
  }

  function reset() {
    px.set(0);
    py.set(0);
  }

  const showImage = imageSrc && !imgFailed;

  return (
    <div className={`${styles.tiltWrapper} ${imageOnly ? styles.tiltWrapperFit : ''}`}>
      <motion.article
        ref={ref}
        className={`${styles.card} ${accentClass || ''}`}
        style={{ rotateX, rotateY }}
        onMouseMove={handleMouseMove}
        onMouseLeave={reset}
        onTouchMove={handleTouchMove}
        onTouchEnd={reset}
        onTouchCancel={reset}
      >
        <div className={`${styles.artArea} ${imageOnly ? styles.artAreaFull : ''}`}>
          {showImage ? (
            <FadeImage
              className={styles.artImg}
              src={imageSrc}
              alt={title}
              onError={() => setImgFailed(true)}
            />
          ) : (
            <div className={styles.artFallback}>{fallbackContent}</div>
          )}

          {glare && (
            <>
              <motion.div
                className={styles.glareLayer}
                style={{ background: glareBg }}
                aria-hidden="true"
              />
              <motion.div
                className={styles.glareLayer}
                style={{ background: shimmerBg, mixBlendMode: 'color-dodge' }}
                aria-hidden="true"
              />
            </>
          )}

          {!imageOnly && (
            <div className={styles.artMeta}>
              {tier && <span className={styles.tierBadge}>{tier}</span>}
              {archetype && <span className={styles.archetypeTag}>{archetype}</span>}
            </div>
          )}
        </div>

        {!imageOnly && (
          <div className={styles.cardBody}>
            <h3 className={styles.cardName}>{title}</h3>
            <p className={styles.cardMechanic}>{mechanic}</p>
            <p className={styles.cardFlavor}>&ldquo;{flavor}&rdquo;</p>
          </div>
        )}
      </motion.article>
    </div>
  );
}
