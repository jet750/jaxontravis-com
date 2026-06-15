import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { fadeInUp, DURATION, EASE } from '../lib/motion';
import { photos } from '../data/photographyConfig';
import PhotoMedia from './photography/PhotoMedia';
import styles from './PhotographyPreview.module.css';

// First three images from the dynamic image system (real photos or placeholders).
const PREVIEW = photos.slice(0, 3);

function PreviewTile({ photo, index }) {
  return (
    <motion.div
      className={styles.tile}
      variants={fadeInUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: DURATION, ease: EASE, delay: index * 0.08 }}
      whileHover={{ scale: 1.02, y: -2, transition: { duration: 0.2 } }}
    >
      <div className={styles.frame}>
        <PhotoMedia photo={photo} />
      </div>
    </motion.div>
  );
}

export default function PhotographyPreview() {
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
      data-accent="violet"
      style={{ opacity: sectionOpacity, scale: sectionScale }}
    >
      <div className={styles.container}>

        <header className={styles.header}>
          <span className={styles.eyebrow}>Photography</span>
          <motion.h2
            className={styles.heading}
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            JET Photography
          </motion.h2>
          <motion.p
            className={styles.subhead}
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: DURATION, ease: EASE, delay: 0.1 }}
          >
            A personal visual archive — landscapes, cityscapes, abstract studies, and travel.
            [Descriptor placeholder — to be updated.]
          </motion.p>
        </header>

        <div
          className={styles.tileGrid}
          role="list"
          aria-label="Photography preview"
        >
          {PREVIEW.map((photo, index) => (
            <div key={photo.id} role="listitem">
              <PreviewTile photo={photo} index={index} />
            </div>
          ))}
        </div>

        <div className={styles.ctas}>
          <motion.button
            className={styles.ctaPrimary}
            onClick={() => navigate('/photography')}
            whileHover={{ scale: 1.02, y: -2, transition: { duration: 0.2 } }}
          >
            Explore Photography →
          </motion.button>
        </div>

      </div>
    </motion.section>
  );
}
