export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date.getTime());
  next.setDate(next.getDate() + days);
  return next;
}

export function chineseDate(dateKey: string): string {
  const [, month, day] = dateKey.split('-');
  return `${Number(month)}月${Number(day)}日`;
}

export function chineseWeekday(date: Date): string {
  return ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()];
}

export function firstParagraph(text: string): string {
  return text.trim().split(/\n+/)[0] ?? '';
}

export function formatClock(iso: string): string {
  const date = new Date(iso);
  return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function monthLabel(year: number, month: number): string {
  return `${year}年${month}月`;
}

export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const next = new Date(year, month - 1 + delta, 1);
  return { year: next.getFullYear(), month: next.getMonth() + 1 };
}

export type CalendarCell = {
  dateKey: string;
  day: number;
  inMonth: boolean;
};

export function buildMonthCells(year: number, month: number): CalendarCell[] {
  const first = new Date(year, month - 1, 1);
  const pad = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month, 0).getDate();
  const prevDays = new Date(year, month - 1, 0).getDate();
  const cells: CalendarCell[] = [];

  for (let index = 0; index < pad; index += 1) {
    const day = prevDays - pad + 1 + index;
    cells.push({
      dateKey: formatDateKey(new Date(year, month - 2, day)),
      day,
      inMonth: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      dateKey: formatDateKey(new Date(year, month - 1, day)),
      day,
      inMonth: true,
    });
  }

  let nextDay = 1;
  while (cells.length % 7 !== 0) {
    cells.push({
      dateKey: formatDateKey(new Date(year, month, nextDay)),
      day: nextDay,
      inMonth: false,
    });
    nextDay += 1;
  }

  return cells;
}
