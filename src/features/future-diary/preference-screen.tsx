import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import type { FragmentPreferences } from './preference-storage';

type Props = {
  title: string;
  prefs: FragmentPreferences;
  onBack(): void;
  onChange(next: FragmentPreferences): void;
};

const RANGE_PRESETS = [
  { startTime: '09:00', endTime: '22:00' },
  { startTime: '08:00', endTime: '21:00' },
  { startTime: '10:00', endTime: '20:00' },
];

const COUNT_PRESETS = [
  { dailyMin: 1, dailyMax: 2 },
  { dailyMin: 2, dailyMax: 4 },
  { dailyMin: 3, dailyMax: 5 },
];

const DND_PRESETS = [
  { dndStart: '22:00', dndEnd: '09:00' },
  { dndStart: '23:00', dndEnd: '08:00' },
  { dndStart: '21:00', dndEnd: '07:00' },
];

function cycle<T>(list: T[], match: (item: T) => boolean): T {
  const index = list.findIndex(match);
  return list[(index + 1) % list.length] ?? list[0];
}

export function PreferenceScreen({ title, prefs, onBack, onChange }: Props) {
  return (
    <View style={styles.page}>
      <View style={styles.topBar}>
        <Pressable accessibilityLabel="返回" onPress={onBack} style={styles.backHit}>
          <Text style={styles.backGlyph}>‹</Text>
        </Pressable>
        <Text style={styles.topTitle}>{title}</Text>
        <View style={styles.backHit} />
      </View>

      <View style={styles.notice}>
        <Text style={styles.noticeText}>通知尚未接入，设置会先保存在本地。</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>随机出现</Text>
            <Text style={styles.rowSub}>在一天中自然地收到未来片段</Text>
          </View>
          <Switch
            accessibilityLabel="随机出现"
            onValueChange={(enabled) => onChange({ ...prefs, enabled })}
            trackColor={{ false: '#E5E7EB', true: '#93C5FD' }}
            thumbColor={prefs.enabled ? '#3B82F6' : '#F9FAFB'}
            value={prefs.enabled}
          />
        </View>
        <Pressable
          onPress={() => onChange({ ...prefs, ...cycle(RANGE_PRESETS, (item) => item.startTime === prefs.startTime && item.endTime === prefs.endTime) })}
          style={styles.row}
        >
          <Text style={styles.rowTitle}>时间范围</Text>
          <Text style={styles.value}>{prefs.startTime}—{prefs.endTime}</Text>
        </Pressable>
        <Pressable
          onPress={() => onChange({ ...prefs, ...cycle(COUNT_PRESETS, (item) => item.dailyMin === prefs.dailyMin && item.dailyMax === prefs.dailyMax) })}
          style={styles.row}
        >
          <Text style={styles.rowTitle}>每日数量</Text>
          <Text style={styles.value}>{prefs.dailyMin}—{prefs.dailyMax}条</Text>
        </Pressable>
        <Pressable
          onPress={() => onChange({ ...prefs, ...cycle(DND_PRESETS, (item) => item.dndStart === prefs.dndStart && item.dndEnd === prefs.dndEnd) })}
          style={[styles.row, styles.rowLast]}
        >
          <Text style={styles.rowTitle}>勿扰时间</Text>
          <Text style={styles.value}>{prefs.dndStart}—{prefs.dndEnd}</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function InfoScreen({
  title,
  body,
  onBack,
}: {
  title: string;
  body: string;
  onBack(): void;
}) {
  return (
    <View style={styles.page}>
      <View style={styles.topBar}>
        <Pressable accessibilityLabel="返回" onPress={onBack} style={styles.backHit}>
          <Text style={styles.backGlyph}>‹</Text>
        </Pressable>
        <Text style={styles.topTitle}>{title}</Text>
        <View style={styles.backHit} />
      </View>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  backHit: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backGlyph: { color: '#111827', fontSize: 32, lineHeight: 34, fontWeight: '300' },
  topTitle: { color: '#111827', fontSize: 16, fontWeight: '800' },
  notice: {
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  noticeText: { color: '#1D4ED8', fontSize: 13, lineHeight: 20 },
  card: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  rowLast: { borderBottomWidth: 0 },
  rowText: { flex: 1 },
  rowTitle: { color: '#111827', fontSize: 16, fontWeight: '700' },
  rowSub: { color: '#9CA3AF', fontSize: 13, marginTop: 4 },
  value: { color: '#6B7280', fontSize: 14, fontWeight: '600' },
  body: { color: '#4B5563', fontSize: 15, lineHeight: 26 },
});
