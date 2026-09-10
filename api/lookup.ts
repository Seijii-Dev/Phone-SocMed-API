import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { CountryCode } from 'libphonenumber-js';
import { lookupPhone } from '../src/lookup.js';

const buckets = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 30;

function sendJson(res: VercelResponse, status: number, body: unknown) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8').json(body);
}

function clientKey(req: VercelRequest) {
  const forwarded = req.headers['x-forwarded-for'];
  return Array.isArray(forwarded) ? forwarded[0] : String(forwarded ?? req.socket.remoteAddress ?? 'unknown').split(',')[0].trim();
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN ?? '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'method_not_allowed', message: 'Use POST /api/lookup.' });

  const now = Date.now();
  const key = clientKey(req);
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
  else if (++bucket.count > MAX_REQUESTS) return sendJson(res, 429, { error: 'rate_limited', message: 'Too many requests. Try again later.' });

  let body: Record<string, unknown>;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : ((req.body ?? {}) as Record<string, unknown>);
  } catch {
    return sendJson(res, 400, { error: 'invalid_json', message: 'Request body must be valid JSON.' });
  }

  const phone = typeof body.phone === 'string' ? body.phone : '';
  const defaultCountry = typeof body.defaultCountry === 'string' ? body.defaultCountry.toUpperCase() as CountryCode : undefined;
  if (!phone) return sendJson(res, 400, { error: 'invalid_request', message: 'Body must include a phone string.' });

  try {
    return sendJson(res, 200, { ok: true, result: lookupPhone(phone, defaultCountry) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid phone number.';
    return sendJson(res, 422, { error: 'invalid_phone', message });
  }
}
