import { useState, useEffect, useRef } from 'react';

/**
 * Returns [ref, isRevealed].
 * Attach ref to the container you want to animate in on scroll.
 * Fires once — elements already in the viewport on mount reveal immediately
 * (no transition flash for above-the-fold content).
 */
export function useScrollReveal(options = {}) {
  const ref                   = useRef(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Already in view on mount — reveal without animation
    if (el.getBoundingClientRect().top < window.innerHeight) {
      setRevealed(true);
      return;
    }

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          obs.disconnect();
        }
      },
      {
        rootMargin: options.rootMargin ?? '0px 0px -6% 0px',
        threshold:  options.threshold  ?? 0,
      }
    );
    obs.observe(el);
    return () => obs.disconnect();
  // Options are read once on mount. ref.current is populated synchronously
  // before useEffect runs, so the empty dep array is intentional.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [ref, revealed];
}
