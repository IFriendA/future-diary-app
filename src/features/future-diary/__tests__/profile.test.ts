import { MBTI_TYPES, buildProfile, validateProfileDraft } from '../profile';

const validDraft = {
  mbti: 'INFP',
  behaviorLogic: '我做决定时会先感受自己是否认同，压力大时容易拖延，但明确第一步后就能开始。',
  futureSelfGap: '希望未来的我更敢表达真实想法，也能在犹豫时先行动。',
  supportStyle: 'gentle',
} as const;

describe('future-self profile', () => {
  it('accepts every canonical MBTI type', () => {
    expect(MBTI_TYPES).toHaveLength(16);
    for (const mbti of MBTI_TYPES) {
      expect(validateProfileDraft({ ...validDraft, mbti })).toMatchObject({ ok: true });
    }
  });

  it('rejects a forged MBTI type', () => {
    expect(validateProfileDraft({ ...validDraft, mbti: 'ABCD' })).toEqual({
      ok: false,
      field: 'mbti',
      message: '请选择你的 MBTI。',
    });
  });

  it('trims the free text and rejects behavior logic shorter than twenty characters', () => {
    expect(validateProfileDraft({ ...validDraft, behaviorLogic: '  我会先想一想。  ' })).toEqual({
      ok: false,
      field: 'behaviorLogic',
      message: '再多写一点，至少 20 个字。',
    });

    expect(
      validateProfileDraft({
        ...validDraft,
        behaviorLogic: `  ${validDraft.behaviorLogic}  `,
        futureSelfGap: `  ${validDraft.futureSelfGap}  `,
      }),
    ).toEqual({ ok: true, value: validDraft });
  });

  it('keeps the original creation time when a profile is edited', () => {
    const existing = buildProfile(validDraft, new Date('2026-08-26T10:00:00.000Z'));
    const edited = buildProfile(
      { ...validDraft, supportStyle: 'direct' },
      new Date('2026-08-27T10:00:00.000Z'),
      existing,
    );

    expect(edited).toMatchObject({
      createdAt: '2026-08-26T10:00:00.000Z',
      updatedAt: '2026-08-27T10:00:00.000Z',
      supportStyle: 'direct',
    });
  });
});

