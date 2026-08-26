import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  MBTI_TYPES,
  buildProfile,
  type FutureSelfProfile,
  type MbtiType,
  type SupportStyle,
  validateProfileDraft,
} from './profile';

type Props = {
  initialProfile?: FutureSelfProfile | null;
  onComplete(profile: FutureSelfProfile): void;
  now?: () => Date;
};

const SUPPORT_OPTIONS: { value: SupportStyle; title: string; detail: string }[] = [
  { value: 'gentle', title: '温柔陪伴', detail: '先接住我的感受，再陪我往前走' },
  { value: 'direct', title: '直接推动', detail: '说重点，帮我做出决定并迈出第一步' },
  { value: 'playful', title: '轻松幽默', detail: '别太严肃，用一点玩笑帮我松下来' },
];

export function FutureSelfOnboarding({ initialProfile, onComplete, now = () => new Date() }: Props) {
  const [step, setStep] = useState(0);
  const [mbti, setMbti] = useState<MbtiType | null>(initialProfile?.mbti ?? null);
  const [behaviorLogic, setBehaviorLogic] = useState(initialProfile?.behaviorLogic ?? '');
  const [futureSelfGap, setFutureSelfGap] = useState(initialProfile?.futureSelfGap ?? '');
  const [supportStyle, setSupportStyle] = useState<SupportStyle | null>(
    initialProfile?.supportStyle ?? null,
  );
  const [error, setError] = useState('');

  const canContinue =
    (step === 0 && Boolean(mbti)) ||
    (step === 1 && behaviorLogic.trim().length >= 20) ||
    (step === 2 && futureSelfGap.trim().length >= 10) ||
    (step === 3 && Boolean(supportStyle));

  function next() {
    if (!canContinue) return;
    setError('');
    if (step < 3) {
      setStep((current) => current + 1);
      return;
    }

    const validation = validateProfileDraft({ mbti, behaviorLogic, futureSelfGap, supportStyle });
    if (!validation.ok) {
      setError(validation.message);
      return;
    }
    onComplete(buildProfile(validation.value, now(), initialProfile));
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.page}>
          <View style={styles.progressRow}>
            <Text style={styles.eyebrow}>建立未来的我</Text>
            <Text style={styles.progress}>{step + 1} / 4</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${((step + 1) / 4) * 100}%` }]} />
          </View>

          {step === 0 ? (
            <View>
              <Text style={styles.title}>先选出我的 MBTI</Text>
              <Text style={styles.subtitle}>它会成为未来的我理解思考方式的一个坐标。</Text>
              <View style={styles.mbtiGrid}>
                {MBTI_TYPES.map((type) => (
                  <Pressable
                    key={type}
                    onPress={() => setMbti(type)}
                    style={[styles.mbtiButton, mbti === type && styles.selectedButton]}
                  >
                    <Text style={[styles.mbtiText, mbti === type && styles.selectedText]}>{type}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          {step === 1 ? (
            <View>
              <Text style={styles.title}>我平时是怎么行动的？</Text>
              <Text style={styles.subtitle}>随便写。说说我怎么做决定、压力大时会怎样、什么能让我开始。</Text>
              <TextInput
                accessibilityLabel="我的行为逻辑"
                multiline
                onChangeText={setBehaviorLogic}
                placeholder="例如：我会反复确认是否做得够好，所以容易迟迟不开始。但只要有人帮我找到最小的一步，我通常就能继续下去……"
                placeholderTextColor="#969083"
                style={styles.input}
                value={behaviorLogic}
              />
              <Text style={styles.counter}>{behaviorLogic.length}/500</Text>
            </View>
          ) : null}

          {step === 2 ? (
            <View>
              <Text style={styles.title}>希望未来的我，替现在补上什么？</Text>
              <Text style={styles.subtitle}>写下现在不敢做或暂时做不到，但希望未来的我能做到的部分。</Text>
              <TextInput
                accessibilityLabel="希望未来的我补足什么"
                multiline
                onChangeText={setFutureSelfGap}
                placeholder="例如：希望未来的我更敢表达真实想法，不再因为怕别人失望就放弃自己的决定。"
                placeholderTextColor="#969083"
                style={styles.input}
                value={futureSelfGap}
              />
              <Text style={styles.counter}>{futureSelfGap.length}/300</Text>
            </View>
          ) : null}

          {step === 3 ? (
            <View>
              <Text style={styles.title}>我希望怎样被自己鼓励？</Text>
              <Text style={styles.subtitle}>未来的我会按这个方式说话，但不会变成另一个人。</Text>
              <View style={styles.supportList}>
                {SUPPORT_OPTIONS.map((option) => (
                  <Pressable
                    key={option.value}
                    onPress={() => setSupportStyle(option.value)}
                    style={[styles.supportButton, supportStyle === option.value && styles.selectedButton]}
                  >
                    <Text style={[styles.supportTitle, supportStyle === option.value && styles.selectedText]}>
                      {option.title}
                    </Text>
                    <Text style={[styles.supportDetail, supportStyle === option.value && styles.selectedDetail]}>
                      {option.detail}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.footerRow}>
            {step > 0 ? (
              <Pressable onPress={() => setStep((current) => current - 1)} style={styles.backButton}>
                <Text style={styles.backText}>上一步</Text>
              </Pressable>
            ) : (
              <View />
            )}
            <Pressable
              disabled={!canContinue}
              onPress={next}
              style={[styles.nextButton, !canContinue && styles.disabledButton]}
            >
              <Text style={styles.nextText}>{step === 3 ? '开始写未来日记' : '下一步'}</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F3EB' },
  scrollContent: { flexGrow: 1, alignItems: 'center' },
  page: { width: '100%', maxWidth: 720, paddingHorizontal: 20, paddingTop: 30, paddingBottom: 48 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrow: { color: '#6F685D', fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  progress: { color: '#6F685D', fontSize: 13, fontWeight: '700' },
  progressTrack: { height: 5, backgroundColor: '#DED7CB', borderRadius: 6, marginTop: 14, marginBottom: 38 },
  progressFill: { height: 5, backgroundColor: '#E95B35', borderRadius: 6 },
  title: { color: '#23211D', fontSize: 30, lineHeight: 39, fontWeight: '800', letterSpacing: -0.7 },
  subtitle: { color: '#777065', fontSize: 15, lineHeight: 24, marginTop: 10, marginBottom: 24 },
  mbtiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  mbtiButton: { width: '22%', minWidth: 74, flexGrow: 1, paddingVertical: 16, borderRadius: 15, borderWidth: 1, borderColor: '#D8D0C3', backgroundColor: '#FFFCF7', alignItems: 'center' },
  mbtiText: { color: '#34302A', fontSize: 15, fontWeight: '800' },
  selectedButton: { backgroundColor: '#23211D', borderColor: '#23211D' },
  selectedText: { color: '#FFFDF8' },
  input: { minHeight: 190, borderWidth: 1, borderColor: '#D8D0C3', borderRadius: 18, backgroundColor: '#FFFCF7', padding: 16, color: '#23211D', fontSize: 16, lineHeight: 27, textAlignVertical: 'top' },
  counter: { color: '#777065', fontSize: 12, textAlign: 'right', marginTop: 8 },
  supportList: { gap: 12 },
  supportButton: { borderWidth: 1, borderColor: '#D8D0C3', backgroundColor: '#FFFCF7', borderRadius: 18, padding: 18 },
  supportTitle: { color: '#23211D', fontSize: 17, fontWeight: '800' },
  supportDetail: { color: '#777065', fontSize: 13, lineHeight: 20, marginTop: 6 },
  selectedDetail: { color: '#D8D0C3' },
  error: { color: '#A53B28', marginTop: 16 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 34, gap: 12 },
  backButton: { paddingHorizontal: 18, paddingVertical: 15 },
  backText: { color: '#575046', fontSize: 14, fontWeight: '700' },
  nextButton: { minWidth: 140, backgroundColor: '#E95B35', borderRadius: 16, paddingHorizontal: 20, paddingVertical: 16, alignItems: 'center' },
  disabledButton: { opacity: 0.35 },
  nextText: { color: '#FFFDF8', fontSize: 14, fontWeight: '800' },
});

