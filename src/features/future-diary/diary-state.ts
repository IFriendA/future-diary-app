import type { FutureDiary, MomentStatus } from './types';

export function updateMomentStatus(
  diary: FutureDiary,
  momentId: string,
  status: MomentStatus,
): FutureDiary {
  const momentIndex = diary.moments.findIndex((moment) => moment.id === momentId);

  if (momentIndex === -1) {
    return diary;
  }

  return {
    ...diary,
    moments: diary.moments.map((moment, index) =>
      index === momentIndex ? { ...moment, status } : moment,
    ),
  };
}
