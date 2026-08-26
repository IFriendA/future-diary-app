import {
  FutureSelfError,
  createFutureSelfService,
  normalizeFutureSelfPayload,
  selectChatModel,
  validateDiaryRequest,
} from '../future-self';
import { createFutureSelfHandler } from '../../../api/future-self';

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

describe('future-self server core', () => {
  it('rejects diary text shorter than ten characters', () => {
    expect(validateDiaryRequest({ diaryText: '太短了', targetDate: '2026-08-27' })).toEqual({
      ok: false,
      status: 400,
      message: '至少写下 10 个字，未来的我才知道要去哪里。',
    });
  });

  it('accepts a valid diary request and trims surrounding whitespace', () => {
    expect(
      validateDiaryRequest({
        diaryText: '  明天下午我已经完成了提案，也认真吃了午饭。  ',
        targetDate: '2026-08-27',
      }),
    ).toEqual({
      ok: true,
      value: {
        diaryText: '明天下午我已经完成了提案，也认真吃了午饭。',
        targetDate: '2026-08-27',
      },
    });
  });

  it('selects a conversational model and excludes non-chat models', () => {
    expect(
      selectChatModel(['text-embedding-3-small', 'image-1', 'deepseek-chat', 'rerank-v3']),
    ).toBe('deepseek-chat');
  });

  it('normalizes fenced JSON and limits moments to five', () => {
    const content = `\`\`\`json
      {
        "futureMessage": "我已经来到这一天了。",
        "moments": [
          {"title":"事项一","timeWindow":"上午","emotion":"平静"},
          {"title":"事项二","timeWindow":"中午","emotion":"踏实"},
          {"title":"事项三","timeWindow":"下午","emotion":"轻松"},
          {"title":"事项四","timeWindow":"傍晚","emotion":"满足"},
          {"title":"事项五","timeWindow":"晚上","emotion":"安心"},
          {"title":"事项六","timeWindow":"深夜","emotion":"困倦"}
        ]
      }
    \`\`\``;

    expect(normalizeFutureSelfPayload(content)).toEqual({
      futureMessage: '我已经来到这一天了。',
      moments: [
        { id: 'moment-1', title: '事项一', timeWindow: '上午', emotion: '平静' },
        { id: 'moment-2', title: '事项二', timeWindow: '中午', emotion: '踏实' },
        { id: 'moment-3', title: '事项三', timeWindow: '下午', emotion: '轻松' },
        { id: 'moment-4', title: '事项四', timeWindow: '傍晚', emotion: '满足' },
        { id: 'moment-5', title: '事项五', timeWindow: '晚上', emotion: '安心' },
      ],
    });
  });

  it('honors an explicitly configured model', async () => {
    const fetchImpl = jest.fn().mockResolvedValueOnce(
      jsonResponse(200, {
        id: 'chatcmpl-1',
        object: 'chat.completion',
        created: 0,
        model: 'deepseek-chat',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content:
                '{"futureMessage":"我已经把提案交出去了。","moments":[{"title":"完成提案","timeWindow":"下午","emotion":"踏实"}]}',
            },
            finish_reason: 'stop',
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      }),
    );

    const service = createFutureSelfService({
      env: {
        NEW_API_BASE_URL: 'https://pinova.ai/v1',
        NEW_API_KEY: 'test-token',
        NEW_API_MODEL: 'deepseek-chat',
      },
      fetchImpl,
      now: () => new Date('2026-08-26T08:00:00.000Z'),
    });

    await expect(
      service.generate({
        diaryText: '明天下午我已经完成了提案，也认真吃了午饭。',
        targetDate: '2026-08-27',
      }),
    ).resolves.toEqual({
      futureMessage: '我已经把提案交出去了。',
      model: 'deepseek-chat',
      moments: [
        {
          id: 'moment-1',
          title: '完成提案',
          timeWindow: '下午',
          emotion: '踏实',
        },
      ],
    });

    expect(fetchImpl).toHaveBeenNthCalledWith(
      1,
      'https://pinova.ai/v1/chat/completions',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('uses deepseek-v4-flash by default without requesting the model list', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(
      jsonResponse(200, {
        id: 'chatcmpl-default-model',
        object: 'chat.completion',
        created: 0,
        model: 'deepseek-v4-flash',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content:
                '{"futureMessage":"我已经把今天想做的事完成了。","moments":[{"title":"完成今天的事","timeWindow":"今天","emotion":"踏实"}]}',
            },
            finish_reason: 'stop',
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      }),
    );

    const service = createFutureSelfService({
      env: {
        NEW_API_BASE_URL: 'https://pinova.ai/v1',
        NEW_API_KEY: 'test-token',
      },
      fetchImpl,
    });

    await expect(
      service.generate({
        diaryText: '明天下午我已经完成了提案，也认真吃了午饭。',
        targetDate: '2026-08-27',
      }),
    ).resolves.toMatchObject({ model: 'deepseek-v4-flash' });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://pinova.ai/v1/chat/completions',
      expect.objectContaining({
        body: expect.stringContaining('"model":"deepseek-v4-flash"'),
      }),
    );
  });

  it('lists every model exposed by the configured Pinova token', async () => {
    const service = createFutureSelfService({
      env: {
        NEW_API_BASE_URL: 'https://pinova.ai/v1',
        NEW_API_KEY: 'test-token',
      },
      fetchImpl: jest.fn().mockResolvedValue(
        jsonResponse(200, {
          object: 'list',
          data: [
            { id: 'deepseek-chat', object: 'model', created: 0, owned_by: 'deepseek' },
            { id: 'gemini-2.5-flash', object: 'model', created: 0, owned_by: 'google' },
            { id: 'text-embedding-3-small', object: 'model', created: 0, owned_by: 'openai' },
          ],
        }),
      ),
    });

    await expect(service.listModels()).resolves.toEqual([
      'deepseek-chat',
      'gemini-2.5-flash',
      'text-embedding-3-small',
    ]);
  });

  it.each([
    [401, 'config', 'AI 服务配置无效，请检查 Pinova Token。'],
    [429, 'busy', 'AI 服务暂时繁忙，请稍后再试。'],
  ] as const)('maps upstream status %s to a safe error', async (status, code, message) => {
    const service = createFutureSelfService({
      env: {
        NEW_API_BASE_URL: 'https://pinova.ai/v1',
        NEW_API_KEY: 'test-token',
        NEW_API_MODEL: 'deepseek-chat',
      },
      fetchImpl: jest.fn().mockResolvedValue(
        jsonResponse(status, {
          error: { message: 'upstream detail', type: 'new_api_error', code: '' },
        }),
      ),
    });

    await expect(
      service.generate({
        diaryText: '明天下午我已经完成了提案，也认真吃了午饭。',
        targetDate: '2026-08-27',
      }),
    ).rejects.toMatchObject<Partial<FutureSelfError>>({ code, message });
  });

  it('rejects malformed model output instead of inventing a response', async () => {
    const service = createFutureSelfService({
      env: {
        NEW_API_BASE_URL: 'https://pinova.ai/v1',
        NEW_API_KEY: 'test-token',
        NEW_API_MODEL: 'deepseek-chat',
      },
      fetchImpl: jest.fn().mockResolvedValue(
        jsonResponse(200, {
          id: 'chatcmpl-2',
          object: 'chat.completion',
          created: 0,
          model: 'deepseek-chat',
          choices: [
            {
              index: 0,
              message: { role: 'assistant', content: '这不是 JSON' },
              finish_reason: 'stop',
            },
          ],
          usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
        }),
      ),
    });

    await expect(
      service.generate({
        diaryText: '明天下午我已经完成了提案，也认真吃了午饭。',
        targetDate: '2026-08-27',
      }),
    ).rejects.toMatchObject({ code: 'invalid_response' });
  });
});

