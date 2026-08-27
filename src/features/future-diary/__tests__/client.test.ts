import { FutureDiaryClientError, createFutureDiaryClient } from '../client';

const profile = {
  mbti: 'INFP',
  behaviorLogic: '我做决定时会先感受自己是否认同，压力大时容易拖延，但明确第一步后就能开始。',
  futureSelfGap: '希望未来的我更敢表达真实想法，也能在犹豫时先行动。',
  supportStyle: 'gentle',
  createdAt: '2026-08-26T10:00:00.000Z',
  updatedAt: '2026-08-26T10:00:00.000Z',
} as const;

describe('future diary client', () => {
  it('turns the server response into a pending diary', async () => {
    let sentUrl = '';
    let sentBody = '';
    const client = createFutureDiaryClient({
      fetchImpl: async (url, init) => {
        sentUrl = url;
        sentBody = init?.body ?? '';
        return {
          ok: true,
          status: 200,
          json: async () => ({
            futureMessage: '我已经把这一天走完了。',
            model: 'chat-model',
            moments: [
              {
                id: 'moment-1',
                title: '写完方案',
                timeWindow: '上午',
                emotion: '踏实',
              },
            ],
          }),
        };
      },
      now: () => new Date('2026-08-26T12:00:00.000Z'),
    });

    const diary = await client.generate({
      diaryText: '我明天上午已经写完了方案。',
      targetDate: '2026-08-27',
      profile,
    });

    expect(sentUrl).toBe('/api/future-self');
    expect(JSON.parse(sentBody)).toEqual({
      diaryText: '我明天上午已经写完了方案。',
      targetDate: '2026-08-27',
      profile,
    });
    expect(diary).toEqual({
      id: 'diary-1787745600000',
      targetDate: '2026-08-27',
      rawText: '我明天上午已经写完了方案。',
      futureMessage: '我已经把这一天走完了。',
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
    });
  });

  it('surfaces the safe error returned by the server', async () => {
    const client = createFutureDiaryClient({
      fetchImpl: async () => ({
        ok: false,
        status: 429,
        json: async () => ({ error: '今天的回信有点多，请十分钟后再试。' }),
      }),
    });

    await expect(
      client.generate({
        diaryText: '我明天上午已经写完了方案。',
        targetDate: '2026-08-27',
        profile,
      }),
    ).rejects.toEqual(
      new FutureDiaryClientError('今天的回信有点多，请十分钟后再试。', 429),
    );
  });

  it('hides malformed upstream responses behind a safe message', async () => {
    const client = createFutureDiaryClient({
      fetchImpl: async () => ({
        ok: false,
        status: 502,
        json: async () => {
          throw new SyntaxError("Unexpected token '<'");
        },
      }),
    });

    await expect(
      client.generate({
        diaryText: '我明天上午已经写完了方案。',
        targetDate: '2026-08-27',
        profile,
      }),
    ).rejects.toEqual(
      new FutureDiaryClientError('未来的我暂时没有回信，请稍后再试。', 502),
    );
  });

  it('asks the server to generate a future persona from onboarding answers', async () => {
    let sentUrl = '';
    let sentBody = '';
    const client = createFutureDiaryClient({
      fetchImpl: async (url, init) => {
        sentUrl = url;
        sentBody = init?.body ?? '';
        return {
          ok: true,
          status: 200,
          json: async () => ({
            model: 'deepseek-v4-flash',
            nodes: {
              mbti: 'INFP',
              behavior: '先理解再行动',
              gap: '更果断',
              support: '温柔陪伴',
            },
            quote: '我是明天的你。我会记得你今天想做的事。',
            behaviorSummary: '先理解再行动',
            gapSummary: '更主动、更果断',
            supportSummary: '温柔陪伴',
          }),
        };
      },
    });

    await expect(
      client.generatePersona({
        mbti: 'INFP',
        behaviorLogic: profile.behaviorLogic,
        futureSelfGap: profile.futureSelfGap,
        supportStyle: 'gentle',
      }),
    ).resolves.toMatchObject({
      nodes: { behavior: '先理解再行动', gap: '更果断' },
      quote: '我是明天的你。我会记得你今天想做的事。',
    });
    expect(sentUrl).toBe('/api/future-persona');
    expect(JSON.parse(sentBody)).toMatchObject({ mbti: 'INFP', supportStyle: 'gentle' });
  });
});
