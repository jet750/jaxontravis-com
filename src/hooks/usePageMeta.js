import { useEffect } from 'react';

const DEFAULT_TITLE = 'Jaxon Travis — Operations & Revenue Leader';
const DEFAULT_DESC =
  "AI-powered recruiter interview. Talk to an AI trained on Jaxon's full background before scheduling a call.";
const DEFAULT_URL = 'https://jaxontravis.com';
const DEFAULT_IMAGE = 'https://jaxontravis.com/og-default.png';

/** Set (or create) a meta tag matched by an attribute/value pair. */
function setMeta(attr, key, content) {
  let meta = document.querySelector(`meta[${attr}="${key}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attr, key);
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', content);
}

/**
 * Sets document.title, the meta description, and the OpenGraph / Twitter
 * social tags for the current route.
 *
 * Client-side only — fine for Google (renders JS) and good enough for an SPA
 * without adding an SSR/head-management dependency.
 *
 * `options` is optional; call sites that pass only (title, description) keep
 * working and fall back to the site-wide defaults for url/image.
 *
 * @param {string} [title]
 * @param {string} [description]
 * @param {{ url?: string, image?: string, ogTitle?: string,
 *           ogDescription?: string, twitterTitle?: string,
 *           twitterDescription?: string }} [options]
 */
export function usePageMeta(title, description, options = {}) {
  const { url, image, ogTitle, ogDescription, twitterTitle, twitterDescription } =
    options;

  useEffect(() => {
    const resolvedTitle = title || DEFAULT_TITLE;
    const resolvedDesc = description || DEFAULT_DESC;
    const resolvedUrl = url || DEFAULT_URL;
    const resolvedImage = image || DEFAULT_IMAGE;

    document.title = resolvedTitle;
    setMeta('name', 'description', resolvedDesc);

    // OpenGraph
    setMeta('property', 'og:title', ogTitle || resolvedTitle);
    setMeta('property', 'og:description', ogDescription || resolvedDesc);
    setMeta('property', 'og:url', resolvedUrl);
    setMeta('property', 'og:image', resolvedImage);

    // Twitter / X
    setMeta('name', 'twitter:title', twitterTitle || resolvedTitle);
    setMeta('name', 'twitter:description', twitterDescription || resolvedDesc);
  }, [
    title,
    description,
    url,
    image,
    ogTitle,
    ogDescription,
    twitterTitle,
    twitterDescription,
  ]);
}
