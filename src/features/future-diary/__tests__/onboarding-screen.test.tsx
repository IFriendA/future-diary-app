import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { FutureSelfOnboarding } from '../onboarding-screen';
import type { FutureSelfProfile } from '../profile';

const generatedPersona = {
  model: 'deepseek-v4-flash',
  nodes: {
    mbti: 'INFP',
    behavior: '先理解再行动',
    gap: '更果断',
    support: '温柔陪伴',
  },
  quote: '我是明天的你。我会记得你今天想做的事，也会在你犹豫时替你往前迈一步。',
  behaviorSummary: '先理解再行动',
  gapSummary: '更主动、更果断',
  supportSummary: '温柔陪伴',
};

describe('future-self onboarding', () => {
  it('requires MBTI, generates a persona, and confirms the future self', async () => {
    let completed: FutureSelfProfile | null = null;
    let resolvePersona: (value: typeof generatedPersona) => void = () => undefined;
    const pending = new Promise<typeof generatedPersona>((resolve) => {
      resolvePersona = resolve;
    });

    await render(
      <FutureSelfOnboarding
        now={() => new Date('2026-08-26T10:00:00.000Z')}
        stageDelayMs={0}
        generatePersona={async () => pending}
        onComplete={(profile) => {
          completed = profile;
        }}
      />,
    );

    expect(screen.getByText('认识未来的我')).toBeTruthy();
    await fireEvent.press(screen.getByText('开始'));
    expect(screen.getByText('选择你的 MBTI')).toBeTruthy();
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
    await fireEvent.press(screen.getByText('生成未来的我'));

    await screen.findByText('未来的我正在形成');
    expect(screen.queryByText('先理解再行动')).toBeNull();
    resolvePersona(generatedPersona);
    await screen.findByText('先理解再行动');
    await screen.findByText('这是未来的我');
    await fireEvent.press(screen.getByText('确认，这就是未来的我'));

    expect(completed).toEqual({
      mbti: 'INFP',
      behaviorLogic: '我做决定时会先感受自己是否认同，压力大时容易拖延，但明确第一步后就能开始。',
      futureSelfGap: '希望未来的我更敢表达真实想法，也能在犹豫时先行动。',
      supportStyle: 'gentle',
      personaQuote: generatedPersona.quote,
      behaviorSummary: '先理解再行动',
      gapSummary: '更主动、更果断',
      supportSummary: '温柔陪伴',
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

    await render(
      <FutureSelfOnboarding
        initialProfile={profile}
        generatePersona={async () => generatedPersona}
        onComplete={() => undefined}
      />,
    );

    expect(screen.getByText('选择你的 MBTI')).toBeTruthy();
    expect(screen.getByText('ENTJ')).toBeTruthy();
    await fireEvent.press(screen.getByText('下一步'));
    expect(screen.getByDisplayValue(profile.behaviorLogic)).toBeTruthy();
  });

  it('lets the user skip optional pages and still generate node keywords', async () => {
    const generatePersona = jest.fn(async (draft) => {
      expect(draft.behaviorLogic).toBe('');
      expect(draft.futureSelfGap).toBe('');
      return generatedPersona;
    });

    await render(
      <FutureSelfOnboarding
        stageDelayMs={0}
        generatePersona={generatePersona}
        onComplete={() => undefined}
      />,
    );

    await fireEvent.press(screen.getByText('开始'));
    await fireEvent.press(screen.getByText('INFP'));
    await fireEvent.press(screen.getByText('下一步'));
    await fireEvent.press(screen.getByText('下一步'));
    await fireEvent.press(screen.getByText('下一步'));
    await fireEvent.press(screen.getByText('温柔陪伴'));
    await fireEvent.press(screen.getByText('生成未来的我'));

    await waitFor(() => expect(generatePersona).toHaveBeenCalled());
    await screen.findByText('这是未来的我');
  });
});
