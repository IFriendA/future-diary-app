import { useState } from 'react';

import { createFutureDiaryClient, type FutureDiaryClient } from './client';
import { FutureDiaryScreen } from './diary-screen';
import { FutureSelfOnboarding } from './onboarding-screen';
import type { FutureSelfProfile } from './profile';
import { createProfileStorage, type ProfileStorage } from './profile-storage';
import { createDiaryStorage, type DiaryStorage } from './storage';

type Props = {
  profileStorage?: ProfileStorage;
  diaryStorage?: DiaryStorage;
  client?: FutureDiaryClient;
  now?: () => Date;
};

export function FutureDiaryApp({ profileStorage, diaryStorage, client, now = () => new Date() }: Props) {
  const [resolvedProfileStorage] = useState(() => profileStorage ?? createProfileStorage());
  const [resolvedDiaryStorage] = useState(() => diaryStorage ?? createDiaryStorage());
  const [resolvedClient] = useState(() => client ?? createFutureDiaryClient());
  const [profile, setProfile] = useState<FutureSelfProfile | null>(() => resolvedProfileStorage.load());
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  if (!profile || isEditingProfile) {
    return (
      <FutureSelfOnboarding
        initialProfile={profile}
        now={now}
        onComplete={(nextProfile) => {
          resolvedProfileStorage.save(nextProfile);
          setProfile(nextProfile);
          setIsEditingProfile(false);
        }}
      />
    );
  }

  return (
    <FutureDiaryScreen
      client={resolvedClient}
      now={now}
      onEditProfile={() => setIsEditingProfile(true)}
      profile={profile}
      storage={resolvedDiaryStorage}
    />
  );
}

