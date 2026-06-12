import styles from './About.module.css';
import { useScrollReveal } from '../hooks/useScrollReveal';

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
  const [containerRef, revealed] = useScrollReveal();
  return (
    <section id="about" className={styles.section} data-accent="cerulean">
      <div className={styles.container} ref={containerRef} data-reveal={revealed ? 'true' : 'false'}>

        {/* ── Section header ── */}
        <header className={styles.sectionTop}>
          <span className={styles.eyebrow}>ABOUT</span>
          <h2 className={styles.heading}>The Through-Line</h2>
        </header>

        {/* ── Bio block — photo + text ── */}
        <div className={styles.bioBlock}>

          {/* Left: photo + location */}
          <div className={styles.photoWrap}>
            <div className={styles.photoPlaceholder} role="img" aria-label="Jaxon Travis">
              <span className={styles.initials} aria-hidden="true">JT</span>
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
          <div className={styles.textSide}>
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

            {/* Role chips */}
            <div className={styles.rolesBlock}>
              <span className={styles.rolesLabel}>Open to</span>
              <ul className={styles.roleChips} aria-label="Target roles">
                {ROLES.map(role => (
                  <li key={role} className={styles.roleChip}>{role}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* ── Skills ── */}
        <div className={styles.skillsBlock}>
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
        </div>

        {/* ── Contact row ── */}
        <div className={styles.contactBlock}>
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
        </div>

      </div>
    </section>
  );
}
