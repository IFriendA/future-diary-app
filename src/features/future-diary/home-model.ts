import { addDays, chineseDate, chineseWeekday, firstParagraph, formatClock, formatDateKey } from './dates';
import type { DiaryMoment, FutureDiary } from './types';

export type HomeModel = {
  todayKey: string;
  tomorrowKey: string;
  todayLabel: string;
  tomorrowLabel: string;
  pending: DiaryMoment[];
  fromTomorrowPreview: string | null;
  fromTomorrowTime: string | null;
  tomorrowDiary: FutureDiary | null;
};

export function buildHomeModel({
  diaries,
  now,
}: {
  diaries: Record<string, FutureDiary>;
  drafts?: Record<string, string>;
  now: Date;
}): HomeModel {
  const todayKey = formatDateKey(now);
  const tomorrowKey = formatDateKey(addDays(now, 1));
  const todayDiary = diaries[todayKey] ?? null;
  const tomorrowDiary = diaries[tomorrowKey] ?? null;

  return {
    todayKey,
    tomorrowKey,
    todayLabel: `${chineseDate(todayKey)}，${chineseWeekday(now)}`,
    tomorrowLabel: chineseDate(tomorrowKey),
    pending: (todayDiary?.moments ?? []).filter((moment) => moment.status === 'pending'),
    fromTomorrowPreview: tomorrowDiary ? firstParagraph(tomorrowDiary.futureMessage) || null : null,
    fromTomorrowTime: tomorrowDiary ? formatClock(tomorrowDiary.createdAt) : null,
    tomorrowDiary,
  };
}
