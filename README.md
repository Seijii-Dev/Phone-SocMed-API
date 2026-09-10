# Phone Social Metadata API

A TypeScript + Node.js serverless API for Vercel. The default endpoint validates and normalizes phone numbers locally with `libphonenumber-js`, returning E.164 formatting, region metadata, validity, and number type.

## Important privacy boundary

The default implementation does **not** reverse-search social-media accounts by phone number. It does not scrape platforms, enumerate private accounts, use leaked databases, or infer a person's identity. Social matches can be added only through documented, authorized provider APIs with appropriate consent and provider terms compliance.

## API

### `POST /api/lookup`

Request:

```json
{
  "phone": "+14155552671",
  "defaultCountry": "US"
}
```

Response:

```json
{
  "ok": true,
  "result": {
    "input": "+14155552671",
    "phone": {
      "e164": "+14155552671",
      "countryCallingCode": "+1",
      "nationalNumber": "4155552671",
      "country": "US",
      "isPossible": true,
      "isValid": true,
      "type": "FIXED_LINE_OR_MOBILE"
    },
    "social": [
      {
        "provider": "social-adapters",
        "status": "not_configured"
      }
    ],
    "privacy": {
      "searchedPublicly": false
    }
  }
}
```

## Local development

```bash
npm install
npm run build
npm test
npm run dev
```

Then send:

```bash
curl -X POST http://localhost:3000/api/lookup \
  -H 'content-type: application/json' \
  -d '{"phone":"+14155552671"}'
```

## Vercel deployment

The project is configured for Vercel's Node.js serverless runtime. Deploy a preview with the Vercel CLI or connect the repository in the Vercel dashboard. Configure `CORS_ORIGIN` to the exact frontend origin instead of leaving the default wildcard in production. `ALLOWED_COUNTRIES` may contain a comma-separated allowlist such as `US,CA,GB`.

No API secret is required for the default local phone metadata endpoint. If an authorized provider adapter is added, store its credential in Vercel Environment Variables and never commit it to source control.

## Security notes

The in-memory rate limiter is best-effort on serverless deployments because instances are ephemeral. For production abuse prevention, place the API behind Vercel protection or an external rate-limit service. Do not log raw phone numbers; if request auditing is required, log a keyed hash with a short retention period.

## Adding a social adapter

An adapter must use an official API, require the appropriate user consent and authorization, document the provider's data-use rules, minimize returned fields, and clearly distinguish `found`, `not_found`, `rate_limited`, and `provider_error`. Do not add a generic search engine that probes multiple platforms by phone number.
