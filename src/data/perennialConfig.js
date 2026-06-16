// ─── Perennial — card data system ────────────────────────────────────────────
//
// Hybrid dynamic card system, mirroring `photographyConfig.js`. New cards are
// added simply by dropping a WebP file into `src/assets/perennial/` — Vite's
// import.meta.glob picks them up at build time, so no manual registration is
// required here.
//
// `cardMeta` is an OPTIONAL override layer keyed by exact filename. Any file in
// the folder without an entry falls back to a cleaned title derived from its
// filename, with empty game text.

// Eagerly import every WebP in the folder as a resolved URL string. `eager`
// inlines the imports at build time (no async), so `cards` below is a plain
// synchronous array. Glob keys are paths like
// '../assets/perennial/birds-of-paradise.webp'.
export const cardModules = import.meta.glob(
  '../assets/perennial/*.webp',
  { eager: true, import: 'default' }
);

// Card metadata — keyed by exact filename. Provides title, tier, archetype,
// mechanic, and flavor text for each card. Any file in the folder without an
// entry here gets a basic fallback (title from filename, no game text).
export const cardMeta = {
  'birds-of-paradise.webp': {
    title: 'Bird of Paradise',
    tier: 'T3',
    archetype: 'Flowering',
    mechanic: 'Bloom — score 2 points when paired with a pollinator card.',
    flavor: 'Where beauty evolved as currency.',
  },
  'blue-morpho-butterfly.webp': {
    title: 'Blue Morpho Butterfly',
    tier: 'T2',
    archetype: 'Pollinator',
    mechanic: 'Flutter — move to any adjacent biome without spending an action.',
    flavor: 'Wings that paint light, not pigment.',
  },
  'cornflower.webp': {
    title: 'Cornflower',
    tier: 'T1',
    archetype: 'Wildflower',
    mechanic: 'Hardy — survives frost events without penalty.',
    flavor: 'The field\'s quiet insistence.',
  },
  'fly-agaric.webp': {
    title: 'Fly Agaric',
    tier: 'T2',
    archetype: 'Fungi',
    mechanic: 'Mycorrhizal — share Water tokens with adjacent plant cards.',
    flavor: 'The forest floor\'s hidden network.',
  },
  'ink-cap.webp': {
    title: 'Ink Cap',
    tier: 'T1',
    archetype: 'Fungi',
    mechanic: 'Deliquesce — discard after 2 seasons, draw 2 cards.',
    flavor: 'Brief, brilliant, then gone.',
  },
  'iris.webp': {
    title: 'Iris',
    tier: 'T2',
    archetype: 'Flowering',
    mechanic: 'Rhizome — place one additional Iris from hand at no cost.',
    flavor: 'Named for the goddess of the rainbow.',
  },
  'japanese-maple.webp': {
    title: 'Japanese Maple',
    tier: 'T3',
    archetype: 'Deciduous',
    mechanic: 'Seasonal Color — score 1 point per season card played this round.',
    flavor: 'Autumn made permanent.',
  },
  'magnolia.webp': {
    title: 'Magnolia',
    tier: 'T3',
    archetype: 'Ancient',
    mechanic: 'Primordial — immune to invasive species events.',
    flavor: 'Older than the bees that pollinate it.',
  },
  'ocotillo.webp': {
    title: 'Ocotillo',
    tier: 'T2',
    archetype: 'Desert',
    mechanic: 'Flash Bloom — score double points if played after a Rain event.',
    flavor: 'Dormant until the desert remembers water.',
  },
  'prickly-pear.webp': {
    title: 'Prickly Pear',
    tier: 'T1',
    archetype: 'Succulent',
    mechanic: 'Water Store — gain 1 Water token each dry season automatically.',
    flavor: 'The desert\'s most generous host.',
  },
  'quinoa.webp': {
    title: 'Quinoa',
    tier: 'T2',
    archetype: 'Crop',
    mechanic: 'Altitude Adapted — immune to temperature shift penalties.',
    flavor: 'Five thousand years of Andean selection.',
  },
  'saguaro-cactus.webp': {
    title: 'Saguaro Cactus',
    tier: 'T3',
    archetype: 'Desert',
    mechanic: 'Drought — immune to dry-season discard. Store 2 Water tokens each season.',
    flavor: 'A century of patience, visible.',
  },
  'tomato.webp': {
    title: 'Tomato',
    tier: 'T1',
    archetype: 'Crop',
    mechanic: 'Prolific — produce 2 Fruit tokens per growing season.',
    flavor: 'Fruit pretending to be a vegetable.',
  },
  'tropical-pitcher.webp': {
    title: 'Tropical Pitcher',
    tier: 'T2',
    archetype: 'Carnivorous',
    mechanic: 'Trap — remove one insect card from opponent\'s field.',
    flavor: 'Patience with a digestive system.',
  },
  'venus-flytrap.webp': {
    title: 'Venus Flytrap',
    tier: 'T3',
    archetype: 'Carnivorous',
    mechanic: 'Snap — counter any pollinator card played against your field.',
    flavor: 'The plant that learned to hunt.',
  },
};

// Resolved, ordered list of cards built from the folder. Sorted by filename so
// the grid order is stable and predictable.
//
// Each entry: { id, src, title, tier, archetype, mechanic, flavor }
export const cards = Object.entries(cardModules)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([path, src]) => {
    const filename = path.split('/').pop();
    const meta = cardMeta[filename] || {};
    const title = meta.title || filename
      .replace('.webp', '')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
    return {
      id: filename,
      src,
      title,
      tier: meta.tier || 'T1',
      archetype: meta.archetype || '',
      mechanic: meta.mechanic || '',
      flavor: meta.flavor || '',
    };
  });
