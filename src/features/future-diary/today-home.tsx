import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { HomeModel } from './home-model';
import type { DiaryMoment, FutureDiary } from './types';

type Props = {
  home: HomeModel;
  onRespond(moment: DiaryMoment): void;
  onOpenLetter(diary: FutureDiary): void;
  onWriteTomorrow(): void;
  onEditTomorrow(): void;
  onEditProfile?: () => void;
};

export function TodayHome({
  home,
  onRespond,
  onOpenLetter,
  onWriteTomorrow,
  onEditTomorrow,
  onEditProfile,
}: Props) {
  return (
    <View>
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Text style={styles.dateTitle}>{home.todayLabel}</Text>
        {onEditProfile ? (
          <Pressable accessibilityLabel="未来的我" onPress={onEditProfile} style={styles.avatar} />
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      {home.pending.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>待回应</Text>
          <Text style={styles.sectionSub}>{home.pending.length}件事等我回应</Text>
          {home.pending.map((moment) => (
            <Pressable key={moment.id} onPress={() => onRespond(moment)} style={styles.pendingRow}>
              <View style={styles.pendingDot} />
              <Text style={styles.pendingTitle}>{moment.title}</Text>
              <Text style={styles.pendingMeta}>待确认</Text>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {home.fromTomorrowPreview && home.tomorrowDiary ? (
        <View style={styles.section}>
          <View style={styles.fromHeader}>
            <Text style={styles.sectionTitle}>来自明天</Text>
            {home.fromTomorrowTime ? (
              <View style={styles.timeRow}>
                <View style={styles.liveDot} />
                <Text style={styles.timeText}>{home.fromTomorrowTime}</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.quote}>
            <Text style={styles.quoteText}>{home.fromTomorrowPreview}</Text>
          </View>
          <Pressable onPress={() => onOpenLetter(home.tomorrowDiary!)}>
            <Text style={styles.link}>查看完整回信</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>写给明天</Text>
        <Text style={styles.tomorrowDate}>{home.tomorrowLabel}</Text>
        {home.tomorrowDiary ? (
          <View>
            <Text style={styles.summary} numberOfLines={2}>
              {home.tomorrowDiary.rawText}
            </Text>
            <View style={styles.linkRow}>
              <Pressable onPress={() => onOpenLetter(home.tomorrowDiary!)}>
                <Text style={styles.link}>查看回信</Text>
              </Pressable>
              <Pressable onPress={onEditTomorrow}>
                <Text style={styles.link}>编辑</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable onPress={onWriteTomorrow}>
            <Text style={styles.link}>＋ 写下明天</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
    paddingTop: 6,
  },
  headerSpacer: { width: 36, height: 36 },
  dateTitle: { color: '#111827', fontSize: 18, fontWeight: '800', letterSpacing: 0.2 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  section: { marginBottom: 36 },
  sectionTitle: { color: '#111827', fontSize: 22, fontWeight: '800', marginBottom: 6 },
  sectionSub: { color: '#9CA3AF', fontSize: 13, marginBottom: 8 },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
    gap: 12,
  },
  pendingDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
  },
  pendingTitle: { flex: 1, color: '#111827', fontSize: 16, fontWeight: '500' },
  pendingMeta: { color: '#60A5FA', fontSize: 13, fontWeight: '600' },
  chevron: { color: '#60A5FA', fontSize: 22, lineHeight: 24, marginLeft: -4 },
  fromHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#3B82F6' },
  timeText: { color: '#9CA3AF', fontSize: 12 },
  quote: {
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
    paddingLeft: 14,
    marginBottom: 14,
  },
  quoteText: { color: '#374151', fontSize: 15, lineHeight: 26 },
  link: { color: '#3B82F6', fontSize: 15, fontWeight: '700' },
  tomorrowDate: { color: '#9CA3AF', fontSize: 13, marginBottom: 14 },
  summary: { color: '#4B5563', fontSize: 15, lineHeight: 24, marginBottom: 14 },
  linkRow: { flexDirection: 'row', gap: 20 },
});
