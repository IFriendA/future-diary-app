import type { FutureSelfProfile } from './profile';
import type { StorageLike } from './storage';

const PROFILE_STORAGE_KEY = 'future-diary:profile';

const memoryValues = new Map<string, string>();
const memoryStorage: StorageLike = {
  getItem: (key) => memoryValues.get(key) ?? null,
  setItem: (key, value) => memoryValues.set(key, value),
  removeItem: (key) => memoryValues.delete(key),
};

function getDefaultStorage(): StorageLike {
  if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
    return globalThis.localStorage as StorageLike;
  }
  return memoryStorage;
}

export function createProfileStorage(storage: StorageLike = getDefaultStorage()) {
  return {
    load(): FutureSelfProfile | null {
      try {
        const value = storage.getItem(PROFILE_STORAGE_KEY);
        return value ? (JSON.parse(value) as FutureSelfProfile) : null;
      } catch {
        return null;
      }
    },
    save(profile: FutureSelfProfile) {
      storage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    },
    clear() {
      storage.removeItem(PROFILE_STORAGE_KEY);
    },
  };
}

export type ProfileStorage = ReturnType<typeof createProfileStorage>;

