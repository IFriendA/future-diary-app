import { FutureSelfError, createFutureSelfService } from '../src/server/future-self';

type RequestLike = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
};

type ResponseLike = {
  status(code: number): ResponseLike;
  setHeader(name: string, value: string): ResponseLike;
  json(body: unknown): ResponseLike;
};

type ModelsServiceLike = {
  listModels(): Promise<string[]>;
};

export function createModelsHandler({ service }: { service: ModelsServiceLike }) {
  return async function modelsHandler(req: RequestLike, res: ResponseLike) {
    res.setHeader('Cache-Control', 'no-store');

    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return res.status(405).json({ error: '只支持读取模型列表。' });
    }

    try {
      return res.status(200).json({ models: await service.listModels() });
    } catch (error) {
      if (error instanceof FutureSelfError) {
        return res.status(error.status).json({ error: error.message, code: error.code });
      }
      return res.status(502).json({ error: '暂时无法获取 Pinova 模型列表。' });
    }
  };
}

let productionHandler: ReturnType<typeof createModelsHandler> | undefined;

export default function handler(req: RequestLike, res: ResponseLike) {
  if (!productionHandler) {
    productionHandler = createModelsHandler({
      service: createFutureSelfService({
        env: {
          NEW_API_BASE_URL: process.env.NEW_API_BASE_URL,
          NEW_API_KEY: process.env.NEW_API_KEY,
          NEW_API_MODEL: process.env.NEW_API_MODEL,
        },
      }),
    });
  }
  return productionHandler(req, res);
}
