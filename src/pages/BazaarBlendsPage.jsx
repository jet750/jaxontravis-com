import ArtisanStudio   from '../components/ArtisanStudio';
import { usePageMeta } from '../hooks/usePageMeta';

export default function BazaarBlendsPage() {
  usePageMeta(
    'Bazaar Blends — Jaxon Travis',
    'An artisan spice brand built on authentic regional blends with cultural provenance. Every spice has an origin story.',
    {
      url: 'https://jaxontravis.com/bazaar-blends',
      // TODO: add public/og-bazaar.png — 1200x630px branded card
      image: 'https://jaxontravis.com/og-bazaar.png',
    },
  );

  return <ArtisanStudio />;
}
