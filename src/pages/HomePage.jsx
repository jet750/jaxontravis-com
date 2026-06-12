import Hero                from '../components/Hero';
import AIInterviewPreview  from '../components/AIInterviewPreview';
import PerennialPreview    from '../components/PerennialPreview';
import BazaarBlendsPreview from '../components/BazaarBlendsPreview';
import AboutPreview        from '../components/AboutPreview';
import WorkSamplesPreview  from '../components/WorkSamplesPreview';
import { usePageMeta }     from '../hooks/usePageMeta';

export default function HomePage() {
  usePageMeta(
    'Jaxon Travis — Operations & Revenue Leader',
    'Operations and revenue leader in Carlsbad, CA. Game designer, AI builder, artisan creator. Interview an AI trained on his full background — no scheduling required.',
  );

  return (
    <>
      <Hero />
      <AIInterviewPreview />
      <PerennialPreview />
      <BazaarBlendsPreview />
      <AboutPreview />
      <WorkSamplesPreview />
    </>
  );
}
