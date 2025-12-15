import { create } from 'zustand';
import { Word, WordStatus } from '@/types/Word';

/**
 * Interface defining the shape of the vocabulary store
 * Contains the word list, loading states, and methods to manage vocabulary
 */
interface VocabularyState {
  /** Array of vocabulary words */
  words: Word[];
  /** Loading state indicator */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Function to fetch words from the API */
  loadWords: () => Promise<void>;
  /** Function to update a word's status */
  updateWordStatus: (id: string, status: WordStatus) => void;
}

const COOKIE_NAME = 'wordStatuses';

const getSavedStatuses = (): Record<string, WordStatus> => {
  if (typeof document === 'undefined') return {};
  
  const cookie = document.cookie
    .split('; ')
    .find(row => row.startsWith(`${COOKIE_NAME}=`));
    
  if (!cookie) return {};
  
  try {
    return JSON.parse(cookie.split('=')[1]);
  } catch {
    return {};
  }
};

const saveStatuses = (statuses: Record<string, WordStatus>) => {
  if (typeof document === 'undefined') return;
  
  document.cookie = `${COOKIE_NAME}=${JSON.stringify(statuses)}; path=/; max-age=31536000`; // 1 year expiry
};

/**
 * Zustand store for managing vocabulary state
 * Handles fetching words, updating status, and maintaining loading states
 */
export const useVocabularyStore = create<VocabularyState>((set, get) => ({
  words: [],
  isLoading: false,
  error: null,
  loadWords: async () => {
    if (get().words.length > 0) return;
    
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/vocabulary');
      const data = await response.json();

      // Normalize association-related fields and booleans coming from the API
      const words = data.map((word: any) => ({
        ...word,
        isAssociated: word.isAssociated === true || word.isAssociated === "1" || word.isAssociated === 1,
        associationWord: word.associationWord || undefined,
        associationSentence: word.associationSentence || undefined
      }));

      set({ words, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to load vocabulary', isLoading: false });
    }
  },
  updateWordStatus: async (id: string, status: WordStatus) => {
    const currentWords = get().words;
    const updatedWords = currentWords.map(word => 
      word.id === id ? { ...word, status } : word
    );
    
    set({ words: updatedWords });
    
    try {
      await fetch('/api/vocabulary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wordId: id, status })
      });
    } catch (error) {
      set({ error: 'Failed to update word status' });
    }
  }
})); 