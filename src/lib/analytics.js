// Unified client-side event tracking.
//
// Four sinks, all optional and all fail-silent:
//   1. Vercel Analytics custom events (track) — works automatically on Vercel,
//      no env var needed. (Custom events require the Vercel Pro plan to appear
//      in the dashboard; calls are harmless no-ops otherwise.)
//   2. PostHog — only initialized when VITE_POSTHOG_KEY is set at build time.
//      Without the key, posthog is never initialized and capture() is skipped.
//   3. Google Analytics 4 — only initialized when VITE_GA4_MEASUREMENT_ID is set.
//      If unset, no script tags are injected and no console errors occur.
//   4. Microsoft Clarity — only initialized when VITE_CLARITY_PROJECT_ID is set.
//      If unset, no script tags are injected and no console errors occur.
//
// Env vars (client-side, so VITE_ prefix — these are PUBLIC keys, not secrets):
//   VITE_POSTHOG_KEY          — PostHog project API key (phc_…)
//   VITE_POSTHOG_HOST         — optional, defaults to https://us.i.posthog.com
//   VITE_GA4_MEASUREMENT_ID   — GA4 measurement ID (G-XXXXXXXXXX); set in Vercel dashboard
//   VITE_CLARITY_PROJECT_ID   — Microsoft Clarity project ID; set in Vercel dashboard
//
// NOTE on VITE_ prefix: Vite only exposes env vars with this prefix to the client
// bundle (via import.meta.env). These are public/client-side tracking IDs — they
// appear in the page source regardless of approach, so the VITE_ prefix is correct.
// Server-only secrets (ANTHROPIC_API_KEY, RESEND_API_KEY) must NOT use VITE_.

import { track } from '@vercel/analytics';
import posthog from 'posthog-js';

const POSTHOG_KEY  = import.meta.env.VITE_POSTHOG_KEY;
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com';
const GA4_ID       = import.meta.env.VITE_GA4_MEASUREMENT_ID;
const CLARITY_ID   = import.meta.env.VITE_CLARITY_PROJECT_ID;

let posthogReady = false;

/** Call once at app start. Safe to call without any keys configured. */
export function initAnalytics() {
  if (!POSTHOG_KEY || posthogReady) return;
  try {
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      capture_pageview: true,
      autocapture: false, // explicit events only — keeps the stream readable
      persistence: 'localStorage',
    });
    posthogReady = true;
  } catch (err) {
    console.error('[analytics] PostHog init failed:', err?.message ?? err);
  }
}

/** Dynamically injects the GA4 gtag.js snippet. No-op if VITE_GA4_MEASUREMENT_ID is unset. */
export function initGA4() {
  if (!GA4_ID) return;
  try {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    // Standard gtag function must use `arguments` — rest params break internal GA4 dispatch.
    window.gtag = function gtag() { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA4_ID);
  } catch (err) {
    console.error('[analytics] GA4 init failed:', err?.message ?? err);
  }
}

/** Dynamically injects the Microsoft Clarity snippet. No-op if VITE_CLARITY_PROJECT_ID is unset. */
export function initClarity() {
  if (!CLARITY_ID) return;
  try {
    window.clarity = window.clarity || function() {
      (window.clarity.q = window.clarity.q || []).push(arguments);
    };
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.clarity.ms/tag/${CLARITY_ID}`;
    const first = document.getElementsByTagName('script')[0];
    first.parentNode.insertBefore(script, first);
  } catch (err) {
    console.error('[analytics] Clarity init failed:', err?.message ?? err);
  }
}

/**
 * Track a named event with optional flat properties.
 * Never throws; analytics must never break the UI.
 *
 * Events used across the site:
 *   interview_gate_completed   — AI Interview gate form passed validation/submitted
 *   jd_fetch_submitted         — JD URL "Fetch" clicked        { outcome: 'success'|'error' }
 *   chat_message_sent          — recruiter chat turn            { turn: number }
 *   transcript_email           — transcript send triggered      { trigger: 'manual'|'auto' }
 *   work_samples_gate          — Work Samples gate attempt      { outcome: 'granted'|'denied'|'error' }
 */
export function trackEvent(name, props = {}) {
  try { track(name, props); } catch { /* no-op */ }
  if (posthogReady) {
    try { posthog.capture(name, props); } catch { /* no-op */ }
  }
}
