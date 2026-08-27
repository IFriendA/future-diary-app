import { buildArchiveModel, diaryArchiveStatus, diaryTitle } from '../archive-model';
import type { FutureDiary } from '../types';

const ongoing: FutureDiary = {
  id: 'd1',
  targetDate: '2026-08-29',
  rawText: '我明天已经把剩下的部分写完了。',
  futureMessage: '剩下的部分我也写完了。',
  model: 'chat-model',
  createdAt: '2026-08-28T13:42:00.000Z',
  moments: [
    {
      id: 'm1',
      title: '写完剩下的部分',
      timeWindow: '上午',
      emotion: '踏实',
      status: 'pending',
    },
  ],
};

const responded: FutureDiary = {
  id: 'd2',
  targetDate: '2026-08-28',
  rawText: '我完成了方案第一版，也出门走了一会儿。',
  futureMessage: '第一版已经写下来了。开始比想象中轻一点。',
  model: 'chat-model',
  createdAt: '2026-08-27T13:42:00.000Z',
  moments: [
    {
      id: 'm1',
      title: '完成方案第一版',
      timeWindow: '上午',
      emotion: '踏实',
      status: 'partial',
    },
    {
      id: 'm2',
      title: '出去走一会儿',
      timeWindow: '下午',
      emotion: '轻松',
      status: 'fulfilled',
    },
    {
      id: 'm3',
      title: '早点休息',
      timeWindow: '晚上',
      emotion: '安心',
      status: 'carried',
    },
  ],
};

const realized: FutureDiary = {
  id: 'd3',
  targetDate: '2026-08-21',
  rawText: '我把这一天过完了。',
  futureMessage: '这一天被我好好过完了。',
  model: 'chat-model',
  createdAt: '2026-08-20T21:10:00.000Z',
  moments: [
    {
      id: 'm1',
      title: '早点休息',
      timeWindow: '晚上',
      emotion: '安心',
      status: 'fulfilled',
    },
  ],
};

describe('diary archive model', () => {
  const now = new Date(2026, 7, 28, 9, 41);

  it('uses the first moment title, otherwise the first sentence of the original text', () => {
    expect(diaryTitle(responded)).toBe('完成方案第一版');
    expect(
      diaryTitle({
        ...responded,
        moments: [],
        rawText: '第一版已经写下来了。开始比想象中轻一点。',
      }),
    ).toBe('第一版已经写下来了');
  });

  it('derives 进行中／已回应／已实现 from date and moment status', () => {
    expect(diaryArchiveStatus(ongoing, now)).toBe('ongoing');
    expect(diaryArchiveStatus(responded, now)).toBe('responded');
    expect(diaryArchiveStatus(realized, now)).toBe('realized');
  });

  it('builds a Monday-start calendar with status marks and a recent list', () => {
    const archive = buildArchiveModel({
      diaries: {
        '2026-08-29': ongoing,
        '2026-08-28': responded,
        '2026-08-21': realized,
      },
      now,
      month: { year: 2026, month: 8 },
    });

    expect(archive.monthLabel).toBe('2026年8月');
    expect(archive.weekdays).toEqual(['一', '二', '三', '四', '五', '六', '日']);
    expect(archive.cells[0].inMonth).toBe(false);
    expect(archive.cells.find((cell) => cell.dateKey === '2026-08-01')?.day).toBe(1);
    expect(archive.marks['2026-08-29']).toBe('ongoing');
    expect(archive.marks['2026-08-28']).toBe('responded');
    expect(archive.marks['2026-08-21']).toBe('realized');
    expect(archive.recent.map((item) => item.date)).toEqual(['2026-08-29', '2026-08-28', '2026-08-21']);
    expect(archive.recent[1]).toMatchObject({
      title: '完成方案第一版',
      statusLabel: '已回应',
    });
  });

  it('shifts the visible month without changing stored diaries', () => {
    const next = buildArchiveModel({
      diaries: { '2026-08-28': responded },
      now,
      month: { year: 2026, month: 9 },
    });

    expect(next.monthLabel).toBe('2026年9月');
    expect(next.cells.some((cell) => cell.dateKey === '2026-09-01' && cell.inMonth)).toBe(true);
    expect(next.recent).toHaveLength(1);
  });
});
