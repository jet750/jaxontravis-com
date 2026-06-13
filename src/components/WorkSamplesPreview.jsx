import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { fadeInUp, DURATION, EASE } from '../lib/motion';
import styles from './WorkSamplesPreview.module.css';

export default function WorkSamplesPreview() {
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
      data-accent="gold"
      style={{ opacity: sectionOpacity, scale: sectionScale }}
    >
      <div className={styles.container}>

        <div className={styles.banner}>
          <div className={styles.textSide}>
            <span className={styles.eyebrow}>Professional</span>

            <motion.h2
              className={styles.heading}
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
            >
              <svg
                className={styles.lockIcon}
                width="20" height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Work Samples
            </motion.h2>

            <motion.p
              className={styles.body}
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: DURATION, ease: EASE, delay: 0.1 }}
            >
              Selected deliverables from past roles — CRM architecture, outbound
              infrastructure, and operations systems. Password-protected; if we're
              in conversation, ask and I'll share access.
            </motion.p>
          </div>

          <motion.button
            className={styles.ctaPrimary}
            onClick={() => navigate('/work-samples')}
            whileHover={{ scale: 1.02, y: -2, transition: { duration: 0.2 } }}
          >
            View Work Samples →
          </motion.button>
        </div>

      </div>
    </motion.section>
  );
}
