import type { StorageLike } from './storage';

const PREFS_KEY = 'future-diary:fragment-prefs';

export type FragmentPreferences = {
  enabled: boolean;
  startTime: string;
  endTime: string;
  dailyMin: number;
  dailyMax: number;
  dndStart: string;
  dndEnd: string;
};

export const defaultPreferences: FragmentPreferences = {
  enabled: true,
  startTime: '09:00',
  endTime: '22:00',
  dailyMin: 2,
  dailyMax: 4,
  dndStart: '22:00',
  dndEnd: '09:00',
};

function getDefaultStorage(): StorageLike {
  if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
    return globalThis.localStorage as StorageLike;
  }
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

function readPreferences(value: string | null): FragmentPreferences {
  if (!value) return { ...defaultPreferences };
  try {
    const parsed = JSON.parse(value) as Partial<FragmentPreferences>;
    return {
      enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : defaultPreferences.enabled,
      startTime: typeof parsed.startTime === 'string' ? parsed.startTime : defaultPreferences.startTime,
      endTime: typeof parsed.endTime === 'string' ? parsed.endTime : defaultPreferences.endTime,
      dailyMin: typeof parsed.dailyMin === 'number' ? parsed.dailyMin : defaultPreferences.dailyMin,
      dailyMax: typeof parsed.dailyMax === 'number' ? parsed.dailyMax : defaultPreferences.dailyMax,
      dndStart: typeof parsed.dndStart === 'string' ? parsed.dndStart : defaultPreferences.dndStart,
      dndEnd: typeof parsed.dndEnd === 'string' ? parsed.dndEnd : defaultPreferences.dndEnd,
    };
  } catch {
    return { ...defaultPreferences };
  }
}

export function createPreferenceStorage(storage: StorageLike = getDefaultStorage()) {
  return {
    load(): FragmentPreferences {
      return readPreferences(storage.getItem(PREFS_KEY));
    },
    save(prefs: FragmentPreferences) {
      storage.setItem(PREFS_KEY, JSON.stringify(prefs));
    },
  };
}

export type PreferenceStorage = ReturnType<typeof createPreferenceStorage>;
