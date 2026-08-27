import { fireEvent, render, screen } from '@testing-library/react-native';

import { FutureDiaryScreen } from '../diary-screen';
import type { FutureSelfProfile } from '../profile';
import { createDiaryStorage } from '../storage';
import type { FutureDiary } from '../types';

const profile: FutureSelfProfile = {
  mbti: 'INFP',
  behaviorLogic: '我做决定时会先感受自己是否认同，压力大时容易拖延，但明确第一步后就能开始。',
  futureSelfGap: '希望未来的我更敢表达真实想法，也能在犹豫时先行动。',
  supportStyle: 'gentle',
  createdAt: '2026-08-26T10:00:00.000Z',
  updatedAt: '2026-08-26T10:00:00.000Z',
};

const todayDiary: FutureDiary = {
  id: 'diary-today',
  targetDate: '2026-08-28',
  rawText: '我完成了方案第一版，也出门走了一会儿。',
  futureMessage: '第一版已经写下来了。开始比想象中轻一点。\n\n下午的散步让我松下来了。',
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
    {
      id: 'moment-2',
      title: '出去走一会儿',
      timeWindow: '下午',
      emotion: '轻松',
      status: 'fulfilled',
    },
    {
      id: 'moment-3',
      title: '早点休息',
      timeWindow: '晚上',
      emotion: '安心',
      status: 'pending',
    },
  ],
};

const tomorrowDiary: FutureDiary = {
  id: 'diary-tomorrow',
  targetDate: '2026-08-29',
  rawText: '我明天已经把剩下的部分写完了。',
  futureMessage: '剩下的部分我也写完了。没有那么赶。\n\n这一天比预想中安静。',
  model: 'chat-model',
  createdAt: '2026-08-28T02:36:00.000Z',
  moments: [
    {
      id: 'moment-4',
      title: '写完剩下的部分',
      timeWindow: '上午',
      emotion: '踏实',
      status: 'pending',
    },
  ],
};

const generatedTomorrow: FutureDiary = {
  ...tomorrowDiary,
  id: 'diary-generated',
  rawText: '我明天上午已经写完了方案第一版，也出门走了一会儿。',
  futureMessage: '第一版已经写下来了。开始比想象中轻一点。',
  moments: [
    {
      id: 'moment-new',
      title: '完成方案第一版',
      timeWindow: '上午',
      emotion: '踏实',
      status: 'pending',
    },
  ],
};

function createMemoryStorage(initial: Record<string, string> = {}) {
  const values = { ...initial };
  return {
    getItem: (key: string) => values[key] ?? null,
    setItem: (key: string, next: string) => {
      values[key] = next;
    },
    removeItem: (key: string) => {
      delete values[key];
    },
  };
}

function seedStorage(diaries: FutureDiary[] = [], drafts: Record<string, string> = {}) {
  const storage = createDiaryStorage(createMemoryStorage());
  diaries.forEach((diary) => storage.save(diary));
  Object.entries(drafts).forEach(([date, text]) => storage.saveDraft(date, text));
  return storage;
}

async function renderToday(options?: {
  diaries?: FutureDiary[];
  drafts?: Record<string, string>;
  generate?: (input: {
    diaryText: string;
    targetDate: string;
    profile: FutureSelfProfile;
  }) => Promise<FutureDiary>;
  storage?: ReturnType<typeof createDiaryStorage>;
}) {
  const storage = options?.storage ?? seedStorage(options?.diaries, options?.drafts);
  const generate = options?.generate ?? (async () => generatedTomorrow);
  await render(
    <FutureDiaryScreen
      client={{ generate }}
      profile={profile}
      storage={storage}
      now={() => new Date(2026, 7, 28, 9, 41)}
    />,
  );
  return { storage, generate };
}

