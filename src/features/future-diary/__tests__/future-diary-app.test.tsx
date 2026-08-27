import { fireEvent, render, screen } from '@testing-library/react-native';

import { FutureDiaryApp } from '../future-diary-app';
import type { FutureSelfProfile } from '../profile';
import { createDiaryStorage } from '../storage';

const profile: FutureSelfProfile = {
  mbti: 'INFP',
  behaviorLogic: '我做决定时会先感受自己是否认同，压力大时容易拖延，但明确第一步后就能开始。',
  futureSelfGap: '希望未来的我更敢表达真实想法，也能在犹豫时先行动。',
  supportStyle: 'gentle',
  createdAt: '2026-08-26T10:00:00.000Z',
  updatedAt: '2026-08-26T10:00:00.000Z',
};

function emptyDiaryStorage() {
  const values: Record<string, string> = {};
  return createDiaryStorage({
    getItem: (key) => values[key] ?? null,
    setItem: (key, next) => {
      values[key] = next;
    },
    removeItem: (key) => {
      delete values[key];
    },
  });
}

describe('future diary app profile routing', () => {
  it('shows onboarding when no profile is saved', async () => {
    await render(
      <FutureDiaryApp
        diaryStorage={emptyDiaryStorage()}
        profileStorage={{ load: () => null, save: () => undefined, clear: () => undefined }}
      />,
    );

    expect(screen.getByText('认识未来的我')).toBeTruthy();
  });

  it('opens the diary for a saved profile and allows editing it', async () => {
    await render(
      <FutureDiaryApp
        diaryStorage={emptyDiaryStorage()}
        now={() => new Date(2026, 7, 28, 9, 41)}
        profileStorage={{ load: () => profile, save: () => undefined, clear: () => undefined }}
      />,
    );

    expect(screen.getByText('写给明天')).toBeTruthy();
    await fireEvent.press(screen.getByText('我的'));
    await fireEvent.press(screen.getByText('未来人格'));
    await fireEvent.press(screen.getByText('编辑'));
    expect(screen.getByText('选择你的 MBTI')).toBeTruthy();
  });
});
