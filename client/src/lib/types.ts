export interface Entry {
  id: number;
  userId: number;
  date: string; // YYYY-MM-DD
  title?: string;
  content: string;
  mood: Mood;
  weather?: string;
  tags: string[];
  images: string[];
  createdAt: string;
  updatedAt: string;
}

export type Mood = 'happy' | 'neutral' | 'sad' | 'tired' | 'stressed';

export interface MoodOption {
  value: Mood;
  label: string;
  emoji: string;
  color: string;
  bgColor: string;
}

export const MOODS: MoodOption[] = [
  { value: 'happy', label: 'Vui', emoji: '😄', color: '#F59E0B', bgColor: '#FEF3C7' },
  { value: 'neutral', label: 'Bình thường', emoji: '😐', color: '#6B7280', bgColor: '#F3F4F6' },
  { value: 'sad', label: 'Buồn', emoji: '😔', color: '#3B82F6', bgColor: '#DBEAFE' },
  { value: 'tired', label: 'Mệt mỏi', emoji: '😫', color: '#8B5CF6', bgColor: '#EDE9FE' },
  { value: 'stressed', label: 'Căng thẳng', emoji: '😡', color: '#EF4444', bgColor: '#FEE2E2' },
];

export interface User {
  id: number;
  email: string;
}

export interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
}
