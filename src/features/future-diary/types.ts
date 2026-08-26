export type MomentStatus = 'pending' | 'partial' | 'fulfilled' | 'carried';

export type DiaryMoment = {
  id: string;
  title: string;
  timeWindow: string;
  emotion: string;
  status: MomentStatus;
};

export type FutureDiary = {
  id: string;
  targetDate: string;
  rawText: string;
  futureMessage: string;
  model: string;
  createdAt: string;
  moments: DiaryMoment[];
};

export type FutureSelfResult = {
  futureMessage: string;
  model: string;
  moments: Omit<DiaryMoment, 'status'>[];
};
