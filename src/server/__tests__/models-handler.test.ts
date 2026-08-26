import { createModelsHandler } from '../../../api/models';

function createResponseRecorder() {
  return {
    statusCode: 0,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    setHeader() {
      return this;
    },
    json(body: unknown) {
      this.body = body;
      return this;
    },
  };
}

describe('models Vercel handler', () => {
  it('returns the models available to the configured token', async () => {
    const response = createResponseRecorder();
    const handler = createModelsHandler({
      service: { listModels: async () => ['deepseek-chat', 'gemini-2.5-flash'] },
    });

    await handler(
      {
        method: 'GET',
        headers: { host: 'future-diary-app.vercel.app' },
      },
      response,
    );

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ models: ['deepseek-chat', 'gemini-2.5-flash'] });
  });
});
