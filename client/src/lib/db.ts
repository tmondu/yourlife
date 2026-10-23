import Dexie, { Table } from 'dexie';
import { Entry } from './types';

interface DraftEntry {
  id?: number;
  date: string;
  title?: string;
  content: string;
  mood: string;
  weather?: string;
  tags: string[];
  images: string[];
  updatedAt: number;
}

class YourLifeDB extends Dexie {
  entries!: Table<Entry>;
  drafts!: Table<DraftEntry>;

  constructor() {
    super('yourlife-db');
    this.version(1).stores({
      entries: '++id, date, userId, mood, createdAt',
      drafts: '++id, date, updatedAt',
    });
  }
}

export const db = new YourLifeDB();

// Draft auto-save helpers
export const saveDraft = async (draft: Omit<DraftEntry, 'id' | 'updatedAt'>) => {
  const existing = await db.drafts.where('date').equals(draft.date).first();
  if (existing) {
    await db.drafts.update(existing.id!, { ...draft, updatedAt: Date.now() });
  } else {
    await db.drafts.add({ ...draft, updatedAt: Date.now() });
  }
};

export const getDraft = async (date: string) => {
  return db.drafts.where('date').equals(date).first();
};

export const deleteDraft = async (date: string) => {
  await db.drafts.where('date').equals(date).delete();
};

// Cache entries locally
export const cacheEntries = async (entries: Entry[]) => {
  await db.entries.bulkPut(entries);
};

export const getCachedEntries = async (month: string) => {
  return db.entries.where('date').startsWith(month).reverse().sortBy('date');
};
