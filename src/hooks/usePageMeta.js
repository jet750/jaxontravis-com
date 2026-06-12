import { useEffect } from 'react';

const DEFAULT_TITLE = 'Jaxon Travis — Operations & Revenue Leader';
const DEFAULT_DESC =
  "AI-powered recruiter interview. Talk to an AI trained on Jaxon's full background before scheduling a call.";

/**
 * Sets document.title and the meta description for the current route.
 * Client-side only — fine for Google (renders JS) and good enough for an SPA
 * without adding an SSR/head-management dependency.
 */
export function usePageMeta(title, description) {
  useEffect(() => {
    document.title = title || DEFAULT_TITLE;

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', description || DEFAULT_DESC);
  }, [title, description]);
}
