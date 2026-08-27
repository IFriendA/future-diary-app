import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { DiaryMoment, MomentStatus } from './types';

type Props = {
  moment: DiaryMoment;
  selected: MomentStatus | null;
  onSelect(status: MomentStatus): void;
  onBack(): void;
  onConfirm(): void;
};

const OPTIONS: { status: MomentStatus; label: string }[] = [
  { status: 'fulfilled', label: '已经发生' },
  { status: 'partial', label: '做到一部分' },
  { status: 'carried', label: '明天继续' },
];

const FEEDBACK: Record<MomentStatus, string> = {
  pending: '',
  fulfilled: '✓ 我做到了，明天的记忆正在变成今天。',
  partial: '我已经开始了，这一部分也算数。',
  carried: '我允许这件事带着现在的进度去往明天。',
};

export function RespondScreen({ moment, selected, onSelect, onBack, onConfirm }: Props) {
  return (
    <View style={styles.page}>
      <View style={styles.topBar}>
        <Pressable accessibilityLabel="返回" onPress={onBack} style={styles.backHit}>
          <Text style={styles.backGlyph}>‹</Text>
        </Pressable>
        <Text style={styles.topTitle}>回应今天</Text>
        <View style={styles.backHit} />
      </View>

      <Text style={styles.momentTitle}>{moment.title}</Text>
      <Text style={styles.momentTime}>{moment.timeWindow}</Text>
      <Text style={styles.question}>后来怎么样了？</Text>

      {OPTIONS.map((option) => {
        const active = selected === option.status;
        return (
          <Pressable key={option.status} onPress={() => onSelect(option.status)} style={styles.optionRow}>
            <Text style={styles.optionLabel}>{option.label}</Text>
            <View style={[styles.optionMark, active && styles.optionMarkOn]}>
              {active ? <Text style={styles.optionCheck}>✓</Text> : null}
            </View>
          </Pressable>
        );
      })}

      {selected ? (
        <View style={styles.feedback}>
          <Text style={styles.feedbackText}>{FEEDBACK[selected]}</Text>
        </View>
      ) : null}

      <View style={styles.spacer} />

      <Pressable disabled={!selected} onPress={onConfirm} style={[styles.confirm, !selected && styles.confirmOff]}>
        <Text style={styles.confirmText}>确认</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 },
  backHit: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backGlyph: { color: '#111827', fontSize: 32, lineHeight: 34, fontWeight: '300' },
  topTitle: { color: '#111827', fontSize: 16, fontWeight: '800' },
  momentTitle: { color: '#111827', fontSize: 22, fontWeight: '800' },
  momentTime: { color: '#9CA3AF', fontSize: 13, marginTop: 6, marginBottom: 32 },
  question: { color: '#111827', fontSize: 16, fontWeight: '700', marginBottom: 8 },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F3F4F6',
  },
  optionMark: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionMarkOn: { backgroundColor: '#F97316', borderColor: '#F97316' },
  optionCheck: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  optionLabel: { color: '#111827', fontSize: 16, fontWeight: '500' },
  feedback: {
    marginTop: 22,
    borderLeftWidth: 3,
    borderLeftColor: '#93C5FD',
    backgroundColor: '#F8FBFF',
    paddingLeft: 14,
    paddingVertical: 12,
    paddingRight: 12,
  },
  feedbackText: { color: '#374151', fontSize: 15, lineHeight: 24 },
  spacer: { flex: 1 },
  confirm: {
    alignSelf: 'center',
    minWidth: 120,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 8,
  },
  confirmOff: { opacity: 0.35 },
  confirmText: { color: '#3B82F6', fontSize: 16, fontWeight: '700' },
});
