export const EASE = [0.25, 0.1, 0.25, 1];
export const DURATION = 0.5;

export const fadeInUp = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: DURATION, ease: EASE } },
};

export const fadeIn = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: DURATION, ease: EASE } },
};

export const scaleIn = {
  hidden:  { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: { duration: DURATION, ease: EASE } },
};

export const staggerContainer = {
  visible: { transition: { staggerChildren: 0.08 } },
};
