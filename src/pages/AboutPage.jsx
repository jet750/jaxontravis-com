import About           from '../components/About';
import { usePageMeta } from '../hooks/usePageMeta';

export default function AboutPage() {
  usePageMeta(
    'About — Jaxon Travis',
    'Process architect and systems thinker in Carlsbad, CA. CRM builds, GTM systems, and revenue operations from blank slate to measurable system.',
    {
      url: 'https://jaxontravis.com/about',
      // TODO: add public/og-default.png — 1200x630px branded card
      image: 'https://jaxontravis.com/og-default.png',
    },
  );

  return <About />;
}
