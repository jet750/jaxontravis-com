import { motion } from 'framer-motion';
import { fadeInUp, DURATION, EASE } from '../lib/motion';
import { useParallax } from '../hooks/useParallax';
import { trackEvent } from '../lib/analytics';
import headshotSrc from '../assets/about/headshot.jpg';
import resumePdf from '../assets/about/resume.pdf';
import styles from './About.module.css';

// ── Data ──────────────────────────────────────────────────────────────────────

const ROLES = [
  'Customer Success',
  'Revenue Operations',
  'Business Operations',
  'Chief of Staff',
  'Head of Operations',
];

const SKILLS = [
  {
    category: 'CRM & Revenue Systems',
    items: ['Salesforce', 'Zoho CRM', 'Membrain', 'Pipeline Design', 'Outbound Infrastructure'],
  },
  {
    category: 'AI & Automation',
    items: ['Claude API', 'ChatGPT / GPT-4', 'AI Workflow Design', 'Prompt Engineering', 'No-Code (Softr)'],
  },
  {
    category: 'Operations',
    items: ['SOP Design', 'KPI Frameworks', 'Process Documentation', 'GTM Infrastructure', 'B2B SaaS Post-Sale'],
  },
];

const CONTACT = [
  {
    type:  'email',
    label: 'jaxontravis7@gmail.com',
    href:  'mailto:jaxontravis7@gmail.com',
  },
  {
    type:  'linkedin',
    label: 'linkedin.com/in/jaxontravis',
    href:  'https://linkedin.com/in/jaxontravis',
  },
  {
    type:  'calendar',
    label: 'Book a call',
    href:  '#',
  },
];

// ── Shared whileInView props (reused across all blocks) ───────────────────────

const VIEW = { once: true, amount: 0.3 };

// ── SVG icons ─────────────────────────────────────────────────────────────────

function IconEmail() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
      stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <rect x="1.5" y="3.5" width="13" height="9" rx="1.5"/>
      <path d="M1.5 5.5L8 9.5l6.5-4"/>
    </svg>
  );
}

function IconLinkedIn() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <rect x="1.5" y="5.5" width="2.75" height="9" rx="0.4"/>
      <circle cx="2.875" cy="2.875" r="1.375"/>
      <path d="M7 5.5h2.5v1.35c.55-.95 1.65-1.6 2.85-1.45 2 .2 2.65 1.55 2.65 3.7V14.5h-2.75V9.75c0-1-.35-1.6-1.15-1.6-.8 0-1.35.6-1.35 1.6V14.5H7V5.5z"/>
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
      stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true">
      <rect x="1.5" y="2.5" width="13" height="12" rx="1.5"/>
      <path d="M1.5 6.5h13M5.5 1v3M10.5 1v3"/>
    </svg>
  );
}

