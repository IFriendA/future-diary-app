import { fireEvent, render, screen } from '@testing-library/react-native';

import { FutureSelfOnboarding } from '../onboarding-screen';
import type { FutureSelfProfile } from '../profile';

describe('future-self onboarding', () => {
  it('requires MBTI and completes the four profile steps', async () => {
    let completed: FutureSelfProfile | null = null;
    await render(
      <FutureSelfOnboarding
        now={() => new Date('2026-08-26T10:00:00.000Z')}
        onComplete={(profile) => {
          completed = profile;
        }}
      />,
    );

    expect(screen.getByText('先选出我的 MBTI')).toBeTruthy();
    expect(screen.getByText('下一步')).toBeDisabled();

    await fireEvent.press(screen.getByText('INFP'));
    await fireEvent.press(screen.getByText('下一步'));
    await fireEvent.changeText(
      screen.getByLabelText('我的行为逻辑'),
      '我做决定时会先感受自己是否认同，压力大时容易拖延，但明确第一步后就能开始。',
    );
    await fireEvent.press(screen.getByText('下一步'));
    await fireEvent.changeText(
      screen.getByLabelText('希望未来的我补足什么'),
      '希望未来的我更敢表达真实想法，也能在犹豫时先行动。',
    );
    await fireEvent.press(screen.getByText('下一步'));
    await fireEvent.press(screen.getByText('温柔陪伴'));
    await fireEvent.press(screen.getByText('开始写未来日记'));

    expect(completed).toEqual({
      mbti: 'INFP',
      behaviorLogic: '我做决定时会先感受自己是否认同，压力大时容易拖延，但明确第一步后就能开始。',
      futureSelfGap: '希望未来的我更敢表达真实想法，也能在犹豫时先行动。',
      supportStyle: 'gentle',
      createdAt: '2026-08-26T10:00:00.000Z',
      updatedAt: '2026-08-26T10:00:00.000Z',
    });
  });

  it('prefills an existing profile for editing', async () => {
    const profile: FutureSelfProfile = {
      mbti: 'ENTJ',
      behaviorLogic: '我习惯快速判断和推进，但压力大时会忽略自己的真实感受和身体状态。',
      futureSelfGap: '希望未来的我做决定时更稳定，也愿意给自己一点余地。',
      supportStyle: 'direct',
      createdAt: '2026-08-25T10:00:00.000Z',
      updatedAt: '2026-08-25T10:00:00.000Z',
    };

    await render(<FutureSelfOnboarding initialProfile={profile} onComplete={() => undefined} />);

    expect(screen.getByText('ENTJ')).toBeTruthy();
    await fireEvent.press(screen.getByText('下一步'));
    expect(screen.getByDisplayValue(profile.behaviorLogic)).toBeTruthy();
  });
});

