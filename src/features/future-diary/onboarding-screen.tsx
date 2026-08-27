import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  MBTI_TYPES,
  SUPPORT_STYLE_LABEL,
  buildProfile,
  type FutureSelfProfile,
  type FutureSelfProfileDraft,
  type MbtiType,
  type SupportStyle,
  validateProfileDraft,
} from './profile';
import type { FuturePersonaResult, PersonaNodes } from './types';

type Step = 'welcome' | 'mbti' | 'behavior' | 'gap' | 'support' | 'generating' | 'confirm';
type StageStatus = 'wait' | 'active' | 'done';

type Props = {
  initialProfile?: FutureSelfProfile | null;
  onComplete(profile: FutureSelfProfile): void;
  now?: () => Date;
  generatePersona?(draft: FutureSelfProfileDraft): Promise<FuturePersonaResult>;
  stageDelayMs?: number;
};

const SUPPORT_OPTIONS: { value: SupportStyle; title: string; detail: string; icon: string; tint: string }[] = [
  { value: 'gentle', title: '温柔陪伴', detail: '没关系，我们先做最小的一步。', icon: '♡', tint: '#A78BFA' },
  { value: 'direct', title: '直接推动', detail: '别再等了，现在就开始第一步。', icon: '⚡', tint: '#FB923C' },
  { value: 'playful', title: '轻松幽默', detail: '先动五分钟，未来的我已经给你击掌了。', icon: '☺', tint: '#818CF8' },
];

const BEHAVIOR_PROMPTS = [
  { icon: '⚡', tint: '#A78BFA', text: '我做决定时的偏好与依据' },
  { icon: '◎', tint: '#FB923C', text: '面对挑战时的第一反应' },
  { icon: '♡', tint: '#2DD4BF', text: '我坚持做一件事的原因' },
];

const GAP_CHIPS = [
  { icon: '✎', tint: '#A78BFA', text: '更敢表达' },
  { icon: '»', tint: '#FB923C', text: '更果断' },
  { icon: '◈', tint: '#2DD4BF', text: '更稳定' },
];

const STAGES = [
  { title: '理解我', done: '已完成', active: '进行中', wait: '等待中' },
  { title: '整理我的行动方式', done: '已完成', active: '进行中', wait: '等待中' },
  { title: '形成未来人格', done: '已完成', active: '进行中', wait: '等待中' },
];

