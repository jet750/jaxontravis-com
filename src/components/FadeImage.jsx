import { useCallback, useState } from 'react';
import { motion } from 'framer-motion';

// Lazy-load fade-in image: opacity animates from 0 to 1 once the image loads.
// No blur placeholder (that would require generating low-res versions) — just
// a clean fade. Passes through every prop the original <img> had so nothing
// (className, style, onError, alt) is dropped.
export default function FadeImage({ src, alt, className, style, onError }) {
  const [loaded, setLoaded] = useState(false);

  // A browser-cached image can finish loading before React attaches the onLoad
  // handler, so the event never fires and the image stays stuck at opacity 0.
  // This callback ref checks `complete` the moment the node mounts and reveals
  // already-loaded images immediately.
  const ref = useCallback((node) => {
    if (node && node.complete && node.naturalWidth > 0) {
      setLoaded(true);
    }
  }, []);

  return (
    <motion.img
      ref={ref}
      src={src}
      alt={alt}
      className={className}
      style={style}
      onLoad={() => setLoaded(true)}
      onError={onError}
      animate={{ opacity: loaded ? 1 : 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      initial={{ opacity: 0 }}
    />
  );
}
