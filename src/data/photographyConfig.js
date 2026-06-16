// ─── JET Photography — image data system ─────────────────────────────────────
//
// Hybrid dynamic image system. New photos are added simply by dropping image
// files into `src/assets/photography/` — Vite's import.meta.glob picks them up at
// build time, so no manual registration is required here.
//
// `photographyMeta` is an OPTIONAL override layer keyed by filename. Add an entry
// only when you want a custom title or alt text for a given file. Any file that
// exists in the folder but has no entry here falls back to a cleaned version of
// its filename (extension stripped, hyphens/underscores → spaces, title-cased).
//
//   Example: "mountain-vista.jpg"  →  fallback title "Mountain Vista"
//            add { title: 'Mountain Vista, Sierra Nevada' } to override it.
//
// Until real images are added, the folder is empty and the system synthesizes 12
// styled placeholders (Photo 1 … Photo 12) so the page is fully functional and
// shareable immediately. Placeholder entries carry `placeholder: true` and a
// `src` of `null`; components render a violet-tinted tile instead of an <img>.

/**
 * Optional per-file metadata overrides. Keyed by exact filename (with extension).
 * All fields are optional — provide `title`, `alt`, or both.
 *
 * @type {Record<string, { title?: string, alt?: string }>}
 */
export const photographyMeta = {
  // 'mountain-vista.jpg': { title: 'Mountain Vista', alt: 'Snow-dusted peaks at dawn' },
};

const PLACEHOLDER_COUNT = 12;

/**
 * Turn a filename into a human-readable title: strip the extension, swap hyphens
 * and underscores for spaces, collapse whitespace, and title-case each word.
 *
 *   "desert_road-02.jpg"  →  "Desert Road 02"
 *
 * @param {string} filename
 * @returns {string}
 */
export function titleFromFilename(filename) {
  return filename
    .replace(/\.[^.]+$/, '')        // drop extension
    .replace(/[-_]+/g, ' ')          // hyphens/underscores → spaces
    .replace(/\s+/g, ' ')            // collapse whitespace
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase()); // title-case
}

// Eagerly import every image in the folder as a resolved URL string. `eager`
// means the imports are inlined at build time (no async), so `photos` below is a
// plain synchronous array. Glob keys are paths like
// '../assets/photography/mountain-vista.jpg'.
const modules = import.meta.glob(
  '../assets/photography/*.{jpg,jpeg,png,webp,avif,gif}',
  { eager: true, import: 'default' },
);

function buildFromFolder() {
  return Object.entries(modules)
    // Sort by filename so the grid order is stable and predictable.
    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
    .map(([path, src], index) => {
      const filename = path.split('/').pop();
      const meta = photographyMeta[filename] || {};
      const title = meta.title || titleFromFilename(filename);
      return {
        id: filename,
        src,
        title,
        alt: meta.alt || title,
        index,
        placeholder: false,
      };
    });
}

function buildPlaceholders() {
  return Array.from({ length: PLACEHOLDER_COUNT }, (_, i) => {
    const title = `Photo ${i + 1}`;
    return {
      id: `placeholder-${i + 1}`,
      src: null,
      title,
      alt: title,
      index: i,
      placeholder: true,
    };
  });
}

/**
 * Resolved, ordered list of photos for the whole feature. Real images when the
 * folder has them; otherwise 12 synthesized placeholders.
 *
 * Each entry: { id, src, title, alt, index, placeholder }
 */
export const photos = modules && Object.keys(modules).length > 0
  ? buildFromFolder()
  : buildPlaceholders();

// ─── Film / aerial video ─────────────────────────────────────────────────────
//
// YouTube iframe embeds work with just the video ID — no API key and no API call
// required for a basic embed. VITE_YOUTUBE_API_KEY is reserved for a future pass
// that fetches playlist/metadata dynamically and wires play-event tracking via
// the YouTube IFrame Player API.
export const films = [
  {
    id: 'bLIuTnK1Qc4',
    title: 'Birds at Batiquitos Lagoon',
    location: 'Carlsbad, CA',
  },
  {
    id: '5OVJlgY204A',
    title: 'Carlsbad Coastal',
    location: 'Carlsbad, CA',
  },
  {
    id: 'E9_xA7NwBnA',
    title: 'Flight Over a Misty Lagoon',
    location: 'Encinitas, CA',
  },
];

/** Pre-encoded mailto used by every print-quote CTA (page button + popup). */
export const PRINT_QUOTE_MAILTO =
  'mailto:jaxontravis7@gmail.com' +
  '?subject=Print%20Quote%20Request%20%E2%80%94%20JET%20Photography' +
  '&body=Hi%20Jaxon%2C%0A%0AI%27m%20interested%20in%20ordering%20a%20print.%20Here%20are%20my%20details%3A%0A%0A' +
  'Photo%20title%2F%20description%3A%0ADesired%20size%3A%0AFraming%20preference%3A%0AQuantity%3A%0A%0AThanks!';
