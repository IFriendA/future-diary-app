import { addDays, formatDateKey } from './dates';
import type { StorageLike } from './storage';

const DEMO_DATE_KEY = 'future-diary:demo-date';
const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

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

export function applyDemoDate(realNow: Date, demoDateKey: string | null): Date {
  if (!demoDateKey || !DATE_KEY.test(demoDateKey)) return realNow;
  const [year, month, day] = demoDateKey.split('-').map(Number);
  return new Date(
    year,
    month - 1,
    day,
    realNow.getHours(),
    realNow.getMinutes(),
    realNow.getSeconds(),
    realNow.getMilliseconds(),
  );
}

export function nextDemoDateKey(current: Date): string {
  return formatDateKey(addDays(current, 1));
}

export function createDemoClockStorage(storage: StorageLike = getDefaultStorage()) {
  return {
    load(): string | null {
      const value = storage.getItem(DEMO_DATE_KEY);
      return value && DATE_KEY.test(value) ? value : null;
    },
    save(dateKey: string | null) {
      if (!dateKey) {
        storage.removeItem(DEMO_DATE_KEY);
        return;
      }
      storage.setItem(DEMO_DATE_KEY, dateKey);
    },
  };
}

export type DemoClockStorage = ReturnType<typeof createDemoClockStorage>;
