import About           from '../components/About';
import { usePageMeta } from '../hooks/usePageMeta';

export default function AboutPage() {
  usePageMeta(
    'About — Jaxon Travis',
    'Process architect and systems thinker in Carlsbad, CA. CRM builds, GTM systems, and revenue operations — from blank slate to measurable system.',
  );

  return <About />;
}
