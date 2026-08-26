type DiaryRequest = {
  diaryText: string;
  targetDate: string;
};

type FutureSelfMoment = {
  id: string;
  title: string;
  timeWindow: string;
  emotion: string;
};

type FutureSelfPayload = {
  futureMessage: string;
  moments: FutureSelfMoment[];
};

type FutureSelfResult = FutureSelfPayload & {
  model: string;
};

type FutureSelfEnv = {
  NEW_API_BASE_URL?: string;
  NEW_API_KEY?: string;
  NEW_API_MODEL?: string;
};

type FetchResponse = {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
  text(): Promise<string>;
};

type FetchLike = (
  input: string,
  init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    signal?: AbortSignal;
  },
) => Promise<FetchResponse>;

type FutureSelfErrorCode =
  | 'bad_request'
  | 'config'
  | 'busy'
  | 'timeout'
  | 'invalid_response'
  | 'upstream';

export class FutureSelfError extends Error {
  constructor(
    public readonly code: FutureSelfErrorCode,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'FutureSelfError';
  }
}

export type DiaryValidation =
  | { ok: true; value: DiaryRequest }
  | { ok: false; status: 400; message: string };

export function validateDiaryRequest(input: unknown): DiaryValidation {
  if (!input || typeof input !== 'object') {
    return { ok: false, status: 400, message: '日记内容格式不正确。' };
  }

  const candidate = input as Partial<DiaryRequest>;
  const diaryText = typeof candidate.diaryText === 'string' ? candidate.diaryText.trim() : '';
  const targetDate = typeof candidate.targetDate === 'string' ? candidate.targetDate.trim() : '';

  if (diaryText.length < 10) {
    return {
      ok: false,
      status: 400,
      message: '至少写下 10 个字，未来的我才知道要去哪里。',
    };
  }

  if (diaryText.length > 5000) {
    return { ok: false, status: 400, message: '这篇日记有点长，请控制在 5000 字以内。' };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate) || Number.isNaN(Date.parse(`${targetDate}T00:00:00Z`))) {
    return { ok: false, status: 400, message: '目标日期格式不正确。' };
  }

  return { ok: true, value: { diaryText, targetDate } };
}

const NON_CHAT_MODEL =
  /(embedding|rerank|re-?rank|image|dall-e|sora|video|audio|whisper|tts|speech|moderation)/i;

export function selectChatModel(modelIds: string[]): string {
  const candidates = modelIds
    .map((id) => id.trim())
    .filter(Boolean)
    .filter((id) => !NON_CHAT_MODEL.test(id));

  if (candidates.length === 0) {
    throw new FutureSelfError('config', 'Pinova 中没有可用的文本对话模型。', 503);
  }

  const score = (id: string) => {
    if (/(mini|flash|haiku)/i.test(id)) return 0;
    if (/chat/i.test(id)) return 1;
    if (/(gpt|claude|gemini|deepseek|qwen|glm)/i.test(id)) return 2;
    return 3;
  };

  return [...candidates].sort((left, right) => score(left) - score(right))[0];
}

