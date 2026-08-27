import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { chineseDate } from './dates';
import type { FutureDiary } from './types';

type Props = {
  diary: FutureDiary;
  onBack(): void;
  onAccept(): void;
  onEdit(): void;
};

const COUNT_WORDS = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];

function countWord(count: number) {
  return count >= 0 && count <= 10 ? COUNT_WORDS[count] : String(count);
}

export function LetterScreen({ diary, onBack, onAccept, onEdit }: Props) {
  return (
    <View style={styles.page}>
      <View style={styles.topBar}>
        <Pressable accessibilityLabel="返回" onPress={onBack} style={styles.backHit}>
          <Text style={styles.backGlyph}>‹</Text>
        </Pressable>
        <Text style={styles.topTitle}>{chineseDate(diary.targetDate)} · 来自明天</Text>
        <View style={styles.backHit} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.message}>{diary.futureMessage}</Text>
        <Text style={styles.sign}>明天的我</Text>

        <Text style={styles.remember}>我记住了{countWord(diary.moments.length)}件事</Text>
        {diary.moments.map((moment) => (
          <View key={moment.id} style={styles.momentRow}>
            <Text style={styles.momentTitle}>{moment.title}</Text>
            <Text style={styles.momentTime}>{moment.timeWindow}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable onPress={onAccept} style={styles.footerHit}>
          <Text style={styles.accept}>收下</Text>
        </Pressable>
        <Pressable onPress={onEdit} style={styles.footerHit}>
          <Text style={styles.edit}>修改原文</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  backHit: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backGlyph: { color: '#111827', fontSize: 32, lineHeight: 34, fontWeight: '300' },
  topTitle: { color: '#111827', fontSize: 16, fontWeight: '800' },
  body: { paddingBottom: 24 },
  message: { color: '#111827', fontSize: 17, lineHeight: 30 },
  sign: { color: '#9CA3AF', fontSize: 14, textAlign: 'right', marginTop: 22, marginBottom: 40 },
  remember: { color: '#111827', fontSize: 16, fontWeight: '800', marginBottom: 8 },
  momentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  momentTitle: { flex: 1, color: '#111827', fontSize: 15, fontWeight: '500' },
  momentTime: { color: '#9CA3AF', fontSize: 13 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    paddingBottom: 8,
  },
  footerHit: { paddingVertical: 10, paddingHorizontal: 4 },
  accept: { color: '#3B82F6', fontSize: 16, fontWeight: '700' },
  edit: { color: '#9CA3AF', fontSize: 16, fontWeight: '700' },
});
