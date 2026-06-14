import { useRef } from 'react';
import { useScroll, useTransform, useReducedMotion } from 'framer-motion';

/**
 * Scroll-linked vertical parallax for an image inside a fixed, overflow-hidden frame.
 *
 * Returns a `ref` to attach to the frame and a `style` to spread onto a `motion`
 * element inside it. The image is scaled up to create vertical overflow, then
 * translated within that overflow as the frame travels through the viewport —
 * so it drifts at a different rate than the surrounding content (the parallax).
 *
 * Transform-only (GPU-composited). Returns `undefined` style when the user
 * prefers reduced motion, so the image simply fills the frame statically.
 *
 * @param {object}  [opts]
 * @param {number}  [opts.scale=1.2]  Zoom factor; the overflow per edge is (scale-1)/2.
 * @param {number}  [opts.range=8]    Travel distance each way, in % of frame height.
 *                                    Keep range < (scale-1)/2 * 100 to avoid gaps.
 */
export function useParallax({ scale = 1.2, range = 8 } = {}) {
  const ref = useRef(null);
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], [`${-range}%`, `${range}%`]);

  return {
    ref,
    style: prefersReducedMotion ? undefined : { scale, y },
  };
}
