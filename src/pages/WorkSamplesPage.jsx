import WorkSamples     from '../components/WorkSamples';
import { usePageMeta } from '../hooks/usePageMeta';

export default function WorkSamplesPage() {
  usePageMeta(
    'Work Samples — Jaxon Travis',
    'Password-protected portfolio of selected work deliverables from Jaxon Travis.',
  );

  return <WorkSamples />;
}
