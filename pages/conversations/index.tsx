import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import styles from '../../styles/Conversations.module.css';
import { GoogleGenerativeAI } from "@google/generative-ai";

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

const API_KEY = "AIzaSyBJjYZif960Nh_FccIVcngUZcSFfPq_tgA";
const MAX_MESSAGES = 20;

const basePrompt = `
Ты чат-бот, помогающий человеку учить русский язык через ролевые диалоги.  
Всегда говори по-русски, избегай английского.
Говори как с маленьким ребёнком, который только начинает учить язык.  
Используй только самые простые и частые слова — из повседневной жизни.  
Избегай редких слов, сложных фраз и длинных предложений.  
Отвечай коротко, ясно и по смыслу — не более 6–10 слов.  
Каждое твоё сообщение должно заканчиваться простым вопросом, чтобы продолжить диалог.  
Будь **вежливым**, **живым** и **терпеливым** — как хороший учитель, который играет роль.

В конце каждого твоего ответа предлагай **две очень простые и короткие фразы**, которые человек может выбрать как следующий ответ.

Формат:
Твоя реплика.

Варианты ответа:
– Вариант 1  
– Вариант 2

Не используй одинаковые фразы каждый раз. Пусть ответы будут связаны с твоей репликой и логичны для продолжения.
`;

const correctionAddon = `
Если пользователь делает ошибку — сначала повтори его фразу в правильной и естественной форме.
Начни это предложение словами: "Правильнее сказать...".
Если ошибки нет — не повторяй его фразу.
`;

type Role = 'user' | 'assistant';
type Message = { role: Role; content: string };

interface Conversation {
  id: string;
  title: string;
  emoji: string;
  description: string;
  prompt: string;
}

const conversations: Conversation[] = [
  {
    id: 'market',
    title: 'בשוק',
    emoji: '🛍️',
    description: 'שיחה עם מוכר בשוק',
    prompt: `Ты играешь роль продавца на рынке. Говори по-русски, дружелюбно, просто и с юмором. Отвечай по делу, как настоящий продавец.`
  },
  {
    id: 'friend',
    title: 'עם חבר',
    emoji: '👋',
    description: 'שיחה ידידותית עם חבר ',
    prompt: `Ты играешь роль хорошего друга. Говори неформально, тепло и по-русски. Спрашивай, как у меня дела, и делись своими.`
  },
  {
    id: 'restaurant',
    title: 'במסעדה',
    emoji: '🍽️',
    description: 'הזמנת אוכל ממלצר במסעדה ',
    prompt: `Ты официант в русском кафе. Обслуживай вежливо, просто, по-русски. Спрашивай, что я хочу заказать, и предлагай блюда.`
  },
  {
    id: 'cinema',
    title: 'בקולנוע',
    emoji: '🎬',
    description: 'רכישת כרטיסים לקולנוע',
    prompt: `Ты кассир в кинотеатре. Говори по-русски, профессионально и просто. Помоги выбрать сеанс и купить билет.`
  },
  {
    id: 'street',
    title: 'ברחוב',
    emoji: '🚇',
    description: 'התמצאות ברחוב',
    prompt: `Ты житель города и помогаешь туристу сориентироваться на улице и найти нужное место.
    Отвечай дружелюбно, понятно и по делу.`
  },
  {
    id: 'hotel',
    title: 'בבית מלון',
    emoji: '🎬',
    description: 'צ\'ק אין במלון',
    prompt: `Ты администратор отеля. Говори по-русски вежливо, помогай с заселением, отвечай на вопросы.`
  },
  {
    id: 'doctor',
    title: 'במרפאה',
    emoji: '👨‍⚕️',
    description: 'ביקור אצל הרופא',
    prompt: `Ты врач в клинике. Спрашивай о симптомах, отвечай спокойно, по-русски и профессионально.`
  },
  {
    id: 'clothing',
    title: 'בחנות בגדים',
    emoji: '👕',
    description: 'קניית בגדים',
    prompt: `Ты продавец в магазине одежды. Говори по-русски, помогай выбрать размер и фасон.`
  }
];

