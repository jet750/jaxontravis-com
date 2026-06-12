import AIInterview     from '../components/AIInterview';
import { usePageMeta } from '../hooks/usePageMeta';

export default function AIInterviewPage() {
  usePageMeta(
    'AI Interview — Jaxon Travis',
    "Interview an AI trained on Jaxon Travis's full professional background. Takes 5 minutes and saves you a screening call.",
  );

  return <AIInterview />;
}
