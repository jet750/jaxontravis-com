import { useNavigate } from 'react-router-dom';
import styles from './AIInterviewPreview.module.css';

const CHAT_PREVIEW = [
  {
    role: 'assistant',
    text: "Hi — I'm trained on Jaxon's full professional background. What role are you considering him for?",
  },
  {
    role: 'user',
    text: 'What CRM platforms has he actually built in, not just used?',
  },
  {
    role: 'assistant',
    text: "He's built from scratch three times: Salesforce at Springbig, Zoho at NACB, and Membrain at HŪMNZ — each from first principles including pipeline architecture, stage logic, and workflow automation.",
  },
];

function ChatPreview() {
  return (
    <div className={styles.chatWindow} aria-hidden="true">
      <div className={styles.chatHeader}>
        <span className={styles.chatDot} />
        <span className={styles.chatTitle}>AI Interview — Live Session</span>
      </div>

      <div className={styles.chatMessages}>
        {CHAT_PREVIEW.map((msg, i) => (
          <div
            key={i}
            className={`${styles.bubble} ${msg.role === 'user' ? styles.bubbleUser : styles.bubbleAI}`}
          >
            <span className={styles.bubbleLabel}>
              {msg.role === 'user' ? 'Recruiter' : 'AI'}
            </span>
            <p className={styles.bubbleText}>{msg.text}</p>
          </div>
        ))}

        {/* Typing indicator */}
        <div className={`${styles.bubble} ${styles.bubbleAI} ${styles.typing}`}>
          <span className={styles.bubbleLabel}>AI</span>
          <span className={styles.typingDots}>
            <span /><span /><span />
          </span>
        </div>
      </div>
    </div>
  );
}

export default function AIInterviewPreview() {
  const navigate = useNavigate();

  return (
    <section className={styles.section} data-accent="gold">
      <div className={styles.container}>

        <div className={styles.layout}>

          {/* ── Text side ── */}
          <div className={styles.textSide}>
            <span className={styles.eyebrow}>Professional</span>
            <h2 className={styles.heading}>Interview Me</h2>
            <p className={styles.body}>
              Skip the scheduling back-and-forth. Have a live conversation with an AI
              trained on my professional background, skills, and experience — right now.
              Ask about specific roles, dig into past projects, pressure-test my fit for
              your team. It takes 5 minutes and replaces a screening call.
            </p>
            <p className={styles.body}>
              The AI knows my full work history, the systems I've built, the results I've
              delivered, and the kind of environments where I do my best work. Ask it
              anything you'd ask me.
            </p>

            <button
              className={styles.ctaPrimary}
              onClick={() => navigate('/interview')}
            >
              Start the Interview →
            </button>
          </div>

          {/* ── Chat preview ── */}
          <div className={styles.previewSide}>
            <ChatPreview />
          </div>

        </div>

      </div>
    </section>
  );
}
