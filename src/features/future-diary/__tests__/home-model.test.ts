import { buildHomeModel } from '../home-model';
import type { FutureDiary } from '../types';

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
  futureMessage: '剩下的部分我也写完了。没有那么赶。',
  model: 'chat-model',
  createdAt: '2026-08-28T21:10:00.000Z',
  moments: [],
};

describe('today home model', () => {
  it('puts pending moments from today into 待回应 and hides completed ones', () => {
    const home = buildHomeModel({
      diaries: { '2026-08-28': todayDiary },
      drafts: {},
      now: new Date(2026, 7, 28, 9, 41),
    });

    expect(home.todayLabel).toBe('8月28日，周五');
    expect(home.pending.map((item) => item.title)).toEqual(['完成方案第一版', '早点休息']);
  });

  it('uses the first paragraph of tomorrow’s reply as 来自明天 preview', () => {
    const home = buildHomeModel({
      diaries: { '2026-08-28': todayDiary, '2026-08-29': tomorrowDiary },
      drafts: {},
      now: new Date(2026, 7, 28, 9, 41),
    });

    expect(home.fromTomorrowPreview).toBe('剩下的部分我也写完了。没有那么赶。');
    expect(home.tomorrowDiary?.id).toBe('diary-tomorrow');
  });

  it('hides empty sections when there is no today diary and no tomorrow reply', () => {
    const home = buildHomeModel({
      diaries: {},
      drafts: {},
      now: new Date(2026, 7, 28, 9, 41),
    });

    expect(home.pending).toEqual([]);
    expect(home.fromTomorrowPreview).toBeNull();
    expect(home.tomorrowDiary).toBeNull();
    expect(home.tomorrowLabel).toBe('8月29日');
  });
});
