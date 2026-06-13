import { useState } from 'react';
import { motion } from 'framer-motion';
import styles from './WorkSamples.module.css';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { trackEvent } from '../lib/analytics';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ACCESS_KEY = 'workSamplesAccess';

const SAMPLES = [
  {
    id:      'crm-humnz',
    title:   'CRM Architecture — HŪMNZ',
    tag:     'Revenue Operations',
    summary: '[Add deliverable description]',
  },
  {
    id:      'outbound-nacb',
    title:   'Outbound Infrastructure — NACB',
    tag:     'Sales Operations',
    summary: '[Add deliverable description]',
  },
  {
    id:      'salesforce-springbig',
    title:   'Salesforce Build — Springbig',
    tag:     'CRM Implementation',
    summary: '[Add deliverable description]',
  },
];

function hasSessionAccess() {
  try {
    return sessionStorage.getItem(ACCESS_KEY) === 'granted';
  } catch {
    return false; // sessionStorage unavailable (private mode edge cases)
  }
}

export default function WorkSamples() {
  // ── Gate form ──────────────────────────────────────
  const [name,            setName]            = useState('');
  const [email,           setEmail]           = useState('');
  const [password,        setPassword]        = useState('');
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [verifying,       setVerifying]       = useState(false);
  const [serverError,     setServerError]     = useState('');
  const [unlocked,        setUnlocked]        = useState(hasSessionAccess);

  const [containerRef, revealed] = useScrollReveal();

  async function handleGateSubmit(e) {
    e.preventDefault();
    setSubmitAttempted(true);
    setServerError('');
    if (!name.trim() || !EMAIL_RE.test(email) || !password) return;

    setVerifying(true);
    try {
      const res = await fetch('/api/verify-work-samples', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:     name.trim(),
          email:    email.trim(),
          password,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.ok) {
        try { sessionStorage.setItem(ACCESS_KEY, 'granted'); } catch { /* non-fatal */ }
        setUnlocked(true);
        trackEvent('work_samples_gate', { outcome: 'granted' });
      } else {
        setServerError(data.error || 'Something went wrong — please try again.');
        trackEvent('work_samples_gate', { outcome: 'denied' });
      }
    } catch {
      setServerError('Could not reach the server — please try again.');
      trackEvent('work_samples_gate', { outcome: 'error' });
    }
    setVerifying(false);
  }

  // ── Validation flags ───────────────────────────────
  const nameErr     = submitAttempted && !name.trim();
  const emailErr    = submitAttempted && !EMAIL_RE.test(email);
  const passwordErr = submitAttempted && !password;

  // ═══════════════════════════════════════════════════
  // UNLOCKED VIEW
  // ═══════════════════════════════════════════════════
  if (unlocked) {
    return (
      <section id="work-samples" className={styles.section} data-accent="gold">
        <div className={styles.container} ref={containerRef} data-reveal={revealed ? 'true' : 'false'}>
          <header className={styles.sectionTop}>
            <span className={styles.eyebrow}>PROFESSIONAL</span>
            <h1 className={styles.heading}>Work Samples</h1>
            <p className={styles.subhead}>
              Selected deliverables from past roles. Shared in confidence —
              please don't redistribute.
            </p>
          </header>

          <div className={styles.cardGrid} role="list" aria-label="Work samples">
            {SAMPLES.map(sample => (
              <article key={sample.id} className={styles.card} role="listitem">
                <span className={styles.cardTag}>{sample.tag}</span>
                <h2 className={styles.cardTitle}>{sample.title}</h2>
                <div className={styles.cardDivider} aria-hidden="true" />
                <p className={styles.cardSummary}>{sample.summary}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ═══════════════════════════════════════════════════
  // GATE VIEW
  // ═══════════════════════════════════════════════════
  return (
    <section id="work-samples" className={styles.section} data-accent="gold">
      <div className={styles.container} ref={containerRef} data-reveal={revealed ? 'true' : 'false'}>
        <header className={styles.sectionTop}>
          <span className={styles.eyebrow}>PROFESSIONAL</span>
          <h1 className={styles.heading}>Work Samples</h1>
          <p className={styles.subhead}>
            This page is password-protected. If you've been given access,
            enter your details below.
          </p>
        </header>

        <div className={styles.formSide}>
          <form onSubmit={handleGateSubmit} noValidate>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="ws-name">Your Name</label>
              <input
                id="ws-name"
                type="text"
                className={`${styles.input} ${nameErr ? styles.inputErr : ''}`}
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Sarah Chen"
                autoComplete="name"
                aria-describedby={nameErr ? 'ws-err-name' : undefined}
              />
              {nameErr && (
                <p id="ws-err-name" className={styles.errMsg} role="alert">Required</p>
              )}
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="ws-email">Email</label>
              <input
                id="ws-email"
                type="email"
                className={`${styles.input} ${emailErr ? styles.inputErr : ''}`}
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="sarah@acmecorp.com"
                autoComplete="email"
                aria-describedby={emailErr ? 'ws-err-email' : undefined}
              />
              {emailErr && (
                <p id="ws-err-email" className={styles.errMsg} role="alert">
                  Enter a valid email
                </p>
              )}
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="ws-password">Password</label>
              <input
                id="ws-password"
                type="password"
                className={`${styles.input} ${passwordErr ? styles.inputErr : ''}`}
                value={password}
                onChange={e => { setPassword(e.target.value); setServerError(''); }}
                placeholder="••••••••"
                autoComplete="current-password"
                aria-describedby={passwordErr ? 'ws-err-password' : undefined}
              />
              {passwordErr && (
                <p id="ws-err-password" className={styles.errMsg} role="alert">Required</p>
              )}
            </div>

            {serverError && (
              <p className={styles.serverErr} role="alert">{serverError}</p>
            )}

            <motion.button
              type="submit"
              className={styles.ctaBtn}
              disabled={verifying}
              whileHover={{ scale: 1.02, transition: { duration: 0.15 } }}
              whileTap={{ scale: 0.98, transition: { duration: 0.15 } }}
            >
              {verifying ? 'Verifying…' : 'Unlock Work Samples →'}
            </motion.button>
          </form>
        </div>
      </div>
    </section>
  );
}