describe('today home screen', () => {
  it('keeps the three home sections in place even when they are empty', async () => {
    await renderToday({ diaries: [] });

    expect(screen.getByText('8月28日，周五')).toBeTruthy();
    expect(screen.getByText('待回应')).toBeTruthy();
    expect(screen.getByText('0件事等我回应')).toBeTruthy();
    expect(screen.getByText('来自明天')).toBeTruthy();
    expect(screen.getByText('明天的回信会写在这里。')).toBeTruthy();
    expect(screen.getByText('写给明天')).toBeTruthy();
    expect(screen.getByText('8月29日')).toBeTruthy();
    expect(screen.getByText('＋ 写下明天')).toBeTruthy();
    expect(screen.getByText('今天')).toBeTruthy();
    expect(screen.getByText('日记')).toBeTruthy();
    expect(screen.getByText('我的')).toBeTruthy();
  });

  it('shows pending today moments and tomorrow letter preview', async () => {
    await renderToday({ diaries: [todayDiary, tomorrowDiary] });

    expect(screen.getByText('待回应')).toBeTruthy();
    expect(screen.getByText('2件事等我回应')).toBeTruthy();
    expect(screen.getByText('完成方案第一版')).toBeTruthy();
    expect(screen.getByText('早点休息')).toBeTruthy();
    expect(screen.queryByText('出去走一会儿')).toBeNull();
    expect(screen.getByText('来自明天')).toBeTruthy();
    expect(screen.getByText('剩下的部分我也写完了。没有那么赶。')).toBeTruthy();
    expect(screen.queryByText('这一天比预想中安静。')).toBeNull();
    expect(screen.queryByText('＋ 写下明天')).toBeNull();
    expect(screen.getByText('查看回信')).toBeTruthy();
    expect(screen.getByText('编辑')).toBeTruthy();
  });

  it('lets the user respond to a pending moment and persists the status', async () => {
    const { storage } = await renderToday({ diaries: [todayDiary] });

    await fireEvent.press(screen.getByText('完成方案第一版'));
    expect(screen.getByText('回应今天')).toBeTruthy();
    expect(screen.getByText('后来怎么样了？')).toBeTruthy();

    await fireEvent.press(screen.getByText('做到一部分'));
    expect(screen.getByText('我已经开始了，这一部分也算数。')).toBeTruthy();

    await fireEvent.press(screen.getByText('确认'));
    expect(screen.getByText('待回应')).toBeTruthy();
    expect(screen.queryByText('完成方案第一版')).toBeNull();
    expect(screen.getByText('早点休息')).toBeTruthy();
    expect(storage.loadByDate('2026-08-28')?.moments[0].status).toBe('partial');
  });

  it('opens the full letter, hides old copy, and returns home on 收下', async () => {
    await renderToday({ diaries: [tomorrowDiary] });

    await fireEvent.press(screen.getByText('查看完整回信'));
    expect(screen.getByText('8月29日 · 来自明天')).toBeTruthy();
    expect(screen.getByText('剩下的部分我也写完了。没有那么赶。\n\n这一天比预想中安静。')).toBeTruthy();
    expect(screen.getByText('明天的我')).toBeTruthy();
    expect(screen.getByText('我记住了一件事')).toBeTruthy();
    expect(screen.queryByText('我从明天写回来')).toBeNull();
    expect(screen.queryByText('今天')).toBeNull();

    await fireEvent.press(screen.getByText('收下'));
    expect(screen.getByText('来自明天')).toBeTruthy();
    expect(screen.getByText('今天')).toBeTruthy();
  });

  it('opens the paper editor from 写下明天, autosaves a draft, and restores it', async () => {
    const { storage } = await renderToday({ diaries: [] });

    await fireEvent.press(screen.getByText('＋ 写下明天'));
    expect(screen.getByText('8月29日 · 明天')).toBeTruthy();
    expect(screen.getByText('已保存')).toBeTruthy();
    expect(screen.queryByText('让明天的我先经历一次')).toBeNull();

    await fireEvent.changeText(
      screen.getByLabelText('写下明天的日记'),
      '我明天上午已经写完了方案第一版。',
    );
    expect(storage.loadDraft('2026-08-29')).toBe('我明天上午已经写完了方案第一版。');

    await fireEvent.press(screen.getByLabelText('返回'));
    await fireEvent.press(screen.getByText('＋ 写下明天'));
    expect(screen.getByLabelText('写下明天的日记').props.value).toBe(
      '我明天上午已经写完了方案第一版。',
    );
  });

  it('submits the editor to the existing AI client and opens the letter', async () => {
    const generate = jest.fn(async () => generatedTomorrow);
    await renderToday({ generate });

    await fireEvent.press(screen.getByText('＋ 写下明天'));
    await fireEvent.changeText(
      screen.getByLabelText('写下明天的日记'),
      '我明天上午已经写完了方案第一版，也出门走了一会儿。',
    );
    await fireEvent.press(screen.getByText('写好了'));

    await screen.findByText('8月29日 · 来自明天');
    expect(generate).toHaveBeenCalledWith({
      diaryText: '我明天上午已经写完了方案第一版，也出门走了一会儿。',
      targetDate: '2026-08-29',
      profile,
    });
    expect(screen.getByText('第一版已经写下来了。开始比想象中轻一点。')).toBeTruthy();
  });

  it('keeps the original text after a failed submit so the user can retry', async () => {
    let shouldFail = true;
    const generate = jest.fn(async () => {
      if (shouldFail) {
        shouldFail = false;
        throw new Error('未来的我暂时没有回信，请稍后再试。');
      }
      return generatedTomorrow;
    });
    await renderToday({ generate });

    await fireEvent.press(screen.getByText('＋ 写下明天'));
    await fireEvent.changeText(
      screen.getByLabelText('写下明天的日记'),
      '我明天上午已经写完了方案第一版，也出门走了一会儿。',
    );
    await fireEvent.press(screen.getByText('写好了'));

    await screen.findByText('未来的我暂时没有回信，请稍后再试。');
    expect(screen.getByLabelText('写下明天的日记').props.value).toBe(
      '我明天上午已经写完了方案第一版，也出门走了一会儿。',
    );

    await fireEvent.press(screen.getByText('写好了'));
    await screen.findByText('8月29日 · 来自明天');
    expect(generate).toHaveBeenCalledTimes(2);
  });

  it('opens the editor from 修改原文 with the original diary text', async () => {
    await renderToday({ diaries: [tomorrowDiary] });

    await fireEvent.press(screen.getByText('查看完整回信'));
    await fireEvent.press(screen.getByText('修改原文'));
    expect(screen.getByText('8月29日 · 明天')).toBeTruthy();
    expect(screen.getByLabelText('写下明天的日记').props.value).toBe(tomorrowDiary.rawText);
  });

  it('does not navigate when 日记 or 我的 is shown', async () => {
    await renderToday({ diaries: [] });
    expect(screen.getByText('写给明天')).toBeTruthy();
    expect(screen.getByText('日记')).toBeTruthy();
    expect(screen.getByText('我的')).toBeTruthy();
    expect(screen.queryByText('日记页面')).toBeNull();
  });
});
