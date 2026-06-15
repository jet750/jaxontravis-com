import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { trackEvent } from '../../lib/analytics';
import PhotoMedia from './PhotoMedia';
import styles from './Lightbox.module.css';

const SWIPE_THRESHOLD = 50; // px of horizontal travel to register a swipe

// Full-screen lightbox cycling through the grid images (NOT the hero image).
// Mounted/unmounted by the parent inside <AnimatePresence>; internal index seeds
// from `startIndex`. Navigation (arrows/keys/swipe) never closes — only the X
// button, Escape, or a backdrop tap fully exit, which fires the close analytics
// and bubbles to onClose (parent then runs the print-prompt gate).
export default function Lightbox({ photos, startIndex, onClose }) {
  const count = photos.length;
  const [index, setIndex] = useState(startIndex);

  // Unique images seen during this lightbox session (seed with the opener).
  const viewedRef = useRef(new Set([startIndex]));

  const goTo = useCallback((next) => {
    const wrapped = (next + count) % count;
    setIndex(wrapped);
    viewedRef.current.add(wrapped);
  }, [count]);

  const goPrev = useCallback(() => goTo(index - 1), [goTo, index]);
  const goNext = useCallback(() => goTo(index + 1), [goTo, index]);

  // Open event — once, for the image that triggered the lightbox.
  useEffect(() => {
    trackEvent('photography_lightbox_open', {
      image_title: photos[startIndex].title,
      image_index: startIndex,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Full exit: fire close analytics with the current image + unique view count,
  // then hand off to the parent. Only X / Escape / backdrop route through here.
  const handleClose = useCallback(() => {
    trackEvent('photography_lightbox_close', {
      image_title: photos[index].title,
      images_viewed: viewedRef.current.size,
    });
    onClose();
  }, [index, onClose, photos]);

  // Keyboard: ←/→ navigate, Esc closes.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowLeft')  { e.preventDefault(); goPrev(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); goNext(); }
      else if (e.key === 'Escape') { e.preventDefault(); handleClose(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goPrev, goNext, handleClose]);

  // Lock body scroll while the lightbox is open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Touch swipe (mobile): horizontal travel past the threshold navigates.
  const touchStartX = useRef(null);
  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > SWIPE_THRESHOLD) {
      if (dx < 0) goNext();
      else goPrev();
    }
    touchStartX.current = null;
  };

  const photo = photos[index];

  return (
    <motion.div
      className={styles.overlay}
      onClick={handleClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      role="dialog"
      aria-modal="true"
      aria-label={`${photo.title} — image ${index + 1} of ${count}`}
    >
      {/* Close (X) */}
      <button
        type="button"
        className={styles.close}
        onClick={(e) => { e.stopPropagation(); handleClose(); }}
        aria-label="Close lightbox"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>

      {/* Prev */}
      <button
        type="button"
        className={`${styles.arrow} ${styles.arrowPrev}`}
        onClick={(e) => { e.stopPropagation(); goPrev(); }}
        aria-label="Previous image"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 5l-7 7 7 7" />
        </svg>
      </button>

      {/* Stage — image + title bar. Stops propagation so taps/swipes here don't close. */}
      <motion.figure
        key={index}
        className={styles.stage}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {photo.src ? (
          <img src={photo.src} alt={photo.alt} className={styles.image} draggable="false" />
        ) : (
          <div className={styles.placeholderBox}>
            <PhotoMedia photo={photo} loading="eager" />
          </div>
        )}

        <figcaption className={styles.caption}>
          <span className={styles.captionTitle}>{photo.title}</span>
          <span className={styles.captionCount}>{index + 1} / {count}</span>
        </figcaption>
      </motion.figure>

      {/* Next */}
      <button
        type="button"
        className={`${styles.arrow} ${styles.arrowNext}`}
        onClick={(e) => { e.stopPropagation(); goNext(); }}
        aria-label="Next image"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </motion.div>
  );
}
