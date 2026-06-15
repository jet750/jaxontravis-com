import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeInUp, DURATION, EASE } from '../lib/motion';
import { useParallax } from '../hooks/useParallax';
import { usePageMeta } from '../hooks/usePageMeta';
import { trackEvent } from '../lib/analytics';
import { photos, PRINT_QUOTE_MAILTO } from '../data/photographyConfig';
import PhotoMedia from '../components/photography/PhotoMedia';
import PhotoGrid from '../components/photography/PhotoGrid';
import Lightbox from '../components/photography/Lightbox';
import PrintQuotePrompt from '../components/photography/PrintQuotePrompt';
import styles from './Photography.module.css';

const PROMPT_FLAG = 'photography_prompt_shown';
const TIME_ON_PAGE_MS = 60000; // 60 continuous seconds on /photography

const THEMES = ['Landscapes', 'Cityscapes', 'Abstract studies', 'Travel'];
const VIEW = { once: true, amount: 0.3 };

export default function Photography() {
  usePageMeta(
    'JET Photography — Landscape, Abstract & Travel | Jaxon Travis',
    'JET Photography — a personal visual archive of landscape, cityscape, abstract, and travel photography by Jaxon Travis.',
    {
      url: 'https://jaxontravis.com/photography',
      ogTitle: 'JET Photography | Jaxon Travis',
      ogDescription: 'Landscape, abstract, and travel photography. Prints available by request.',
      // TODO: add public/og-photography.jpg — 1200x630px branded card, then uncomment:
      // image: 'https://jaxontravis.com/og-photography.jpg',
    },
  );

  // Sticky-photo parallax, mirroring the About page (ref on the scrolling block,
  // transform applied to the media inside the overflow-hidden frame).
  const { ref: heroRef, style: heroParallax } = useParallax({ scale: 1.25, range: 10 });

  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [promptOpen, setPromptOpen] = useState(false);

  const hero = photos[0]; // featured image — display only, not in the lightbox cycle

  // Show the print prompt at most once per session. Whichever trigger fires
  // first sets the shared sessionStorage flag so the other can't retrigger.
  const showPrintPrompt = useCallback((trigger) => {
    try {
      if (sessionStorage.getItem(PROMPT_FLAG) === 'true') return;
      sessionStorage.setItem(PROMPT_FLAG, 'true');
    } catch {
      /* sessionStorage blocked — fall through and show once in-memory */
    }
    setPromptOpen(true);
    trackEvent('photography_print_prompt_shown', { trigger });
  }, []);

  // Trigger 2 — 60 continuous seconds on the page.
  useEffect(() => {
    const timer = setTimeout(() => showPrintPrompt('time_on_page'), TIME_ON_PAGE_MS);
    return () => clearTimeout(timer);
  }, [showPrintPrompt]);

  const openLightbox = useCallback((index) => setLightboxIndex(index), []);

  // Trigger 1 — full lightbox exit (X / Escape / backdrop), not between-image nav.
  const closeLightbox = useCallback(() => {
    setLightboxIndex(null);
    showPrintPrompt('lightbox_exit');
  }, [showPrintPrompt]);

  return (
    <section className={styles.section} data-accent="violet">
      <div className={styles.container}>

        {/* ── Section header ── */}
        <motion.header
          className={styles.header}
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={VIEW}
        >
          <span className={styles.eyebrow}>Photography</span>
          <h1 className={styles.heading}>JET Photography</h1>
        </motion.header>

        {/* ── Hero split: sticky featured photo + scrollable statement ── */}
        <div className={styles.heroBlock} ref={heroRef}>

          {/* Left: featured photo (sticky) */}
          <div className={styles.heroPhotoWrap}>
            <div className={styles.heroFrame}>
              <motion.div className={styles.heroMedia} style={heroParallax}>
                {hero.src ? (
                  <img
                    src={hero.src}
                    alt={hero.alt}
                    className={styles.heroImg}
                    draggable="false"
                  />
                ) : (
                  <PhotoMedia photo={hero} loading="eager" />
                )}
              </motion.div>
            </div>
          </div>

          {/* Right: scrollable artist statement */}
          <motion.div
            className={styles.statement}
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={VIEW}
            transition={{ duration: DURATION, ease: EASE, delay: 0.1 }}
          >
            <span className={styles.statementEyebrow}>Artist Statement</span>
            <p className={styles.statementPara}>
              JET Photography is Jaxon Travis&apos;s personal visual archive — landscapes,
              cityscapes, abstract studies, and travel photography captured across the
              American West, urban environments, and beyond. [Artist statement placeholder —
              to be updated.]
            </p>

            <div className={styles.themesBlock}>
              <span className={styles.themesLabel}>What&apos;s inside</span>
              <ul className={styles.themes} aria-label="Photography themes">
                {THEMES.map((theme) => (
                  <li key={theme} className={styles.themeChip}>{theme}</li>
                ))}
              </ul>
            </div>

            {/* Persistent print-quote CTA (page button) */}
            <motion.a
              href={PRINT_QUOTE_MAILTO}
              className={styles.printBtn}
              onClick={() => trackEvent('photography_print_cta_click', { source: 'page_button' })}
              whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
            >
              Request Print Quote
            </motion.a>
          </motion.div>
        </div>

        {/* ── Grid ── */}
        <motion.div
          className={styles.gridHeader}
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={VIEW}
        >
          <span className={styles.gridEyebrow}>The Collection</span>
          <p className={styles.gridHint}>Tap any image to view full size.</p>
        </motion.div>

        <PhotoGrid photos={photos} onOpen={openLightbox} />

      </div>

      {/* ── Lightbox (grid images only — never the hero) ── */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <Lightbox
            key="lightbox"
            photos={photos}
            startIndex={lightboxIndex}
            onClose={closeLightbox}
          />
        )}
      </AnimatePresence>

      {/* ── Print-quote popup ── */}
      <AnimatePresence>
        {promptOpen && (
          <PrintQuotePrompt
            key="print-prompt"
            mailtoHref={PRINT_QUOTE_MAILTO}
            onDismiss={() => setPromptOpen(false)}
            onCtaClick={() => trackEvent('photography_print_cta_click', { source: 'popup' })}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
