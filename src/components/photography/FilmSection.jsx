import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer } from '../../lib/motion';
import { films } from '../../data/photographyConfig';
import styles from './FilmSection.module.css';

// Aerial & short-film embeds. Basic YouTube iframe embeds need only the video ID
// — no API key, no API call. Play-event tracking is intentionally NOT wired here:
// YouTube iframes don't expose play events without the IFrame Player API. A future
// pass using VITE_YOUTUBE_API_KEY can add trackEvent on play.

const VIEW = { once: true, amount: 0.3 };

export default function FilmSection() {
  return (
    <motion.div
      className={styles.section}
      variants={fadeInUp}
      initial="hidden"
      whileInView="visible"
      viewport={VIEW}
    >
      <header className={styles.header}>
        <span className={styles.eyebrow}>Film</span>
        <h2 className={styles.heading}>Aerial &amp; Short Film</h2>
      </header>

      <motion.div
        className={styles.grid}
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={VIEW}
      >
        {films.map((film) => (
          <motion.div key={film.id} className={styles.card} variants={fadeInUp}>
            <div className={styles.frame}>
              <iframe
                className={styles.iframe}
                src={`https://www.youtube.com/embed/${film.id}?rel=0&modestbranding=1&color=white`}
                title={film.title}
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className={styles.caption}>
              <p className={styles.title}>{film.title}</p>
              <p className={styles.location}>{film.location}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
