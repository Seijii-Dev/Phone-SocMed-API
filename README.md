# Phone Social Metadata API

TypeScript + Express + Node.js API deployable to Vercel or a conventional Node.js host.

## Architecture

- `src/app.ts` creates and exports the Express application without starting a listener.
- `api/index.ts` exports the Express application for Vercel serverless execution.
- `src/server.ts` starts the listener for local development or a persistent Node.js host.
- `src/lookup.ts` validates and normalizes phone numbers locally with `libphonenumber-js`.

The default implementation does **not** reverse-search social-media accounts by phone number. It does not scrape platforms, enumerate private accounts, use leaked databases, or infer a person's identity. Social matches require documented, authorized provider APIs with appropriate consent and provider terms compliance.

## API

### `GET /`

Returns service metadata.

### `GET /api/health`

Returns a health response.

### `POST /api/lookup`

Request:

```json
{
  "phone": "+14155552671",
  "defaultCountry": "US"
}
```

The response contains E.164 formatting, country and calling code, validity, possible-number status, number type, and an explicit `not_configured` social-adapter status.

## Local development

```bash
npm install
npm run build
npm test
npm run dev
```

The local server listens on `PORT` or `3000`.

## Vercel deployment

Connect the repository to Vercel and deploy the `main` branch. Vercel detects `api/index.ts` as the serverless Express entrypoint. Do not call `app.listen()` from the Vercel adapter; the listener exists only in `src/server.ts`.

Set `CORS_ORIGIN` to the exact frontend origin in production. `ALLOWED_COUNTRIES` may contain a comma-separated region allowlist such as `US,CA,GB`. `RATE_LIMIT` defaults to 30 requests per minute per instance.

## Security notes

The in-memory rate limiter is best-effort on serverless deployments because instances are ephemeral. For production abuse prevention, add platform-level protection or a shared rate-limit store. Do not log raw phone numbers. If auditing is required, use a keyed hash with short retention.
