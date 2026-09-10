import express from 'express';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import { lookupPhone } from './lookup.js';

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

app.get('/', (_req, res) => {
  res.json({ name: 'Phone Social Metadata API', status: 'operational', endpoint: 'POST /api/lookup' });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'operational', timestamp: new Date().toISOString() });
});

app.post('/api/lookup', (req, res) => {
  const phone = typeof req.body?.phone === 'string' ? req.body.phone : '';
  const defaultCountry = typeof req.body?.defaultCountry === 'string'
    ? req.body.defaultCountry.toUpperCase()
    : undefined;

  if (!phone) {
    return res.status(400).json({ error: 'invalid_request', message: 'Body must include a phone string.' });
  }

  try {
    return res.json({ ok: true, result: lookupPhone(phone, defaultCountry as never) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid phone number.';
    return res.status(422).json({ error: 'invalid_phone', message });
  }
});

app.use((_req, res) => {
  res.status(404).json({ error: 'not_found', message: 'Route not found.' });
});

export default app;
