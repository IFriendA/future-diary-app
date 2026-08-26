import type { FutureDiary } from './types';

const STORAGE_KEY = 'future-diary:latest';

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

export function createDiaryStorage(storage: StorageLike = getDefaultStorage()) {
  return {
    load(): FutureDiary | null {
      try {
        const value = storage.getItem(STORAGE_KEY);
        return value ? (JSON.parse(value) as FutureDiary) : null;
      } catch {
        return null;
      }
    },

    save(diary: FutureDiary) {
      storage.setItem(STORAGE_KEY, JSON.stringify(diary));
    },

    clear() {
      storage.removeItem(STORAGE_KEY);
    },
  };
}

export type DiaryStorage = ReturnType<typeof createDiaryStorage>;
