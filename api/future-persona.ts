import {
  FutureSelfError,
  createFutureSelfService,
  validatePersonaRequest,
} from '../src/server/future-self';
import type { FutureSelfProfileDraft } from '../src/features/future-diary/profile';

type RequestLike = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
};

type ResponseLike = {
  status(code: number): ResponseLike;
  setHeader(name: string, value: string): ResponseLike;
  json(body: unknown): ResponseLike;
};

type FuturePersonaServiceLike = {
  generatePersona(profile: FutureSelfProfileDraft): Promise<unknown>;
};

function firstHeader(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

function parseBody(body: unknown): unknown {
  if (typeof body !== 'string') return body;
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

function isSameOrigin(headers: RequestLike['headers']): boolean {
  const origin = firstHeader(headers.origin);
  if (!origin) return true;

  const host = firstHeader(headers['x-forwarded-host']) || firstHeader(headers.host);
  try {
    return Boolean(host) && new URL(origin).host === host;
  } catch {
    return false;
  }
}

function requestIp(headers: RequestLike['headers']): string {
  const forwarded = firstHeader(headers['x-forwarded-for']);
  return forwarded.split(',')[0]?.trim() || 'unknown';
}

type RateRecord = { count: number; resetsAt: number };

export function createFuturePersonaHandler({
  service,
  now = () => Date.now(),
}: {
  service: FuturePersonaServiceLike;
  now?: () => number;
}) {
  const requestsByIp = new Map<string, RateRecord>();

  return async function futurePersonaHandler(req: RequestLike, res: ResponseLike) {
    res.setHeader('Cache-Control', 'no-store');

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ error: '这里只接收未来人格生成。' });
    }

    if (!isSameOrigin(req.headers)) {
      return res.status(403).json({ error: '请求来源不被允许。' });
    }

    const ip = requestIp(req.headers);
    const timestamp = now();
    const current = requestsByIp.get(ip);
    const record =
      !current || current.resetsAt <= timestamp
        ? { count: 0, resetsAt: timestamp + 10 * 60 * 1000 }
        : current;

    if (record.count >= 8) {
      return res.status(429).json({ error: '今天的回信有点多，请十分钟后再试。' });
    }

    record.count += 1;
    requestsByIp.set(ip, record);

    const validation = validatePersonaRequest(parseBody(req.body));
    if (!validation.ok) {
      return res.status(validation.status).json({ error: validation.message });
    }

    try {
      const result = await service.generatePersona(validation.value);
      return res.status(200).json(result);
    } catch (error) {
      if (error instanceof FutureSelfError) {
        return res.status(error.status).json({ error: error.message, code: error.code });
      }
      return res.status(502).json({ error: '未来的我暂时没有形成，请稍后再试。' });
    }
  };
}

let productionHandler: ReturnType<typeof createFuturePersonaHandler> | undefined;

export default function handler(req: RequestLike, res: ResponseLike) {
  if (!productionHandler) {
    productionHandler = createFuturePersonaHandler({
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
