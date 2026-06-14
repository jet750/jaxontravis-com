import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { fadeInUp, DURATION, EASE } from '../lib/motion';
import { useParallax } from '../hooks/useParallax';
import headshotSrc from '../assets/about/headshot.jpg';
import styles from './AboutPreview.module.css';

function Headshot() {
  const { ref: frameRef, style: parallaxStyle } = useParallax();

  return (
    <div className={styles.photoWrap}>
      <div className={styles.photoFrame} ref={frameRef}>
        <motion.img
          src={headshotSrc}
          alt="Jaxon Travis"
          className={styles.headshot}
          style={parallaxStyle}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling.style.display = 'flex';
          }}
        />
        <div className={styles.initials} style={{ display: 'none' }} aria-hidden="true">
          JT
        </div>
      </div>
    </div>
  );
}

export default function AboutPreview() {
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
      data-accent="cerulean"
      style={{ opacity: sectionOpacity, scale: sectionScale }}
    >
      <div className={styles.container}>

        <div className={styles.layout}>

          <Headshot />

          <div className={styles.textSide}>
            <span className={styles.eyebrow}>About</span>

            <motion.h2
              className={styles.name}
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
            >
              Jaxon Travis
            </motion.h2>

            <p className={styles.title}>Senior Director of Strategic Growth</p>

            <motion.p
              className={styles.descriptor}
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: DURATION, ease: EASE, delay: 0.1 }}
            >
              Process architect and systems thinker. I specialize in building operational
              infrastructure from scratch — CRMs, GTM systems, revenue operations — and
              turning blank slates into structured, repeatable, measurable outcomes. Every
              role has followed the same pattern: arrive where the infrastructure doesn't
              fully exist, and build it.
            </motion.p>

            <motion.button
              className={styles.ctaPrimary}
              onClick={() => navigate('/about')}
              whileHover={{ scale: 1.02, y: -2, transition: { duration: 0.2 } }}
            >
              The Through-Line →
            </motion.button>
          </div>

        </div>

      </div>
    </motion.section>
  );
}
