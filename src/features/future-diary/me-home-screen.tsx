import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { SUPPORT_STYLE_LABEL, type FutureSelfProfile } from './profile';

type Props = {
  profile: FutureSelfProfile;
  onOpenPersona(): void;
  onOpenFragments(): void;
  onOpenPrivacy(): void;
  onOpenAbout(): void;
  onOpenSettings(): void;
};

export function personaTagline(profile: FutureSelfProfile) {
  const action = profile.behaviorSummary?.trim() || firstSentence(profile.behaviorLogic) || '先理解，再行动';
  return `${profile.mbti} · ${action}`;
}

export function personaQuoteText(profile: FutureSelfProfile) {
  return (
    profile.personaQuote?.trim() ||
    '我会记得想做的事，也会在犹豫时，陪自己先迈出第一步。'
  );
}

function firstSentence(text: string) {
  return text.trim().split(/[。！？]/)[0]?.trim() || '';
}

export function MeHomeScreen({
  profile,
  onOpenPersona,
  onOpenFragments,
  onOpenPrivacy,
  onOpenAbout,
  onOpenSettings,
}: Props) {
  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>我的</Text>
        <Pressable accessibilityLabel="设置" onPress={onOpenSettings} style={styles.gearHit}>
          <Text style={styles.gear}>⚙</Text>
        </Pressable>
      </View>

      <View style={styles.profileCard}>
        <View accessibilityLabel="头像" style={styles.avatar} />
        <Text style={styles.name}>未来的我</Text>
        <Text style={styles.tagline}>{personaTagline(profile)}</Text>
        <Text style={styles.quote}>{personaQuoteText(profile)}</Text>
      </View>

      <View style={styles.card}>
        <MenuRow title="未来人格" subtitle="性格、行动方式与鼓励方式" onPress={onOpenPersona} />
        <MenuRow title="未来片段" subtitle="随机出现的时间与频率" onPress={onOpenFragments} />
        <MenuRow title="隐私与数据" onPress={onOpenPrivacy} />
        <MenuRow title="关于未来日记" last onPress={onOpenAbout} />
      </View>
    </ScrollView>
  );
}

function MenuRow({
  title,
  subtitle,
  last = false,
  onPress,
}: {
  title: string;
  subtitle?: string;
  last?: boolean;
  onPress(): void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.row, last && styles.rowLast]}>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle ? <Text style={styles.rowSub}>{subtitle}</Text> : null}
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

export function PersonaDetailScreen({
  profile,
  onBack,
  onEdit,
}: {
  profile: FutureSelfProfile;
  onBack(): void;
  onEdit(): void;
}) {
  const rows = [
    { label: 'MBTI', value: profile.mbti },
    { label: '行动方式', value: profile.behaviorSummary?.trim() || firstSentence(profile.behaviorLogic) || '先理解，再行动' },
    { label: '我想补足', value: profile.gapSummary?.trim() || firstSentence(profile.futureSelfGap) || '主动迈出第一步' },
    { label: '鼓励方式', value: profile.supportSummary?.trim() || SUPPORT_STYLE_LABEL[profile.supportStyle] },
  ];

  return (
    <View style={styles.page}>
      <View style={styles.topBar}>
        <Pressable accessibilityLabel="返回" onPress={onBack} style={styles.backHit}>
          <Text style={styles.backGlyph}>‹</Text>
        </Pressable>
        <Text style={styles.topTitle}>未来的我</Text>
        <Pressable onPress={onEdit} style={styles.backHit}>
          <Text style={styles.editLink}>编辑</Text>
        </Pressable>
      </View>
      <Text style={styles.intro}>这些内容决定我如何理解和回应自己。</Text>
      <View style={styles.card}>
        {rows.map((row, index) => (
          <View key={row.label} style={[styles.row, index === rows.length - 1 && styles.rowLast]}>
            <View style={styles.rowText}>
              <Text style={styles.rowSub}>{row.label}</Text>
              <Text style={styles.rowTitle}>{row.value}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 16 },
  page: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  pageTitle: { color: '#111827', fontSize: 22, fontWeight: '800' },
  gearHit: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  gear: { fontSize: 18, color: '#6B7280' },
  profileCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  name: { color: '#111827', fontSize: 20, fontWeight: '800', marginBottom: 6 },
  tagline: { color: '#6B7280', fontSize: 14, fontWeight: '600', marginBottom: 10 },
  quote: { color: '#4B5563', fontSize: 14, lineHeight: 22, textAlign: 'center' },
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
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
    gap: 8,
  },
  rowLast: { borderBottomWidth: 0 },
  rowText: { flex: 1 },
  rowTitle: { color: '#111827', fontSize: 16, fontWeight: '700' },
  rowSub: { color: '#9CA3AF', fontSize: 13, marginTop: 3 },
  chevron: { color: '#D1D5DB', fontSize: 22 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  backHit: { minWidth: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backGlyph: { color: '#111827', fontSize: 32, lineHeight: 34, fontWeight: '300' },
  topTitle: { color: '#111827', fontSize: 16, fontWeight: '800' },
  editLink: { color: '#3B82F6', fontSize: 15, fontWeight: '700' },
  intro: { color: '#9CA3AF', fontSize: 13, lineHeight: 20, marginBottom: 16 },
});