export default function ConversationsIndex() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [chatSession, setChatSession] = useState<any>(null);
  const [history, setHistory] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [debugMsg, setDebugMsg] = useState<string>('Initializing...');
  const [correctionEnabled, setCorrectionEnabled] = useState(false);
  const [suggestedReplies, setSuggestedReplies] = useState<string[]>([]);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [history]);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    loadVoices();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      const initGemini = async () => {
        try {
          setDebugMsg('📦 Initializing Gemini...');
          const genAI = new GoogleGenerativeAI(API_KEY);
          const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

          const globalPrompt = correctionEnabled
            ? basePrompt + "\n\n" + correctionAddon
            : basePrompt;

          // Add instruction for varied greeting
          const promptWithGreeting = `${globalPrompt}\n\n${selectedConversation.prompt}\n\nНачни диалог с подходящего приветствия, соответствующего твоей роли. Не используй всегда одно и то же приветствие.`;

          const chat = await model.startChat({
            history: [{
              role: "user",
              parts: [{ text: promptWithGreeting }]
            }],
            generationConfig: {
              maxOutputTokens: 50,
              temperature: 0.7,
            },
          });

          setChatSession(chat);

          // Send a dummy message to trigger the assistant's greeting
          const dummyInputs = ["...", "—", "🔊", "👋"];
          const dummy = dummyInputs[Math.floor(Math.random() * dummyInputs.length)];
          const initialResponse = await chat.sendMessage(dummy);
          const assistantMessage = initialResponse.response.text();
          const { reply, options } = extractReplyAndOptions(assistantMessage);
          setHistory([{ role: 'assistant', content: reply }]);
          setSuggestedReplies(options);
          speak(reply);
          setDebugMsg('✅ Gemini ready!');
        } catch (error) {
          console.error('Error initializing Gemini:', error);
          setDebugMsg('❌ Failed to initialize Gemini');
        }
      };

      initGemini();
    }
  }, [selectedConversation, correctionEnabled]);

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ru-RU';
    const voice = voices.find(v => v.lang.startsWith('ru'));
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  };

  function extractReplyAndOptions(fullText: string): { reply: string, options: string[] } {
    const parts = fullText.split('Варианты ответа:');
    const reply = parts[0].trim();
    const options = parts[1]
      ? parts[1]
          .split('–')
          .map(opt => opt.trim())
          .filter(opt => opt.length > 0)
      : [];
    return { reply, options };
  }

  const handleRecognizedText = async (text: string) => {
    if (isConversationEnded) {
      setDebugMsg("🚫 Conversation ended. Start a new one.");
      return;
    }
    if (!chatSession || !text) {
      setDebugMsg('⚠️ No input or model not ready');
      return;
    }

    const updatedHistory: Message[] = [...history, { role: 'user', content: text }];
    setHistory(updatedHistory);

    setDebugMsg('💬 Sending to Gemini...');
    setLoading(true);
    try {
      const result = await chatSession.sendMessage(text);
      const reply = result.response.text();
      
      const { reply: assistantReply, options: assistantOptions } = extractReplyAndOptions(reply);
      setHistory([...updatedHistory, { role: 'assistant', content: assistantReply }]);
      setSuggestedReplies(assistantOptions);
      speak(assistantReply);
      setDebugMsg('✅ Response complete');
    } catch (error) {
      console.error('Error from Gemini:', error);
      setDebugMsg('❌ Error from model');
    }
    setLoading(false);
  };

  const startRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('הדפדפן שלך לא תומך בזיהוי קולי');
      setDebugMsg('❌ SpeechRecognition not supported');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'ru-RU';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      const timeoutId = setTimeout(() => recognition.stop(), 8000);

      recognition.onstart = () => {
        setDebugMsg('🎙️ Listening...');
        setListening(true);
      };
      recognition.onend = () => {
        clearTimeout(timeoutId);
        setListening(false);
        setDebugMsg('🛑 Recognition ended.');
      };
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        setListening(false);
        setDebugMsg(`❌ STT error: ${event.error}`);
      };
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const text = event.results[0][0].transcript;
        setDebugMsg(`📝 Recognized: "${text}"`);
        handleRecognizedText(text);
      };

      recognition.start();
    } catch (err) {
      console.error('Error initializing speech recognition:', err);
      setDebugMsg('❌ Error initializing STT');
    }
  };

  const startNewConversation = async () => {
    setHistory([]);
    setDebugMsg('🔄 Starting new conversation...');
    
    if (selectedConversation) {
      try {
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const globalPrompt = correctionEnabled
          ? basePrompt + "\n\n" + correctionAddon
          : basePrompt;
        const chat = await model.startChat({
          history: [{
            role: "user",
            parts: [{ text: globalPrompt + '\n\n' + selectedConversation.prompt }]
          }],
          generationConfig: {
            maxOutputTokens: 50,
            temperature: 0.7,
          },
        });
        setChatSession(chat);
        setDebugMsg('✅ Ready for new conversation!');
      } catch (error) {
        console.error('Error starting new conversation:', error);
        setDebugMsg('❌ Failed to start new conversation');
      }
    }
  };

  const isConversationEnded = history.length >= MAX_MESSAGES;

  if (selectedConversation) {
    return (
      <div className={styles.container} dir="rtl">
        <h1 className={styles.title}>{selectedConversation.emoji} {selectedConversation.title}</h1>
        <p className={styles.description}>
          לחץ ודבר ברוסית. השיחה תתנהל ברוסית
        </p>

        <div className={styles.correctionToggle}>
          <label>
            האם תרצה לקבל תיקונים שלך בשיחה?
            <input
              type="checkbox"
              checked={correctionEnabled}
              onChange={() => setCorrectionEnabled(!correctionEnabled)}
            />
          </label>
        </div>

        <div className={styles.chatBox} ref={chatRef}>
          {history.map((msg, i) => (
            <div key={i} className={msg.role === 'user' ? styles.userMsg : styles.assistantMsg}>
              <div className={styles.msgHeader}>
                <div className={styles.messageContent}>
                  <div className={styles.messageText}>
                    {msg.content}
                  </div>
                </div>
                {msg.role === 'assistant' && (
                  <div className={styles.messageActions}>
                    <button 
                      className={styles.iconButton}
                      onClick={() => speak(msg.content)}
                      title="Replay audio"
                    >
                      🔊
                    </button>
                  </div>
                )}
              </div>
            </div>
            // הצעות לתשובה UI - מחוץ לבועה של הבוט, אחרי ההודעה האחרונה בלבד
          ))}
          {/* הצעות לתשובה - רק אחרי הודעת הבוט האחרונה */}
          {history.length > 0 && history[history.length - 1].role === 'assistant' && suggestedReplies.length > 0 && (
            <div className={styles.suggestionsWrapper}>
              <div className={styles.suggestions}>
                <div className={styles.suggestionsTitle}>הצעות לתשובה</div>
                <div className={styles.suggestionButtons}>
                  {suggestedReplies.map((option, idx) => (
                    <button
                      key={idx}
                      className={styles.suggestionButton}
                      onClick={() => {
                        if (isConversationEnded) {
                          setDebugMsg("🚫 Conversation ended. Start a new one.");
                          return;
                        }
                        handleRecognizedText(option);
                      }}
                      tabIndex={0}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={styles.controls}>
          {isConversationEnded ? (
            <>
              <div className={styles.conversationEnded}>
                🔁 השיחה הסתיימה. לחץ למטה כדי להתחיל שיחה חדשה
              </div>
              <button 
                className={styles.newConversationButton}
                onClick={startNewConversation}
              >
                התחל שיחה חדשה
              </button>
            </>
          ) : (
            <button
              className={`${styles.recordButton} ${listening ? styles.recording : ''}`}
              onClick={startRecognition}
              disabled={listening || loading}
            >
              {listening ? 'מקשיב...' : 'לחץ ודבר'}
            </button>
          )}
        </div>

        <div style={{ marginTop: '1rem', fontSize: '1rem', color: '#666' }}>
          <strong>סטטוס:</strong> {debugMsg}
        </div>

        <button 
          onClick={() => setSelectedConversation(null)}
          style={{
            marginTop: '1rem',
            padding: '0.5rem 1rem',
            background: '#f5f5f5',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer'
          }}
        >
          חזרה לרשימת השיחות
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container} dir="rtl">
      <h1 className={styles.title}>בחר סוג שיחה 💬</h1>
      <p className={styles.description}>
        בחר את סוג השיחה שברצונך לתרגל
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
        gap: '1rem',
        padding: '1rem',
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {conversations.map((conv) => (
          <div 
            key={conv.id}
            onClick={() => setSelectedConversation(conv)}
            className={styles.conversationCard}
            style={{
              backgroundImage: `url("/animations/conversation/${conv.id.charAt(0).toUpperCase() + conv.id.slice(1)}.png")`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              position: "relative"
            }}
          >
            <div className={styles.cardLabel}>{conv.title}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
