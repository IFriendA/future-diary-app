import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { FutureDiaryScreen } from '../diary-screen';
import type { FutureSelfProfile } from '../profile';
import type { FutureDiary } from '../types';

const profile: FutureSelfProfile = {
  mbti: 'INFP',
  behaviorLogic: '我做决定时会先感受自己是否认同，压力大时容易拖延，但明确第一步后就能开始。',
  futureSelfGap: '希望未来的我更敢表达真实想法，也能在犹豫时先行动。',
  supportStyle: 'gentle',
  createdAt: '2026-08-26T10:00:00.000Z',
  updatedAt: '2026-08-26T10:00:00.000Z',
};

const generatedDiary: FutureDiary = {
  id: 'diary-1',
  targetDate: '2026-08-27',
  rawText: '我明天上午已经写完了方案。',
  futureMessage: '我已经把方案写完了，现在心里很踏实。',
  model: 'chat-model',
  createdAt: '2026-08-26T12:00:00.000Z',
  moments: [
    {
      id: 'moment-1',
      title: '写完方案',
      timeWindow: '上午',
      emotion: '踏实',
      status: 'pending',
    },
  ],
};

describe('future diary screen', () => {
  it('generates a diary and lets the user mark a moment fulfilled', async () => {
    const savedDiary: { value: FutureDiary | null } = { value: null };
    const storage = {
      load: () => null,
      save: (diary: FutureDiary) => {
        savedDiary.value = diary;
      },
      clear: () => {
        savedDiary.value = null;
      },
    };

    await render(
      <FutureDiaryScreen
        client={{ generate: async () => generatedDiary }}
        profile={profile}
        storage={storage}
        now={() => new Date('2026-08-26T12:00:00.000Z')}
      />,
    );

    await fireEvent.changeText(
      screen.getByLabelText('写下明天的日记'),
      '我明天上午已经写完了方案。',
    );
    await fireEvent.press(screen.getByText('让明天的我先经历一次'));

    await screen.findByText('我已经把方案写完了，现在心里很踏实。');
    await fireEvent.press(screen.getByText('已经发生'));

    await waitFor(() => expect(screen.getByText('已实现')).toBeTruthy());
    expect(savedDiary.value?.moments[0].status).toBe('fulfilled');
  });

  it('restores a saved diary when the screen opens', async () => {
    await render(
      <FutureDiaryScreen
        client={{ generate: async () => generatedDiary }}
        profile={profile}
        storage={{ load: () => generatedDiary, save: () => undefined, clear: () => undefined }}
      />,
    );

    expect(screen.getByText('写完方案')).toBeTruthy();
    expect(screen.getByText('我已经把方案写完了，现在心里很踏实。')).toBeTruthy();
  });
});
