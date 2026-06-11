import Hero                from '../components/Hero';
import AIInterviewPreview  from '../components/AIInterviewPreview';
import PerennialPreview    from '../components/PerennialPreview';
import BazaarBlendsPreview from '../components/BazaarBlendsPreview';
import AboutPreview        from '../components/AboutPreview';

export default function HomePage() {
  return (
    <>
      <Hero />
      <AIInterviewPreview />
      <PerennialPreview />
      <BazaarBlendsPreview />
      <AboutPreview />
    </>
  );
}