function appendPrompt(current: string, prompt: string) {
  const piece = current.trim() ? prompt : `${prompt}：`;
  if (!current.trim()) return piece;
  return `${current.replace(/\s+$/, '')}\n${piece}`;
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function FutureSelfOnboarding({
  initialProfile,
  onComplete,
  now = () => new Date(),
  generatePersona,
  stageDelayMs = 420,
}: Props) {
  const [step, setStep] = useState<Step>(initialProfile ? 'mbti' : 'welcome');
  const [mbti, setMbti] = useState<MbtiType | null>(initialProfile?.mbti ?? null);
  const [behaviorLogic, setBehaviorLogic] = useState(initialProfile?.behaviorLogic ?? '');
  const [futureSelfGap, setFutureSelfGap] = useState(initialProfile?.futureSelfGap ?? '');
  const [supportStyle, setSupportStyle] = useState<SupportStyle | null>(
    initialProfile?.supportStyle ?? null,
  );
  const [error, setError] = useState('');
  const [persona, setPersona] = useState<FuturePersonaResult | null>(null);
  const [visibleNodes, setVisibleNodes] = useState<Partial<PersonaNodes>>({});
  const [stageStatus, setStageStatus] = useState<StageStatus[]>(['active', 'wait', 'wait']);
  const cancelled = useRef(false);

  useEffect(
    () => () => {
      cancelled.current = true;
    },
    [],
  );

  const draft: FutureSelfProfileDraft | null =
    mbti && supportStyle
      ? { mbti, behaviorLogic: behaviorLogic.trim(), futureSelfGap: futureSelfGap.trim(), supportStyle }
      : null;

  async function playReveal(result: FuturePersonaResult) {
    setVisibleNodes({ mbti: result.nodes.mbti });
    setStageStatus(['done', 'active', 'wait']);
    await wait(stageDelayMs);
    if (cancelled.current) return;
    setVisibleNodes((current) => ({
      ...current,
      behavior: result.nodes.behavior,
      gap: result.nodes.gap,
    }));
    setStageStatus(['done', 'done', 'active']);
    await wait(stageDelayMs);
    if (cancelled.current) return;
    setVisibleNodes(result.nodes);
    setStageStatus(['done', 'done', 'done']);
    await wait(stageDelayMs);
    if (cancelled.current) return;
    setStep('confirm');
  }

  async function startGeneration() {
    if (!draft || !generatePersona) {
      setError('未来的我暂时没有形成，请稍后再试。');
      return;
    }
    setError('');
    setStep('generating');
    setVisibleNodes({});
    setStageStatus(['active', 'wait', 'wait']);
    try {
      const result = await generatePersona(draft);
      if (cancelled.current) return;
      setPersona(result);
      await playReveal(result);
    } catch (caught) {
      if (cancelled.current) return;
      setError(caught instanceof Error ? caught.message : '未来的我暂时没有形成，请稍后再试。');
    }
  }

  function complete() {
    if (!draft || !persona) return;
    const validation = validateProfileDraft(draft);
    if (!validation.ok) {
      setError(validation.message);
      return;
    }
    onComplete(
      buildProfile(validation.value, now(), initialProfile, {
        personaQuote: persona.quote,
        behaviorSummary: persona.behaviorSummary,
        gapSummary: persona.gapSummary,
        supportSummary: persona.supportSummary,
      }),
    );
  }

  function goBack() {
    setError('');
    if (step === 'mbti') setStep('welcome');
    if (step === 'behavior') setStep('mbti');
    if (step === 'gap') setStep('behavior');
    if (step === 'support') setStep('gap');
    if (step === 'confirm') setStep('mbti');
    if (step === 'generating') setStep('support');
  }

  const progress =
    step === 'mbti' ? 1 : step === 'behavior' ? 2 : step === 'gap' ? 3 : step === 'support' ? 4 : 0;
  const showHeader = step !== 'welcome' && step !== 'generating';
  const canNext =
    (step === 'mbti' && Boolean(mbti)) ||
    step === 'behavior' ||
    step === 'gap' ||
    (step === 'support' && Boolean(supportStyle));

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.page}>
          {showHeader ? (
            <View style={styles.headerRow}>
              {step !== 'mbti' || !initialProfile ? (
                <Pressable onPress={goBack} style={styles.backHit} accessibilityLabel="返回">
                  <Text style={styles.backGlyph}>‹</Text>
                </Pressable>
              ) : (
                <View style={styles.backHit} />
              )}
              {progress > 0 ? (
                <View style={styles.progressWrap}>
                  <View style={styles.progressTrack}>
                    {[1, 2, 3, 4].map((index) => (
                      <View
                        key={index}
                        style={[styles.progressSeg, index <= progress && styles.progressSegOn]}
                      />
                    ))}
                  </View>
                  <Text style={styles.progressText}>{progress}/4</Text>
                </View>
              ) : (
                <View style={styles.progressWrap} />
              )}
            </View>
          ) : null}

          {step === 'welcome' ? (
            <View style={styles.welcome}>
              <Text style={styles.sparkles}>✦  ✦</Text>
              <Text style={styles.welcomeTitle}>认识未来的我</Text>
              <Text style={styles.welcomeSub}>连接现在与未来，成为更好的自己。</Text>
              <Pressable onPress={() => setStep('mbti')} style={styles.primaryButton}>
                <Text style={styles.primaryText}>开始</Text>
              </Pressable>
            </View>
          ) : null}

          {step === 'mbti' ? (
            <View>
              <Text style={styles.title}>选择你的 MBTI</Text>
              <Text style={styles.subtitle}>帮助我们更懂你（必选）</Text>
              <View style={styles.mbtiGrid}>
                {MBTI_TYPES.map((type) => {
                  const selected = mbti === type;
                  return (
                    <Pressable
                      key={type}
                      onPress={() => setMbti(type)}
                      style={[styles.mbtiButton, selected && styles.selectedCard]}
                    >
                      {selected ? (
                        <View style={styles.checkBadge}>
                          <Text style={styles.checkText}>✓</Text>
                        </View>
                      ) : null}
                      <Text style={[styles.mbtiText, selected && styles.selectedLabel]}>{type}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}

          {step === 'behavior' ? (
            <View>
              <Text style={styles.title}>我通常是怎么行动的？</Text>
              <Text style={styles.subtitle}>描述你的行为逻辑与习惯（选填）</Text>
              <View style={styles.inputCard}>
                <TextInput
                  accessibilityLabel="我的行为逻辑"
                  multiline
                  maxLength={500}
                  onChangeText={setBehaviorLogic}
                  placeholder="写下你的想法..."
                  placeholderTextColor="#94A3B8"
                  style={styles.input}
                  value={behaviorLogic}
                />
                <Text style={styles.counter}>{behaviorLogic.length}/500</Text>
              </View>
              <Text style={styles.hint}>需要一点灵感？试试这些例子</Text>
              {BEHAVIOR_PROMPTS.map((item) => (
                <Pressable
                  key={item.text}
                  onPress={() => setBehaviorLogic((current) => appendPrompt(current, item.text))}
                  style={styles.promptRow}
                >
                  <Text style={[styles.promptIcon, { color: item.tint }]}>{item.icon}</Text>
                  <Text style={styles.promptText}>{item.text}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          {step === 'gap' ? (
            <View>
              <Text style={styles.title}>希望未来的我，替现在补上什么？</Text>
              <Text style={styles.subtitle}>聚焦一个方向，说说你最想改变或提升的地方（选填）</Text>
              <View style={styles.inputCard}>
                <TextInput
                  accessibilityLabel="希望未来的我补足什么"
                  multiline
                  maxLength={500}
                  onChangeText={setFutureSelfGap}
                  placeholder="写下你的想法..."
                  placeholderTextColor="#94A3B8"
                  style={styles.input}
                  value={futureSelfGap}
                />
                <Text style={styles.counter}>{futureSelfGap.length}/500</Text>
              </View>
              <Text style={styles.hint}>也可以直接选择一个方向</Text>
              <View style={styles.chipRow}>
                {GAP_CHIPS.map((item) => (
                  <Pressable
                    key={item.text}
                    onPress={() => setFutureSelfGap((current) => appendPrompt(current, item.text))}
                    style={styles.chip}
                  >
                    <Text style={[styles.promptIcon, { color: item.tint }]}>{item.icon}</Text>
                    <Text style={styles.chipText}>{item.text}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          {step === 'support' ? (
            <View>
              <Text style={styles.title}>我希望怎样被自己鼓励？</Text>
              <Text style={styles.subtitle}>选择最适合自己的说话方式，之后还可以改。</Text>
              <View style={styles.supportList}>
                {SUPPORT_OPTIONS.map((option) => {
                  const selected = supportStyle === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => setSupportStyle(option.value)}
                      style={[styles.supportCard, selected && styles.selectedCard]}
                    >
                      {selected ? (
                        <View style={styles.checkBadge}>
                          <Text style={styles.checkText}>✓</Text>
                        </View>
                      ) : null}
                      <View style={styles.supportHead}>
                        <Text style={[styles.promptIcon, { color: option.tint }]}>{option.icon}</Text>
                        <Text style={styles.supportTitle}>{option.title}</Text>
                      </View>
                      <Text style={styles.supportDetail}>{option.detail}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}

          {step === 'generating' ? (
            <View style={styles.generating}>
              <Text style={styles.title}>未来的我正在形成</Text>
              <Text style={styles.subtitle}>我正在理解今天的你，准备好明天陪你行动。</Text>
              <View style={styles.radar}>
                <View style={[styles.ring, styles.ringOuter]} />
                <View style={[styles.ring, styles.ringMid]} />
                <View style={[styles.ring, styles.ringInner]} />
                <View style={styles.radarCore}>
                  <Text style={styles.coreSpark}>✦</Text>
                </View>
                <Text style={[styles.nodeLabel, styles.nodeTl]}>{visibleNodes.mbti ?? ''}</Text>
                <Text style={[styles.nodeLabel, styles.nodeTr]}>{visibleNodes.behavior ?? ''}</Text>
                <Text style={[styles.nodeLabel, styles.nodeBl]}>{visibleNodes.gap ?? ''}</Text>
                <Text style={[styles.nodeLabel, styles.nodeBr]}>{visibleNodes.support ?? ''}</Text>
              </View>
              <View style={styles.stageList}>
                {STAGES.map((item, index) => {
                  const status = stageStatus[index];
                  return (
                    <View key={item.title} style={styles.stageRow}>
                      <View
                        style={[
                          styles.stageDot,
                          status === 'done' && styles.stageDotDone,
                          status === 'active' && styles.stageDotActive,
                        ]}
                      >
                        {status === 'done' ? <Text style={styles.checkText}>✓</Text> : null}
                        {status === 'active' ? (
                          <ActivityIndicator color="#3B82F6" size="small" />
                        ) : null}
                      </View>
                      <Text style={styles.stageTitle}>{item.title}</Text>
                      <Text style={[styles.stageState, status !== 'wait' && styles.stageStateOn]}>
                        {item[status]}
                      </Text>
                    </View>
                  );
                })}
              </View>
              {error ? (
                <View>
                  <Text style={styles.error}>{error}</Text>
                  <Pressable onPress={startGeneration} style={styles.primaryButton}>
                    <Text style={styles.primaryText}>再试一次</Text>
                  </Pressable>
                </View>
              ) : (
                <Text style={styles.footerNote}>大约需要几秒</Text>
              )}
            </View>
          ) : null}

          {step === 'confirm' && persona ? (
            <View>
              <Text style={styles.title}>这是未来的我</Text>
              <View style={styles.quoteCard}>
                <Text style={styles.quote}>{persona.quote}</Text>
              </View>
              {[
                { label: 'MBTI', value: mbti ?? '', step: 'mbti' as const },
                { label: '行为逻辑', value: persona.behaviorSummary, step: 'behavior' as const },
                { label: '想补足的部分', value: persona.gapSummary, step: 'gap' as const },
                {
                  label: '鼓励方式',
                  value: persona.supportSummary || (supportStyle ? SUPPORT_STYLE_LABEL[supportStyle] : ''),
                  step: 'support' as const,
                },
              ].map((row) => (
                <View key={row.label} style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>{row.label}</Text>
                  <Text style={styles.summaryValue}>{row.value}</Text>
                  <Pressable onPress={() => setStep(row.step)} accessibilityLabel={`编辑${row.label}`}>
                    <Text style={styles.editGlyph}>✎</Text>
                  </Pressable>
                </View>
              ))}
              <Pressable onPress={complete} style={styles.primaryButton}>
                <Text style={styles.primaryText}>确认，这就是未来的我</Text>
              </Pressable>
              <Pressable onPress={() => setStep('mbti')} style={styles.textLink}>
                <Text style={styles.textLinkLabel}>返回调整</Text>
              </Pressable>
            </View>
          ) : null}

          {error && step !== 'generating' ? <Text style={styles.error}>{error}</Text> : null}

          {step === 'mbti' || step === 'behavior' || step === 'gap' || step === 'support' ? (
            <Pressable
              disabled={!canNext}
              onPress={() => {
                if (!canNext) return;
                if (step === 'mbti') setStep('behavior');
                if (step === 'behavior') setStep('gap');
                if (step === 'gap') setStep('support');
                if (step === 'support') void startGeneration();
              }}
              style={[styles.primaryButton, !canNext && styles.disabledButton]}
            >
              <Text style={styles.primaryText}>{step === 'support' ? '生成未来的我' : '下一步'}</Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const colors = {
  bg: '#FBFBFD',
  ink: '#1E293B',
  muted: '#94A3B8',
  sub: '#64748B',
  primary: '#3B82F6',
  line: '#E2E8F0',
  card: '#FFFFFF',
  input: '#F1F5F9',
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { flexGrow: 1, alignItems: 'center' },
  page: { width: '100%', maxWidth: 430, paddingHorizontal: 22, paddingTop: 12, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 28, gap: 8 },
  backHit: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backGlyph: { color: colors.ink, fontSize: 32, lineHeight: 34, fontWeight: '300' },
  progressWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressTrack: { flex: 1, flexDirection: 'row', gap: 6 },
  progressSeg: { flex: 1, height: 4, borderRadius: 4, backgroundColor: '#E2E8F0' },
  progressSegOn: { backgroundColor: colors.primary },
  progressText: { color: colors.muted, fontSize: 13, fontWeight: '600', width: 32, textAlign: 'right' },
  welcome: { flexGrow: 1, minHeight: 520, justifyContent: 'center' },
  sparkles: { color: '#C4B5FD', fontSize: 22, textAlign: 'center', marginBottom: 18 },
  welcomeTitle: { color: colors.ink, fontSize: 34, fontWeight: '800', textAlign: 'center', letterSpacing: -0.8 },
  welcomeSub: { color: colors.sub, fontSize: 15, textAlign: 'center', marginTop: 12, marginBottom: 48 },
  title: { color: colors.ink, fontSize: 26, lineHeight: 34, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { color: colors.sub, fontSize: 14, lineHeight: 22, marginTop: 8, marginBottom: 22 },
  mbtiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  mbtiButton: {
    width: '22%',
    flexGrow: 1,
    minWidth: 68,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    alignItems: 'center',
  },
  mbtiText: { color: colors.ink, fontSize: 13, fontWeight: '700' },
  selectedCard: { borderColor: colors.primary, borderWidth: 1.5, backgroundColor: '#F8FBFF' },
  selectedLabel: { color: colors.primary },
  checkBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  inputCard: { backgroundColor: colors.input, borderRadius: 16, padding: 14, minHeight: 160 },
  input: { minHeight: 120, color: colors.ink, fontSize: 16, lineHeight: 24, textAlignVertical: 'top' },
  counter: { color: colors.muted, fontSize: 12, textAlign: 'right', marginTop: 8 },
  hint: { color: colors.muted, fontSize: 13, marginTop: 22, marginBottom: 10 },
  promptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 8,
  },
  promptIcon: { fontSize: 16, width: 20, textAlign: 'center' },
  promptText: { color: colors.ink, fontSize: 14, fontWeight: '600' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  chipText: { color: colors.ink, fontSize: 13, fontWeight: '600' },
  supportList: { gap: 10 },
  supportCard: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
  },
  supportHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  supportTitle: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  supportDetail: { color: colors.sub, fontSize: 13, lineHeight: 20 },
  generating: { paddingTop: 24 },
  radar: { height: 260, marginVertical: 12, alignItems: 'center', justifyContent: 'center' },
  ring: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 999,
  },
  ringOuter: { width: 220, height: 220 },
  ringMid: { width: 150, height: 150 },
  ringInner: { width: 84, height: 84 },
  radarCore: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coreSpark: { color: '#A78BFA', fontSize: 18 },
  nodeLabel: { position: 'absolute', color: colors.ink, fontSize: 13, fontWeight: '700', maxWidth: 96 },
  nodeTl: { top: 18, left: 8 },
  nodeTr: { top: 18, right: 8, textAlign: 'right' },
  nodeBl: { bottom: 28, left: 8 },
  nodeBr: { bottom: 28, right: 8, textAlign: 'right' },
  stageList: { gap: 14, marginTop: 8 },
  stageRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stageDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageDotDone: { backgroundColor: colors.primary, borderColor: colors.primary },
  stageDotActive: { borderColor: colors.primary, borderWidth: 0 },
  stageTitle: { flex: 1, color: colors.ink, fontSize: 14, fontWeight: '700' },
  stageState: { color: colors.muted, fontSize: 12 },
  stageStateOn: { color: colors.primary },
  footerNote: { color: colors.muted, fontSize: 12, textAlign: 'center', marginTop: 28 },
  quoteCard: { backgroundColor: colors.input, borderRadius: 16, padding: 16, marginBottom: 18 },
  quote: { color: colors.ink, fontSize: 15, lineHeight: 24 },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  summaryLabel: { width: 92, color: colors.ink, fontSize: 13, fontWeight: '700' },
  summaryValue: { flex: 1, color: colors.sub, fontSize: 13 },
  editGlyph: { color: colors.muted, fontSize: 14 },
  primaryButton: {
    marginTop: 28,
    minHeight: 52,
    backgroundColor: colors.primary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  disabledButton: { opacity: 0.35 },
  primaryText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  textLink: { alignItems: 'center', paddingVertical: 16 },
  textLinkLabel: { color: colors.sub, fontSize: 14 },
  error: { color: '#DC2626', marginTop: 16, fontSize: 13, lineHeight: 20 },
});
