import { useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { createFutureDiaryClient, type FutureDiaryClient } from './client';
import { updateMomentStatus } from './diary-state';
import { buildHomeModel } from './home-model';
import { LetterScreen } from './letter-screen';
import type { FutureSelfProfile } from './profile';
import { RespondScreen } from './respond-screen';
import { createDiaryStorage, type DiaryStorage } from './storage';
import { TodayHome } from './today-home';
import type { DiaryMoment, FutureDiary, MomentStatus } from './types';
import { WriteScreen } from './write-screen';

type ViewState =
  | { name: 'home' }
  | { name: 'respond'; momentId: string }
  | { name: 'letter'; date: string }
  | { name: 'editor'; date: string };

type Props = {
  client?: Pick<FutureDiaryClient, 'generate'>;
  storage?: DiaryStorage;
  now?: () => Date;
  profile: FutureSelfProfile;
  onEditProfile?: () => void;
};

export function FutureDiaryScreen({
  client,
  storage,
  now = () => new Date(),
  profile,
  onEditProfile,
}: Props) {
  const [resolvedClient] = useState(() => client ?? createFutureDiaryClient());
  const [resolvedStorage] = useState(() => storage ?? createDiaryStorage());
  const [diaries, setDiaries] = useState<Record<string, FutureDiary>>(() => resolvedStorage.loadAll());
  const [view, setView] = useState<ViewState>({ name: 'home' });
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [draftSaved, setDraftSaved] = useState(true);
  const [respondChoice, setRespondChoice] = useState<MomentStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const home = buildHomeModel({ diaries, now: now() });
  const editorValue =
    view.name === 'editor' ? editorTextFor(view.date, drafts, diaries, resolvedStorage) : '';
  const respondMoment =
    view.name === 'respond'
      ? (diaries[home.todayKey]?.moments.find((moment) => moment.id === view.momentId) ?? null)
      : null;
  const letterDiary = view.name === 'letter' ? diaries[view.date] ?? null : null;

  function persist(diary: FutureDiary) {
    resolvedStorage.save(diary);
    setDiaries((current) => ({ ...current, [diary.targetDate]: diary }));
  }

  function openEditor(date: string) {
    setError('');
    setDraftSaved(true);
    setDrafts((current) => ({
      ...current,
      [date]: editorTextFor(date, current, diaries, resolvedStorage),
    }));
    setView({ name: 'editor', date });
  }

  function changeDraft(date: string, text: string) {
    setDrafts((current) => ({ ...current, [date]: text }));
    resolvedStorage.saveDraft(date, text);
    setDraftSaved(true);
  }

  async function submitEditor(date: string) {
    const diaryText = (drafts[date] ?? '').trim();
    if (diaryText.length < 10 || isLoading) return;
    setError('');
    setIsLoading(true);
    try {
      const generated = await resolvedClient.generate({ diaryText, targetDate: date, profile });
      persist(generated);
      resolvedStorage.clearDraft(date);
      setDrafts((current) => {
        const next = { ...current };
        delete next[date];
        return next;
      });
      setView({ name: 'letter', date });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '未来的我暂时没有回信，请稍后再试。');
    } finally {
      setIsLoading(false);
    }
  }

  function chooseStatus(moment: DiaryMoment, status: MomentStatus) {
    const todayDiary = diaries[home.todayKey];
    if (!todayDiary) return;
    persist(updateMomentStatus(todayDiary, moment.id, status));
    setRespondChoice(status);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.page}>
        {view.name === 'home' ? (
          <ScrollView contentContainerStyle={styles.homeScroll} showsVerticalScrollIndicator={false}>
            <TodayHome
              home={home}
              onEditProfile={onEditProfile}
              onRespond={(moment) => {
                setRespondChoice(moment.status === 'pending' ? null : moment.status);
                setView({ name: 'respond', momentId: moment.id });
              }}
              onOpenLetter={(diary) => setView({ name: 'letter', date: diary.targetDate })}
              onWriteTomorrow={() => openEditor(home.tomorrowKey)}
              onEditTomorrow={() => openEditor(home.tomorrowKey)}
            />
          </ScrollView>
        ) : null}

        {view.name === 'respond' && respondMoment ? (
          <RespondScreen
            moment={respondMoment}
            selected={respondChoice}
            onBack={() => setView({ name: 'home' })}
            onSelect={(status) => chooseStatus(respondMoment, status)}
            onConfirm={() => setView({ name: 'home' })}
          />
        ) : null}

        {view.name === 'letter' && letterDiary ? (
          <LetterScreen
            diary={letterDiary}
            onBack={() => setView({ name: 'home' })}
            onAccept={() => setView({ name: 'home' })}
            onEdit={() => openEditor(letterDiary.targetDate)}
          />
        ) : null}

        {view.name === 'editor' ? (
          <WriteScreen
            dateKey={view.date}
            value={editorValue}
            saved={draftSaved}
            isLoading={isLoading}
            error={error}
            onChange={(text) => changeDraft(view.date, text)}
            onBack={() => setView({ name: 'home' })}
            onSubmit={() => void submitEditor(view.date)}
          />
        ) : null}

        {view.name === 'home' ? (
          <View style={styles.tabBar}>
            <View accessibilityState={{ selected: true }} style={styles.tab}>
              <TabIcon name="today" active />
              <Text style={styles.tabLabelOn}>今天</Text>
            </View>
            <View style={styles.tabMuted}>
              <TabIcon name="diary" />
              <Text style={styles.tabLabel}>日记</Text>
            </View>
            <View style={styles.tabMuted}>
              <TabIcon name="me" />
              <Text style={styles.tabLabel}>我的</Text>
            </View>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

function editorTextFor(
  date: string,
  drafts: Record<string, string>,
  diaries: Record<string, FutureDiary>,
  storage: DiaryStorage,
) {
  return drafts[date] ?? (storage.loadDraft(date) || diaries[date]?.rawText || '');
}

function TabIcon({ name, active = false }: { name: 'today' | 'diary' | 'me'; active?: boolean }) {
  const color = active ? '#3B82F6' : '#D1D5DB';
  if (name === 'today') {
    return (
      <View style={styles.iconBox}>
        <View style={[styles.homeRoof, { borderBottomColor: color }]} />
        <View style={[styles.homeBody, { borderColor: color }]} />
      </View>
    );
  }
  if (name === 'diary') {
    return (
      <View style={styles.iconBox}>
        <View style={[styles.book, { borderColor: color }]}>
          <View style={[styles.bookSpine, { backgroundColor: color }]} />
        </View>
      </View>
    );
  }
  return (
    <View style={styles.iconBox}>
      <View style={[styles.personHead, { borderColor: color }]} />
      <View style={[styles.personBody, { borderColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  page: {
    flex: 1,
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
    paddingHorizontal: 22,
    backgroundColor: '#FFFFFF',
    ...(Platform.OS === 'web'
      ? {
          borderLeftWidth: 1,
          borderRightWidth: 1,
          borderColor: '#E5E7EB',
        }
      : {}),
  },
  homeScroll: { paddingBottom: 12 },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 10,
    paddingBottom: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
  },
  tab: { alignItems: 'center', minWidth: 72 },
  tabMuted: { alignItems: 'center', minWidth: 72, opacity: 0.9 },
  tabLabel: { color: '#9CA3AF', fontSize: 11, fontWeight: '600', marginTop: 4 },
  tabLabelOn: { color: '#3B82F6', fontSize: 11, fontWeight: '800', marginTop: 4 },
  iconBox: { width: 22, height: 20, alignItems: 'center', justifyContent: 'flex-end' },
  homeRoof: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginBottom: -1,
  },
  homeBody: { width: 14, height: 10, borderWidth: 1.6, borderTopWidth: 1.6, borderRadius: 1 },
  book: { width: 14, height: 16, borderWidth: 1.6, borderRadius: 2, justifyContent: 'center' },
  bookSpine: { width: 1.6, height: 12, marginLeft: 3, borderRadius: 1 },
  personHead: { width: 7, height: 7, borderRadius: 4, borderWidth: 1.6, marginBottom: 2 },
  personBody: { width: 12, height: 7, borderWidth: 1.6, borderTopLeftRadius: 6, borderTopRightRadius: 6, borderBottomWidth: 0 },
});
