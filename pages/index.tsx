// דף הבית: הפנייה לעמוד הלמידה או הצגת מבוא
import Link from 'next/link';
import { FaBook, FaChalkboardTeacher, FaHeadphones, FaLanguage } from 'react-icons/fa';
import styles from '../styles/HomePage.module.css';
import { useState } from 'react';

export default function Home() {
  const [showTip, setShowTip] = useState(false);
  return (
    <div className={styles.homeBg}>
      <header className={styles.headerSection}>
        <h1 className={styles.header}>ברוכים הבאים - Добро пожаловать</h1>
        <h2 className={styles.subheader}>מה נלמד היום - что мы узнаем сегодня ?</h2>
      </header>
      <main className={styles.mainNav}>
        <Link href="/vocabulary" className={styles.navButton}>
          <span className={styles.icon}>
            <img src="/animations/puzzle.png" alt="Vocabulary Icon" className={styles.iconImage} />
          </span>        
          <span className={styles.buttonText}>אוצר מילים</span>
          <span className={styles.buttonSubtext}>למדו מילים בעזרת אסוציאציות</span>
        </Link>
        <Link href="/exercise" className={styles.navButton}>
          <span className={styles.icon}>
            <img src="/animations/play.png" alt="Practice Icon" className={styles.iconImage} />
          </span>        
          <span className={styles.buttonText}>תרגול</span>
          <span className={styles.buttonSubtext}>תרגולים קצרים מובנים בדף</span>
        </Link>
        <Link href="/conversations" className={`${styles.navButton} ${styles.fullWidthButton}`}>
          <span className={styles.icon}>
            <img src="/animations/mask.png" alt="Conversations Icon" className={styles.iconImage} />
          </span>
          <div className={styles.textColumn}>
            <span className={styles.buttonText}>שיחות</span>
            <span className={styles.buttonSubtext}>התנסו בשיחות ברוסית עם משחקי תפקידים</span>
          </div>
        </Link>
      </main>
      {/* Lightbulb info below conversations, above waves */}
      <button
        className={styles.homeLightbulbToggleBtn}
        aria-expanded={showTip}
        aria-label="הצג טיפים לחוויית שימוש מיטבית"
        onClick={() => setShowTip(v => !v)}
        style={{ marginTop: 0 }}
      >
        {showTip ? '💡✨' : '💡'}
      </button>
      <div className={showTip ? styles.homeLightbulbAnim : styles.homeLightbulbAnimCollapsed}>
        {showTip && (
          <div className={styles.homeLightbulbBubble}>
            <div>
              <b>לחווייה מיטבית:</b><br />
              באנדרואיד היכנסו מדפדפן Samsung Internet<br />
              באייפון הכנסו להגדרות הפלאפון והדליקו את Detect language
            </div>
          </div>
        )}
      </div>
      <img src="/animations/waves.gif" alt="waves animation" className={styles.wavingAnim} />
    </div>
  );
}