import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { scaleIn } from '../../lib/motion';
import styles from './PrintQuotePrompt.module.css';

// Print-quote popup. Mounted/unmounted by the parent inside <AnimatePresence>;
// the session-flag gating lives in the parent so both triggers (lightbox exit
// and 60s-on-page) share one guard. "Maybe later" and backdrop/Escape dismiss;
// the CTA is a real mailto anchor that also reports the click.
export default function PrintQuotePrompt({ onDismiss, mailtoHref, onCtaClick }) {
  // Escape dismisses.
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onDismiss(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onDismiss]);

  return (
    <motion.div
      className={styles.overlay}
      onClick={onDismiss}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="print-prompt-title"
      aria-describedby="print-prompt-body"
    >
      <motion.div
        className={styles.card}
        data-accent="violet"
        onClick={(e) => e.stopPropagation()}
        variants={scaleIn}
        initial="hidden"
        animate="visible"
        exit="hidden"
      >
        <h2 id="print-prompt-title" className={styles.title}>Love what you see?</h2>
        <p id="print-prompt-body" className={styles.body}>
          Prints are available for order. Reach out for sizing, framing options, and pricing.
        </p>

        <div className={styles.actions}>
          <motion.a
            href={mailtoHref}
            className={styles.cta}
            onClick={onCtaClick}
            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
          >
            Request a Print Quote
          </motion.a>
          <button type="button" className={styles.dismiss} onClick={onDismiss}>
            Maybe later
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
