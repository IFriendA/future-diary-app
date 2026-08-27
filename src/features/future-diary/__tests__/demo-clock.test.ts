import { applyDemoDate, createDemoClockStorage } from '../demo-clock';

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

describe('applyDemoDate', () => {
  it('keeps the real clock when no demo date is set', () => {
    const realNow = new Date(2026, 7, 27, 21, 10, 4);
    expect(applyDemoDate(realNow, null).getTime()).toBe(realNow.getTime());
  });

  it('moves the calendar date without changing the time of day', () => {
    const realNow = new Date(2026, 7, 27, 21, 10, 4);
    const demo = applyDemoDate(realNow, '2026-08-28');

    expect(demo.getFullYear()).toBe(2026);
    expect(demo.getMonth()).toBe(7);
    expect(demo.getDate()).toBe(28);
    expect(demo.getHours()).toBe(21);
    expect(demo.getMinutes()).toBe(10);
    expect(demo.getSeconds()).toBe(4);
  });

  it('ignores malformed demo dates', () => {
    const realNow = new Date(2026, 7, 27, 9, 41);
    expect(applyDemoDate(realNow, 'not-a-date').getTime()).toBe(realNow.getTime());
  });
});

describe('demo clock storage', () => {
  it('starts empty and persists a demo date independently from diaries', () => {
    const backend = memory();
    const storage = createDemoClockStorage(backend);

    expect(storage.load()).toBeNull();
    storage.save('2026-08-29');
    expect(storage.load()).toBe('2026-08-29');
    expect(backend.values['future-diary:demo-date']).toBe('2026-08-29');
    expect(backend.values['future-diary:by-date']).toBeUndefined();
  });

  it('clears back to the real clock', () => {
    const storage = createDemoClockStorage(memory());
    storage.save('2026-08-29');
    storage.save(null);
    expect(storage.load()).toBeNull();
  });
});