function createResponseRecorder() {
  return {
    statusCode: 200,
    body: undefined as unknown,
    headers: {} as Record<string, string>,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    setHeader(name: string, value: string) {
      this.headers[name] = value;
      return this;
    },
    json(body: unknown) {
      this.body = body;
      return this;
    },
  };
}

describe('future-self Vercel handler', () => {
  it('returns a generated diary for a valid same-origin POST', async () => {
    const generate = jest.fn().mockResolvedValue({
      futureMessage: '我已经来到这一天了。',
      model: 'deepseek-chat',
      moments: [
        { id: 'moment-1', title: '完成提案', timeWindow: '下午', emotion: '踏实' },
      ],
    });
    const handler = createFutureSelfHandler({ service: { generate } });
    const response = createResponseRecorder();

    await handler(
      {
        method: 'POST',
        headers: {
          host: 'future-diary-app.vercel.app',
          origin: 'https://future-diary-app.vercel.app',
          'x-forwarded-for': '203.0.113.8',
        },
        body: {
          diaryText: '明天下午我已经完成了提案，也认真吃了午饭。',
          targetDate: '2026-08-27',
        },
      },
      response,
    );

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({ futureMessage: '我已经来到这一天了。' });
    expect(generate).toHaveBeenCalledWith({
      diaryText: '明天下午我已经完成了提案，也认真吃了午饭。',
      targetDate: '2026-08-27',
    });
  });

  it('rejects a cross-origin browser request before calling the model', async () => {
    const generate = jest.fn();
    const handler = createFutureSelfHandler({ service: { generate } });
    const response = createResponseRecorder();

    await handler(
      {
        method: 'POST',
        headers: {
          host: 'future-diary-app.vercel.app',
          origin: 'https://attacker.example',
          'x-forwarded-for': '203.0.113.9',
        },
        body: {
          diaryText: '明天下午我已经完成了提案，也认真吃了午饭。',
          targetDate: '2026-08-27',
        },
      },
      response,
    );

    expect(response.statusCode).toBe(403);
    expect(generate).not.toHaveBeenCalled();
  });
});