function extractJsonObject(content: string): unknown {
  const unfenced = content.replace(/^\s*```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');
  const start = unfenced.indexOf('{');
  const end = unfenced.lastIndexOf('}');

  if (start === -1 || end <= start) {
    throw new FutureSelfError('invalid_response', '未来的我这次没有写成一封完整的回信。', 502);
  }

  try {
    return JSON.parse(unfenced.slice(start, end + 1));
  } catch {
    throw new FutureSelfError('invalid_response', '未来的我这次没有写成一封完整的回信。', 502);
  }
}

export function normalizeFutureSelfPayload(content: string): FutureSelfPayload {
  const parsed = extractJsonObject(content);

  if (!parsed || typeof parsed !== 'object') {
    throw new FutureSelfError('invalid_response', '未来的我这次没有写成一封完整的回信。', 502);
  }

  const source = parsed as { futureMessage?: unknown; moments?: unknown };
  const futureMessage = typeof source.futureMessage === 'string' ? source.futureMessage.trim() : '';

  if (!futureMessage || !futureMessage.includes('我') || futureMessage.includes('用户')) {
    throw new FutureSelfError('invalid_response', '未来的我这次没有用自己的口吻写回信。', 502);
  }

  const rawMoments = Array.isArray(source.moments) ? source.moments : [];
  const moments = rawMoments
    .filter((moment): moment is Record<string, unknown> => Boolean(moment) && typeof moment === 'object')
    .map((moment, index) => ({
      id:
        typeof moment.id === 'string' && moment.id.trim()
          ? moment.id.trim()
          : `moment-${index + 1}`,
      title: typeof moment.title === 'string' ? moment.title.trim() : '',
      timeWindow:
        typeof moment.timeWindow === 'string' && moment.timeWindow.trim()
          ? moment.timeWindow.trim()
          : '时间未定',
      emotion:
        typeof moment.emotion === 'string' && moment.emotion.trim()
          ? moment.emotion.trim()
          : '期待',
    }))
    .filter((moment) => moment.title.length > 0)
    .slice(0, 5);

  if (moments.length === 0) {
    throw new FutureSelfError('invalid_response', '未来的我没有读出这一天里的具体事情。', 502);
  }

  return { futureMessage, moments };
}

function buildSystemPrompt(targetDate: string): string {
  return `你就是写日记的人本人，现在处在 ${targetDate} 这一天结束之后。\n\n硬规则：\n- 永远以“我”表达自己的经历、想法和感受。\n- 不得把写日记的人称为“用户”“他”或“她”。\n- 你不是老师、心理医生、监督者或宠物。\n- 你可以替今天暂时不敢做的自己先勇敢一次，但不能承诺现实必然发生。\n- 不羞辱、不恐吓、不制造连续打卡压力，也不说空泛鸡汤。\n\n请只返回 JSON，不要 Markdown：\n{\n  "futureMessage": "一段 120 到 260 字的第一人称未来记忆，具体、温柔、有行动感",\n  "moments": [\n    {\n      "title": "从原文提取的具体事情，简短动词短语",\n      "timeWindow": "明确时间或合理时间段，没有则写时间未定",\n      "emotion": "未来的我完成或经历它时的核心感受"\n    }\n  ]\n}\n\nmoments 必须有 1 到 5 项。`;
}

function mapUpstreamError(status: number): FutureSelfError {
  if (status === 401 || status === 403) {
    return new FutureSelfError('config', 'AI 服务配置无效，请检查 Pinova Token。', 503);
  }
  if (status === 429) {
    return new FutureSelfError('busy', 'AI 服务暂时繁忙，请稍后再试。', 429);
  }
  return new FutureSelfError('upstream', '未来的我暂时没有回信，请稍后再试。', 502);
}

function withTimeoutSignal(timeoutMs: number) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  return { signal: controller.signal, clear: () => clearTimeout(timeoutId) };
}

export function createFutureSelfService({
  env,
  fetchImpl = fetch as unknown as FetchLike,
  now = () => new Date(),
}: {
  env: FutureSelfEnv;
  fetchImpl?: FetchLike;
  now?: () => Date;
}) {
  const baseUrl = env.NEW_API_BASE_URL?.replace(/\/+$/, '');
  const apiKey = env.NEW_API_KEY?.trim();
  const configuredModel = env.NEW_API_MODEL?.trim() || 'deepseek-v4-flash';
  let discoveredModel: { id: string; expiresAt: number } | undefined;

  if (!baseUrl || !apiKey) {
    throw new FutureSelfError('config', 'AI 服务尚未配置完成。', 503);
  }

  const authorizationHeaders = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  async function fetchModelIds(): Promise<string[]> {
    const timeout = withTimeoutSignal(25_000);
    try {
      const response = await fetchImpl(`${baseUrl}/models`, {
        headers: authorizationHeaders,
        signal: timeout.signal,
      });
      if (!response.ok) throw mapUpstreamError(response.status);
      const body = (await response.json()) as { data?: { id?: unknown }[] };
      return Array.isArray(body.data)
        ? body.data.map((item) => (typeof item.id === 'string' ? item.id : '')).filter(Boolean)
        : [];
    } catch (error) {
      if (error instanceof FutureSelfError) throw error;
      if (error instanceof Error && error.name === 'AbortError') {
        throw new FutureSelfError('timeout', '获取 Pinova 模型列表超时。', 504);
      }
      throw new FutureSelfError('upstream', '暂时无法获取 Pinova 模型列表。', 502);
    } finally {
      timeout.clear();
    }
  }

  async function resolveModel(): Promise<string> {
    if (configuredModel) return configuredModel;
    if (discoveredModel && discoveredModel.expiresAt > now().getTime()) return discoveredModel.id;

    try {
      const model = selectChatModel(await fetchModelIds());
      discoveredModel = { id: model, expiresAt: now().getTime() + 10 * 60 * 1000 };
      return model;
    } catch (error) {
      if (error instanceof FutureSelfError) throw error;
      if (error instanceof Error && error.name === 'AbortError') {
        throw new FutureSelfError('timeout', '未来的我暂时没有回信，请稍后再试。', 504);
      }
      throw new FutureSelfError('upstream', '未来的我暂时没有回信，请稍后再试。', 502);
    }
  }

  async function requestCompletion(request: DiaryRequest, model: string): Promise<FetchResponse> {
    const body = {
      model,
      messages: [
        { role: 'system', content: buildSystemPrompt(request.targetDate) },
        { role: 'user', content: request.diaryText },
      ],
      temperature: 0.7,
      max_completion_tokens: 900,
      response_format: { type: 'json_object' },
    };
    const timeout = withTimeoutSignal(25_000);
    try {
      return await fetchImpl(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: authorizationHeaders,
        body: JSON.stringify(body),
        signal: timeout.signal,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new FutureSelfError('timeout', '未来的我暂时没有回信，请稍后再试。', 504);
      }
      throw new FutureSelfError('upstream', '未来的我暂时没有回信，请稍后再试。', 502);
    } finally {
      timeout.clear();
    }
  }

  return {
    listModels: fetchModelIds,

    async generate(request: DiaryRequest): Promise<FutureSelfResult> {
      const model = await resolveModel();
      const response = await requestCompletion(request, model);
      if (!response.ok) throw mapUpstreamError(response.status);

      const body = (await response.json()) as {
        choices?: { message?: { content?: unknown } }[];
      };
      const content = body.choices?.[0]?.message?.content;
      if (typeof content !== 'string') {
        throw new FutureSelfError('invalid_response', '未来的我这次没有写成一封完整的回信。', 502);
      }

      return { ...normalizeFutureSelfPayload(content), model };
    },
  };
}
