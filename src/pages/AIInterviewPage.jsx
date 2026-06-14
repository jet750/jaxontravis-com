import AIInterview     from '../components/AIInterview';
import { usePageMeta } from '../hooks/usePageMeta';

export default function AIInterviewPage() {
  usePageMeta(
    'AI Interview — Jaxon Travis',
    "Skip the screening call. Talk to an AI trained on Jaxon's full background right now — ask about specific roles, past projects, and team fit.",
    {
      url: 'https://jaxontravis.com/interview',
      // TODO: add public/og-interview.png — 1200x630px branded card
      image: 'https://jaxontravis.com/og-interview.png',
    },
  );

  return <AIInterview />;
}
