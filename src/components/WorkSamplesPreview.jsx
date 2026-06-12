import { useNavigate } from 'react-router-dom';
import styles from './WorkSamplesPreview.module.css';

export default function WorkSamplesPreview() {
  const navigate = useNavigate();

  return (
    <section className={styles.section} data-accent="gold">
      <div className={styles.container}>

        <div className={styles.banner}>
          <div className={styles.textSide}>
            <span className={styles.eyebrow}>Professional</span>
            <h2 className={styles.heading}>
              <svg
                className={styles.lockIcon}
                width="20" height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Work Samples
            </h2>
            <p className={styles.body}>
              Selected deliverables from past roles — CRM architecture, outbound
              infrastructure, and operations systems. Password-protected; if we're
              in conversation, ask and I'll share access.
            </p>
          </div>

          <button
            className={styles.ctaPrimary}
            onClick={() => navigate('/work-samples')}
          >
            View Work Samples →
          </button>
        </div>

      </div>
    </section>
  );
}
