import { useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { createFutureDiaryClient, type FutureDiaryClient } from './client';
import { updateMomentStatus } from './diary-state';
import { createDiaryStorage, type DiaryStorage } from './storage';
import type { FutureDiary, MomentStatus } from './types';

type FutureDiaryScreenProps = {
  client?: FutureDiaryClient;
  storage?: DiaryStorage;
  now?: () => Date;
};

const STATUS_LABEL: Record<MomentStatus, string> = {
  pending: '待发生',
  partial: '已做一部分',
  fulfilled: '已实现',
  carried: '带到明天',
};

function tomorrowDate(now: Date) {
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const day = String(tomorrow.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function displayDate(date: string) {
  const [, month, day] = date.split('-');
  return `${Number(month)} 月 ${Number(day)} 日`;
}

export function FutureDiaryScreen({ client, storage, now = () => new Date() }: FutureDiaryScreenProps) {
  const [resolvedClient] = useState(() => client ?? createFutureDiaryClient());
  const [resolvedStorage] = useState(() => storage ?? createDiaryStorage());
  const [diary, setDiary] = useState<FutureDiary | null>(() => resolvedStorage.load());
  const [draft, setDraft] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [feedbackScale] = useState(() => new Animated.Value(0.96));
  const targetDate = tomorrowDate(now());

  async function generateDiary() {
    const diaryText = draft.trim();
    if (diaryText.length < 10 || isLoading) return;

    setError('');
    setIsLoading(true);
    try {
      const generated = await resolvedClient.generate({ diaryText, targetDate });
      resolvedStorage.save(generated);
      setDiary(generated);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : '未来的我暂时没有回信，请稍后再试。',
      );
    } finally {
      setIsLoading(false);
    }
  }

  function setMomentStatus(momentId: string, status: MomentStatus) {
    if (!diary) return;

    const updated = updateMomentStatus(diary, momentId, status);
    resolvedStorage.save(updated);
    setDiary(updated);

    const message =
      status === 'fulfilled'
        ? '✓ 我做到了，明天的记忆正在变成今天。'
        : status === 'partial'
          ? '我已经开始了，这一部分也算数。'
          : '我允许这件事带着现在的进度去往明天。';
    setFeedback(message);
    feedbackScale.setValue(0.96);
    Animated.spring(feedbackScale, {
      toValue: 1,
      friction: 6,
      tension: 80,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }

  function resetDiary() {
    resolvedStorage.clear();
    setDiary(null);
    setDraft('');
    setFeedback('');
    setError('');
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardArea}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.page}>
            <View style={styles.header}>
              <View style={styles.brandRow}>
                <View style={styles.brandMark} />
                <Text style={styles.eyebrow}>未来日记 · 写给明天</Text>
              </View>
              <Text style={styles.title}>{diary ? '我从明天回来了' : '先记得，再发生。'}</Text>
              <Text style={styles.subtitle}>
                {diary
                  ? `${displayDate(diary.targetDate)} · 这是我提前经历过的一天`
                  : `把 ${displayDate(targetDate)} 写成已经发生的样子，明天的我会回信。`}
              </Text>
            </View>

            {!diary ? (
              <View style={styles.editorCard}>
                <Text style={styles.cardLabel}>我的明天</Text>
                <TextInput
                  accessibilityLabel="写下明天的日记"
                  multiline
                  onChangeText={setDraft}
                  placeholder="例如：我明天上午已经把方案的第一版写完了。下午出门走了一圈，回来时没有那么紧绷了……"
                  placeholderTextColor="#9A9387"
                  style={styles.input}
                  textAlignVertical="top"
                  value={draft}
                />
                <View style={styles.editorFooter}>
                  <Text style={styles.hint}>随便写，AI 会自动读出其中的事情。</Text>
                  <Text style={styles.counter}>{draft.length}/5000</Text>
                </View>
                {error ? <Text style={styles.error}>{error}</Text> : null}
                <Pressable
                  disabled={draft.trim().length < 10 || isLoading}
                  onPress={generateDiary}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    (draft.trim().length < 10 || isLoading) && styles.primaryButtonDisabled,
                    pressed && styles.primaryButtonPressed,
                  ]}
                >
                  {isLoading ? (
                    <View style={styles.loadingRow}>
                      <ActivityIndicator color="#FFFDF8" size="small" />
                      <Text style={styles.primaryButtonText}>我正在经历这一天……</Text>
                    </View>
                  ) : (
                    <Text style={styles.primaryButtonText}>让明天的我先经历一次</Text>
                  )}
                </Pressable>
              </View>
            ) : (
              <View style={styles.resultArea}>
                <View style={styles.messageCard}>
                  <Text style={styles.messageLabel}>来自明天的我</Text>
                  <Text style={styles.message}>{diary.futureMessage}</Text>
                </View>

                <View style={styles.momentsHeader}>
                  <Text style={styles.sectionTitle}>这一天里的事</Text>
                  <Text style={styles.sectionMeta}>{diary.moments.length} 个未来片段</Text>
                </View>

                {diary.moments.map((moment, index) => (
                  <View key={moment.id} style={styles.momentCard}>
                    <View style={styles.momentTop}>
                      <View style={styles.numberBadge}>
                        <Text style={styles.numberText}>{String(index + 1).padStart(2, '0')}</Text>
                      </View>
                      <View style={styles.momentCopy}>
                        <Text style={styles.momentTitle}>{moment.title}</Text>
                        <Text style={styles.momentDetail}>
                          {moment.timeWindow} · {moment.emotion}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.statusPill,
                          moment.status === 'fulfilled' && styles.statusPillDone,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            moment.status === 'fulfilled' && styles.statusTextDone,
                          ]}
                        >
                          {STATUS_LABEL[moment.status]}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.actions}>
                      <Pressable
                        onPress={() => setMomentStatus(moment.id, 'partial')}
                        style={styles.actionButton}
                      >
                        <Text style={styles.actionText}>做到一部分</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => setMomentStatus(moment.id, 'fulfilled')}
                        style={[styles.actionButton, styles.doneButton]}
                      >
                        <Text style={[styles.actionText, styles.doneButtonText]}>已经发生</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => setMomentStatus(moment.id, 'carried')}
                        style={styles.actionButton}
                      >
                        <Text style={styles.actionText}>带到明天</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}

                {feedback ? (
                  <Animated.View style={[styles.feedback, { transform: [{ scale: feedbackScale }] }]}>
                    <Text style={styles.feedbackText}>{feedback}</Text>
                  </Animated.View>
                ) : null}

                <Pressable onPress={resetDiary} style={styles.resetButton}>
                  <Text style={styles.resetText}>写一篇新的未来日记</Text>
                </Pressable>
              </View>
            )}

            <Text style={styles.footer}>没有打卡压力。不评判。只是让我和明天的自己靠近一点。</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const colors = {
  paper: '#F7F3EB',
  card: '#FFFCF7',
  ink: '#23211D',
  muted: '#777065',
  border: '#DDD5C8',
  accent: '#E95B35',
  accentSoft: '#FBE7DD',
  success: '#34775B',
  successSoft: '#E5F1EA',
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.paper },
  keyboardArea: { flex: 1 },
  scrollContent: { flexGrow: 1, alignItems: 'center' },
  page: {
    width: '100%',
    maxWidth: 720,
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 48,
  },
  header: { marginBottom: 28 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 18 },
  brandMark: { width: 22, height: 5, borderRadius: 4, backgroundColor: colors.accent },
  eyebrow: { color: colors.muted, fontSize: 13, fontWeight: '700', letterSpacing: 1.2 },
  title: { color: colors.ink, fontSize: 34, lineHeight: 42, fontWeight: '800', letterSpacing: -1 },
  subtitle: { color: colors.muted, fontSize: 16, lineHeight: 25, marginTop: 10, maxWidth: 560 },
  editorCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 22,
    padding: 18,
    shadowColor: '#4E463A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 28,
    elevation: 3,
  },
  cardLabel: { color: colors.ink, fontSize: 14, fontWeight: '800', marginBottom: 12 },
  input: {
    minHeight: 220,
    color: colors.ink,
    fontSize: 17,
    lineHeight: 29,
    padding: 0,
    outlineStyle: 'none',
  } as never,
  editorFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingTop: 13,
    marginTop: 16,
  },
  hint: { flex: 1, color: colors.muted, fontSize: 12, lineHeight: 18 },
  counter: { color: colors.muted, fontSize: 12 },
  error: { color: '#A53B28', fontSize: 13, lineHeight: 20, marginTop: 12 },
  primaryButton: {
    minHeight: 54,
    backgroundColor: colors.ink,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    paddingHorizontal: 18,
  },
  primaryButtonDisabled: { opacity: 0.38 },
  primaryButtonPressed: { transform: [{ scale: 0.99 }] },
  primaryButtonText: { color: '#FFFDF8', fontSize: 15, fontWeight: '800' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  resultArea: { gap: 14 },
  messageCard: {
    backgroundColor: colors.ink,
    borderRadius: 22,
    paddingHorizontal: 22,
    paddingVertical: 24,
  },
  messageLabel: {
    color: '#D7CFC2',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.1,
    marginBottom: 14,
  },
  message: { color: '#FFFDF8', fontSize: 18, lineHeight: 31, fontWeight: '500' },
  momentsHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: 2,
  },
  sectionTitle: { color: colors.ink, fontSize: 20, fontWeight: '800' },
  sectionMeta: { color: colors.muted, fontSize: 12 },
  momentCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
  },
  momentTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  numberBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: { color: colors.accent, fontSize: 12, fontWeight: '900' },
  momentCopy: { flex: 1, paddingTop: 1 },
  momentTitle: { color: colors.ink, fontSize: 16, lineHeight: 23, fontWeight: '800' },
  momentDetail: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 3 },
  statusPill: {
    backgroundColor: '#EFEAE1',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  statusPillDone: { backgroundColor: colors.successSoft },
  statusText: { color: colors.muted, fontSize: 11, fontWeight: '800' },
  statusTextDone: { color: colors.success },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  actionButton: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 11,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  actionText: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  doneButton: { backgroundColor: colors.success, borderColor: colors.success },
  doneButtonText: { color: '#FFFFFF' },
  feedback: {
    backgroundColor: colors.successSoft,
    borderColor: '#C4DDD0',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  feedbackText: { color: colors.success, fontSize: 14, lineHeight: 21, fontWeight: '700' },
  resetButton: { alignSelf: 'center', paddingHorizontal: 12, paddingVertical: 12, marginTop: 4 },
  resetText: { color: colors.accent, fontSize: 14, fontWeight: '800' },
  footer: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 32,
    paddingHorizontal: 20,
  },
});
