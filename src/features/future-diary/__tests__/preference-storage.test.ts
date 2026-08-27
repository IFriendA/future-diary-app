import { createPreferenceStorage, defaultPreferences } from '../preference-storage';

function memory() {
  const values: Record<string, string> = {};
  return {
    getItem: (key: string) => values[key] ?? null,
    setItem: (key: string, next: string) => {
      values[key] = next;
    },
    removeItem: (key: string) => {
      delete values[key];
    },
    values,
  };
}

describe('fragment preference storage', () => {
  it('returns defaults when nothing is saved', () => {
    const storage = createPreferenceStorage(memory());
    expect(storage.load()).toEqual(defaultPreferences);
  });

  it('persists fragment notification preferences independently from diaries', () => {
    const backend = memory();
    const storage = createPreferenceStorage(backend);
    storage.save({
      ...defaultPreferences,
      enabled: false,
      dailyMin: 1,
      dailyMax: 2,
    });

    expect(storage.load()).toMatchObject({ enabled: false, dailyMin: 1, dailyMax: 2 });
    expect(backend.values['future-diary:fragment-prefs']).toBeTruthy();
    expect(backend.values['future-diary:by-date']).toBeUndefined();
    expect(backend.values['future-diary:profile']).toBeUndefined();
  });

  it('falls back to defaults when stored JSON is malformed', () => {
    const storage = createPreferenceStorage({
      getItem: () => '{broken',
      setItem: () => undefined,
      removeItem: () => undefined,
    });

    expect(storage.load()).toEqual(defaultPreferences);
  });
});