function IconPin() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
      stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M8 1.5C5.65 1.5 3.75 3.45 3.75 5.85c0 4.05 4.25 8.65 4.25 8.65s4.25-4.6 4.25-8.65C12.25 3.45 10.35 1.5 8 1.5z"/>
      <circle cx="8" cy="5.85" r="1.5"/>
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function About() {
  const { ref: photoRef, style: photoParallax } = useParallax({ scale: 1.25, range: 10 });

  return (
    <section id="about" className={styles.section} data-accent="cerulean">
      <div className={styles.container}>

        {/* ── Block 1: Section header — delay 0 ── */}
        <motion.header
          className={styles.sectionTop}
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={VIEW}
        >
          <span className={styles.eyebrow}>ABOUT</span>
          <h2 className={styles.heading}>The Through-Line</h2>
        </motion.header>

        {/* ── Block 2: Bio — photo loads immediately (parallax only); text fades in ── */}
        {/* bioBlock is the non-sticky scroll target so the sticky photo can parallax. */}
        <div className={styles.bioBlock} ref={photoRef}>
          {/* Left: photo + location */}
          <div className={styles.photoWrap}>
            <div className={styles.photoPlaceholder}>
              <motion.img
                src={headshotSrc}
                alt="Jaxon Travis"
                className={styles.headshot}
                style={photoParallax}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling.style.display = 'flex';
                }}
              />
              <span className={styles.initials} style={{ display: 'none' }} aria-hidden="true">JT</span>
            </div>

            <div className={styles.locationBlock}>
              <span className={styles.locationIcon}><IconPin /></span>
              <div>
                <p className={styles.locationCity}>Carlsbad, California</p>
                <p className={styles.locationNote}>Remote or hybrid preferred · Open to US-wide</p>
              </div>
            </div>
          </div>

          {/* Right: bio + role chips */}
          <motion.div
            className={styles.textSide}
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={VIEW}
            transition={{ duration: DURATION, ease: EASE, delay: 0.1 }}
          >
            <div className={styles.bio}>
              <p className={styles.bioPara}>
                Every role in Jaxon's career has followed the same underlying pattern: arriving
                somewhere where the operational infrastructure doesn't fully exist, and building
                it. Whether that's a blank CRM instance, a missing GTM process, an undefined
                sales motion, or a broken client success function — the pattern is consistent.
              </p>
              <p className={styles.bioPara}>
                <strong>Blank slate to structured, repeatable, measurable system.</strong> That
                is the through-line regardless of whether the title was CSM, RevOps, or
                Operations. Strongest in environments where the infrastructure doesn't fully
                exist yet — not a process inheritor, but a process architect.
              </p>
              <p className={styles.bioPara}>
                Currently Director of Operations at HŪMNZ in Carlsbad, CA — and open to the
                right next chapter.
              </p>
            </div>

            <div className={styles.rolesBlock}>
              <span className={styles.rolesLabel}>Open to</span>
              <ul className={styles.roleChips} aria-label="Target roles">
                {ROLES.map(role => (
                  <li key={role} className={styles.roleChip}>{role}</li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>

        {/* ── Block 3: Skills — delay 0.2s ── */}
        <motion.div
          className={styles.skillsBlock}
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={VIEW}
          transition={{ duration: DURATION, ease: EASE, delay: 0.2 }}
        >
          <span className={styles.skillsEyebrow}>SKILL INVENTORY</span>

          <div className={styles.skillsGrid}>
            {SKILLS.map(group => (
              <div key={group.category} className={styles.skillGroup}>
                <span className={styles.skillCategory}>{group.category}</span>
                <ul className={styles.skillTags} aria-label={group.category}>
                  {group.items.map(item => (
                    <li key={item} className={styles.skillTag}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Block 4: Contact — delay 0.3s ── */}
        <motion.div
          className={styles.contactBlock}
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={VIEW}
          transition={{ duration: DURATION, ease: EASE, delay: 0.3 }}
        >
          <ul className={styles.contactList} aria-label="Contact">
            {CONTACT.map(item => (
              <li key={item.type}>
                <a
                  href={item.href}
                  className={styles.contactItem}
                  target={item.type === 'email' ? undefined : '_blank'}
                  rel={item.type === 'email' ? undefined : 'noopener noreferrer'}
                >
                  <span className={styles.contactIcon}>
                    {item.type === 'email'    && <IconEmail />}
                    {item.type === 'linkedin' && <IconLinkedIn />}
                    {item.type === 'calendar' && <IconCalendar />}
                  </span>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* ── Block 5: Resume — delay 0.4s ── */}
        {/* Outer container animates; the <object> embed inside does NOT */}
        <motion.div
          className={styles.resumeBlock}
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={VIEW}
          transition={{ duration: DURATION, ease: EASE, delay: 0.4 }}
        >
          <span className={styles.resumeEyebrow}>RESUME</span>

          {/* Plain div — <object> is not wrapped in a motion element */}
          <div className={styles.resumeViewerWrap}>
            <object
              data={resumePdf}
              type="application/pdf"
              width="100%"
              height="950px"
            >
              <p className={styles.pdfFallback}>
                Your browser doesn't support embedded PDFs.{' '}
                <a href={resumePdf} target="_blank" rel="noopener noreferrer">
                  View the resume here
                </a>.
              </p>
            </object>
          </div>

          {/* Desktop: download button */}
          <motion.a
            href={resumePdf}
            download="Jaxon-Travis-Resume.pdf"
            className={`${styles.resumeBtn} ${styles.desktopDownload}`}
            onClick={() => trackEvent('resume_download')}
            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
          >
            Download Resume
          </motion.a>

          {/* Mobile: view + download buttons */}
          <div className={styles.mobileResumeActions}>
            <motion.a
              href={resumePdf}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.resumeBtn}
              whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
            >
              View Resume
            </motion.a>
            <motion.a
              href={resumePdf}
              download="Jaxon-Travis-Resume.pdf"
              className={`${styles.resumeBtn} ${styles.resumeBtnSecondary}`}
              onClick={() => trackEvent('resume_download')}
              whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
            >
              Download
            </motion.a>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
