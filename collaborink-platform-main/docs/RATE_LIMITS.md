# Rate Limits

All limits are per IP address unless stated otherwise. Limits are applied at the Express layer using `express-rate-limit`.

## Endpoints

| Route pattern | Window | Max requests | Notes |
|---|---|---|---|
| `/api/*` (general) | 15 min | 200 | Covers all API routes |
| `POST /api/auth/login` | 1 min | 10 | Brute-force protection |
| `POST /api/auth/signup` | 1 min | 10 | Abuse prevention |
| `/api/chats/channels/*` | 1 min | 30 | Per authenticated user ID |

## Exceeded limit response

```json
HTTP 429 Too Many Requests
{
  "message": "Too many requests, please try again later"
}
```

Auth and chat limiters return customised messages:
- Auth: `"Too many auth attempts, please try again later"`
- Chat: `"Too many messages, slow down"`

## Headers

Standard `express-rate-limit` headers are sent:

```
X-RateLimit-Limit: 200
X-RateLimit-Remaining: 143
X-RateLimit-Reset: 1716560400
```

## Test mode

When `NODE_ENV=test` all limits are raised to **10 000 req/window** so automated test suites are not throttled.

## Adjusting limits

Edit `backend/src/app.js`. The three limiters are defined near the top:

```js
const limiter    = rateLimit({ windowMs: 15 * 60 * 1000, max: isTest ? 10000 : 200 });
const authLimiter = rateLimit({ windowMs: 60 * 1000,      max: isTest ? 10000 : 10 });
const chatLimiter = rateLimit({ windowMs: 60 * 1000,      max: isTest ? 10000 : 30 });
```

Increase `max` or `windowMs` as traffic grows. Consider moving to a Redis-backed store (`rate-limit-redis`) for multi-instance deployments so limits are shared across processes.

## Recommended production settings

| Scenario | Suggestion |
|---|---|
| Public API with heavy traffic | Add Redis store, raise general limit to 500 |
| Behind a proxy (Railway, Render) | Set `app.set('trust proxy', 1)` so `req.ip` reflects the real client IP |
| DDoS mitigation | Front with Cloudflare or a WAF before reaching Express |
