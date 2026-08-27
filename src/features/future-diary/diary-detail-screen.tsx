import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { diaryTitle } from './archive-model';
import { chineseDate, firstParagraph, formatClock, formatDateKey } from './dates';
import type { FutureDiary, MomentStatus } from './types';

const MOMENT_LABEL: Record<MomentStatus, string> = {
  pending: '待确认',
  fulfilled: '已经发生',
  partial: '做到一部分',
  carried: '明天继续',
};

const MOMENT_COLOR: Record<MomentStatus, string> = {
  pending: '#9CA3AF',
  fulfilled: '#8B5CF6',
  partial: '#F97316',
  carried: '#60A5FA',
};

type Props = {
  diary: FutureDiary;
  onBack(): void;
  onOpenLetter(): void;
  onEdit(): void;
};

export function DiaryDetailScreen({ diary, onBack, onOpenLetter, onEdit }: Props) {
  const writtenOn = formatDateKey(new Date(diary.createdAt));

  return (
    <View style={styles.page}>
      <View style={styles.topBar}>
        <Pressable accessibilityLabel="返回" onPress={onBack} style={styles.backHit}>
          <Text style={styles.backGlyph}>‹</Text>
        </Pressable>
        <Text style={styles.topTitle}>{chineseDate(diary.targetDate)}</Text>
        <View style={styles.backHit} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{diaryTitle(diary)}</Text>
        <Text style={styles.written}>
          写于{chineseDate(writtenOn)} {formatClock(diary.createdAt)}
        </Text>

        <Text style={styles.sectionTitle}>我写下的明天</Text>
        <Text style={styles.bodyText}>{diary.rawText}</Text>

        <View style={styles.replyHeader}>
          <View style={styles.liveDot} />
          <Text style={styles.sectionTitle}>来自明天的回信</Text>
        </View>
        <View style={styles.quote}>
          <Text style={styles.bodyText}>{firstParagraph(diary.futureMessage) || diary.futureMessage}</Text>
        </View>
        <Pressable onPress={onOpenLetter}>
          <Text style={styles.link}>查看完整回信</Text>
        </Pressable>

        <Text style={[styles.sectionTitle, styles.laterTitle]}>后来发生了</Text>
        {diary.moments.map((moment, index) => (
          <View key={moment.id} style={[styles.momentRow, index === diary.moments.length - 1 && styles.rowLast]}>
            <Text style={styles.momentTitle}>{moment.title}</Text>
            <Text style={[styles.momentStatus, { color: MOMENT_COLOR[moment.status] }]}>
              {MOMENT_LABEL[moment.status]}
            </Text>
          </View>
        ))}
      </ScrollView>

      <Pressable onPress={onEdit} style={styles.editHit}>
        <Text style={styles.link}>编辑日记</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  backHit: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backGlyph: { color: '#111827', fontSize: 32, lineHeight: 34, fontWeight: '300' },
  topTitle: { color: '#111827', fontSize: 16, fontWeight: '800' },
  body: { paddingBottom: 16 },
  title: { color: '#111827', fontSize: 22, fontWeight: '800', marginBottom: 6 },
  written: { color: '#9CA3AF', fontSize: 13, marginBottom: 24 },
  sectionTitle: { color: '#111827', fontSize: 16, fontWeight: '800', marginBottom: 10 },
  bodyText: { color: '#374151', fontSize: 15, lineHeight: 26 },
  replyHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 28, marginBottom: 10 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#3B82F6' },
  quote: {
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
    paddingLeft: 14,
    marginBottom: 12,
  },
  link: { color: '#3B82F6', fontSize: 15, fontWeight: '700' },
  laterTitle: { marginTop: 28 },
  momentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  rowLast: { borderBottomWidth: 0 },
  momentTitle: { flex: 1, color: '#111827', fontSize: 15, fontWeight: '600' },
  momentStatus: { fontSize: 13, fontWeight: '700' },
  editHit: { alignItems: 'center', paddingVertical: 14 },
});
