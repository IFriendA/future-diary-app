import type { FutureDiary } from './types';

const LEGACY_KEY = 'future-diary:latest';
const DIARIES_KEY = 'future-diary:by-date';
const DRAFTS_KEY = 'future-diary:drafts';

export type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

const memoryValues = new Map<string, string>();

const memoryStorage: StorageLike = {
  getItem(key) {
    return memoryValues.get(key) ?? null;
  },
  setItem(key, value) {
    memoryValues.set(key, value);
  },
  removeItem(key) {
    memoryValues.delete(key);
  },
};

function getDefaultStorage(): StorageLike {
  if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
    return globalThis.localStorage as StorageLike;
  }
  return memoryStorage;
}

function parseRecord<T>(value: string | null): Record<string, T> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, T>) : {};
  } catch {
    return {};
  }
}

export function createDiaryStorage(storage: StorageLike = getDefaultStorage()) {
  function loadAll(): Record<string, FutureDiary> {
    const diaries = parseRecord<FutureDiary>(storage.getItem(DIARIES_KEY));
    const legacyRaw = storage.getItem(LEGACY_KEY);
    if (!legacyRaw) return diaries;

    try {
      const legacy = JSON.parse(legacyRaw) as FutureDiary;
      if (legacy?.targetDate && !diaries[legacy.targetDate]) {
        diaries[legacy.targetDate] = legacy;
        storage.setItem(DIARIES_KEY, JSON.stringify(diaries));
        storage.removeItem(LEGACY_KEY);
      }
    } catch {
      storage.removeItem(LEGACY_KEY);
    }
    return diaries;
  }

  function saveAll(diaries: Record<string, FutureDiary>) {
    storage.setItem(DIARIES_KEY, JSON.stringify(diaries));
  }

  function loadDrafts() {
    return parseRecord<string>(storage.getItem(DRAFTS_KEY));
  }

  return {
    loadAll,
    loadByDate(date: string): FutureDiary | null {
      return loadAll()[date] ?? null;
    },
    save(diary: FutureDiary) {
      const diaries = loadAll();
      diaries[diary.targetDate] = diary;
      saveAll(diaries);
    },
    loadDraft(date: string): string {
      return loadDrafts()[date] ?? '';
    },
    saveDraft(date: string, text: string) {
      const drafts = loadDrafts();
      drafts[date] = text;
      storage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
    },
    clearDraft(date: string) {
      const drafts = loadDrafts();
      delete drafts[date];
      storage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
    },
  };
}

export type DiaryStorage = ReturnType<typeof createDiaryStorage>;
