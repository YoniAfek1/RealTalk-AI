import styles from '../../styles/Exercise.module.css';

type Question = {
  id: number;
  prompt: string;
  options: string[];
  answer: string;
};

const questions: Question[] = [
  {
    id: 1,
    prompt: 'בחר/י את התרגום הנכון ל: яблоко',
    options: ['תפוח', 'אגס', 'בננה'],
    answer: 'תפוח',
  },
  {
    id: 2,
    prompt: 'בחר/י את התרגום הנכון ל: спасибо',
    options: ['שלום', 'תודה', 'בבקשה'],
    answer: 'תודה',
  },
  {
    id: 3,
    prompt: 'בחר/י את התרגום הנכון ל: дом',
    options: ['בית', 'מים', 'ספר'],
    answer: 'בית',
  },
];

export default function Exercise() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>תרגול</h1>
      <p className={styles.description}>
        תרגול קצר ומובנה בתוך העמוד. בחרו את התרגום הנכון למילה ברוסית.
      </p>
      <div className={styles.quizList}>
        {questions.map((q) => (
          <div key={q.id} className={styles.quizCard}>
            <div className={styles.quizPrompt}>{q.prompt}</div>
            <div className={styles.quizOptions}>
              {q.options.map((opt) => (
                <button
                  key={opt}
                  className={styles.quizButton}
                  onClick={() => alert(opt === q.answer ? '✅ נכון!' : '❌ נסו שוב')}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className={styles.bottomAnim}>
        <img src="/animations/anna2.gif" alt="anna animation" className={styles.annaImage} />
      </div>
    </div>
  );
}