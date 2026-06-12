import GameDesign      from '../components/GameDesign';
import { usePageMeta } from '../hooks/usePageMeta';

export default function PerennialPage() {
  usePageMeta(
    'Perennial: A Cultivar Anthology — Jaxon Travis',
    'A botanical engine-building card game for 2–4 players. Ten growing seasons, four biomes, ecological accuracy in every mechanic.',
  );

  return <GameDesign />;
}
