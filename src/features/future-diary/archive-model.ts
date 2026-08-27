import { buildMonthCells, firstParagraph, formatDateKey, monthLabel } from './dates';
import type { FutureDiary } from './types';

export type ArchiveStatus = 'ongoing' | 'responded' | 'realized';

export const ARCHIVE_STATUS_LABEL: Record<ArchiveStatus, string> = {
  ongoing: '进行中',
  responded: '已回应',
  realized: '已实现',
};

export type ArchiveItem = {
  date: string;
  title: string;
  snippet: string;
  status: ArchiveStatus;
  statusLabel: string;
};

export type ArchiveModel = {
  monthLabel: string;
  weekdays: string[];
  cells: ReturnType<typeof buildMonthCells>;
  marks: Record<string, ArchiveStatus>;
  recent: ArchiveItem[];
};

export function diaryTitle(diary: FutureDiary): string {
  const momentTitle = diary.moments[0]?.title.trim();
  if (momentTitle) return momentTitle;
  const line = firstParagraph(diary.rawText);
  return line.split(/[。！？]/)[0]?.trim() || '未命名的一天';
}

export function diaryArchiveStatus(diary: FutureDiary, now: Date): ArchiveStatus {
  const todayKey = formatDateKey(now);
  if (diary.moments.length === 0) {
    return diary.targetDate > todayKey ? 'ongoing' : 'responded';
  }
  if (diary.moments.some((moment) => moment.status === 'pending')) {
    return 'ongoing';
  }
  if (diary.moments.every((moment) => moment.status === 'fulfilled')) {
    return 'realized';
  }
  return 'responded';
}

export function buildArchiveModel({
  diaries,
  now,
  month,
}: {
  diaries: Record<string, FutureDiary>;
  now: Date;
  month: { year: number; month: number };
}): ArchiveModel {
  const marks: Record<string, ArchiveStatus> = {};
  const recent = Object.values(diaries)
    .sort((left, right) => right.targetDate.localeCompare(left.targetDate))
    .map((diary) => {
      const status = diaryArchiveStatus(diary, now);
      marks[diary.targetDate] = status;
      return {
        date: diary.targetDate,
        title: diaryTitle(diary),
        snippet: firstParagraph(diary.rawText) || firstParagraph(diary.futureMessage),
        status,
        statusLabel: ARCHIVE_STATUS_LABEL[status],
      };
    });

  return {
    monthLabel: monthLabel(month.year, month.month),
    weekdays: ['一', '二', '三', '四', '五', '六', '日'],
    cells: buildMonthCells(month.year, month.month),
    marks,
    recent,
  };
}
