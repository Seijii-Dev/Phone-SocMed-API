# Phone Social Metadata API

TypeScript + Express + Node.js API deployable to Vercel or a conventional Node.js host.

## Architecture

- `src/app.ts` creates and exports the Express application without starting a listener.
- `api/index.ts` exports the Express application for Vercel serverless execution.
- `src/server.ts` starts the listener for local development or a persistent Node.js host.
- `src/lookup.ts` validates and normalizes phone numbers locally with `libphonenumber-js`.
- `src/providers/index.ts` defines the social-provider contract and reports adapters as disabled by default.

## Privacy and provider boundary

The uploaded ZIP included reverse-lookup calls to unofficial or private-account endpoints for Telegram, Instagram, WhatsApp, and Facebook. Those network calls were not imported into the repository. The API returns `not_configured` provider entries instead.

Social matches may be added only through documented, authorized provider APIs using explicit consent or account-linking/OAuth flows. The service must not scrape platforms, enumerate private accounts, use leaked databases, or infer a person's identity from a phone number.

## API

### `GET /`

Returns service metadata.

### `GET /api/health`

Returns health status and the configured provider names.

### `POST /api/lookup` or `POST /lookup`

Request:

```json
{
  "phone": "+14155552671",
  "defaultCountry": "US"
}
```

The response contains E.164 formatting, country, validity, number type, privacy metadata, and disabled social-provider statuses.

### `POST /api/lookup/batch`

Request:

```json
{
  "phones": ["+14155552671", "+442071838750"]
}
```

Up to 10 phone numbers are accepted per request.

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
