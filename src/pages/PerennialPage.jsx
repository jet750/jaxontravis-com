import GameDesign      from '../components/GameDesign';
import { usePageMeta } from '../hooks/usePageMeta';

export default function PerennialPage() {
  usePageMeta(
    'Perennial: A Cultivar Anthology — Jaxon Travis',
    'A botanical engine-building card game for 2–4 players. Ten growing seasons, four biomes, ecological accuracy in every mechanic.',
    {
      url: 'https://jaxontravis.com/perennial',
      // TODO: add public/og-perennial.png — 1200x630px branded card
      image: 'https://jaxontravis.com/og-perennial.png',
    },
  );

  return <GameDesign />;
}
