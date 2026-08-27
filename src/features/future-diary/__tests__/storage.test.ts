import { createDiaryStorage } from '../storage';
import type { FutureDiary } from '../types';

const todayDiary: FutureDiary = {
  id: 'diary-today',
  targetDate: '2026-08-28',
  rawText: '我完成了方案第一版。',
  futureMessage: '第一版已经写下来了。开始比想象中轻一点。',
  model: 'chat-model',
  createdAt: '2026-08-27T10:36:00.000Z',
  moments: [
    {
      id: 'moment-1',
      title: '完成方案第一版',
      timeWindow: '上午',
      emotion: '踏实',
      status: 'pending',
    },
  ],
};

const tomorrowDiary: FutureDiary = {
  ...todayDiary,
  id: 'diary-tomorrow',
  targetDate: '2026-08-29',
  rawText: '我明天已经把剩下的部分写完了。',
};

function createMemoryStorage(initial: Record<string, string> = {}) {
  const values = { ...initial };
  return {
    getItem: jest.fn((key: string) => values[key] ?? null),
    setItem: jest.fn((key: string, next: string) => {
      values[key] = next;
    }),
    removeItem: jest.fn((key: string) => {
      delete values[key];
    }),
  };
}

describe('future diary storage', () => {
  it('saves and restores diaries by target date', () => {
    const storage = createDiaryStorage(createMemoryStorage());
    storage.save(todayDiary);
    storage.save(tomorrowDiary);

    expect(storage.loadByDate('2026-08-28')).toEqual(todayDiary);
    expect(storage.loadByDate('2026-08-29')).toEqual(tomorrowDiary);
    expect(storage.loadAll()).toEqual({
      '2026-08-28': todayDiary,
      '2026-08-29': tomorrowDiary,
    });
  });

  it('migrates a legacy latest diary into dated storage', () => {
    const storage = createDiaryStorage(
      createMemoryStorage({
        'future-diary:latest': JSON.stringify(todayDiary),
      }),
    );

    expect(storage.loadByDate('2026-08-28')).toEqual(todayDiary);
  });

  it('saves drafts separately from generated diaries', () => {
    const storage = createDiaryStorage(createMemoryStorage());
    storage.saveDraft('2026-08-29', '我明天已经出门走了一圈。');

    expect(storage.loadDraft('2026-08-29')).toBe('我明天已经出门走了一圈。');
    expect(storage.loadByDate('2026-08-29')).toBeNull();
  });

  it('returns null when persisted data is malformed', () => {
    const storage = createDiaryStorage(
      createMemoryStorage({ 'future-diary:by-date': '{not-json' }),
    );

    expect(storage.loadByDate('2026-08-28')).toBeNull();
  });
});
