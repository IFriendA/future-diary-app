export const MBTI_TYPES = [
  'INTJ',
  'INTP',
  'ENTJ',
  'ENTP',
  'INFJ',
  'INFP',
  'ENFJ',
  'ENFP',
  'ISTJ',
  'ISFJ',
  'ESTJ',
  'ESFJ',
  'ISTP',
  'ISFP',
  'ESTP',
  'ESFP',
] as const;

export type MbtiType = (typeof MBTI_TYPES)[number];
export type SupportStyle = 'gentle' | 'direct' | 'playful';

export type FutureSelfProfileDraft = {
  mbti: MbtiType;
  behaviorLogic: string;
  futureSelfGap: string;
  supportStyle: SupportStyle;
};

export type FutureSelfProfile = FutureSelfProfileDraft & {
  createdAt: string;
  updatedAt: string;
};

export type ProfileField = keyof FutureSelfProfileDraft;

export type ProfileValidation =
  | { ok: true; value: FutureSelfProfileDraft }
  | { ok: false; field: ProfileField; message: string };

const SUPPORT_STYLES: SupportStyle[] = ['gentle', 'direct', 'playful'];

export function validateProfileDraft(input: unknown): ProfileValidation {
  const value = input && typeof input === 'object' ? (input as Record<string, unknown>) : {};
  const mbti = typeof value.mbti === 'string' ? value.mbti : '';
  const behaviorLogic = typeof value.behaviorLogic === 'string' ? value.behaviorLogic.trim() : '';
  const futureSelfGap = typeof value.futureSelfGap === 'string' ? value.futureSelfGap.trim() : '';
  const supportStyle = typeof value.supportStyle === 'string' ? value.supportStyle : '';

  if (!MBTI_TYPES.includes(mbti as MbtiType)) {
    return { ok: false, field: 'mbti', message: '请选择你的 MBTI。' };
  }
  if (behaviorLogic.length < 20) {
    return { ok: false, field: 'behaviorLogic', message: '再多写一点，至少 20 个字。' };
  }
  if (behaviorLogic.length > 500) {
    return { ok: false, field: 'behaviorLogic', message: '请控制在 500 字以内。' };
  }
  if (futureSelfGap.length < 10) {
    return { ok: false, field: 'futureSelfGap', message: '再多写一点，至少 10 个字。' };
  }
  if (futureSelfGap.length > 300) {
    return { ok: false, field: 'futureSelfGap', message: '请控制在 300 字以内。' };
  }
  if (!SUPPORT_STYLES.includes(supportStyle as SupportStyle)) {
    return { ok: false, field: 'supportStyle', message: '请选择一种鼓励方式。' };
  }

  return {
    ok: true,
    value: {
      mbti: mbti as MbtiType,
      behaviorLogic,
      futureSelfGap,
      supportStyle: supportStyle as SupportStyle,
    },
  };
}

export function buildProfile(
  draft: FutureSelfProfileDraft,
  now: Date,
  existing?: FutureSelfProfile | null,
): FutureSelfProfile {
  const timestamp = now.toISOString();
  return {
    ...draft,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };
}

