import styles from './PhotoMedia.module.css';

// Renders a single photography image — or, when the photo has no real source yet
// (the default state until images are added to src/assets/photography/), a
// violet-tinted placeholder tile. Mirrors the Bazaar Blends "Coming Soon" frame,
// retinted to the photography violet accent. Fills its parent; positioning,
// hover-lift, and mouse parallax are owned by the wrapping component.
export default function PhotoMedia({ photo, className = '', loading = 'lazy' }) {
  if (photo.src) {
    return (
      <img
        src={photo.src}
        alt={photo.alt}
        className={`${styles.image} ${className}`}
        loading={loading}
        draggable="false"
      />
    );
  }

  return (
    <div
      className={`${styles.placeholder} ${className}`}
      role="img"
      aria-label={photo.alt}
    >
      <div className={styles.placeholderInner} aria-hidden="true">
        <svg className={styles.placeholderIcon} viewBox="0 0 32 32" fill="none">
          <rect x="4" y="7" width="24" height="18" rx="2" stroke="currentColor" strokeWidth="1.25" />
          <circle cx="11.5" cy="13.5" r="2.5" stroke="currentColor" strokeWidth="1.25" />
          <path d="M5 22l6.5-6 4.5 4 4-3.5L27 22" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className={styles.placeholderLabel}>{photo.title}</span>
      </div>
    </div>
  );
}
