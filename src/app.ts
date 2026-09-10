import express from 'express';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import { lookupPhone } from './lookup.js';
import { providers } from './providers/index.js';

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(cors({
  origin: process.env.CORS_ORIGIN ?? '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json({ limit: '16kb' }));
app.use(rateLimit({
  windowMs: 60_000,
  limit: Number.parseInt(process.env.RATE_LIMIT ?? '30', 10),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'rate_limited', message: 'Too many requests. Try again later.' },
}));

function parseCountry(value: unknown) {
  return typeof value === 'string' ? value.toUpperCase() : undefined;
}

function runLookup(phone: string, defaultCountry?: string) {
  const result = lookupPhone(phone, defaultCountry as never);
  return {
    phone: result.phone.e164,
    country: result.phone.country ?? 'UNKNOWN',
    lineType: result.phone.type ?? 'unknown',
    valid: result.phone.isValid,
    profiles: providers,
    privacy: result.privacy,
  };
}

app.get('/', (_req, res) => {
  res.json({ name: 'Phone Social Metadata API', status: 'operational', endpoint: 'POST /api/lookup' });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'operational', providers: providers.map((provider) => provider.platform), timestamp: new Date().toISOString() });
});

const lookupHandler = (req: express.Request, res: express.Response) => {
  const phone = typeof req.body?.phone === 'string' ? req.body.phone : '';
  if (!phone) return res.status(400).json({ error: 'invalid_request', message: 'Body must include a phone string.' });

  try {
    return res.json({ ok: true, result: runLookup(phone, parseCountry(req.body?.defaultCountry)) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid phone number.';
    return res.status(422).json({ error: 'invalid_phone', message });
  }
};

app.post('/api/lookup', lookupHandler);
app.post('/lookup', lookupHandler);

app.post('/api/lookup/batch', (req, res) => {
  const phones = req.body?.phones;
  if (!Array.isArray(phones) || phones.length < 1 || phones.length > 10 || phones.some((phone) => typeof phone !== 'string')) {
    return res.status(400).json({ error: 'invalid_request', message: 'phones must be an array of 1-10 strings.' });
  }

  const results = phones.map((phone) => {
    try {
      return { ...runLookup(phone), input: phone };
    } catch {
      return { input: phone, valid: false, error: 'Invalid phone number.' };
    }
  });
  return res.json({ results });
});

app.use((_req, res) => {
  res.status(404).json({ error: 'not_found', message: 'Route not found.' });
});

export default app;
