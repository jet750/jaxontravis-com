import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// Ambient, dismissable recruiter prompt. Inline styles only (per spec) so the
// component stays self-contained and portable. Mount/unmount + exit animation
// are owned by the <AnimatePresence> wrapper in App.jsx.
export default function RecruiterNudge({ visible, onDismiss }) {
  const navigate = useNavigate();

  // Parent gates mounting, but honor the prop contract regardless.
  if (!visible) return null;

  const handleCta = () => {
    navigate('/interview');
    onDismiss();
  };

  return (
    <motion.div
      role="complementary"
      aria-label="Suggestion: interview Jaxon's AI"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
      // 1.5s delay keeps it from flashing in before the page has rendered
      // (e.g. on instant LinkedIn-referral detection).
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 1.5 }}
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 100,
        maxWidth: 280,
        background: '#1a1714',
        border: '1px solid rgba(212, 168, 63, 0.25)',
        borderRadius: 8,
        padding: '16px 20px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(240, 235, 226, 0.8)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(240, 235, 226, 0.4)'; }}
        style={{
          position: 'absolute',
          top: 6,
          right: 10,
          background: 'transparent',
          border: 'none',
          padding: 2,
          margin: 0,
          fontSize: 16,
          lineHeight: 1,
          cursor: 'pointer',
          color: 'rgba(240, 235, 226, 0.4)',
          transition: 'color 0.2s ease',
        }}
      >
        ×
      </button>

      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: '#D4A83F',
        }}
      >
        Skip the screening call
      </div>

      <p
        style={{
          margin: '8px 0 14px',
          fontSize: 13,
          lineHeight: 1.5,
          color: 'rgba(240, 235, 226, 0.8)',
        }}
      >
        Talk to an AI trained on Jaxon&apos;s full background — right now.
      </p>

      <button
        type="button"
        onClick={handleCta}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(212,168,63,0.08)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
        style={{
          display: 'block',
          width: '100%',
          padding: 10,
          background: 'transparent',
          border: '1px solid #D4A83F',
          borderRadius: 4,
          color: '#D4A83F',
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: 12,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          transition: 'background 0.2s ease',
        }}
      >
        Interview Me →
      </button>
    </motion.div>
  );
}
