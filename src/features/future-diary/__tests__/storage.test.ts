import { createDiaryStorage } from '../storage';
import type { FutureDiary } from '../types';

const diary: FutureDiary = {
  id: 'diary-1',
  targetDate: '2026-08-27',
  rawText: '我完成了明天的重要工作。',
  futureMessage: '我已经把最难的部分开了个头。',
  model: 'chat-model',
  createdAt: '2026-08-26T12:00:00.000Z',
  moments: [
    {
      id: 'moment-1',
      title: '完成重要工作',
      timeWindow: '上午',
      emotion: '踏实',
      status: 'pending',
    },
  ],
};

function createMemoryStorage(initial?: string) {
  let value = initial ?? null;

  return {
    getItem: jest.fn(() => value),
    setItem: jest.fn((_key: string, next: string) => {
      value = next;
    }),
    removeItem: jest.fn(() => {
      value = null;
    }),
  };
}

describe('future diary storage', () => {
  it('saves and restores the latest diary', () => {
    const backingStorage = createMemoryStorage();
    const storage = createDiaryStorage(backingStorage);

    storage.save(diary);

    expect(storage.load()).toEqual(diary);
  });

  it('returns null when persisted data is malformed', () => {
    const storage = createDiaryStorage(createMemoryStorage('{not-json'));

    expect(storage.load()).toBeNull();
  });

  it('clears the saved diary', () => {
    const backingStorage = createMemoryStorage(JSON.stringify(diary));
    const storage = createDiaryStorage(backingStorage);

    storage.clear();

    expect(storage.load()).toBeNull();
  });
});
