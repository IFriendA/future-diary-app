import { updateMomentStatus } from '../diary-state';
import type { FutureDiary } from '../types';

const diary: FutureDiary = {
  id: 'diary-1',
  targetDate: '2026-08-27',
  rawText: '明天上午我已经完成了提案，也认真吃了午饭。',
  futureMessage: '我已经来到这一天了。',
  model: 'deepseek-chat',
  createdAt: '2026-08-26T08:00:00.000Z',
  moments: [
    {
      id: 'moment-1',
      title: '完成提案',
      timeWindow: '上午',
      emotion: '踏实',
      status: 'pending',
    },
  ],
};

describe('updateMomentStatus', () => {
  it('changes only the selected moment without mutating the diary', () => {
    const updated = updateMomentStatus(diary, 'moment-1', 'fulfilled');

    expect(updated).not.toBe(diary);
    expect(updated.moments[0].status).toBe('fulfilled');
    expect(diary.moments[0].status).toBe('pending');
  });

  it('returns the original diary when the moment does not exist', () => {
    expect(updateMomentStatus(diary, 'missing', 'partial')).toBe(diary);
  });
});
