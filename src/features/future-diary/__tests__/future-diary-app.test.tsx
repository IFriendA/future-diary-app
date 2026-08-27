import { fireEvent, render, screen } from '@testing-library/react-native';

import { FutureDiaryApp } from '../future-diary-app';
import type { FutureSelfProfile } from '../profile';

const profile: FutureSelfProfile = {
  mbti: 'INFP',
  behaviorLogic: '我做决定时会先感受自己是否认同，压力大时容易拖延，但明确第一步后就能开始。',
  futureSelfGap: '希望未来的我更敢表达真实想法，也能在犹豫时先行动。',
  supportStyle: 'gentle',
  createdAt: '2026-08-26T10:00:00.000Z',
  updatedAt: '2026-08-26T10:00:00.000Z',
};

describe('future diary app profile routing', () => {
  it('shows onboarding when no profile is saved', async () => {
    await render(
      <FutureDiaryApp
        profileStorage={{ load: () => null, save: () => undefined, clear: () => undefined }}
      />,
    );

    expect(screen.getByText('认识未来的我')).toBeTruthy();
  });

  it('opens the diary for a saved profile and allows editing it', async () => {
    await render(
      <FutureDiaryApp
        profileStorage={{ load: () => profile, save: () => undefined, clear: () => undefined }}
      />,
    );

    expect(screen.getByText('先记得，再发生。')).toBeTruthy();
    await fireEvent.press(screen.getByText('调整未来的我'));
    expect(screen.getByText('选择你的 MBTI')).toBeTruthy();
  });
});

