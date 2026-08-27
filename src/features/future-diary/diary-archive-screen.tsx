import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { buildArchiveModel, type ArchiveStatus } from './archive-model';
import { formatDateKey, shiftMonth } from './dates';
import type { FutureDiary } from './types';

const STATUS_COLOR: Record<ArchiveStatus, string> = {
  ongoing: '#3B82F6',
  responded: '#8B5CF6',
  realized: '#F97316',
};

type Props = {
  diaries: Record<string, FutureDiary>;
  now: Date;
  onOpen(date: string): void;
};

export function DiaryArchiveScreen({ diaries, now, onOpen }: Props) {
  const [month, setMonth] = useState(() => ({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  }));
  const [selectedDate, setSelectedDate] = useState(() => formatDateKey(now));
  const archive = buildArchiveModel({ diaries, now, month });

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <Text style={styles.pageTitle}>日记</Text>

      <View style={styles.card}>
        <View style={styles.monthRow}>
          <Pressable accessibilityLabel="上个月" onPress={() => setMonth(shiftMonth(month.year, month.month, -1))} style={styles.monthHit}>
            <Text style={styles.monthArrow}>‹</Text>
          </Pressable>
          <Text style={styles.monthLabel}>{archive.monthLabel}</Text>
          <Pressable accessibilityLabel="下个月" onPress={() => setMonth(shiftMonth(month.year, month.month, 1))} style={styles.monthHit}>
            <Text style={styles.monthArrow}>›</Text>
          </Pressable>
        </View>

        <View style={styles.weekRow}>
          {archive.weekdays.map((day) => (
            <Text key={day} style={styles.weekday}>
              {day}
            </Text>
          ))}
        </View>
        <View style={styles.grid}>
          {archive.cells.map((cell, index) => {
            const mark = archive.marks[cell.dateKey];
            const selected = cell.inMonth && cell.dateKey === selectedDate;
            return (
              <Pressable
                key={`${cell.dateKey}-${index}`}
                disabled={!cell.inMonth}
                onPress={() => {
                  setSelectedDate(cell.dateKey);
                  if (mark) onOpen(cell.dateKey);
                }}
                style={styles.cell}
              >
                <View style={[styles.dayWrap, selected && styles.daySelected]}>
                  <Text style={[styles.dayText, !cell.inMonth && styles.dayMuted, selected && styles.daySelectedText]}>
                    {cell.day}
                  </Text>
                </View>
                {cell.inMonth && mark ? <View style={[styles.dot, { backgroundColor: STATUS_COLOR[mark] }]} /> : <View style={styles.dotSpacer} />}
              </Pressable>
            );
          })}
        </View>
      </View>

      <Text style={styles.recentTitle}>最近</Text>
      {archive.recent.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.empty}>还没有写下的日记。</Text>
        </View>
      ) : (
        <View style={styles.card}>
          {archive.recent.map((item, index) => (
            <Pressable
              key={item.date}
              onPress={() => onOpen(item.date)}
              style={[styles.recentRow, index === archive.recent.length - 1 && styles.rowLast]}
            >
              <View style={styles.recentMain}>
                <Text style={styles.recentName}>{formatRecentTitle(item.date, item.title)}</Text>
                <Text style={styles.recentSnippet} numberOfLines={1}>
                  {item.snippet}
                </Text>
              </View>
              <Text style={[styles.recentStatus, { color: STATUS_COLOR[item.status] }]}>{item.statusLabel}</Text>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function formatRecentTitle(date: string, title: string) {
  const [, month, day] = date.split('-');
  return `${Number(month)}月${Number(day)}日 ${title}`;
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 16 },
  pageTitle: { color: '#111827', fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 16, marginTop: 4 },
  card: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  monthHit: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  monthArrow: { color: '#111827', fontSize: 28, lineHeight: 30, fontWeight: '300' },
  monthLabel: { color: '#111827', fontSize: 16, fontWeight: '800' },
  weekRow: { flexDirection: 'row', marginBottom: 6 },
  weekday: { flex: 1, textAlign: 'center', color: '#9CA3AF', fontSize: 12, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.28%', alignItems: 'center', paddingVertical: 6 },
  dayWrap: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  daySelected: { borderWidth: 1.5, borderColor: '#3B82F6' },
  dayText: { color: '#111827', fontSize: 14, fontWeight: '600' },
  daySelectedText: { color: '#3B82F6' },
  dayMuted: { color: '#D1D5DB' },
  dot: { width: 6, height: 6, borderRadius: 3, marginTop: 4 },
  dotSpacer: { height: 10 },
  recentTitle: { color: '#111827', fontSize: 18, fontWeight: '800', marginBottom: 10 },
  empty: { color: '#9CA3AF', fontSize: 14, lineHeight: 22 },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
    gap: 8,
  },
  rowLast: { borderBottomWidth: 0 },
  recentMain: { flex: 1 },
  recentName: { color: '#111827', fontSize: 15, fontWeight: '700', marginBottom: 4 },
  recentSnippet: { color: '#9CA3AF', fontSize: 13 },
  recentStatus: { fontSize: 13, fontWeight: '700' },
  chevron: { color: '#D1D5DB', fontSize: 20 },
});
