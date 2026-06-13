import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import styles from './NotFoundPage.module.css';
import { usePageMeta } from '../hooks/usePageMeta';

const MotionLink = motion(Link);

export default function NotFoundPage() {
  usePageMeta('Page Not Found — Jaxon Travis', "This page doesn't exist.");

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <span className={styles.eyebrow}>Page Not Found</span>
        <h1 className={styles.heading}>404</h1>
        <p className={styles.body}>This page doesn't exist.</p>
        <MotionLink
          to="/"
          className={styles.cta}
          whileHover={{ scale: 1.02, transition: { duration: 0.15 } }}
          whileTap={{ scale: 0.98, transition: { duration: 0.15 } }}
        >
          Back to Home →
        </MotionLink>
      </div>
    </div>
  );
}
