import ArtisanStudio   from '../components/ArtisanStudio';
import { usePageMeta } from '../hooks/usePageMeta';

export default function BazaarBlendsPage() {
  usePageMeta(
    'Bazaar Blends — Jaxon Travis',
    'Where every spice has an origin story. Authentic regional spice blends that put the origin culture first. Launching soon.',
  );

  return <ArtisanStudio />;
}
