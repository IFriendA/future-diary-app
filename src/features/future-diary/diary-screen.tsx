import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { createFutureDiaryClient, type FutureDiaryClient } from './client';
import { DiaryArchiveScreen } from './diary-archive-screen';
import { DiaryDetailScreen } from './diary-detail-screen';
import { updateMomentStatus } from './diary-state';
import { buildHomeModel } from './home-model';
import { LetterScreen } from './letter-screen';
import type { FutureSelfProfile } from './profile';
import { RespondScreen } from './respond-screen';
import { createDiaryStorage, type DiaryStorage } from './storage';
import { TodayHome } from './today-home';
import type { DiaryMoment, FutureDiary, MomentStatus } from './types';
import { WriteScreen } from './write-screen';

type TabName = 'today' | 'diary' | 'me';

type Overlay =
  | { name: 'respond'; momentId: string }
  | { name: 'letter'; date: string; back: TabName }
  | { name: 'editor'; date: string; back: TabName }
  | { name: 'diary-detail'; date: string };

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
  const [tab, setTab] = useState<TabName>('today');
  const [overlay, setOverlay] = useState<Overlay | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [draftSaved, setDraftSaved] = useState(true);
  const [respondChoice, setRespondChoice] = useState<MomentStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const currentNow = now();
  const home = buildHomeModel({ diaries, now: currentNow });
  const editorValue =
    overlay?.name === 'editor' ? editorTextFor(overlay.date, drafts, diaries, resolvedStorage) : '';
  const respondMoment =
    overlay?.name === 'respond'
      ? (diaries[home.todayKey]?.moments.find((moment) => moment.id === overlay.momentId) ?? null)
      : null;
  const letterDiary = overlay?.name === 'letter' ? diaries[overlay.date] ?? null : null;
  const detailDiary = overlay?.name === 'diary-detail' ? diaries[overlay.date] ?? null : null;
  const showTabs = overlay === null;

  function persist(diary: FutureDiary) {
    resolvedStorage.save(diary);
    setDiaries((current) => ({ ...current, [diary.targetDate]: diary }));
  }

  function openEditor(date: string, back: TabName) {
    setError('');
    setDraftSaved(true);
    setDrafts((current) => ({
      ...current,
      [date]: editorTextFor(date, current, diaries, resolvedStorage),
    }));
    setOverlay({ name: 'editor', date, back });
  }

  function changeDraft(date: string, text: string) {
    setDrafts((current) => ({ ...current, [date]: text }));
    resolvedStorage.saveDraft(date, text);
    setDraftSaved(true);
  }

  function closeOverlay() {
    if (!overlay) return;
    if ((overlay.name === 'editor' || overlay.name === 'letter') && overlay.back === 'diary') {
      setTab('diary');
      setOverlay({ name: 'diary-detail', date: overlay.date });
      return;
    }
    setOverlay(null);
  }

  async function submitEditor(date: string, back: TabName) {
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
      setOverlay({ name: 'letter', date, back });
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
        {overlay === null && tab === 'today' ? (
          <ScrollView contentContainerStyle={styles.homeScroll} showsVerticalScrollIndicator={false}>
            <TodayHome
              home={home}
              onEditProfile={onEditProfile}
              onRespond={(moment) => {
                setRespondChoice(moment.status === 'pending' ? null : moment.status);
                setOverlay({ name: 'respond', momentId: moment.id });
              }}
              onOpenLetter={(diary) => setOverlay({ name: 'letter', date: diary.targetDate, back: 'today' })}
              onWriteTomorrow={() => openEditor(home.tomorrowKey, 'today')}
              onEditTomorrow={() => openEditor(home.tomorrowKey, 'today')}
            />
          </ScrollView>
        ) : null}

        {overlay === null && tab === 'diary' ? (
          <DiaryArchiveScreen
            diaries={diaries}
            now={currentNow}
            onOpen={(date) => setOverlay({ name: 'diary-detail', date })}
          />
        ) : null}

        {overlay === null && tab === 'me' ? (
          <View>
            <Text style={styles.meTitle}>我的</Text>
          </View>
        ) : null}

        {overlay?.name === 'respond' && respondMoment ? (
          <RespondScreen
            moment={respondMoment}
            selected={respondChoice}
            onBack={() => setOverlay(null)}
            onSelect={(status) => chooseStatus(respondMoment, status)}
            onConfirm={() => setOverlay(null)}
          />
        ) : null}

        {overlay?.name === 'letter' && letterDiary ? (
          <LetterScreen
            diary={letterDiary}
            onBack={closeOverlay}
            onAccept={closeOverlay}
            onEdit={() => openEditor(letterDiary.targetDate, overlay.back)}
          />
        ) : null}

        {overlay?.name === 'diary-detail' && detailDiary ? (
          <DiaryDetailScreen
            diary={detailDiary}
            onBack={() => setOverlay(null)}
            onOpenLetter={() => setOverlay({ name: 'letter', date: detailDiary.targetDate, back: 'diary' })}
            onEdit={() => openEditor(detailDiary.targetDate, 'diary')}
          />
        ) : null}

        {overlay?.name === 'editor' ? (
          <WriteScreen
            dateKey={overlay.date}
            value={editorValue}
            saved={draftSaved}
            isLoading={isLoading}
            error={error}
            onChange={(text) => changeDraft(overlay.date, text)}
            onBack={closeOverlay}
            onSubmit={() => void submitEditor(overlay.date, overlay.back)}
          />
        ) : null}

        {showTabs ? (
          <View style={styles.tabBar}>
            {(['today', 'diary', 'me'] as const).map((name) => {
              const active = tab === name;
              const label = name === 'today' ? '今天' : name === 'diary' ? '日记' : '我的';
              return (
                <Pressable
                  key={name}
                  accessibilityState={{ selected: active }}
                  onPress={() => setTab(name)}
                  style={styles.tab}
                >
                  <TabIcon name={name} active={active} />
                  <Text style={active ? styles.tabLabelOn : styles.tabLabel}>{label}</Text>
                  <View style={[styles.tabLine, active && styles.tabLineOn]} />
                </Pressable>
              );
            })}
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
  tabLabel: { color: '#9CA3AF', fontSize: 11, fontWeight: '600', marginTop: 4 },
  tabLabelOn: { color: '#3B82F6', fontSize: 11, fontWeight: '800', marginTop: 4 },
  tabLine: { marginTop: 4, height: 2, width: 16, borderRadius: 1, backgroundColor: 'transparent' },
  tabLineOn: { backgroundColor: '#3B82F6' },
  meTitle: { color: '#111827', fontSize: 22, fontWeight: '800', marginTop: 8 },
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
