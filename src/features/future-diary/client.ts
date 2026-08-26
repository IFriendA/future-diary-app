import type { FutureDiary, FutureSelfResult } from './types';
import type { FutureSelfProfile } from './profile';

type GenerateInput = {
  diaryText: string;
  targetDate: string;
  profile: FutureSelfProfile;
};

type FetchResponse = {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
};

type FetchLike = (
  url: string,
  init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  },
) => Promise<FetchResponse>;

export class FutureDiaryClientError extends Error {
  constructor(
    message: string,
    public readonly status = 500,
  ) {
    super(message);
    this.name = 'FutureDiaryClientError';
  }
}

function readResult(body: unknown): FutureSelfResult {
  if (!body || typeof body !== 'object') {
    throw new FutureDiaryClientError('未来的我这次没有写成完整回信。', 502);
  }

  const result = body as Partial<FutureSelfResult>;
  if (
    typeof result.futureMessage !== 'string' ||
    typeof result.model !== 'string' ||
    !Array.isArray(result.moments)
  ) {
    throw new FutureDiaryClientError('未来的我这次没有写成完整回信。', 502);
  }

  return result as FutureSelfResult;
}

export function createFutureDiaryClient({
  fetchImpl = fetch as unknown as FetchLike,
  now = () => new Date(),
}: {
  fetchImpl?: FetchLike;
  now?: () => Date;
} = {}) {
  return {
    async generate(input: GenerateInput): Promise<FutureDiary> {
      const response = await fetchImpl('/api/future-self', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      let body: unknown;
      try {
        body = await response.json();
      } catch {
        throw new FutureDiaryClientError(
          '未来的我暂时没有回信，请稍后再试。',
          response.ok ? 502 : response.status,
        );
      }
      if (!response.ok) {
        const message =
          body && typeof body === 'object' && typeof (body as { error?: unknown }).error === 'string'
            ? (body as { error: string }).error
            : '未来的我暂时没有回信，请稍后再试。';
        throw new FutureDiaryClientError(message, response.status);
      }

      const result = readResult(body);
      const createdAt = now();

      return {
        id: `diary-${createdAt.getTime()}`,
        targetDate: input.targetDate,
        rawText: input.diaryText,
        futureMessage: result.futureMessage,
        model: result.model,
        createdAt: createdAt.toISOString(),
        moments: result.moments.map((moment) => ({ ...moment, status: 'pending' })),
      };
    },
  };
}

export type FutureDiaryClient = ReturnType<typeof createFutureDiaryClient>;
