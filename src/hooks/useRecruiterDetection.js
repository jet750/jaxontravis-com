import { useState, useEffect } from 'react';
import { trackEvent } from '../lib/analytics';

// Storage keys used by the recruiter-nudge feature (single source of truth):
//   sessionStorage: jt_linkedin_referral, jt_session_count, jt_nudge_dismissed
//   localStorage:   jt_interview_started
// (jt_nudge_dismissed is read/written by App + AboutPreview, not here.)

const DWELL_THRESHOLD_MS = 45 * 1000; // 45s of continuous visibility

// Module-level guards: the hook is mounted in more than one place (App +
// AboutPreview), so these dedupe one-time side effects across every instance
// within a single page load. They reset only on a full page reload.
let nudgeTracked = false;
let sessionCounted = false;

function trackNudgeOnce(signal) {
  if (nudgeTracked) return;
  nudgeTracked = true;
  // trackEvent is already fail-silent; the guard is belt-and-suspenders.
  try { trackEvent('recruiter_nudge_triggered', { signal }); } catch { /* no-op */ }
}

function readSessionCount() {
  try {
    return parseInt(sessionStorage.getItem('jt_session_count') || '0', 10) || 0;
  } catch {
    return 0;
  }
}

// Bumps the per-session page-load counter exactly once per page load, no matter
// how many hook instances mount.
function bumpSessionCount() {
  if (sessionCounted) return;
  sessionCounted = true;
  try {
    sessionStorage.setItem('jt_session_count', String(readSessionCount() + 1));
  } catch { /* no-op */ }
}

// Pure reads only — safe to run during render (in a lazy state initializer).
// Returns the triggering signal string, or null. LinkedIn takes precedence.
function detectGlobalSignal() {
  try {
    const linkedinFlagged = sessionStorage.getItem('jt_linkedin_referral') === 'true';
    const referrer = (document.referrer || '').toLowerCase();
    const search   = (window.location.search || '').toLowerCase();
    if (
      linkedinFlagged ||
      referrer.includes('linkedin.com') ||
      search.includes('utm_source=linkedin')
    ) {
      return 'linkedin_referral';
    }

    const interviewStarted = localStorage.getItem('jt_interview_started') === 'true';
    // readSessionCount() is the number of page loads already recorded this
    // session; >= 1 means the current load is at least the second.
    if (!interviewStarted && readSessionCount() >= 1) {
      return 'returning_visitor';
    }
  } catch { /* no-op */ }
  return null;
}

/**
 * Detects recruiter signals and returns a single boolean: shouldNudge.
 * Never throws — all storage/observer access is wrapped in try/catch.
 *
 * @param {Object} [opts]
 * @param {React.RefObject} [opts.sectionRef] - element to watch for dwell.
 *        Omit to run only the global signals (LinkedIn referral, returning visitor).
 * @returns {boolean} shouldNudge
 */
export function useRecruiterDetection({ sectionRef } = {}) {
  // Signals 1 (LinkedIn) and 3 (returning visitor) are synchronous — resolve
  // them once via a lazy initializer rather than a setState-in-effect.
  const [globalSignal] = useState(detectGlobalSignal);
  const [dwellNudge, setDwellNudge] = useState(false);

  // Side effects for the global signals: storage writes + analytics, no setState.
  useEffect(() => {
    if (globalSignal === 'linkedin_referral') {
      // Persist so later in-session navigations still detect the referral.
      try { sessionStorage.setItem('jt_linkedin_referral', 'true'); } catch { /* no-op */ }
    }
    bumpSessionCount(); // count this page load exactly once across all instances
    if (globalSignal) trackNudgeOnce(globalSignal);
  }, [globalSignal]);

  // ── SIGNAL 2 — Extended dwell on the observed section ──────────────────────
  useEffect(() => {
    const el = sectionRef?.current;
    if (!el) return undefined; // signal inactive without a sectionRef

    let dwellTimer = null;
    const clearDwell = () => {
      if (dwellTimer != null) {
        clearTimeout(dwellTimer);
        dwellTimer = null;
      }
    };

    try {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            // Start the clock once; ignore repeat "still visible" callbacks.
            if (dwellTimer == null) {
              dwellTimer = setTimeout(() => {
                setDwellNudge(true);
                trackNudgeOnce('dwell_time');
              }, DWELL_THRESHOLD_MS);
            }
          } else {
            // Left the viewport before 45s — reset; a fresh dwell must restart.
            clearDwell();
          }
        },
        // Any visibility counts: sections here are often taller than the
        // viewport, so a high threshold could never be reached.
        { threshold: 0 },
      );

      observer.observe(el);
      return () => {
        observer.disconnect();
        clearDwell();
      };
    } catch {
      clearDwell();
      return undefined;
    }
  }, [sectionRef]);

  return Boolean(globalSignal) || dwellNudge;
}
