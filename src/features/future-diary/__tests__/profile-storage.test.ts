import { createProfileStorage } from '../profile-storage';
import type { FutureSelfProfile } from '../profile';

const profile: FutureSelfProfile = {
  mbti: 'INFP',
  behaviorLogic: '我做决定时会先感受自己是否认同，压力大时容易拖延，但明确第一步后就能开始。',
  futureSelfGap: '希望未来的我更敢表达真实想法，也能在犹豫时先行动。',
  supportStyle: 'gentle',
  createdAt: '2026-08-26T10:00:00.000Z',
  updatedAt: '2026-08-26T10:00:00.000Z',
};

describe('future-self profile storage', () => {
  it('persists the profile under a key independent from the diary', () => {
    const values = new Map<string, string>();
    const storage = createProfileStorage({
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
      removeItem: (key) => values.delete(key),
    });

    storage.save(profile);

    expect(storage.load()).toEqual(profile);
    expect(values.has('future-diary:profile')).toBe(true);
    expect(values.has('future-diary:latest')).toBe(false);
  });

  it('ignores malformed stored JSON', () => {
    const storage = createProfileStorage({
      getItem: () => '{broken',
      setItem: () => undefined,
      removeItem: () => undefined,
    });

    expect(storage.load()).toBeNull();
  });
});

