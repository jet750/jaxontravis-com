import { Link } from 'react-router-dom';
import styles from './NotFoundPage.module.css';

export default function NotFoundPage() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <span className={styles.eyebrow}>Page Not Found</span>
        <h1 className={styles.heading}>404</h1>
        <p className={styles.body}>This page doesn't exist.</p>
        <Link to="/" className={styles.cta}>Back to Home →</Link>
      </div>
    </div>
  );
}
