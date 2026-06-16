import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { trackEvent } from '../lib/analytics';

// Inline styles only (same self-contained pattern as RecruiterNudge). No HTML
// <form> tag — div + onClick handlers per the gate-form convention. Mount/unmount
// and exit animation are owned by the <AnimatePresence> wrapper in the parent.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Translucent accent — accentColor arrives as a CSS var string e.g.
// 'var(--accent-ember)', so we blend it with color-mix at call sites.
const tint = (accentColor, pct) =>
  `color-mix(in srgb, ${accentColor} ${pct}%, transparent)`;

export default function NotifyModal({
  isOpen,
  onClose,
  source,
  accentColor,
  title,
  description,
}) {
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [status, setStatus]   = useState('idle'); // idle | loading | success
  const [emailErr, setEmailErr] = useState(false);
  const [errMsg, setErrMsg]   = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [nameFocused, setNameFocused]   = useState(false);

  // Fire once when the modal opens (before any submission).
  useEffect(() => {
    if (isOpen) trackEvent('notify_modal_opened', { source });
  }, [isOpen, source]);

  // Success → auto-close after 2.5s. Cleared on unmount so a manual close
  // doesn't double-fire onClose.
  useEffect(() => {
    if (status !== 'success') return undefined;
    const t = setTimeout(onClose, 2500);
    return () => clearTimeout(t);
  }, [status, onClose]);

  async function submit() {
    if (status === 'loading' || status === 'success') return;

    if (!EMAIL_RE.test(email.trim())) {
      setEmailErr(true);
      setErrMsg('Please enter a valid email address.');
      return;
    }

    setEmailErr(false);
    setErrMsg('');
    setStatus('loading');

    try {
      const res = await fetch('/api/log-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source,
          email: email.trim(),
          name: name.trim(),
          metadata: { page: window.location.pathname },
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      trackEvent('waitlist_submitted', { source, has_name: !!name.trim() });
      setStatus('success');
    } catch {
      setStatus('idle');
      setErrMsg('Something went wrong. Please try again.');
    }
  }

  const inputBase = {
    width: '100%',
    background: 'var(--color-ash)',
    border: '1px solid var(--color-ember-edge)',
    borderRadius: 'var(--radius-md)',
    padding: '10px 14px',
    minHeight: 44,
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: 14,
    color: 'var(--color-parchment)',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const focusStyle = {
    borderColor: accentColor,
    boxShadow: `0 0 0 3px ${tint(accentColor, 12)}`,
  };

  const eyebrowLabel = String(source).replace(/_/g, ' ').toUpperCase();

  return (
    <motion.div
      role="presentation"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 440,
          background: 'var(--color-obsidian)',
          border: `1px solid ${tint(accentColor, 25)}`,
          borderRadius: 'var(--radius-lg)',
          padding: 32,
          boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      >
        {/* Close button — 44×44 hit area anchored to the corner */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-parchment)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-dust)'; }}
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 44,
            height: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            padding: 0,
            margin: 0,
            fontSize: 20,
            lineHeight: 1,
            cursor: 'pointer',
            color: 'var(--color-dust)',
            transition: 'color 0.2s ease',
          }}
        >
          ×
        </button>

        {status === 'success' ? (
          // ── Success state ──────────────────────────────────────────────────
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div
              aria-hidden="true"
              style={{
                width: 56,
                height: 56,
                margin: '0 auto 16px',
                borderRadius: '50%',
                border: `2px solid ${accentColor}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: accentColor,
                fontSize: 26,
                lineHeight: 1,
              }}
            >
              ✓
            </div>
            <p
              style={{
                margin: 0,
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: 26,
                color: accentColor,
              }}
            >
              You&apos;re on the list.
            </p>
          </div>
        ) : (
          // ── Form state ─────────────────────────────────────────────────────
          <>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: accentColor,
                marginBottom: 12,
              }}
            >
              {eyebrowLabel}
            </div>

            <h2
              style={{
                margin: '0 0 8px',
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: 28,
                fontWeight: 400,
                lineHeight: 1.2,
                color: 'var(--color-parchment)',
              }}
            >
              {title}
            </h2>

            <p
              style={{
                margin: '0 0 24px',
                fontSize: 14,
                lineHeight: 1.6,
                color: 'var(--color-dust)',
              }}
            >
              {description}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onFocus={() => setNameFocused(true)}
                onBlur={() => setNameFocused(false)}
                placeholder="Your name (optional)"
                aria-label="Your name"
                disabled={status === 'loading'}
                style={{ ...inputBase, ...(nameFocused ? focusStyle : null) }}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (emailErr) setEmailErr(false); }}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
                placeholder="you@email.com"
                aria-label="Email address"
                aria-invalid={emailErr}
                disabled={status === 'loading'}
                style={{
                  ...inputBase,
                  ...(emailFocused ? focusStyle : null),
                  ...(emailErr
                    ? { borderColor: 'var(--accent-ember)', boxShadow: '0 0 0 3px rgba(201, 107, 66, 0.12)' }
                    : null),
                }}
              />

              <button
                type="button"
                onClick={submit}
                disabled={status === 'loading'}
                onMouseEnter={(e) => { if (status !== 'loading') e.currentTarget.style.background = tint(accentColor, 8); }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                style={{
                  width: '100%',
                  minHeight: 44,
                  padding: 12,
                  background: 'transparent',
                  border: `1px solid ${accentColor}`,
                  borderRadius: 'var(--radius-md)',
                  color: accentColor,
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  cursor: status === 'loading' ? 'default' : 'pointer',
                  opacity: status === 'loading' ? 0.6 : 1,
                  transition: 'background 0.2s ease',
                }}
              >
                {status === 'loading' ? 'Sending…' : 'Notify me →'}
              </button>

              {errMsg && (
                <p
                  role="alert"
                  style={{
                    margin: 0,
                    fontSize: 13,
                    color: 'var(--accent-ember)',
                  }}
                >
                  {errMsg}
                </p>
              )}
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
